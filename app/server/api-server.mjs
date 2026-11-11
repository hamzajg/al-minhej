#!/usr/bin/env node
/**
 * AlMinhej API — a minimal, dependency-free stand-in for the REST surface in
 * `AlMinhej_Backend_Architecture.md` §5.
 *
 * §5.A — the public reading API. Read-only, and serves the *same* knowledge
 * graph the in-memory provider ships with (`src/infrastructure/memory/data/*.json`),
 * which is the whole point: the app can be pointed at either implementation and
 * has to produce identical output. Swap this for the real Mongo-backed server
 * later and nothing above `infrastructure/` notices.
 *
 * §5.B — the Content Management API. Create/edit nodes, draw relationships, and
 * move a node through `draft → in_review → published`, role-gated. Mutations live
 * in memory for the life of the process (the fixtures are read, never written
 * back), which is enough to run the review workflow end to end — publishing here
 * is observable on the reading side immediately, because digitization progress is
 * derived from the graph at read time rather than cached on the book node.
 *
 * Endpoints — §5.A (public, no auth):
 *   GET /v1/health
 *   GET /v1/nodes/{id}
 *   GET /v1/nodes?slug={slug}
 *   GET /v1/nodes?ids={id,id,...}
 *   GET /v1/nodes?type={NodeType}
 *   GET /v1/relationships?nodeId={id}[&direction=from|to]
 *   POST /v1/nodes/{id}/companion/ask   ← grounded AI answer (§7)
 *
 * Endpoints — §5.A (the reader's own state, sends `x-alminhej-account`):
 *   GET /v1/me/path      ← the account's learning path
 *   PUT /v1/me/path      ← replace it
 *   GET /v1/me/nodes/{id}/state  ← the account's own state for one node
 *   PUT /v1/me/nodes/{id}/state  ← replace it
 *
 * Endpoints — §5.B (admin, sends `x-alminhej-roles`):
 *   GET   /v1/admin/nodes?type={NodeType}&status={NodeStatus}
 *   POST  /v1/admin/nodes
 *   PATCH /v1/admin/nodes/{id}
 *   POST  /v1/admin/nodes/{id}/relationships
 *   POST  /v1/admin/nodes/{id}/submit-for-review
 *   POST  /v1/admin/nodes/{id}/publish
 *
 * Run: npm run api   (PORT=8787 by default)
 *
 * The companion route is the only one that leaves this process: it calls the
 * Anthropic API with `ANTHROPIC_API_KEY` from the environment (never from the
 * client — see §7 and `server/companion.mjs`). With no key set it answers 503
 * rather than pretending, so the app can show an honest "not configured" state.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildKnowledgeContext } from "./knowledgeContext.mjs";
import { askClaude, CompanionUpstreamError, DEFAULT_MODEL } from "./companion.mjs";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "infrastructure", "memory", "data");

// Mutable for the life of the process — the §5.B writes append/update these in
// memory. The JSON on disk is only ever the seed.
const NODES = JSON.parse(readFileSync(join(dataDir, "nodes.json"), "utf8"));
const RELATIONSHIPS = JSON.parse(readFileSync(join(dataDir, "relationships.json"), "utf8"));

const PORT = Number(process.env.PORT ?? 8787);

/**
 * §7's AI layer. The key lives here and only here — read from the environment
 * at boot, used for the outbound call, never serialized into any response and
 * never part of the client bundle (the browser only ever talks to this route).
 */
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const COMPANION_MODEL = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
const companionReady = () => Boolean(ANTHROPIC_API_KEY);

/**
 * §7: "Every POST /v1/nodes/{id}/companion/ask call is logged to `ai_sessions`
 * — not for surveillance, but because that log is the raw material for a
 * scholarly reviewer to spot-check whether the companion is staying properly
 * grounded." In-memory here, like the §5.B writes; a real server persists it.
 */
const AI_SESSIONS = [];

