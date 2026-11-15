/**
 * The study companion's server-side half: the grounded prompt contract and the
 * one outbound call to the Anthropic API.
 *
 * Split out from `api-server.mjs` so the prompt contract is importable and
 * testable *without* starting an HTTP server — the system prompt is what
 * actually enforces Prompt 5's first acceptance criterion ("a question outside
 * the node's assembled context gets a graceful decline"), so it should be
 * checkable directly rather than only observed through a live model.
 *
 * The API key is read from the environment by the caller and never leaves this
 * process — see `api-server.mjs`. Nothing here is bundled into the client.
 */

export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";
export const DEFAULT_MODEL = "claude-sonnet-4-5";
export const MAX_TOKENS = 700;

/**
 * The system prompt is deliberately strict about three things, because each one
 * is a requirement rather than a style choice:
 *   1. answer *only* from the supplied context — no outside knowledge;
 *   2. decline plainly when the context cannot answer, instead of guessing;
 *   3. self-identify as AI-generated and stay separate from scholar commentary.
 */
export function companionSystemPrompt(lang) {
  const language = lang === "ar" ? "Arabic" : "English";
  return [
    "You are the AlMinhej study companion. You help a reader understand one node of an",
    "Islamic knowledge graph, using ONLY the grounding context supplied in the user message.",
    "",
    "Hard rules — these override everything else:",
    "1. Answer using ONLY the supplied grounding context. Never use outside knowledge. Never",
    "   invent a hadith, a narrator, a book, a verse, a scholar, or an opinion that is not in",
    "   the context.",
    "2. If the question cannot be answered from the supplied context — because the material is",
    "   not there, or because it asks something the context does not cover — say so plainly and",
    "   briefly, and suggest what the reader could ask about instead. Do NOT guess or fill gaps",
    "   from general knowledge.",
    "3. Always make clear that your answer is an AI-generated explanation, kept separate from",
    "   the religious text and from scholar commentary. Do not present yourself as a scholar, and",
    "   do not issue religious rulings (fatwa).",
    "",
    `Answer directly and concisely in ${language}.`,
  ].join("\n");
}

/** Turn the assembled context + question into the exact request we send. */
export function buildCompanionRequest({ context, question, lang, model = DEFAULT_MODEL }) {
  return {
    model,
    max_tokens: MAX_TOKENS,
    system: companionSystemPrompt(lang),
    messages: [
      {
        role: "user",
        content: [
          "Grounding context (JSON) — this is the only material you may draw on:",
          JSON.stringify(context),
          "",
          `Reader's question: ${question}`,
        ].join("\n"),
      },
    ],
  };
}

export class CompanionUpstreamError extends Error {}

/* ------------------------------------------------------------------ *
 * Companion v2 — retrieval tools.
 *
 * The single-shot `askClaude` above can only see the target node's bounded
 * context. Real reader questions often need material from *other* nodes
 * ("what does this narrator say elsewhere?", "where is this verse explained?").
 * The agent path below gives the model three read-only retrieval tools over
 * the same server modules the REST routes use — `searchGraph`,
 * `buildKnowledgeContext`, `assembleExplore` — and feeds whatever comes back
 * in as *additional grounding*. The system prompt's hard rules are unchanged:
 * the model still answers only from supplied context (now including tool
 * results) and still declines what the material cannot support.
 * ------------------------------------------------------------------ */

export const AGENT_MAX_ITERATIONS = 4;
/** Hard cap on any single tool result so a large explore payload can't blow
 *  the prompt budget. */
export const MAX_TOOL_RESULT_CHARS = 6000;

/** Anthropic tool specs — all read-only, all over published graph material. */
export const COMPANION_TOOLS = [
  {
    name: "search_knowledge",
    description:
      "Search the published knowledge graph (hadith, narrators, books, verses, commentary) " +
      "by keywords. Returns up to 5 nodes with title and snippet.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords to search for" },
      },
      required: ["query"],
    },
  },
  {
    name: "read_node_context",
    description:
      "Read the bounded grounding context of a specific knowledge node by id " +
      "(the same context the reader's own node provides).",
    input_schema: {
      type: "object",
      properties: {
        nodeId: { type: "string", description: "Knowledge node id" },
      },
      required: ["nodeId"],
    },
  },
  {
    name: "explore_node",
    description:
      "Read a node's neighborhood: neighbors, timeline and cross-references, " +
      "by slug (e.g. 'arbain-2').",
    input_schema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Node slug" },
      },
      required: ["slug"],
    },
  },
];

