import type { IsnadRepository } from "@/domain/repositories";
import type { IsnadData } from "@/domain/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

let cache: Record<string, IsnadData> = {};

async function fetchIsnad(slug: string): Promise<IsnadData | null> {
  if (cache[slug]) return cache[slug];
  try {
    const res = await fetch(`${API_BASE}/isnad/${slug}.json`);
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