const NODE_TYPES = ["BOOK", "PAGE", "HADITH", "VERSE", "NARRATOR", "EVENT", "CONCEPT"];
const NODE_STATUSES = ["draft", "in_review", "published"];
const RELATIONSHIP_TYPES = [
  "PART_OF", "NARRATED_BY", "EXPLAINS", "REFERENCES", "SIMILAR_TO",
  "collected_in", "core_concept", "related_hadith", "narrator_in",
  "full_chain_source", "thematic_link", "involved", "contained_in", "contextual",
];

/**
 * Roles are a *set*, not a single value — the whole point of §5.B's
 * "an editor can't publish their own draft unless they also hold the reviewer
 * role". A caller sends `x-alminhej-roles: editor,scholar-reviewer` and gets both.
 */
const EDITOR_ROLES = new Set(["editor", "scholar-reviewer", "admin"]);
const REVIEWER_ROLES = new Set(["scholar-reviewer", "admin"]);

class BadRequest extends Error {}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
  });
  res.end(body);
}

/** The error envelope every endpoint in §5.A uses. */
function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message, details: null } });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new BadRequest("Request body is not valid JSON"));
      }
    });
    req.on("error", () => reject(new BadRequest("Could not read request body")));
  });
}

function rolesFrom(req) {
  const raw = req.headers["x-alminhej-roles"];
  if (!raw) return [];
  return String(raw).split(",").map((role) => role.trim().toLowerCase()).filter(Boolean);
}

function hasRole(roles, allowed) {
  return roles.some((role) => allowed.has(role));
}

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isLocalized = (value) =>
  !!value && typeof value === "object" && isNonEmptyString(value.ar) && isNonEmptyString(value.en);

/* ------------------------------------------------------------------ *
 * §5.A — public reading API
 *
 * Only *published* nodes are ever visible here. Everything the reading app
 * reads (by id, by slug, batch, or "all books") has to be a node a reviewer
 * has actually released — a draft leaking into the public graph would be a
 * content bug that no test would catch, because the fixtures happen to be
 * all-published today.
 * ------------------------------------------------------------------ */
const publishedOnly = (nodes) => nodes.filter((node) => node.status === "published");

function handleNodes(res, url) {
  const id = url.pathname.slice("/v1/nodes/".length);
  if (id) {
    const node = NODES.find((n) => n.id === id && n.status === "published");
    if (!node) return sendError(res, 404, "NODE_NOT_FOUND", `No node with id '${id}'`);
    return sendJson(res, 200, node);
  }

  const slug = url.searchParams.get("slug");
  if (slug !== null) {
    const node = NODES.find((n) => n.slug === slug && n.status === "published");
    if (!node) return sendError(res, 404, "NODE_NOT_FOUND", `No node with slug '${slug}'`);
    return sendJson(res, 200, node);
  }

  const ids = url.searchParams.get("ids");
  if (ids !== null) {
    const wanted = new Set(ids.split(",").filter(Boolean));
    return sendJson(res, 200, publishedOnly(NODES).filter((n) => wanted.has(n.id)));
  }

  const type = url.searchParams.get("type");
  if (type !== null) {
    // Mirrors MemoryKnowledgeRepository.listByType: published only.
    return sendJson(res, 200, NODES.filter((n) => n.type === type && n.status === "published"));
  }

  return sendJson(res, 200, publishedOnly(NODES));
}

function handleRelationships(res, url) {
  const nodeId = url.searchParams.get("nodeId");
  if (nodeId === null) {
    return sendError(res, 400, "INVALID_REQUEST", "Query parameter 'nodeId' is required");
  }

  const direction = url.searchParams.get("direction");
  if (direction !== null && direction !== "from" && direction !== "to") {
    return sendError(res, 400, "INVALID_REQUEST", "Query parameter 'direction' must be 'from' or 'to'");
  }

  const edges = RELATIONSHIPS.filter((r) => {
    if (direction === "from") return r.from === nodeId;
    if (direction === "to") return r.to === nodeId;
    return r.from === nodeId || r.to === nodeId;
  });
  return sendJson(res, 200, edges);
}

