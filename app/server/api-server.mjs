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
 * move a node through `draft → in_review → published`, role-gated. Publishing here
 * is observable on the reading side immediately, because digitization progress is
 * derived from the graph at read time rather than cached on the book node.
 *
 * All of it — the graph, accounts, sessions, learning paths, per-node reader
 * state, the search index, the companion log — is read from and written through
 * `server/store.mjs`, §6's document model. With no `ALMINHEJ_DATA_DIR` the store
 * is in-memory and the fixtures are re-read at boot, which is the behavior this
 * server has always had; point the env var at a directory and every write lands
 * on disk, so an editor's publish, a reader's path, and a registered account all
 * survive a restart. `/v1/health` reports which mode is active.
 *
 * Endpoints — §5.A (public, no auth):
 *   GET /v1/health
 *   GET /v1/nodes/{id}
 *   GET /v1/nodes?slug={slug}
 *   GET /v1/nodes?ids={id,id,...}
 *   GET /v1/nodes?type={NodeType}
 *   GET /v1/relationships?nodeId={id}[&direction=from|to]
 *   GET /v1/reading/{slug}              ← the whole assembled reading DTO in one call
 *   GET /v1/explore/{slug}              ← the node's neighborhood: neighbors, timeline, cross-refs
 *   GET /v1/paths/recommended?from={slug}[&exclude={id,id}][&prefer={reason,reason}]
 *                                       ← the one next node the graph supports from here
 *   GET /v1/search?q={query}            ← cross-type search over the graph (§6's search_index)
 *   GET  /v1/nodes/{id}/votes           ← the public tally (+ `votedByMe` when a session is sent)
 *   POST /v1/nodes/{id}/votes           ← cast a prioritization vote (§6's `votes`, auth required)
 *   POST /v1/nodes/{id}/companion/ask   ← grounded AI answer (§7)
 *
 * Endpoints — §5.A (auth, no credentials to read):
 *   POST /v1/auth/register   ← email + password -> session token
 *   POST /v1/auth/login      ← email + password -> session token
 *   POST /v1/auth/logout     ← invalidate the caller's session
 *   GET  /v1/auth/me         ← the identity behind the caller's token
 *
 * Endpoints — §5.A (the reader's own state, sends `Authorization: Bearer`):
 *   GET /v1/me/path      ← the account's learning path
 *   PUT /v1/me/path      ← replace it
 *   GET /v1/me/nodes/{id}/state  ← the account's own state for one node
 *   PUT /v1/me/nodes/{id}/state  ← replace it
 *   GET  /v1/me/progress ← the account's aggregate learning progress
 *   POST /v1/onboarding/goals    ← set the initial learning path from a goal
 *
 * Endpoints — §5.B (admin, sends `x-alminhej-roles`):
 *   GET   /v1/admin/nodes?type={NodeType}&status={NodeStatus}
 *   POST  /v1/admin/nodes
 *   PATCH /v1/admin/nodes/{id}
 *   POST  /v1/admin/nodes/{id}/relationships
 *   POST  /v1/admin/nodes/{id}/submit-for-review
 *   POST  /v1/admin/nodes/{id}/publish
 *
 * Run: npm run api                       (PORT=8787 by default; in-memory)
 *      ALMINHEJ_DATA_DIR=.data npm run api   (same server, now durable)
 *
 * The companion route is the only one that leaves this process: it calls the
 * Anthropic API with `ANTHROPIC_API_KEY` from the environment (never from the
 * client — see §7 and `server/companion.mjs`). With no key set it answers 503
 * rather than pretending, so the app can show an honest "not configured" state.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildKnowledgeContext } from "./knowledgeContext.mjs";
import { assembleReadingExperience } from "./readingExperience.mjs";
import { buildSearchIndex, searchGraph } from "./search.mjs";
import { assembleExplore } from "./explore.mjs";
import { recommendNext } from "./recommendations.mjs";
import { askClaude, CompanionUpstreamError, DEFAULT_MODEL } from "./companion.mjs";
import { createStore } from "./store.mjs";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "infrastructure", "memory", "data");

/**
 * §6's document model. `ALMINHEJ_DATA_DIR` makes it durable; unset, it is a no-op
 * store and every collection below hydrates to nothing, exactly as this server
 * behaved before the store existed.
 */
const store = createStore({ dir: process.env.ALMINHEJ_DATA_DIR ?? null });

const fixture = (name) => JSON.parse(readFileSync(join(dataDir, name), "utf8"));

/**
 * The authored graph. On a fresh — or in-memory — store this is the JSON fixtures,
 * the same ones the client's Memory provider ships, which is what keeps the two
 * providers comparable. On a *persisted* store that has been written to, it is
 * whatever was last saved: an editor's published node is still published after a
 * restart, and the fixtures are only ever the seed.
 */
const NODES = store.collection("knowledge_nodes").all();
if (NODES.length === 0) NODES.push(...fixture("nodes.json"));

const RELATIONSHIPS = store.collection("relationships").all();
if (RELATIONSHIPS.length === 0) RELATIONSHIPS.push(...fixture("relationships.json"));

/** Persist a whole collection. A no-op while the store is in-memory. */
const collections = {
  nodes: store.collection("knowledge_nodes"),
  relationships: store.collection("relationships"),
  users: store.collection("users"),
  sessions: store.collection("sessions"),
  learningPaths: store.collection("learning_paths"),
  readerStates: store.collection("reader_states"),
  votes: store.collection("votes"),
  searchIndex: store.collection("search_index"),
  aiSessions: store.collection("ai_sessions"),
};

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
 * grounded." It is §6's `ai_sessions` collection: hydrated from the store at
 * boot and appended through it, so the audit trail outlives the process that
 * wrote it.
 */
const AI_SESSIONS = collections.aiSessions.all();

/**
 * §6's `search_index` — "denormalized, refreshed on publish".
 *
 * The index is derived state, so it is never hand-maintained: it is written by
 * `refreshSearchIndex` at boot, and again after every write that can change a
 * node's searchable text. §5.B names publishing as the refresh trigger and it is
 * the interesting one, but an editor's PATCH can change a title or a body on a
 * node that is already live, and a stale index would leave a reader unable to
 * find text sitting in plain sight on the page. So the rule is the broader one —
 * "whenever the text changes" — with publish as one such moment.
 *
 * A store written by an older server has no such collection; an empty one is
 * indistinguishable from a stale one, so it is rebuilt. A populated one is
 * trusted, because the only writer is the refresh above.
 */
const SEARCH_INDEX = collections.searchIndex.all();

function refreshSearchIndex() {
  SEARCH_INDEX.length = 0;
  SEARCH_INDEX.push(...buildSearchIndex(NODES));
  collections.searchIndex.replace(SEARCH_INDEX);
}

if (SEARCH_INDEX.length === 0) refreshSearchIndex();

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

const READING_PREFIX = "/v1/reading/";
const EXPLORE_PREFIX = "/v1/explore/";

/**
 * §5.A's `GET /v1/reading/{slug}` — the assembled `ReadingExperienceDTO`, so the
 * client fetches it in one request instead of reassembling it from the raw
 * `nodes`/`relationships` endpoints. The assembly itself lives in
 * `readingExperience.mjs` (the server-side twin of the client's
 * `AssembleReadingExperience`); this handler only resolves the slug, 404s on an
 * unknown one, and serializes the DTO.
 */
function handleReading(res, url) {
  const slug = decodeURIComponent(url.pathname.slice(READING_PREFIX.length));
  if (!slug) {
    return sendError(res, 404, "NOT_FOUND", "A slug is required: GET /v1/reading/{slug}");
  }
  const dto = assembleReadingExperience(slug, NODES, RELATIONSHIPS);
  if (!dto) {
    return sendError(res, 404, "NODE_NOT_FOUND", `No published node with slug '${slug}'`);
  }
  return sendJson(res, 200, dto);
}

/**
 * §5.A's `GET /v1/explore/{slug}` — the node's neighborhood, assembled. The walk
 * itself lives in `explore.mjs` (the server-side twin of the client's
 * `application/ExploreGraph.ts`, parity-checked against it); this handler only
 * resolves the slug, 404s on an unknown one, and serializes the DTO.
 *
 * Unlike `/v1/reading/{slug}` there is nothing to assemble per request beyond the
 * walk itself — no index, no cache — so the answer always describes the graph as
 * it stands right now, including a node an editor published a moment ago.
 */
function handleExplore(res, url) {
  const slug = decodeURIComponent(url.pathname.slice(EXPLORE_PREFIX.length));
  if (!slug) {
    return sendError(res, 404, "NOT_FOUND", "A slug is required: GET /v1/explore/{slug}");
  }
  const dto = assembleExplore(slug, NODES, RELATIONSHIPS);
  if (!dto) {
    return sendError(res, 404, "NODE_NOT_FOUND", `No published node with slug '${slug}'`);
  }
  return sendJson(res, 200, dto);
}

const RECOMMENDED_PATH = "/v1/paths/recommended";

/**
 * §5.A's `GET /v1/paths/recommended?from={slug}` — the one next node the graph
 * supports from where the reader is, given the ids already on their path
 * (`exclude`) and the rule order a goal wants (`prefer`). The walk itself lives
 * in `recommendations.mjs` (the server-side twin of the client's
 * `application/RecommendationGraph.ts`, parity-checked against it); this handler
 * only parses the query, 404s on an unknown starting slug, and serializes the
 * DTO.
 *
 * A missing `from` is a `400` — a malformed request. A `from` that is not in the
 * published graph is a `404`. A `from` that *is* real but has nothing readable to
 * point at is a `200` whose `next` is `null`: "nothing to suggest from here" is a
 * real answer, not an error, and the two must not collapse into one.
 */
function handleRecommendedPaths(res, url) {
  const from = url.searchParams.get("from");
  if (from === null || from === "") {
    return sendError(
      res,
      400,
      "INVALID_REQUEST",
      "A starting node is required: GET /v1/paths/recommended?from={slug}"
    );
  }
  const exclude = (url.searchParams.get("exclude") ?? "").split(",").filter(Boolean);
  const prefer = (url.searchParams.get("prefer") ?? "").split(",").filter(Boolean);
  const dto = recommendNext({ fromSlug: from, exclude, prefer }, NODES, RELATIONSHIPS);
  if (!dto) {
    return sendError(res, 404, "NODE_NOT_FOUND", `No published node with slug '${from}'`);
  }
  return sendJson(res, 200, dto);
}

/**
 * §5.A's `GET /v1/search?q={query}` — cross-type search over the graph, served
 * from §6's `search_index`. The query itself lives in `search.mjs` (the
 * server-side twin of `application/SearchGraph.ts`, parity-checked against it);
 * this handler only validates the request and serializes the rows.
 *
 * A missing `q` is a `400`, not an empty page: an absent parameter is a
 * malformed request, whereas `?q=` with nothing in it legitimately matches
 * nothing and answers `200 []`. Collapsing the two would hide a client bug.
 */
function handleSearch(res, url) {
  const query = url.searchParams.get("q");
  if (query === null) {
    return sendError(res, 400, "INVALID_REQUEST", "A query is required: GET /v1/search?q={query}");
  }
  return sendJson(res, 200, searchGraph(query, SEARCH_INDEX, NODES));
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
    collections.aiSessions.replace(AI_SESSIONS);
    return sendJson(res, 200, { answer, model, grounded: true });
  } catch (cause) {
    if (cause instanceof CompanionUpstreamError) {
      return sendError(res, 502, "COMPANION_UPSTREAM_ERROR", cause.message);
    }
    throw cause;
  }
}

