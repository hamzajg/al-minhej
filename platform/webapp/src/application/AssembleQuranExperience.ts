import type { KnowledgeRepository, RelationshipRepository } from "@/domain/repositories";
import type { KnowledgeNode } from "@/domain/types";
import type {
  QuranExperienceDTO,
  QuranReaderDTO,
  QuranTOCEntry,
} from "@/domain/dto";

type QuranMeta = {
  basmalaNote: { ar: string; en: string; pendingReaders: string; pendingReadersEn: string };
  collections: Record<string, { ar: string; en: string; countAr: string; countEn: string }>;
  qiraatPaths: Record<string, { ar: string; en: string; subtitleAr: string; subtitleEn: string; descAr: string; descEn: string }>;
  toc: QuranTOCEntry[];
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

let cachedQuranMeta: QuranMeta | null = null;

async function fetchQuranMeta(): Promise<QuranMeta> {
  if (cachedQuranMeta) return cachedQuranMeta;
  const res = await fetch(`${API_BASE}/nodes/quran.json`);
  if (!res.ok) throw new Error(`Failed to fetch quran metadata: ${res.status}`);
  const data = (await res.json()) as QuranMeta;
  cachedQuranMeta = data;
  return data;
}

export class AssembleQuranExperience {
  private nodes: KnowledgeRepository;
  private relationships: RelationshipRepository;

  constructor(
    nodes: KnowledgeRepository,
    relationships: RelationshipRepository
  ) {
    this.nodes = nodes;
    this.relationships = relationships;
  }

  async surahExperience(slug: string): Promise<QuranExperienceDTO | null> {
    const surah = await this.nodes.findBySlug(slug);
    if (!surah || surah.type !== "SURAH" || surah.attributes.kind !== "surah") return null;

    const [meta, readers, allRiwayat] = await Promise.all([
      fetchQuranMeta(),
      this.loadReaders(),
      this.buildAllRiwayat(),
    ]);

    const segments = this.extractSegments(surah);
    const vocab = this.extractVocab(surah);
    const tafsir = this.extractTafsir(surah);
    const related = await this.buildRelated(surah);
    const sources = this.buildSources(tafsir);
    const quiz = this.extractQuiz(surah);
    const companion = this.extractCompanion(surah);

    return {
      surah,
      toc: meta.toc,
      readers,
      allRiwayat,
      segments,
      vocab,
      tafsir,
      related,
      sources,
      quiz,
      companionPrompts: companion.prompts,
      companionAnswers: companion.answers,
      basmalaNote: meta.basmalaNote,
      collections: meta.collections,
      qiraatPaths: meta.qiraatPaths,
    };
  }

  async surahToc(): Promise<QuranTOCEntry[]> {
    const meta = await fetchQuranMeta();
    return meta.toc;
  }

  async listReaders(): Promise<QuranReaderDTO[]> {
    return this.loadReaders();
  }

  /* ── private helpers ── */

  private async loadReaders(): Promise<QuranReaderDTO[]> {
    const readerNodes = await this.nodes.listByType("READER");
    return readerNodes
      .filter((n): n is KnowledgeNode & { attributes: Extract<import("@/domain/types").NodeAttributes, { kind: "reader" }> } => n.attributes.kind === "reader")
      .sort((a, b) => a.attributes.order - b.attributes.order)
      .map((n) => {
        const attrs = n.attributes;
        return {
          node: n,
          order: attrs.order,
          collection: attrs.collection,
          countsBasmala: attrs.countsBasmala,
          ar: n.title.ar,
          en: n.title.en,
          cityAr: attrs.cityAr,
          cityEn: attrs.cityEn,
          riwayat: attrs.riwayat,
        };
      });
  }

  private async buildAllRiwayat(): Promise<QuranExperienceDTO["allRiwayat"]> {
    const readers = await this.loadReaders();
    return readers.flatMap((rdr) =>
      rdr.riwayat.map((rw) => ({
        ...rw,
        readerId: rdr.node.id.replace("reader-", ""),
        readerAr: rdr.ar,
        readerEn: rdr.en,
        collection: rdr.collection,
        countsBasmala: rdr.countsBasmala,
      }))
    );
  }

  private extractSegments(surah: KnowledgeNode): QuranExperienceDTO["segments"] {
    const block = surah.content.find((b) => b.type === "qiraat_segments");
    if (!block || block.type !== "qiraat_segments") return {};
    return block.segments;
  }

  private extractVocab(surah: KnowledgeNode): QuranExperienceDTO["vocab"] {
    const block = surah.content.find((b) => b.type === "vocabulary");
    if (!block || block.type !== "vocabulary") return [];
    return block.entries.map((e) => ({
      id: e.id,
      word: e.word,
      root: e.root ?? "",
      pron: e.pron ?? "",
      occ: e.occurrences?.[0] ?? 0,
      en: e.gloss.en,
      ar: e.gloss.ar,
    }));
  }

  private extractTafsir(surah: KnowledgeNode): QuranExperienceDTO["tafsir"] {
    return surah.content
      .filter((b): b is Extract<typeof b, { type: "commentary" }> => b.type === "commentary")
      .map((b) => ({
        id: b.scholar.en.toLowerCase().replace(/\s+/g, ""),
        scholar: b.scholar.ar,
        scholarEn: b.scholar.en,
        work: b.note.ar.substring(0, 30),
        workEn: b.note.en.substring(0, 30),
        note: b.note,
      }));
  }

  private async buildRelated(surah: KnowledgeNode): Promise<QuranExperienceDTO["related"]> {
    const outgoing = await this.relationships.outgoingFrom(surah.id);
    const references = outgoing.filter((r) => r.type === "REFERENCES");
    if (references.length === 0) return [];

    const targetIds = references.map((r) => r.to);
    const targets = await this.nodes.findManyByIds(targetIds);

    return references.map((r) => {
      const node = targets.find((t) => t.id === r.to);
      return {
        id: r.to,
        type: node?.type.toLowerCase() ?? "unknown",
        ar: node?.title.ar ?? "",
        en: node?.title.en ?? "",
        src: r.metadata?.src_en
          ? { ar: (r.metadata.src_ar as string) ?? "", en: r.metadata.src_en as string }
          : undefined,
        note: r.metadata?.note_en
          ? { ar: (r.metadata.note_ar as string) ?? "", en: r.metadata.note_en as string }
          : undefined,
      };
    });
  }

  private buildSources(
    tafsir: QuranExperienceDTO["tafsir"]
  ): QuranExperienceDTO["sources"] {
    const sources: QuranExperienceDTO["sources"] = {};
    for (const t of tafsir) {
      if (!sources[t.id]) {
        sources[t.id] = {
          id: t.id,
          ar: t.work,
          en: t.workEn,
          authorAr: t.scholar,
          authorEn: t.scholarEn,
          era: "",
          total: 114,
          indexed: 1,
          unit: { ar: "سورة", en: "surahs" },
        };
      }
    }
    return sources;
  }

  private extractQuiz(surah: KnowledgeNode): QuranExperienceDTO["quiz"] {
    const block = surah.content.find((b) => b.type === "quiz");
    if (!block || block.type !== "quiz") return [];
    return block.questions.map((q) => ({
      q: q.question,
      options: q.options.map((o) => o.text),
      correct: q.options.findIndex((o) => o.id === q.correctOptionId),
    }));
  }

  private extractCompanion(surah: KnowledgeNode): {
    prompts: { ar: string[]; en: string[] };
    answers: { ar: string[]; en: string[] };
  } {
    const blocks = surah.content.filter(
      (b): b is Extract<typeof b, { type: "ai_context" }> => b.type === "ai_context"
    );
    const ar: string[] = [];
    const en: string[] = [];
    const ansAr: string[] = [];
    const ansEn: string[] = [];

    for (const block of blocks) {
      for (const item of block.items) {
        if (item.question.ar) ar.push(item.question.ar);
        if (item.question.en) en.push(item.question.en);
        if (item.answer.ar) ansAr.push(item.answer.ar);
        if (item.answer.en) ansEn.push(item.answer.en);
      }
    }

    return {
      prompts: { ar, en },
      answers: { ar: ansAr, en: ansEn },
    };
  }
}