/* ------------------------------------------------------------------ *
 * §7 — the AI layer. Grounded, never open model access.
 * ------------------------------------------------------------------ */

const COMPANION_PREFIX = "/v1/nodes/";
const COMPANION_SUFFIX = "/companion/ask";

/** `true` when the path is the companion route (its `{id}` may contain `/`). */
const isCompanionRoute = (pathname) =>
  pathname.startsWith(COMPANION_PREFIX) && pathname.endsWith(COMPANION_SUFFIX);

async function handleCompanion(req, res, url) {
  const id = decodeURIComponent(
    url.pathname.slice(COMPANION_PREFIX.length, url.pathname.length - COMPANION_SUFFIX.length)
  );

  // Validate the target first, so a missing node is a 404 regardless of whether
  // the companion happens to be configured — the two failures are unrelated.
  if (!NODES.some((n) => n.id === id && n.status === "published")) {
    return sendError(res, 404, "NODE_NOT_FOUND", `No published node with id '${id}'`);
  }

  const body = await readJson(req);
  if (!isNonEmptyString(body.question)) {
    return sendError(res, 400, "INVALID_REQUEST", "'question' is required");
  }
  const lang = body.lang === "ar" ? "ar" : "en";

  // The builder — §7's boundary. The model only ever sees this object.
  const context = buildKnowledgeContext(id, NODES, RELATIONSHIPS);
  if (!context) {
    return sendError(res, 404, "CONTEXT_UNAVAILABLE", `Could not assemble context for '${id}'`);
  }

  if (!companionReady()) {
    return sendError(
      res,
      503,
      "COMPANION_UNAVAILABLE",
      "The study companion is not configured: set ANTHROPIC_API_KEY in the server environment " +
        "(the key must never live in the client)."
    );
  }

  try {
    const { answer, model } = await askClaude({
      context,
      question: body.question.trim(),
      lang,
      apiKey: ANTHROPIC_API_KEY,
      model: COMPANION_MODEL,
    });
    AI_SESSIONS.push({
      nodeId: id,
      question: body.question.trim(),
      lang,
      model,
      at: new Date().toISOString(),
    });
    return sendJson(res, 200, { answer, model, grounded: true });
  } catch (cause) {
    if (cause instanceof CompanionUpstreamError) {
      return sendError(res, 502, "COMPANION_UPSTREAM_ERROR", cause.message);
    }
    throw cause;
  }
}

/* ------------------------------------------------------------------ *
 * §5.A — the reader's own state, per account (`/v1/me/*`)
 *
 * There is no auth yet (PROMPTS.md Prompt 6 scoped it that way on purpose):
 * the client mints an opaque token once and sends it as
 * `x-alminhej-account`, and that token *is* the identity. It is not a
 * credential — there is no password and nothing is verified — so this is the
 * honest floor for "per-account", and the seam real auth (`/v1/auth/*`) slots
 * into later. In-memory, like the §5.B writes: a real server persists this as
 * §6's `learning_paths` collection.
 * ------------------------------------------------------------------ */

const ACCOUNTS = new Map();

/** Mirrors `EMPTY_LEARNING_PATH` in the client's `domain/learning.ts`. */
const EMPTY_PATH = {
  goalId: null,
  seedNodeId: null,
  visited: [],
  startedAt: null,
  onboardingSeen: false,
};

function accountFrom(req) {
  const raw = req.headers["x-alminhej-account"];
  return isNonEmptyString(raw) ? String(raw).trim() : null;
}

