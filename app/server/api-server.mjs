#!/usr/bin/env node
/**
 * AlMinhej Public Reading API — a minimal, dependency-free stand-in for the
 * REST surface in `AlMinhej_Backend_Architecture.md` §5.A.
 *
 * It serves the *same* knowledge graph the in-memory provider ships with
 * (`src/infrastructure/memory/data/*.json`), which is the whole point: the app
 * can be pointed at either implementation and has to produce identical output.
 * Swap this for the real Mongo-backed server later and nothing above
 * `infrastructure/` notices.
 *
 * Endpoints:
 *   GET /v1/health
 *   GET /v1/nodes/{id}                      -> KnowledgeNode
 *   GET /v1/nodes?slug={slug}               -> KnowledgeNode
 *   GET /v1/nodes?ids={id,id,...}           -> KnowledgeNode[]
 *   GET /v1/nodes?type={NodeType}           -> KnowledgeNode[] (published only)
 *   GET /v1/relationships?nodeId={id}[&direction=from|to] -> Relationship[]
 *
 * Run: npm run api   (PORT=8787 by default)
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "infrastructure", "memory", "data");

const NODES = JSON.parse(readFileSync(join(dataDir, "nodes.json"), "utf8"));
const RELATIONSHIPS = JSON.parse(readFileSync(join(dataDir, "relationships.json"), "utf8"));

const PORT = Number(process.env.PORT ?? 8787);

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

function handleNodes(res, url) {
  const id = url.pathname.slice("/v1/nodes/".length);
  if (id) {
    const node = NODES.find((n) => n.id === id);
    if (!node) return sendError(res, 404, "NODE_NOT_FOUND", `No node with id '${id}'`);
    return sendJson(res, 200, node);
  }

  const slug = url.searchParams.get("slug");
  if (slug !== null) {
    const node = NODES.find((n) => n.slug === slug);
    if (!node) return sendError(res, 404, "NODE_NOT_FOUND", `No node with slug '${slug}'`);
    return sendJson(res, 200, node);
  }

  const ids = url.searchParams.get("ids");
  if (ids !== null) {
    const wanted = new Set(ids.split(",").filter(Boolean));
    return sendJson(res, 200, NODES.filter((n) => wanted.has(n.id)));
  }

  const type = url.searchParams.get("type");
  if (type !== null) {
    // Mirrors MemoryKnowledgeRepository.listByType: published only.
    return sendJson(res, 200, NODES.filter((n) => n.type === type && n.status === "published"));
  }

  return sendJson(res, 200, NODES);
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

const server = createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type, accept",
    });
    return res.end();
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${PORT}`}`);

  if (req.method !== "GET") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", `${req.method} is not supported`);
  }
  if (url.pathname === "/v1/health") {
    return sendJson(res, 200, { status: "ok", nodes: NODES.length, relationships: RELATIONSHIPS.length });
  }
  if (url.pathname === "/v1/nodes" || url.pathname.startsWith("/v1/nodes/")) {
    return handleNodes(res, url);
  }
  if (url.pathname === "/v1/relationships") {
    return handleRelationships(res, url);
  }

  return sendError(res, 404, "NOT_FOUND", `No route for ${url.pathname}`);
});

server.listen(PORT, () => {
  console.log(`AlMinhej API listening on http://localhost:${PORT} (${NODES.length} nodes, ${RELATIONSHIPS.length} edges)`);
});
