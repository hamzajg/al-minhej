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