/* ------------------------------------------------------------------ *
 * §5.A — auth (`/v1/auth/*`)
 *
 * Real identity, replacing the self-minted token Prompt 6 shipped: there, the
 * client invented a value and sent it as `x-alminhej-account`, and that value
 * *was* the account — so anyone could reach anyone's path by guessing a header.
 * Here a reader registers or logs in with an email and a password, the password
 * is salted and hashed with `scrypt` (compared in constant time), and the server
 * issues an opaque session token. `/v1/me/*` then resolves the account from that
 * token — it never trusts a client-supplied id again.
 *
 * Tokens are random and looked up in `SESSIONS` rather than signed: there is no
 * signing key to leak, and `logout` is a real delete rather than a denylist — a
 * smaller surface than a hand-rolled JWT. Both §6's `users` collection and those
 * tokens live in the store, so a durable server keeps its accounts *and* their
 * sessions across a restart; in-memory, they reset with the process.
 * ------------------------------------------------------------------ */

/** §6's `users` collection, held two ways: by email to log in, by id for `/v1/auth/me`. */
const USERS = new Map(); // email (lowercased) -> user
const USERS_BY_ID = new Map(); // id -> user
const SESSIONS = new Map(); // token -> { userId, createdAt }

const saveUsers = () => collections.users.replace([...USERS.values()]);
const saveSessions = () =>
  collections.sessions.replace([...SESSIONS].map(([token, session]) => ({ token, ...session })));

