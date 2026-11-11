/**
 * The reader's own *per-node* state — the things a reader marks about a node,
 * as opposed to the node itself. Like `learning.ts`'s path, this is the
 * reader's state, never authored content, so it never touches the graph
 * fixtures and lives behind its own repository (`ReaderStateRepository`).
 *
 * Moving this off `localStorage` (`PROMPTS.md` Prompt 7) is the same swap the
 * path made in Prompt 6, one scope deeper: one document per (account, node)
 * instead of one per account, so a reader's bookmarks, discovered vocabulary,
 * recite counts, and Practice-tab notes follow the account rather than the
 * browser.
 */
export interface ReaderState {
  /** The reader has flagged this node (the reading toolbar's bookmark). */
  bookmarked: boolean;
  /** Vocabulary entry ids the reader has opened in the vocabulary helper. */
  discovered: string[];
  /** How many times the reader has recited this node in Memorize mode. */
  reciteCount: number;
  /** The reader's own reflection note (Practice tab). */
  takeaway: string;
  /** The reader's own action item (Practice tab). */
  actionItem: string;
}

/**
 * What a node's reader state is before the reader has done anything. Defined
 * once here so the memory provider, the hook, and the server's
 * `GET /v1/me/nodes/{id}/state` default all agree on what "nothing yet" means.
 */
export const EMPTY_READER_STATE: ReaderState = {
  bookmarked: false,
  discovered: [],
  reciteCount: 0,
  takeaway: "",
  actionItem: "",
};
