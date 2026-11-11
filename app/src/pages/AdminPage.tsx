import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ContentBlock, KnowledgeNode, NodeStatus, RelationshipType } from "@/domain/types";
import { AssembleReadingExperience } from "@/application/AssembleReadingExperience";
import { HttpKnowledgeRepository } from "@/infrastructure/http/HttpKnowledgeRepository";
import { HttpRelationshipRepository } from "@/infrastructure/http/HttpRelationshipRepository";
import {
  addRelationship,
  createNode,
  listAdminNodes,
  publishNode,
  submitForReview,
  type AdminContext,
  type AdminRole,
} from "@/infrastructure/http/adminClient";

/**
 * §5.B's editor surface. Deliberately plain — this is the workbench an editor
 * and a scholar-reviewer sit in, not a reading experience. The two things it
 * has to get right are the two acceptance criteria: an editor can build a
 * hadith and wire it to a book that *already exists* (never by retyping the
 * book's name), and publishing it moves that book's derived progress on the
 * reading side with no extra step.
 */

const DEFAULT_BASE_URL: string = import.meta.env?.VITE_ALMINHEJ_API_BASE_URL ?? "http://localhost:8787";

const ROLE_LABELS: Record<AdminRole, string> = {
  editor: "editor",
  "scholar-reviewer": "scholar-reviewer",
  admin: "admin",
};

const RELATIONSHIP_OPTIONS: RelationshipType[] = [
  "PART_OF",
  "NARRATED_BY",
  "EXPLAINS",
  "REFERENCES",
  "SIMILAR_TO",
];

const STATUS_TONE: Record<NodeStatus, string> = {
  draft: "var(--color-sub)",
  in_review: "var(--color-gold)",
  published: "var(--color-emerald)",
};

type DraftBlock =
  | { kind: "original_text"; textAr: string; textEn: string; sourceAr: string; sourceEn: string }
  | { kind: "context"; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string };

interface Progress {
  indexedUnits: number;
  pct: number;
}

interface Notice {
  kind: "ok" | "error";
  text: string;
}

const blankBlock = (): DraftBlock => ({
  kind: "original_text",
  textAr: "",
  textEn: "",
  sourceAr: "",
  sourceEn: "",
});

function blockHasContent(block: DraftBlock): boolean {
  return block.kind === "original_text"
    ? Boolean(block.textAr.trim() || block.textEn.trim())
    : Boolean(block.titleAr.trim() || block.titleEn.trim() || block.bodyAr.trim() || block.bodyEn.trim());
}

function toContentBlock(block: DraftBlock): ContentBlock {
  if (block.kind === "original_text") {
    return {
      type: "original_text",
      textAr: block.textAr,
      textEn: block.textEn,
      sourceRef: { ar: block.sourceAr, en: block.sourceEn },
    };
  }
  return {
    type: "context",
    title: { ar: block.titleAr, en: block.titleEn },
    body: { ar: block.bodyAr, en: block.bodyEn },
  };
}

const errorText = (cause: unknown): string =>
  cause instanceof Error ? cause.message : "Unknown error";

const field =
  "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-2.5 py-1.5 text-[12px] text-[var(--color-ink)] outline-none focus:border-[var(--color-gold)]";

const label = "block text-[10px] uppercase tracking-[0.08em] text-[var(--color-sub)] mb-1";