for (const user of collections.users.all()) {
  USERS.set(user.email, user);
  USERS_BY_ID.set(user.id, user);
}
for (const { token, ...session } of collections.sessions.all()) {
  SESSIONS.set(token, session);
}

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UNAUTHENTICATED_MESSAGE = "Sign in required: send a valid Authorization: Bearer <token>";

const hashPassword = (password, salt) => scryptSync(password, salt, 64).toString("hex");

/** Constant-time so a wrong password and a wrong-length hash take the same path. */
function verifyPassword(password, user) {
  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = Buffer.from(hashPassword(password, user.salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function issueSession(userId) {
  const token = randomBytes(32).toString("hex");
  SESSIONS.set(token, { userId, createdAt: new Date().toISOString() });
  saveSessions();
  return token;
}

/** What a caller is allowed to see of a user — never the hash, never the salt. */
const publicUser = (user) => ({ id: user.id, email: user.email });

/** The `Authorization: Bearer <token>` value, or null. */
function tokenFrom(req) {
  const raw = req.headers["authorization"];
  if (!isNonEmptyString(raw)) return null;
  const [scheme, value] = String(raw).split(" ");
  return scheme?.toLowerCase() === "bearer" && isNonEmptyString(value) ? value.trim() : null;
}

/** The authenticated user id behind the request, or null (no session). */
function accountFrom(req) {
  const token = tokenFrom(req);
  const session = token ? SESSIONS.get(token) : null;
  return session ? session.userId : null;
}

/** Validate and normalize an email/password pair, or return the reason it isn't one. */
function readCredentials(body) {
  if (!isNonEmptyString(body.email) || !EMAIL_PATTERN.test(body.email.trim())) {
    return { error: "'email' must be a valid email address" };
  }
  if (!isNonEmptyString(body.password) || body.password.length < MIN_PASSWORD_LENGTH) {
    return { error: `'password' must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  return { email: body.email.trim().toLowerCase(), password: body.password };
}

async function handleAuthRegister(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/auth/register`);
  }
  const creds = readCredentials(await readJson(req));
  if (creds.error) return sendError(res, 400, "INVALID_REQUEST", creds.error);
  if (USERS.has(creds.email)) {
    return sendError(res, 409, "EMAIL_TAKEN", "An account with that email already exists");
  }

  const salt = randomBytes(16).toString("hex");
  const user = {
    id: `user-${randomBytes(8).toString("hex")}`,
    email: creds.email,
    passwordHash: hashPassword(creds.password, salt),
    salt,
    createdAt: new Date().toISOString(),
  };
  USERS.set(user.email, user);
  USERS_BY_ID.set(user.id, user);
  saveUsers();
  return sendJson(res, 201, { token: issueSession(user.id), user: publicUser(user) });
}

async function handleAuthLogin(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/auth/login`);
  }
  const body = await readJson(req);
  if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
    return sendError(res, 400, "INVALID_REQUEST", "'email' and 'password' are required");
  }

  const user = USERS.get(body.email.trim().toLowerCase());
  // One response for "no such email" and "wrong password" — neither the message
  // nor the status may tell a caller which accounts exist.
  if (!user || !verifyPassword(body.password, user)) {
    return sendError(res, 401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }
  return sendJson(res, 200, { token: issueSession(user.id), user: publicUser(user) });
}

function handleAuthMe(req, res) {
  if (req.method !== "GET") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/auth/me`);
  }
  const session = SESSIONS.get(tokenFrom(req));
  const user = session ? USERS_BY_ID.get(session.userId) : null;
  if (!user) return sendError(res, 401, "UNAUTHENTICATED", UNAUTHENTICATED_MESSAGE);
  return sendJson(res, 200, { user: publicUser(user) });
}

function handleAuthLogout(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/auth/logout`);
  }
  const token = tokenFrom(req);
  if (token) {
    SESSIONS.delete(token);
    saveSessions();
  }
  // Idempotent: logging out an already-invalid session is not an error.
  return sendJson(res, 200, { ok: true });
}

async function handleAuth(req, res, url) {
  switch (url.pathname) {
    case "/v1/auth/register":
      return handleAuthRegister(req, res);
    case "/v1/auth/login":
      return handleAuthLogin(req, res);
    case "/v1/auth/logout":
      return handleAuthLogout(req, res);
    case "/v1/auth/me":
      return handleAuthMe(req, res);
    default:
      return sendError(res, 404, "NOT_FOUND", `No auth route for ${url.pathname}`);
  }
}

/* ------------------------------------------------------------------ *
 * §5.A — the reader's own state, per account (`/v1/me/*`)
 *
 * Identity is now real (see above): the account is whatever user the caller's
 * session token belongs to, resolved server-side. A missing or invalid token is
 * a `401`, never a `400` — "you are not signed in" and "your request was
 * malformed" are different failures and the client acts on them differently.
 * §6's `learning_paths`: one document per account, held in the store, so a path
 * a reader built yesterday is still theirs today.
 * ------------------------------------------------------------------ */

/** accountId -> the account's learning path. §6's `learning_paths`. */
const ACCOUNTS = new Map();

const savePaths = () =>
  collections.learningPaths.replace([...ACCOUNTS].map(([accountId, path]) => ({ accountId, path })));

for (const { accountId, path } of collections.learningPaths.all()) {
  ACCOUNTS.set(accountId, path);
}

/** Mirrors `EMPTY_LEARNING_PATH` in the client's `domain/learning.ts`. */
const EMPTY_PATH = {
  goalId: null,
  seedNodeId: null,
  visited: [],
  startedAt: null,
  onboardingSeen: false,
};

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
    return sendError(res, 401, "UNAUTHENTICATED", UNAUTHENTICATED_MESSAGE);
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
  savePaths();
  return sendJson(res, 200, stored);
}

/* ------------------------------------------------------------------ *
 * §5.A — the reader's own state *for one node* (`/v1/me/nodes/{id}/state`)
 *
 * The path above is one document per account; this is one per (account,
 * node): bookmark, discovered vocabulary, recite count, and the Practice-tab
 * notes. It is the same identity story (the account behind the caller's session
 * token) and the same in-memory lifecycle. Kept separate from the path because
 * it is written on nearly every reader interaction, where the path is not.
 * ------------------------------------------------------------------ */

const ME_NODE_PREFIX = "/v1/me/nodes/";
const ME_NODE_SUFFIX = "/state";

/** `true` when the path is the per-node state route (its `{id}` is encoded). */
const isMeNodeStateRoute = (pathname) =>
  pathname.startsWith(ME_NODE_PREFIX) && pathname.endsWith(ME_NODE_SUFFIX);

/**
 * One document per (account, node) — §6's `user_progress`, whose §6.3 unique
 * compound key `(userId, nodeId)` is exactly this pair. The in-process key is a
 * joined string so two accounts' states can never collide; the store gets it back
 * as the two fields, so the persisted shape is the documented one rather than a
 * serialization artifact.
 */
const READER_STATES = new Map();
const readerStateKey = (accountId, nodeId) => `${accountId}\u0000${nodeId}`;

const saveReaderStates = () =>
  collections.readerStates.replace(
    [...READER_STATES].map(([key, state]) => {
      const [accountId, nodeId] = key.split("\u0000");
      return { accountId, nodeId, state };
    })
  );

for (const { accountId, nodeId, state } of collections.readerStates.all()) {
  READER_STATES.set(readerStateKey(accountId, nodeId), state);
}

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
    return sendError(res, 401, "UNAUTHENTICATED", UNAUTHENTICATED_MESSAGE);
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
  saveReaderStates();
  return sendJson(res, 200, stored);
}