/** System prompt for the agent path — same hard rules, plus tool use. */
export function companionAgentSystemPrompt(lang) {
  const language = lang === "ar" ? "Arabic" : "English";
  return [
    "You are the AlMinhej study companion. You help a reader understand an",
    "Islamic knowledge graph, using ONLY grounding material: the context supplied",
    "in the user message and any material returned by your retrieval tools.",
    "",
    "Hard rules — these override everything else:",
    "1. Answer using ONLY the supplied grounding material (context + tool results).",
    "   Never use outside knowledge. Never invent a hadith, a narrator, a book, a",
    "   verse, a scholar, or an opinion that is not in the material.",
    "2. If the question cannot be answered from the material — because it is not",
    "   there, or because the material does not cover it — say so plainly and",
    "   briefly, and suggest what the reader could ask about instead. Do NOT",
    "   guess or fill gaps from general knowledge.",
    "3. Always make clear that your answer is an AI-generated explanation, kept",
    "   separate from the religious text and from scholar commentary. Do not",
    "   present yourself as a scholar, and do not issue religious rulings (fatwa).",
    "4. Use the retrieval tools when the supplied context alone cannot answer —",
    "   for example when the question concerns another node, narrator, book, or",
    "   verse. Tool results are additional grounding; cite nothing they do not",
    "   contain. Do not call tools when the supplied context already suffices.",
    "",
    `Answer directly and concisely in ${language}.`,
  ].join("\n");
}

const clampJson = (value) => {
  const text = JSON.stringify(value);
  return text.length <= MAX_TOOL_RESULT_CHARS
    ? text
    : `${text.slice(0, MAX_TOOL_RESULT_CHARS)}…[truncated]`;
};

/**
 * Run the bounded agent loop. `retrieve(name, input)` is injected by the
 * caller (it owns the graph collections); it must return a JSON-safe value or
 * throw — tool failures become `is_error` results the model can see, never a
 * crashed request.
 *
 * Returns `{ answer, model, toolTrace }` where toolTrace lists every
 * retrieval for the `ai_sessions` log.
 */
export async function askClaudeAgent({
  context,
  question,
  lang,
  apiKey,
  model = DEFAULT_MODEL,
  retrieve,
  maxIterations = AGENT_MAX_ITERATIONS,
  fetchImpl = fetch,
}) {
  const messages = [
    {
      role: "user",
      content: [
        "Grounding context (JSON) — the starting material you may draw on:",
        JSON.stringify(context),
        "",
        `Reader's question: ${question}`,
      ].join("\n"),
    },
  ];
  const toolTrace = [];

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const body = {
      model,
      max_tokens: MAX_TOKENS,
      system: companionAgentSystemPrompt(lang),
      tools: COMPANION_TOOLS,
      messages,
    };

    let response;
    try {
      response = await fetchImpl(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      });
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      throw new CompanionUpstreamError(`Could not reach the Anthropic API (${detail})`);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new CompanionUpstreamError(
        `Anthropic API returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`
      );
    }

    const data = await response.json();
    const content = data.content ?? [];
    const toolUses = content.filter((block) => block.type === "tool_use");

    if (data.stop_reason !== "tool_use" || toolUses.length === 0) {
      const answer = content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      if (!answer) throw new CompanionUpstreamError("The model returned an empty answer");
      return { answer, model: data.model ?? model, toolTrace };
    }

    // Echo the assistant turn verbatim (Anthropic requires the full content
    // blocks, including tool_use, to be sent back).
    messages.push({ role: "assistant", content });

    const results = [];
    for (const use of toolUses) {
      let resultText;
      let isError = false;
      try {
        const value = await retrieve(use.name, use.input ?? {});
        resultText = clampJson(value ?? { ok: true });
      } catch (cause) {
        isError = true;
        resultText = JSON.stringify({
          ok: false,
          error: cause instanceof Error ? cause.message : String(cause),
        });
      }
      toolTrace.push({ tool: use.name, input: use.input ?? {}, isError });
      results.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: resultText,
        ...(isError ? { is_error: true } : {}),
      });
    }
    messages.push({ role: "user", content: results });
  }

  throw new CompanionUpstreamError("The companion used its retrieval budget without answering");
}

/**
 * Perform the call. `fetchImpl` is injectable so the smoke check can assert the
 * outgoing request shape without touching the network.
 */
export async function askClaude({
  context,
  question,
  lang,
  apiKey,
  model = DEFAULT_MODEL,
  fetchImpl = fetch,
}) {
  const body = buildCompanionRequest({ context, question, lang, model });

  let response;
  try {
    response = await fetchImpl(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new CompanionUpstreamError(`Could not reach the Anthropic API (${detail})`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new CompanionUpstreamError(
      `Anthropic API returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`
    );
  }

  const data = await response.json();
  const answer = (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!answer) throw new CompanionUpstreamError("The model returned an empty answer");
  return { answer, model: data.model ?? model };
}
