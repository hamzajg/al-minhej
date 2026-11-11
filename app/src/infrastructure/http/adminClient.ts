import type {
  KnowledgeNode,
  NodeStatus,
  NodeType,
  Relationship,
  RelationshipType,
} from "@/domain/types";
import { BackendError } from "./httpClient";

/**
 * The client for `AlMinhej_Backend_Architecture.md` §5.B — the Content
 * Management API. Kept separate from the read-only repositories on purpose:
 * it is the one place that knows about roles, and it deliberately does *not*
 * collapse a 404 into `null` the way `apiGet` does. "The node you tried to
 * link to does not exist" is the error an editor needs to see (it's what
 * stops a duplicate "Sahih al-Bukhari"), not an absence to paper over.
 */

export type AdminRole = "editor" | "scholar-reviewer" | "admin";

export interface AdminContext {
  baseUrl: string;
  roles: AdminRole[];
}

type WritableField = "type" | "slug" | "title" | "attributes" | "content";

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

async function apiSend<T>(
  ctx: AdminContext,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${ctx.baseUrl.replace(/\/+$/, "")}${path}`;
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-alminhej-roles": ctx.roles.join(","),
  };
  if (body !== undefined) headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new BackendError("NETWORK_ERROR", `Could not reach the AlMinhej API at ${url} (${detail})`);
  }

  const payload = (await response.json().catch(() => null)) as (T & ErrorEnvelope) | null;

  if (!response.ok) {
    throw new BackendError(
      payload?.error?.code ?? "HTTP_ERROR",
      payload?.error?.message ?? `Request to ${url} failed with ${response.status}`,
      response.status
    );
  }

  return payload as T;
}

export function listAdminNodes(
  ctx: AdminContext,
  filter: { type?: NodeType; status?: NodeStatus } = {}
): Promise<KnowledgeNode[]> {
  const params = new URLSearchParams();
  if (filter.type) params.set("type", filter.type);
  if (filter.status) params.set("status", filter.status);
  const query = params.toString();
  return apiSend<KnowledgeNode[]>(ctx, "GET", `/v1/admin/nodes${query ? `?${query}` : ""}`);
}

export interface CreateNodeInput {
  type: NodeType;
  slug: string;
  title: { ar: string; en: string };
  attributes: KnowledgeNode["attributes"];
  content?: KnowledgeNode["content"];
}

export function createNode(ctx: AdminContext, input: CreateNodeInput): Promise<KnowledgeNode> {
  return apiSend<KnowledgeNode>(ctx, "POST", "/v1/admin/nodes", input);
}

export function patchNode(
  ctx: AdminContext,
  id: string,
  patch: Partial<Pick<KnowledgeNode, WritableField>>
): Promise<KnowledgeNode> {
  return apiSend<KnowledgeNode>(ctx, "PATCH", `/v1/admin/nodes/${encodeURIComponent(id)}`, patch);
}

export interface AddRelationshipInput {
  to: string;
  type: RelationshipType;
  metadata?: Record<string, string>;
}

export function addRelationship(
  ctx: AdminContext,
  id: string,
  input: AddRelationshipInput
): Promise<Relationship> {
  return apiSend<Relationship>(
    ctx,
    "POST",
    `/v1/admin/nodes/${encodeURIComponent(id)}/relationships`,
    input
  );
}

export function submitForReview(ctx: AdminContext, id: string): Promise<KnowledgeNode> {
  return apiSend<KnowledgeNode>(ctx, "POST", `/v1/admin/nodes/${encodeURIComponent(id)}/submit-for-review`);
}

export function publishNode(ctx: AdminContext, id: string): Promise<KnowledgeNode> {
  return apiSend<KnowledgeNode>(ctx, "POST", `/v1/admin/nodes/${encodeURIComponent(id)}/publish`);
}