/** A learning path is a small, fixed shape — reject anything else outright. */
function isValidPath(value) {
  const nullableString = (v) => v === null || isNonEmptyString(v);
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!nullableString(value.goalId)) return false;
  if (!nullableString(value.seedNodeId)) return false;
  if (!nullableString(value.startedAt)) return false;
  if (typeof value.onboardingSeen !== "boolean") return false;
  if (!Array.isArray(value.visited) || !value.visited.every(isNonEmptyString)) return false;
  return true;
}

async function handleMePath(req, res) {
  const accountId = accountFrom(req);
  if (!accountId) {
    return sendError(
      res,
      400,
      "INVALID_REQUEST",
      "The x-alminhej-account header is required — it is the account identity"
    );
  }

  if (req.method === "GET") {
    // An unknown account is not an error: it simply has no path yet, and the
    // empty path is the honest answer (never a 404 the client must special-case).
    return sendJson(res, 200, ACCOUNTS.get(accountId) ?? EMPTY_PATH);
  }

  if (req.method !== "PUT") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/me/path`);
  }

  const body = await readJson(req);
  if (!isValidPath(body)) {
    return sendError(
      res,
      400,
      "INVALID_REQUEST",
      "Body must be a learning path: { goalId, seedNodeId, visited[], startedAt, onboardingSeen }"
    );
  }

  const stored = {
    goalId: body.goalId,
    seedNodeId: body.seedNodeId,
    visited: body.visited,
    startedAt: body.startedAt,
    onboardingSeen: body.onboardingSeen,
  };
  ACCOUNTS.set(accountId, stored);
  return sendJson(res, 200, stored);
}

/* ------------------------------------------------------------------ *
 * §5.A — the reader's own state *for one node* (`/v1/me/nodes/{id}/state`)
 *
 * The path above is one document per account; this is one per (account,
 * node): bookmark, discovered vocabulary, recite count, and the Practice-tab
 * notes. It is the same identity story (`x-alminhej-account`) and the same
 * in-memory lifecycle. Kept separate from the path because it is written on
 * nearly every reader interaction, where the path is not.
 * ------------------------------------------------------------------ */

const ME_NODE_PREFIX = "/v1/me/nodes/";
const ME_NODE_SUFFIX = "/state";

/** `true` when the path is the per-node state route (its `{id}` is encoded). */
const isMeNodeStateRoute = (pathname) =>
  pathname.startsWith(ME_NODE_PREFIX) && pathname.endsWith(ME_NODE_SUFFIX);

/** One document per account+node, keyed so two accounts' states never collide. */
const READER_STATES = new Map();
const readerStateKey = (accountId, nodeId) => `${accountId}\u0000${nodeId}`;

/** Mirrors `EMPTY_READER_STATE` in the client's `domain/readerState.ts`. */
const EMPTY_READER_STATE = {
  bookmarked: false,
  discovered: [],
  reciteCount: 0,
  takeaway: "",
  actionItem: "",
};

/** A reader state is a small, fixed shape — reject anything else outright. */
function isValidReaderState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (typeof value.bookmarked !== "boolean") return false;
  if (!Number.isInteger(value.reciteCount) || value.reciteCount < 0) return false;
  if (typeof value.takeaway !== "string") return false;
  if (typeof value.actionItem !== "string") return false;
  if (!Array.isArray(value.discovered) || !value.discovered.every(isNonEmptyString)) return false;
  return true;
}

async function handleMeNodeState(req, res, url) {
  const accountId = accountFrom(req);
  if (!accountId) {
    return sendError(
      res,
      400,
      "INVALID_REQUEST",
      "The x-alminhej-account header is required — it is the account identity"
    );
  }

  const nodeId = decodeURIComponent(
    url.pathname.slice(ME_NODE_PREFIX.length, url.pathname.length - ME_NODE_SUFFIX.length)
  );
  // A state for a node nobody can read is a client bug, not a document to keep.
  if (!NODES.some((n) => n.id === nodeId)) {
    return sendError(res, 404, "NODE_NOT_FOUND", `No node with id '${nodeId}'`);
  }

  const key = readerStateKey(accountId, nodeId);

  if (req.method === "GET") {
    // As with the path: an account that has never touched this node simply has
    // no state, and the honest answer is the empty state, never a 404.
    return sendJson(res, 200, READER_STATES.get(key) ?? EMPTY_READER_STATE);
  }

  if (req.method !== "PUT") {
    return sendError(
      res,
      405,
      "METHOD_NOT_ALLOWED",
      `${req.method} is not supported on /v1/me/nodes/{id}/state`
    );
  }

  const body = await readJson(req);
  if (!isValidReaderState(body)) {
    return sendError(
      res,
      400,
      "INVALID_REQUEST",
      "Body must be a reader state: { bookmarked, discovered[], reciteCount, takeaway, actionItem }"
    );
  }

  const stored = {
    bookmarked: body.bookmarked,
    discovered: body.discovered,
    reciteCount: body.reciteCount,
    takeaway: body.takeaway,
    actionItem: body.actionItem,
  };
  READER_STATES.set(key, stored);
  return sendJson(res, 200, stored);
}

/* ------------------------------------------------------------------ *
 * §5.B — Content Management API
 * ------------------------------------------------------------------ */

function uniqueNodeId(base) {
  if (!NODES.some((n) => n.id === base)) return base;
  let suffix = 2;
  while (NODES.some((n) => n.id === `${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function uniqueRelationshipId(base) {
  if (!RELATIONSHIPS.some((r) => r.id === base)) return base;
  let suffix = 2;
  while (RELATIONSHIPS.some((r) => r.id === `${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

async function createNode(req, res) {
  const body = await readJson(req);

  if (!NODE_TYPES.includes(body.type)) {
    return sendError(res, 400, "INVALID_REQUEST", `'type' must be one of ${NODE_TYPES.join(", ")}`);
  }
  if (!isNonEmptyString(body.slug)) {
    return sendError(res, 400, "INVALID_REQUEST", "'slug' is required");
  }
  if (NODES.some((n) => n.slug === body.slug)) {
    return sendError(res, 409, "DUPLICATE_SLUG", `A node with slug '${body.slug}' already exists`);
  }
  if (!isLocalized(body.title)) {
    return sendError(res, 400, "INVALID_REQUEST", "'title' must be a localized { ar, en } object");
  }
  if (!body.attributes || !isNonEmptyString(body.attributes.kind)) {
    return sendError(res, 400, "INVALID_REQUEST", "'attributes' must include a 'kind'");
  }
  if (body.content !== undefined && !Array.isArray(body.content)) {
    return sendError(res, 400, "INVALID_REQUEST", "'content' must be an array of content blocks");
  }

  const node = {
    id: uniqueNodeId(isNonEmptyString(body.id) ? body.id : `${String(body.type).toLowerCase()}-${body.slug}`),
    type: body.type,
    slug: body.slug,
    status: "draft", // §5.B: new content always starts as a draft.
    title: body.title,
    attributes: body.attributes,
    content: body.content ?? [],
    schemaVersion: 1,
  };
  NODES.push(node);
  return sendJson(res, 201, node);
}

async function patchNode(req, res, node) {
  const body = await readJson(req);

  if (body.status !== undefined) {
    return sendError(
      res,
      400,
      "INVALID_REQUEST",
      "Status is not editable directly — use /submit-for-review or /publish"
    );
  }
  if (body.type !== undefined && !NODE_TYPES.includes(body.type)) {
    return sendError(res, 400, "INVALID_REQUEST", `'type' must be one of ${NODE_TYPES.join(", ")}`);
  }
  if (body.slug !== undefined) {
    if (!isNonEmptyString(body.slug)) {
      return sendError(res, 400, "INVALID_REQUEST", "'slug' must be a non-empty string");
    }
    if (NODES.some((n) => n.slug === body.slug && n.id !== node.id)) {
      return sendError(res, 409, "DUPLICATE_SLUG", `A node with slug '${body.slug}' already exists`);
    }
  }
  if (body.title !== undefined && !isLocalized(body.title)) {
    return sendError(res, 400, "INVALID_REQUEST", "'title' must be a localized { ar, en } object");
  }
  if (body.attributes !== undefined && (!body.attributes || !isNonEmptyString(body.attributes.kind))) {
    return sendError(res, 400, "INVALID_REQUEST", "'attributes' must include a 'kind'");
  }
  if (body.content !== undefined && !Array.isArray(body.content)) {
    return sendError(res, 400, "INVALID_REQUEST", "'content' must be an array of content blocks");
  }

  if (body.type !== undefined) node.type = body.type;
  if (body.slug !== undefined) node.slug = body.slug;
  if (body.title !== undefined) node.title = body.title;
  if (body.attributes !== undefined) node.attributes = body.attributes;
  if (body.content !== undefined) node.content = body.content;

  return sendJson(res, 200, node);
}

async function addRelationship(req, res, source) {
  const body = await readJson(req);

  if (!isNonEmptyString(body.to)) {
    return sendError(res, 400, "INVALID_REQUEST", "'to' is required");
  }
  if (!RELATIONSHIP_TYPES.includes(body.type)) {
    return sendError(res, 400, "INVALID_REQUEST", `'type' must be one of ${RELATIONSHIP_TYPES.join(", ")}`);
  }
  // This 404 is the guard §5.B calls out: refuse a dangling edge rather than
  // letting an editor mint a second "Sahih al-Bukhari" node by typo.
  if (!NODES.some((n) => n.id === body.to)) {
    return sendError(
      res,
      404,
      "NODE_NOT_FOUND",
      `No node with id '${body.to}' — link to the node that already exists instead of creating a duplicate`
    );
  }
  if (RELATIONSHIPS.some((r) => r.from === source.id && r.to === body.to && r.type === body.type)) {
    return sendError(
      res,
      409,
      "DUPLICATE_RELATIONSHIP",
      `'${source.id}' already has a ${body.type} edge to '${body.to}'`
    );
  }

  const edge = {
    id: uniqueRelationshipId(`r-${source.id}-${body.to}-${String(body.type).toLowerCase()}`),
    from: source.id,
    to: body.to,
    type: body.type,
  };
  if (body.metadata && typeof body.metadata === "object") edge.metadata = body.metadata;
  RELATIONSHIPS.push(edge);
  return sendJson(res, 201, edge);
}

function transition(req, res, node, target, allowedRoles, forbiddenMessage) {
  if (!hasRole(rolesFrom(req), allowedRoles)) {
    return sendError(res, 403, "FORBIDDEN", forbiddenMessage);
  }
  if (node.status === target) return sendJson(res, 200, node);
  if (node.status === "published") {
    return sendError(res, 409, "INVALID_STATE", `Node '${node.id}' is already published`);
  }

  node.status = target;
  // §5.B: publishing a node is what emits `NodePublished` and recomputes the
  // parent book's `digitization.indexedUnits` in a Mongo-backed server. Here
  // progress is derived from the graph on read (DigitizationProgressService), so
  // there is no cached counter to recompute — the status flip above is the whole
  // update, and the book's bar moves on the next read with no extra step.
  return sendJson(res, 200, node);
}

async function handleAdminNodes(req, res, url) {
  if (!hasRole(rolesFrom(req), EDITOR_ROLES)) {
    return sendError(
      res,
      403,
      "FORBIDDEN",
      "The Content Management API requires an editor, scholar-reviewer, or admin role"
    );
  }

  if (url.pathname === "/v1/admin/nodes") {
    if (req.method === "GET") {
      const type = url.searchParams.get("type");
      const status = url.searchParams.get("status");
      if (status !== null && !NODE_STATUSES.includes(status)) {
        return sendError(res, 400, "INVALID_REQUEST", `'status' must be one of ${NODE_STATUSES.join(", ")}`);
      }
      let result = NODES;
      if (type !== null) result = result.filter((n) => n.type === type);
      if (status !== null) result = result.filter((n) => n.status === status);
      return sendJson(res, 200, result);
    }
    if (req.method === "POST") return createNode(req, res);
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/admin/nodes`);
  }

  const suffix = decodeURIComponent(url.pathname.slice("/v1/admin/nodes/".length));
  const slash = suffix.indexOf("/");
  const id = slash === -1 ? suffix : suffix.slice(0, slash);
  const action = slash === -1 ? "" : suffix.slice(slash + 1);

  const node = NODES.find((n) => n.id === id);
  if (!node) return sendError(res, 404, "NODE_NOT_FOUND", `No node with id '${id}'`);

  if (action === "") {
    if (req.method === "GET") return sendJson(res, 200, node);
    if (req.method === "PATCH") return patchNode(req, res, node);
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/admin/nodes/{id}`);
  }

  if (req.method !== "POST") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/admin/nodes/{id}/${action}`);
  }

  switch (action) {
    case "relationships":
      return addRelationship(req, res, node);
    case "submit-for-review":
      return transition(
        req, res, node, "in_review", EDITOR_ROLES,
        "Submitting for review requires an editor, scholar-reviewer, or admin role"
      );
    case "publish":
      return transition(
        req, res, node, "published", REVIEWER_ROLES,
        "Publishing requires a scholar-reviewer or admin role"
      );
    default:
      return sendError(res, 404, "NOT_FOUND", `No admin action '${action}'`);
  }
}

/* ------------------------------------------------------------------ */

async function dispatch(req, res, url) {
  if (url.pathname === "/v1/admin/nodes" || url.pathname.startsWith("/v1/admin/nodes/")) {
    return handleAdminNodes(req, res, url);
  }

  // §7's companion is the one public route that is a POST — it has to be
  // matched before the generic GET-only guard below.
  if (isCompanionRoute(url.pathname)) {
    if (req.method !== "POST") {
      return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on the companion route`);
    }
    return handleCompanion(req, res, url);
  }

  // `/v1/me/*` accepts PUT as well as GET, so it too precedes the guard.
  if (url.pathname === "/v1/me/path") {
    return handleMePath(req, res);
  }
  if (isMeNodeStateRoute(url.pathname)) {
    return handleMeNodeState(req, res, url);
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported`);
  }
  if (url.pathname === "/v1/health") {
    return sendJson(res, 200, {
      status: "ok",
      nodes: NODES.length,
      relationships: RELATIONSHIPS.length,
      // Honest about the one dependency that lives outside this process.
      companion: companionReady() ? "ready" : "unconfigured",
    });
  }
  if (url.pathname === "/v1/nodes" || url.pathname.startsWith("/v1/nodes/")) {
    return handleNodes(res, url);
  }
  if (url.pathname === "/v1/relationships") {
    return handleRelationships(res, url);
  }

  return sendError(res, 404, "NOT_FOUND", `No route for ${url.pathname}`);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, OPTIONS",
      "access-control-allow-headers": "content-type, accept, x-alminhej-roles, x-alminhej-account",
    });
    return res.end();
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${PORT}`}`);

  try {
    await dispatch(req, res, url);
  } catch (cause) {
    if (cause instanceof BadRequest) {
      return sendError(res, 400, "INVALID_REQUEST", cause.message);
    }
    console.error(cause);
    return sendError(res, 500, "INTERNAL_ERROR", "Unexpected error");
  }
});

server.listen(PORT, () => {
  console.log(`AlMinhej API listening on http://localhost:${PORT} (${NODES.length} nodes, ${RELATIONSHIPS.length} edges)`);
});
