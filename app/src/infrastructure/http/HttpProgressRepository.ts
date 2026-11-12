import type { ProgressDTO } from "@/domain/learning";
import type { ProgressRepository } from "@/domain/repositories";
import { getMyProgress } from "./meClient";

/**
 * The real aggregate read: `GET /v1/me/progress` over the session token —
 * the server sums the account's path and every per-node reader state it
 * owns. `accountKey` is the caller's bearer token here, same as the other
 * `Http*` per-account repositories.
 */
export class HttpProgressRepository implements ProgressRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get(accountKey: string): Promise<ProgressDTO> {
    return getMyProgress(this.baseUrl, accountKey);
  }
}