/* ------------------------------------------------------------------ *
 * §5.A — prioritization votes (`/v1/nodes/{id}/votes`)
 *
 * A vote is a public signal on a source — "digitize this next" — not reader
 * state and not knowledge, so it gets its own §6 collection (`votes`) rather
 * than living inside `reader_states`. The tally itself is public: anyone can
 * see how many accounts asked for a node. Casting is not anonymous — §6.3's
 * unique compound `(userId, nodeId)` only means something when there is a
 * userId, so POST resolves the caller's session exactly like `/v1/me/*` does
 * and answers `401` without one.
 *
 * Idempotency is layered the way §5.A describes it: the `(accountId, nodeId)`
 * compound makes a repeat vote a no-op (the same account cannot inflate the
 * count), and an `Idempotency-Key` header makes a *retried* request replay the
 * first response instead of counting twice — the flaky-mobile-connection case
 * the architecture doc calls out. Both return the same `VoteTally` shape the
 * client's `domain/votes.ts` defines.
 * ------------------------------------------------------------------ */

const NODE_VOTES_PREFIX = "/v1/nodes/";
const NODE_VOTES_SUFFIX = "/votes";

/** `true` when the path is the votes route (its `{id}` is encoded). */
const isNodeVotesRoute = (pathname) =>
  pathname.startsWith(NODE_VOTES_PREFIX) && pathname.endsWith(NODE_VOTES_SUFFIX);

