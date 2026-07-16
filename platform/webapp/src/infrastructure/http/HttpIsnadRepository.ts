import type { IsnadRepository } from "@/domain/repositories";
import type { IsnadData } from "@/domain/types";

const API_BASE = "/api";

let cache: Record<string, IsnadData> = {};

async function fetchIsnad(slug: string): Promise<IsnadData | null> {
  if (cache[slug]) return cache[slug];
  try {
    const res = await fetch(`${API_BASE}/v1/isnad/${slug}.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as IsnadData;
    cache[slug] = data;
    return data;
  } catch {
    return null;
  }
}

export class HttpIsnadRepository implements IsnadRepository {
  async findByHadithSlug(hadithSlug: string): Promise<IsnadData | null> {
    return fetchIsnad(hadithSlug);
  }
}
