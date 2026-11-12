/**
 * §6's document model — the persistent store the server's state actually lives
 * in, behind one small seam.
 *
 * `AlMinhej_Backend_Architecture.md` §6 names the collections: `knowledge_nodes`,
 * `relationships`, `users`, `user_progress`, `search_index`, `ai_sessions` (and,
 * per §5.A, the session tokens and each account's learning path). Until now
 * `api-server.mjs` held all of it in module-level arrays and Maps, so every write
 * died with the process — and the Content Management API's whole point (publish a
 * node, watch the book's digitization progress move) evaporated on the next
 * restart.
 *
 * This module is that state, expressed as §6's collections and persisted as one
 * JSON file per collection. Two deliberate constraints:
 *
 *   • **Zero dependencies, still.** The architecture doc's target is MongoDB,
 *     and this is not it — but the *shape* is: a collection of documents with
 *     `all()` and `replace()`, which is the whole surface this server needs. A
 *     Mongo adapter satisfies the same interface (`collection(name)` →
 *     `find({}).toArray()` / `deleteMany` + `insertMany`), so swapping this for
 *     the real thing is one file, not a rewrite. Requiring a running MongoDB
 *     would also break the property that `npm run api` works with nothing else
 *     installed.
 *   • **Opt-in.** With no `ALMINHEJ_DATA_DIR`, `createStore()` is a no-op and the
 *     server behaves exactly as before (in-memory, fixtures re-read at boot).
 *     That keeps the client/server parity check honest — a persisted, edited
 *     graph is *not* the fixture graph — and means neither CI nor a first-time
 *     `npm run api` writes anything to disk. Point the env var at a directory
 *     and the same server becomes durable.
 *
 * Writes are atomic (write a temp file, then rename over the target), so a crash
 * mid-save can't leave a half-written collection behind.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** §6's collections, as this server uses them. Documented so the mapping is explicit. */
export const COLLECTIONS = [
  "knowledge_nodes", // §6 `knowledge_nodes` — all authored content, polymorphic on `type`
  "relationships", //   §6 `relationships` — graph edges, queried from both directions
  "users", //         §6 `users` — auth/profile records (hash + salt included)
  "sessions", //      §5.A's session tokens; opaque, so they must be stored, not derived
  "learning_paths", //§6's per-user path — one document per account
  "reader_states", // §6 `user_progress` — per (userId, nodeId); §6.3's unique compound key
  "votes", //        §6 `votes` — per (userId, nodeId); §6.3's unique compound key
  "search_index", //  §6's denormalized index — refreshed whenever the graph's text changes
  "ai_sessions", //   §7/§6 `ai_sessions` — the companion Q&A audit log
];

/**
 * A store over `dir`, or an in-memory no-op store when `dir` is null.
 *
 * The collection API is intentionally two methods: read them all, write them all.
 * This server's collections are small (a hand-authored graph, a handful of
 * accounts) and are always read/written whole, so a document-level API would be
 * complexity without a caller.
 */
export function createStore({ dir } = {}) {
  const pathFor = (name) => join(dir, `${name}.json`);

  function read(name) {
    if (!dir) return null;
    try {
      const parsed = JSON.parse(readFileSync(pathFor(name), "utf8"));
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      // Absent or unreadable is not an error: it means "not seeded yet", and the
      // caller falls back to the fixtures exactly as it did before this existed.
      return null;
    }
  }

  function write(name, docs) {
    if (!dir) return;
    mkdirSync(dir, { recursive: true });
    const target = pathFor(name);
    const tmp = `${target}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(docs, null, 2)}\n`);
    renameSync(tmp, target);
  }

  return {
    /** `false` when nothing will be written — the server reports this on `/v1/health`. */
    persistent: Boolean(dir),
    dir: dir ?? null,
    collection: (name) => ({
      /** The stored documents, or `[]` when the collection has never been written. */
      all: () => read(name) ?? [],
      /** Persist the whole collection. A no-op when the store is in-memory. */
      replace: (docs) => write(name, docs),
    }),
  };
}