/** §6's `votes` collection — one document per (account, node) that voted. */
const VOTES = collections.votes.all();
const saveVotes = () => collections.votes.replace(VOTES);

/**
 * `Idempotency-Key` → the nodeId it was first spent on, scoped per account.
 * Rebuilt from the store at boot so a replay survives a restart, not just a
 * retry inside one process.
 */
const VOTE_IDEMPOTENCY = new Map();
for (const vote of VOTES) {
  if (vote.idempotencyKey) {
    VOTE_IDEMPOTENCY.set(`${vote.accountId}${vote.idempotencyKey}`, vote.nodeId);
  }
}

/** The `{nodeId, count, votedByMe}` triple — `votedByMe` needs an account. */
function voteTally(nodeId, accountId) {
  const forNode = VOTES.filter((v) => v.nodeId === nodeId);
  return {
    nodeId,
    count: forNode.length,
    votedByMe: Boolean(accountId && forNode.some((v) => v.accountId === accountId)),
  };
}

async function handleNodeVotes(req, res, url) {
  const nodeId = decodeURIComponent(
    url.pathname.slice(NODE_VOTES_PREFIX.length, url.pathname.length - NODE_VOTES_SUFFIX.length)
  );
  // Votes are a public signal on *published* sources — same visibility rule
  // as every other §5.A read, so a draft's tally is a 404, not a zero.
  if (!NODES.some((n) => n.id === nodeId && n.status === "published")) {
    return sendError(res, 404, "NODE_NOT_FOUND", `No published node with id '${nodeId}'`);
  }

  if (req.method === "GET") {
    // Public read: the count is for everyone; `votedByMe` resolves only when
    // the caller sends a live session, and is honestly `false` otherwise.
    return sendJson(res, 200, voteTally(nodeId, accountFrom(req)));
  }

  if (req.method !== "POST") {
    return sendError(
      res,
      405,
      "METHOD_NOT_ALLOWED",
      `${req.method} is not supported on /v1/nodes/{id}/votes`
    );
  }

  const accountId = accountFrom(req);
  if (!accountId) {
    return sendError(res, 401, "UNAUTHENTICATED", UNAUTHENTICATED_MESSAGE);
  }

  const idempotencyKey = req.headers["idempotency-key"];
  const key = isNonEmptyString(idempotencyKey) ? idempotencyKey.trim() : null;
  if (key) {
    const seen = VOTE_IDEMPOTENCY.get(`${accountId}${key}`);
    if (seen !== undefined && seen !== nodeId) {
      return sendError(
        res,
        400,
        "INVALID_REQUEST",
        "Idempotency-Key was already used for a vote on a different node"
      );
    }
    if (seen === nodeId) {
      // A retry of a vote that already landed: replay the tally, don't recount.
      return sendJson(res, 200, voteTally(nodeId, accountId));
    }
  }

  if (VOTES.some((v) => v.accountId === accountId && v.nodeId === nodeId)) {
    // §6.3's unique compound doing its job: the same account cannot vote twice.
    return sendJson(res, 200, voteTally(nodeId, accountId));
  }

  const vote = {
    accountId,
    nodeId,
    idempotencyKey: key,
    at: new Date().toISOString(),
  };
  VOTES.push(vote);
  saveVotes();
  if (key) VOTE_IDEMPOTENCY.set(`${accountId}${key}`, nodeId);
  return sendJson(res, 201, voteTally(nodeId, accountId));
}

