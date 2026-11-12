/**
 * §5.A's `POST /v1/nodes/{id}/votes` — a digitization-prioritization vote.
 *
 * A vote is not knowledge and not reader-state-for-this-node: it is a *public*
 * count on a source, plus a private "did I already vote" bit so the same
 * account cannot inflate it. The two fields travel together as `VoteTally`
 * because the UI always needs both, and splitting them would let the button
 * and the count disagree about the same click.
 */
export interface VoteTally {
  nodeId: string;
  /** How many distinct accounts have voted for this node. */
  count: number;
  /** Whether *this* caller is one of them. False when the caller is anonymous. */
  votedByMe: boolean;
}

export const emptyTally = (nodeId: string): VoteTally => ({
  nodeId,
  count: 0,
  votedByMe: false,
});
