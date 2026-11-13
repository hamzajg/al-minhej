import type { WorkspaceKind, WorkspaceNote } from "@/domain/workspace";
import type { WorkspaceRepository } from "@/domain/repositories";
import type { ReaderState } from "@/domain/readerState";
import { MemoryReaderStateRepository } from "./MemoryReaderStateRepository";

/**
 * The no-backend stand-in for the user workspace. Two localStorage homes,
 * mirroring the server's two collections:
 *
 * - Bookmarks are *not* a separate store here either — they are the
 *   `bookmarked` flag on the per-node reader state, listed by scanning the
 *   `alminhej:readerstate:{account}:` prefix, exactly the local equivalent of
 *   the server filtering `READER_STATES` by account.
 * - Notes and reflections are one `alminhej:notes:{account}` array with a
 *   `kind` discriminator — §6's `user_notes`, one collection for both kinds.
 */
const notesKeyFor = (accountKey: string) => `alminhej:notes:${accountKey}`;
const readerStatePrefixFor = (accountKey: string) =>
  `alminhej:readerstate:${accountKey}:`;

const newLocalId = () =>
  `note-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private readerStates = new MemoryReaderStateRepository();

  private readNotes(accountKey: string): WorkspaceNote[] {
    try {
      const raw = window.localStorage.getItem(notesKeyFor(accountKey));
      const parsed = raw ? (JSON.parse(raw) as WorkspaceNote[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeNotes(accountKey: string, notes: WorkspaceNote[]): void {
    try {
      window.localStorage.setItem(notesKeyFor(accountKey), JSON.stringify(notes));
    } catch {
      /* storage unavailable — the session still works in memory */
    }
  }

  async listBookmarks(accountKey: string): Promise<string[]> {
    const prefix = readerStatePrefixFor(accountKey);
    const bookmarked: string[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          const state = JSON.parse(window.localStorage.getItem(key) ?? "null") as ReaderState | null;
          if (state?.bookmarked) bookmarked.push(key.slice(prefix.length));
        } catch {
          /* one corrupt document must not hide the rest */
        }
      }
    } catch {
      /* storage unavailable — no bookmarks to list */
    }
    return bookmarked;
  }

  async setBookmark(accountKey: string, nodeId: string, bookmarked: boolean): Promise<void> {
    // Read-modify-write through the reader-state repository so the flag merge
    // behaves identically to the server's — nothing else on the document moves.
    const state = await this.readerStates.get(accountKey, nodeId);
    await this.readerStates.save(accountKey, nodeId, { ...state, bookmarked });
  }

  async listNotes(
    accountKey: string,
    kind: WorkspaceKind,
    nodeId?: string
  ): Promise<WorkspaceNote[]> {
    return this.readNotes(accountKey)
      .filter((n) => n.kind === kind && (nodeId === undefined || n.nodeId === nodeId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async createNote(
    accountKey: string,
    kind: WorkspaceKind,
    nodeId: string,
    text: string
  ): Promise<WorkspaceNote> {
    const now = new Date().toISOString();
    const doc: WorkspaceNote = {
      id: newLocalId(),
      nodeId,
      kind,
      text,
      createdAt: now,
      updatedAt: now,
    };
    this.writeNotes(accountKey, [doc, ...this.readNotes(accountKey)]);
    return doc;
  }
}