/* ------------------------------------------------------------------ *
 * §5.A — onboarding goals and learning progress
 *
 * `POST /v1/onboarding/goals` is the *initial* path write: it exists
 * separately from `PUT /v1/me/path` because onboarding is the one moment a
 * path is created rather than updated — the endpoint refuses to clobber a
 * path the reader has already travelled (`visited` non-empty → 409), which
 * the generic PUT deliberately does not police.
 *
 * `GET /v1/me/progress` is the aggregate read the journey endpoints imply:
 * the path's own counters plus what the per-node reader states add up to.
 * Both resolve the account from the session token exactly like `/v1/me/*`.
 * ------------------------------------------------------------------ */

async function handleOnboardingGoals(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/onboarding/goals`);
  }
  const accountId = accountFrom(req);
  if (!accountId) {
    return sendError(res, 401, "UNAUTHENTICATED", UNAUTHENTICATED_MESSAGE);
  }

  const body = await readJson(req);
  if (!isNonEmptyString(body.goalId)) {
    return sendError(res, 400, "INVALID_REQUEST", "'goalId' is required");
  }
  if (!isNonEmptyString(body.seedNodeId)) {
    return sendError(res, 400, "INVALID_REQUEST", "'seedNodeId' is required");
  }
  // The seed must be a node a reader can actually start from — same
  // published-only rule as every other §5.A read.
  if (!NODES.some((n) => n.id === body.seedNodeId && n.status === "published")) {
    return sendError(res, 404, "NODE_NOT_FOUND", `No published node with id '${body.seedNodeId}'`);
  }

  const existing = ACCOUNTS.get(accountId);
  if (existing && existing.visited.length > 0) {
    return sendError(
      res,
      409,
      "PATH_EXISTS",
      "This account already has a learning path with progress; reset it before onboarding again"
    );
  }

  const path = {
    goalId: body.goalId,
    seedNodeId: body.seedNodeId,
    visited: [],
    startedAt: new Date().toISOString(),
    onboardingSeen: true,
  };
  ACCOUNTS.set(accountId, path);
  savePaths();
  return sendJson(res, 200, path);
}

function handleMeProgress(req, res) {
  if (req.method !== "GET") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported on /v1/me/progress`);
  }
  const accountId = accountFrom(req);
  if (!accountId) {
    return sendError(res, 401, "UNAUTHENTICATED", UNAUTHENTICATED_MESSAGE);
  }

  const path = ACCOUNTS.get(accountId) ?? EMPTY_PATH;
  // Every reader-state document this account owns — the in-process key is
  // `${accountId}\0${nodeId}`, so the prefix is the account boundary.
  const mine = [...READER_STATES.entries()]
    .filter(([key]) => key.startsWith(accountId + "\u0000"))
    .map(([, state]) => state);
  const discovered = new Set(mine.flatMap((s) => s.discovered));

  return sendJson(res, 200, {
    goalId: path.goalId,
    seedNodeId: path.seedNodeId,
    startedAt: path.startedAt,
    visitedCount: path.visited.length,
    bookmarkedCount: mine.filter((s) => s.bookmarked).length,
    discoveredCount: discovered.size,
    reciteCount: mine.reduce((sum, s) => sum + s.reciteCount, 0),
  });
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
  collections.nodes.replace(NODES);
  refreshSearchIndex();
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

  collections.nodes.replace(NODES);
  // A PATCH can change a title or a body on an already-published node, so the
  // index has to follow it — §6's "refreshed on publish" is the trigger §5.B
  // names, but it is not the only way a node's text can change.
  refreshSearchIndex();
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
  collections.relationships.replace(RELATIONSHIPS);
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
  // update, and the book's bar moves on the next read with no extra step. What
  // the store adds is that the flip *sticks*: the page a reviewer publishes is
  // still published for the next process that boots.
  collections.nodes.replace(NODES);
  // §6: publishing a node is what "refreshes the search index" — the moment a
  // node becomes findable, and the moment it stops being invisible to readers.
  refreshSearchIndex();
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

  // `/v1/auth/*` is POST as well as GET, so it too precedes the guard.
  if (url.pathname.startsWith("/v1/auth/")) {
    return handleAuth(req, res, url);
  }

  // `/v1/me/*` accepts PUT as well as GET, so it too precedes the guard.
  if (url.pathname === "/v1/me/path") {
    return handleMePath(req, res);
  }
  if (isMeNodeStateRoute(url.pathname)) {
    return handleMeNodeState(req, res, url);
  }
  if (url.pathname === "/v1/me/progress") {
    return handleMeProgress(req, res);
  }
  // `/v1/onboarding/*` accepts POST, so it precedes the GET-only guard too.
  if (url.pathname === "/v1/onboarding/goals") {
    return handleOnboardingGoals(req, res);
  }

  // Votes accept POST (and GET with an optional session), so the route is
  // matched before the GET-only guard and before the generic /v1/nodes/* reads.
  if (isNodeVotesRoute(url.pathname)) {
    return handleNodeVotes(req, res, url);
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported`);
  }
  if (url.pathname.startsWith(READING_PREFIX)) {
    return handleReading(res, url);
  }
  if (url.pathname.startsWith(EXPLORE_PREFIX)) {
    return handleExplore(res, url);
  }
  if (url.pathname === "/v1/health") {
    return sendJson(res, 200, {
      status: "ok",
      nodes: NODES.length,
      relationships: RELATIONSHIPS.length,
      // §6's `search_index` — the count of *indexed* (i.e. published) nodes, which
      // is why it can be smaller than `nodes` above.
      searchIndex: SEARCH_INDEX.length,
      // Honest about the one dependency that lives outside this process.
      companion: companionReady() ? "ready" : "unconfigured",
      // …and about whether this server's writes outlive it (§6's store).
      persistence: store.persistent ? "file" : "memory",
    });
  }
  if (url.pathname === "/v1/search") {
    return handleSearch(res, url);
  }
  if (url.pathname === RECOMMENDED_PATH) {
    return handleRecommendedPaths(res, url);
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
      "access-control-allow-headers": "content-type, accept, authorization, x-alminhej-roles, idempotency-key",
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
  console.log(
    store.persistent
      ? `Persistence: file — §6's collections are written to ${store.dir}`
      : "Persistence: memory — set ALMINHEJ_DATA_DIR to keep writes across restarts"
  );
});