function Button({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border px-3 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
      style={{
        borderColor: tone === "primary" ? "var(--color-emerald)" : "var(--color-line)",
        background: tone === "primary" ? "var(--color-emerald)" : "var(--color-panel)",
        color: tone === "primary" ? "#F4EFE2" : "var(--color-ink)",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Autocomplete over nodes that already exist. This is the guard §5.B asks for:
 * there is no free-text target id, only a picked node, so an editor literally
 * cannot invent a second "Sahih al-Bukhari" while linking a hadith into a book.
 */
function NodePicker({
  nodes,
  value,
  onChange,
  placeholder,
}: {
  nodes: KnowledgeNode[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = nodes.find((node) => node.id === value) ?? null;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? nodes.filter((node) =>
          [node.id, node.slug, node.title.ar, node.title.en].some((text) =>
            text.toLowerCase().includes(needle)
          )
        )
      : nodes;
    return pool.slice(0, 8);
  }, [nodes, query]);

  return (
    <div className="relative">
      <input
        className={field}
        value={open ? query : selected ? `${selected.title.en} · ${selected.id}` : ""}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] shadow-lg">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-[var(--color-sub)]">
              No existing node matches — reuse an existing one rather than creating a duplicate.
            </div>
          ) : (
            matches.map((node) => (
              <button
                key={node.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(node.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full px-3 py-2 text-start text-[11.5px] hover:bg-[var(--color-panel-2)]"
              >
                <span className="text-[var(--color-ink)]">{node.title.en}</span>
                <span className="ms-2 text-[10px] text-[var(--color-sub)]">
                  {node.type} · {node.id}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [roles, setRoles] = useState<AdminRole[]>(["editor"]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [books, setBooks] = useState<KnowledgeNode[]>([]);
  const [statusFilter, setStatusFilter] = useState<NodeStatus | "all">("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  // create form
  const [slug, setSlug] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [gradeAr, setGradeAr] = useState("");
  const [gradeEn, setGradeEn] = useState("");
  const [isnadType, setIsnadType] = useState<"full" | "short">("short");
  const [blocks, setBlocks] = useState<DraftBlock[]>([blankBlock()]);

  // relationship builder
  const [edgeFrom, setEdgeFrom] = useState("");
  const [edgeTo, setEdgeTo] = useState("");
  const [edgeType, setEdgeType] = useState<RelationshipType>("PART_OF");

  // derived book progress, read through the same service the reading side uses
  const [bookId, setBookId] = useState("book-bukhari");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const progressRef = useRef<Progress | null>(null);

  const ctx: AdminContext = useMemo(() => ({ baseUrl, roles }), [baseUrl, roles]);

  const toggleRole = (role: AdminRole) => {
    setRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role]
    );
  };

  const refreshQueue = useCallback(async () => {
    setNodes(await listAdminNodes(ctx));
  }, [ctx]);

  const reloadProgress = useCallback(async () => {
    const repository = new HttpKnowledgeRepository(baseUrl);
    const book = await repository.findById(bookId);
    if (!book) throw new Error(`No book with id '${bookId}' on ${baseUrl}`);
    const service = new AssembleReadingExperience(repository, new HttpRelationshipRepository(baseUrl));
    const next = await service.progressFor(book);
    setDelta(progressRef.current ? next.indexedUnits - progressRef.current.indexedUnits : null);
    progressRef.current = next;
    setProgress(next);
  }, [baseUrl, bookId]);

  /** Runs a mutating call, surfaces its error envelope, then re-reads the world. */
  const run = useCallback(
    async (action: () => Promise<string>) => {
      setBusy(true);
      setNotice(null);
      try {
        const message = await action();
        await refreshQueue();
        if (edgeType === "PART_OF") {
          await reloadProgress().catch(() => undefined);
        }
        setNotice({ kind: "ok", text: message });
      } catch (cause) {
        setNotice({ kind: "error", text: errorText(cause) });
      } finally {
        setBusy(false);
      }
    },
    [refreshQueue, reloadProgress, edgeType]
  );

  useEffect(() => {
    refreshQueue().catch((cause) => setNotice({ kind: "error", text: errorText(cause) }));
  }, [refreshQueue]);

  useEffect(() => {
    const repository = new HttpKnowledgeRepository(baseUrl);
    repository
      .listByType("BOOK")
      .then(setBooks)
      .catch(() => setBooks([]));
  }, [baseUrl]);

  useEffect(() => {
    reloadProgress().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, bookId]);

  const visibleNodes =
    statusFilter === "all" ? nodes : nodes.filter((node) => node.status === statusFilter);

  const handleCreate = () => {
    if (!slug.trim() || !titleAr.trim() || !titleEn.trim()) {
      setNotice({ kind: "error", text: "Slug and both title languages are required." });
      return;
    }
    const content = blocks.filter(blockHasContent).map(toContentBlock);
    run(async () => {
      const node = await createNode(ctx, {
        type: "HADITH",
        slug: slug.trim(),
        title: { ar: titleAr.trim(), en: titleEn.trim() },
        attributes: { kind: "hadith", grade: { ar: gradeAr.trim(), en: gradeEn.trim() }, isnadType },
        content,
      });
      setSlug("");
      setTitleAr("");
      setTitleEn("");
      setGradeAr("");
      setGradeEn("");
      setBlocks([blankBlock()]);
      setEdgeFrom(node.id);
      return `Created '${node.id}' as a draft (${content.length} content block${content.length === 1 ? "" : "s"}).`;
    });
  };

  const handleAddRelationship = () => {
    if (!edgeFrom || !edgeTo) {
      setNotice({ kind: "error", text: "Pick both the source and the existing target node." });
      return;
    }
    run(async () => {
      const edge = await addRelationship(ctx, edgeFrom, { to: edgeTo, type: edgeType });
      return `Linked ${edge.from} —${edge.type}→ ${edge.to}.`;
    });
  };

  return (
    <div dir="ltr" className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] py-8 px-6">
      <div className="mx-auto w-full max-w-[1080px]">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-gold)]">
              AlMinhej · Content Management API (§5.B)
            </div>
            <h1 className="font-display text-[26px] font-semibold">Digitization workbench</h1>
          </div>
          <Link to="/" className="text-[12px] text-[var(--color-sub)] underline">
            ← Reading app
          </Link>
        </header>

        <section className="mb-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div>
              <span className={label}>API base URL</span>
              <input className={field} value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
              <p className="mt-1 text-[10.5px] text-[var(--color-sub)]">
                Start it with <code>npm run api</code>. Point the reading app at the same URL
                (<code>VITE_ALMINHEJ_API_BASE_URL</code>) to watch progress move live.
              </p>
            </div>
            <div>
              <span className={label}>Acting roles (x-alminhej-roles)</span>
              <div className="flex flex-wrap gap-2">
                {(["editor", "scholar-reviewer", "admin"] as AdminRole[]).map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-[11.5px]">
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-[10.5px] text-[var(--color-sub)]">
                Editor alone cannot publish; add scholar-reviewer to review your own draft.
              </p>
            </div>
          </div>
          {notice && (
            <div
              className="mt-4 rounded-lg px-3 py-2 text-[11.5px]"
              style={{
                background: notice.kind === "ok" ? "color-mix(in srgb, var(--color-emerald) 16%, transparent)" : "rgba(176,120,90,.16)",
                color: "var(--color-ink)",
              }}
            >
              {notice.text}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ---------------- create ---------------- */}
          <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
            <h2 className="mb-3 text-[13px] font-semibold">Create a HADITH node</h2>
            <div className="grid gap-3">
              <div>
                <span className={label}>Slug</span>
                <input className={field} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="arbain-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={label}>Title (ar)</span>
                  <input className={field} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
                </div>
                <div>
                  <span className={label}>Title (en)</span>
                  <input className={field} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
                </div>
                <div>
                  <span className={label}>Grade (ar)</span>
                  <input className={field} value={gradeAr} onChange={(e) => setGradeAr(e.target.value)} dir="rtl" />
                </div>
                <div>
                  <span className={label}>Grade (en)</span>
                  <input className={field} value={gradeEn} onChange={(e) => setGradeEn(e.target.value)} />
                </div>
              </div>
              <div>
                <span className={label}>Isnad type</span>
                <select className={field} value={isnadType} onChange={(e) => setIsnadType(e.target.value as "full" | "short")}>
                  <option value="short">short</option>
                  <option value="full">full</option>
                </select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className={label}>Content blocks</span>
                  <Button onClick={() => setBlocks((current) => [...current, blankBlock()])}>+ Add block</Button>
                </div>
                <div className="grid gap-2">
                  {blocks.map((block, index) => (
                    <div key={index} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] p-2.5">
                      <div className="mb-2 flex items-center gap-2">
                        <select
                          className={field}
                          value={block.kind}
                          onChange={(event) =>
                            setBlocks((current) =>
                              current.map((item, i) =>
                                i === index
                                  ? event.target.value === "context"
                                    ? { kind: "context", titleAr: "", titleEn: "", bodyAr: "", bodyEn: "" }
                                    : blankBlock()
                                  : item
                              )
                            )
                          }
                        >
                          <option value="original_text">original_text</option>
                          <option value="context">context</option>
                        </select>
                        <Button onClick={() => setBlocks((current) => current.filter((_, i) => i !== index))}>
                          Remove
                        </Button>
                      </div>
                      {block.kind === "original_text" ? (
                        <div className="grid gap-2">
                          <textarea
                            className={field}
                            dir="rtl"
                            rows={2}
                            placeholder="Arabic text"
                            value={block.textAr}
                            onChange={(e) =>
                              setBlocks((current) =>
                                current.map((item, i) =>
                                  i === index && item.kind === "original_text" ? { ...item, textAr: e.target.value } : item
                                )
                              )
                            }
                          />
                          <textarea
                            className={field}
                            rows={2}
                            placeholder="English text"
                            value={block.textEn}
                            onChange={(e) =>
                              setBlocks((current) =>
                                current.map((item, i) =>
                                  i === index && item.kind === "original_text" ? { ...item, textEn: e.target.value } : item
                                )
                              )
                            }
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className={field}
                              dir="rtl"
                              placeholder="source ref (ar)"
                              value={block.sourceAr}
                              onChange={(e) =>
                                setBlocks((current) =>
                                  current.map((item, i) =>
                                    i === index && item.kind === "original_text" ? { ...item, sourceAr: e.target.value } : item
                                  )
                                )
                              }
                            />
                            <input
                              className={field}
                              placeholder="source ref (en)"
                              value={block.sourceEn}
                              onChange={(e) =>
                                setBlocks((current) =>
                                  current.map((item, i) =>
                                    i === index && item.kind === "original_text" ? { ...item, sourceEn: e.target.value } : item
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className={field}
                              dir="rtl"
                              placeholder="title (ar)"
                              value={block.titleAr}
                              onChange={(e) =>
                                setBlocks((current) =>
                                  current.map((item, i) =>
                                    i === index && item.kind === "context" ? { ...item, titleAr: e.target.value } : item
                                  )
                                )
                              }
                            />
                            <input
                              className={field}
                              placeholder="title (en)"
                              value={block.titleEn}
                              onChange={(e) =>
                                setBlocks((current) =>
                                  current.map((item, i) =>
                                    i === index && item.kind === "context" ? { ...item, titleEn: e.target.value } : item
                                  )
                                )
                              }
                            />
                          </div>
                          <textarea
                            className={field}
                            dir="rtl"
                            rows={2}
                            placeholder="body (ar)"
                            value={block.bodyAr}
                            onChange={(e) =>
                              setBlocks((current) =>
                                current.map((item, i) =>
                                  i === index && item.kind === "context" ? { ...item, bodyAr: e.target.value } : item
                                )
                              )
                            }
                          />
                          <textarea
                            className={field}
                            rows={2}
                            placeholder="body (en)"
                            value={block.bodyEn}
                            onChange={(e) =>
                              setBlocks((current) =>
                                current.map((item, i) =>
                                  i === index && item.kind === "context" ? { ...item, bodyEn: e.target.value } : item
                                )
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Button tone="primary" onClick={handleCreate} disabled={busy}>
                  Create draft
                </Button>
              </div>
            </div>
          </section>

          {/* ---------------- queue ---------------- */}
          <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">Review queue</h2>
              <div className="flex gap-1.5">
                {(["all", "draft", "in_review", "published"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className="rounded-full border px-2.5 py-1 text-[10.5px]"
                    style={{
                      borderColor: "var(--color-line)",
                      background: statusFilter === value ? "var(--color-emerald)" : "transparent",
                      color: statusFilter === value ? "#F4EFE2" : "var(--color-sub)",
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid max-h-[520px] gap-2 overflow-y-auto">
              {visibleNodes.length === 0 && (
                <p className="text-[11.5px] text-[var(--color-sub)]">Nothing here yet.</p>
              )}
              {visibleNodes.map((node) => (
                <div key={node.id} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-semibold">{node.title.en}</span>
                    <span className="text-[10px] font-semibold" style={{ color: STATUS_TONE[node.status] }}>
                      {node.status}
                    </span>
                  </div>
                  <div className="mb-2 text-[10px] text-[var(--color-sub)]">
                    {node.type} · {node.id} · {node.content.length} blocks
                  </div>
                  <div className="flex gap-2">
                    {node.status === "draft" && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            const updated = await submitForReview(ctx, node.id);
                            return `'${updated.id}' is now ${updated.status}.`;
                          })
                        }
                      >
                        Submit for review
                      </Button>
                    )}
                    {node.status !== "published" && (
                      <Button
                        tone="primary"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            const updated = await publishNode(ctx, node.id);
                            return `Published '${updated.id}'.`;
                          })
                        }
                      >
                        Publish
                      </Button>
                    )}
                    <Button onClick={() => setEdgeFrom(node.id)}>Link from this…</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ---------------- relationship builder ---------------- */}
        <section className="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">Draw a relationship to an existing node</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
            <div>
              <span className={label}>From (source node)</span>
              <NodePicker nodes={nodes} value={edgeFrom} onChange={setEdgeFrom} placeholder="Search source node…" />
            </div>
            <div>
              <span className={label}>Type</span>
              <select className={field} value={edgeType} onChange={(e) => setEdgeType(e.target.value as RelationshipType)}>
                {RELATIONSHIP_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={label}>To (must already exist)</span>
              <NodePicker nodes={nodes} value={edgeTo} onChange={setEdgeTo} placeholder="Search existing node…" />
            </div>
            <div className="flex items-end">
              <Button tone="primary" onClick={handleAddRelationship} disabled={busy}>
                Add relationship
              </Button>
            </div>
          </div>
        </section>

        {/* ---------------- live progress ---------------- */}
        <section className="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <h2 className="mb-1 text-[13px] font-semibold">Book digitization progress (read side)</h2>
          <p className="mb-3 text-[10.5px] text-[var(--color-sub)]">
            Derived from the graph, not stored. Publish a hadith with a PART_OF edge to this book and the bar
            moves with no further step.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <span className={label}>Book</span>
              <select className={field} value={bookId} onChange={(e) => setBookId(e.target.value)}>
                {books.length === 0 && <option value={bookId}>{bookId}</option>}
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title.en}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => reloadProgress().catch((cause) => setNotice({ kind: "error", text: errorText(cause) }))}>
              Refresh
            </Button>
            {progress && (
              <div className="text-[12px]">
                <span className="font-semibold">{progress.indexedUnits}</span> /{" "}
                {books.find((book) => book.id === bookId)?.digitization?.totalUnits ?? "?"} units ·{" "}
                <span className="font-semibold">{progress.pct.toFixed(3)}%</span>
                {delta !== null && delta !== 0 && (
                  <span style={{ color: delta > 0 ? "var(--color-emerald)" : "var(--color-gold)" }} className="ms-2">
                    ({delta > 0 ? "+" : ""}
                    {delta} since last read)
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
