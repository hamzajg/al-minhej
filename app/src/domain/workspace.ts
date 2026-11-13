/**
 * §5.A's user workspace — the reader's own journal, one document per entry.
 *
 * `kind` is the only difference between the two routes the API exposes
 * (`/v1/me/notes`, `/v1/me/reflections`): a note is "what I wanted to
 * remember about this node", a reflection is "what this node changed in me".
 * Same shape, same collection (§6's `user_notes`), different question — so
 * the client treats them as one list with a badge rather than two stores.
 */
export type WorkspaceKind = "note" | "reflection";

export interface WorkspaceNote {
  id: string;
  /** The node this entry is about — the same id `KnowledgeRepository` uses. */
  nodeId: string;
  kind: WorkspaceKind;
  text: string;
  createdAt: string;
  updatedAt: string;
}
