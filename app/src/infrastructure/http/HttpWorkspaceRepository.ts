import type { WorkspaceKind, WorkspaceNote } from "@/domain/workspace";
import type { WorkspaceRepository } from "@/domain/repositories";
import {
  createMyNote,
  getMyBookmarks,
  getMyNotes,
  setMyBookmark,
} from "./meClient";

/**
 * The real workspace store: bookmarks, notes and reflections live on the
 * server behind `/v1/me/*`, keyed by the session token — `accountKey` is the
 * caller's bearer token here, same as every other `Http*` per-account
 * repository. `container.ts` selects this vs. the memory provider on
 * `VITE_ALMINHEJ_API_BASE_URL`.
 */
export class HttpWorkspaceRepository implements WorkspaceRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  listBookmarks(accountKey: string): Promise<string[]> {
    return getMyBookmarks(this.baseUrl, accountKey);
  }

  async setBookmark(accountKey: string, nodeId: string, bookmarked: boolean): Promise<void> {
    await setMyBookmark(this.baseUrl, accountKey, nodeId, bookmarked);
  }

  listNotes(
    accountKey: string,
    kind: WorkspaceKind,
    nodeId?: string
  ): Promise<WorkspaceNote[]> {
    return getMyNotes(this.baseUrl, accountKey, kind, nodeId);
  }

  createNote(
    accountKey: string,
    kind: WorkspaceKind,
    nodeId: string,
    text: string
  ): Promise<WorkspaceNote> {
    return createMyNote(this.baseUrl, accountKey, kind, nodeId, text);
  }
}
