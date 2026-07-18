import { GitBranch, ShieldCheck, BookOpen, TreePine } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useNodeProgress } from "@/hooks/useNodeProgress";
import { useReferencedBooks } from "@/hooks/useReferencedBooks";
import { SourceChip } from "@/components/sources/SourceChip";
import { SourceProgressBar } from "@/components/sources/SourceProgressBar";
import { formatPct } from "@/lib/format";
import { getBiography, getLineage } from "@/lib/contentBlocks";
import type { IsnadDTO } from "@/domain/dto";
import type { KnowledgeNode, BiographyBlock } from "@/domain/types";

interface Props {
  isnad: IsnadDTO;
  activeId: string;
  onSelect: (id: string) => void;
  onOpenSource: (id: string) => void;
}

export function ChainOfNarration({ isnad, activeId, onSelect, onOpenSource }: Props) {
  const { t, uiLang, dir } = useSettings();

  const activeNode: KnowledgeNode | undefined =
    isnad.primary.find((p) => p.node.id === activeId)?.node ??
    isnad.branches.find((b) => b.members.some((m) => m.node.id === activeId))?.members.find((m) => m.node.id === activeId)?.node ??
    isnad.books.find((b) => b.node.id === activeId)?.node;

  const isBookEntity = activeNode?.type === "BOOK";
  const referencedBooks = useReferencedBooks(activeNode?.type === "NARRATOR" ? activeId : undefined);
  const bookProgress = useNodeProgress(isBookEntity ? activeNode : undefined);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1 text-[var(--color-gold)]">
        <GitBranch size={14} />
        <span className="text-[11.5px] font-bold tracking-wide">{t.chainEyebrow}</span>
      </div>
      <h2 className="font-display font-semibold text-lg mb-3.5 text-[var(--color-ink)]">
        {t.chainTitle}
      </h2>

      <div className="rounded-xl border border-[var(--color-emerald)]/30 bg-[var(--color-emerald)]/10 p-3 mb-4 flex gap-2">
        <ShieldCheck size={16} className="text-[var(--color-emerald)] shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-[var(--color-ink)]">{t.authenticity}</p>
      </div>

      <div className="relative ps-4.5">
        <div className="absolute top-1.5 bottom-1.5 start-[5px] w-0.5 bg-[var(--color-line)]" />
        {isnad.primary.map((person) => {
          const active = activeId === person.node.id;
          const depth = person.node.attributes.kind === "narrator" ? person.node.attributes.isnadDepth ?? 0 : 0;
          const isNeck = depth === 4;
          return (
            <button
              key={person.node.id}
              onClick={() => onSelect(person.node.id)}
              className="flex items-start gap-2.5 w-full py-1.5 relative text-start"
            >
              <span
                className="absolute top-2.5 w-2.5 h-2.5 rounded-full"
                style={{
                  insetInlineStart: -18,
                  background: active ? "var(--color-gold)" : isNeck ? "var(--color-emerald)" : "var(--color-panel-2)",
                  border: `2px solid ${active ? "var(--color-gold)" : "var(--color-line)"}`,
                }}
              />
              <div>
                <div
                  className={[
                    "text-[12.5px]",
                    active ? "font-bold text-[var(--color-gold)]" : "font-semibold text-[var(--color-ink)]",
                  ].join(" ")}
                >
                  {uiLang === "ar" ? person.node.title.ar : person.node.title.en}
                </div>
                <div className="text-[10.5px] text-[var(--color-sub)]">{person.role[uiLang]}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-[10.5px] text-[var(--color-sub)] my-2.5 ps-4.5">{t.transmittedBy}</div>

      <div className="flex flex-wrap gap-1.5 ps-4.5 mb-3.5">
        {isnad.branches.map((branch) => {
          const anchor = branch.anchors;
          return branch.members.map((member) => {
            const active = activeId === member.node.id;
            return (
              <button
                key={member.node.id}
                onClick={() => onSelect(member.node.id)}
                className={[
                  "text-[11px] px-2.5 py-1.5 rounded-full border",
                  active
                    ? "bg-[var(--color-gold)] text-[#241c0a] border-[var(--color-gold)]"
                    : "bg-[var(--color-panel-2)] text-[var(--color-ink)] border-[var(--color-line)]",
                ].join(" ")}
              >
                {uiLang === "ar" ? member.node.title.ar : member.node.title.en}{" "}
                <span className="opacity-60">
                  {dir === "rtl" ? "←" : "→"}{" "}
                  {uiLang === "ar" ? anchor.node.title.ar : anchor.node.title.en}
                </span>
              </button>
            );
          });
        })}
      </div>

      <div className="flex gap-2 ps-4.5 mb-4">
        {isnad.books.map(({ node, locator }) => {
          const active = activeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => onSelect(node.id)}
              className={[
                "flex-1 text-start p-2.5 rounded-lg border",
                active
                  ? "bg-[var(--color-emerald)] text-[#F4EFE2] border-[var(--color-emerald)]"
                  : "bg-[var(--color-panel-2)] text-[var(--color-ink)] border-[var(--color-line)]",
              ].join(" ")}
            >
              <div className="text-[11.5px] font-bold">{uiLang === "ar" ? node.title.ar : node.title.en}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{locator[uiLang]}</div>
            </button>
          );
        })}
      </div>

      {activeNode && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] p-3.5">
          <div className="font-display font-semibold text-[15px] mb-0.5 text-[var(--color-ink)]">
            {uiLang === "ar" ? activeNode.title.ar : activeNode.title.en}
          </div>

          {activeNode.attributes.kind === "narrator" && (
            <>
              {(activeNode.attributes.dateBirth || activeNode.attributes.dateDeath) && (
                <div className="text-[10.5px] text-[var(--color-sub)] mb-2">
                  {[activeNode.attributes.dateBirth, activeNode.attributes.dateDeath].filter(Boolean).join(" – ")}
                </div>
              )}
              <div className="inline-block text-[10.5px] font-semibold text-[var(--color-gold)] bg-[var(--color-gold)]/15 rounded-full px-2.5 py-1 mb-2.5">
                {activeNode.attributes.grade[uiLang]}
              </div>
            </>
          )}

          {/* Lineage */}
          {activeNode.attributes.kind === "narrator" && (() => {
            const lineage = getLineage(activeNode);
            if (!lineage?.chain?.length) return null;
            
            const binConnector = uiLang === "ar" ? " بن " : " bin ";
            
            return (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-gold)] mb-1.5">
                  <TreePine size={11} />
                  <span>{uiLang === "ar" ? "النسب" : "Lineage"}</span>
                </div>
                <div className="text-[12px] text-[var(--color-sub)] leading-relaxed">
                  {lineage.chain.map((item, idx) => (
                    <span key={idx} className="whitespace-normal">
                      {idx > 0 && <span className="font-medium">{binConnector}</span>}
                      <span className="font-medium text-[var(--color-ink)]">{item.name[uiLang] || item.name.ar}</span>
                      {item.note && (
                        <span className="text-[10px] italic text-[var(--color-sub)] ml-1">
                          ({item.note[uiLang] || item.note.ar})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                {lineage.convergesWithProphetAt && (
                  <div className="mt-1.5 p-2 bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded">
                    <div className="text-[9px] font-semibold text-[var(--color-emerald)]">
                      {uiLang === "ar" ? "يلتقي بالنسب النبوي عند:" : "Converges with Prophetic lineage at:"}
                    </div>
                    <div className="text-[9px] text-[var(--color-ink)]">
                      {lineage.convergesWithProphetAt.name[uiLang] || lineage.convergesWithProphetAt.name.ar}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Biographical References (Taqrib al-Tahdhib, etc.) */}
          {activeNode.attributes.kind === "narrator" && (() => {
            const bio = getBiography(activeNode) as BiographyBlock | undefined;
            if (!bio?.biographicalReferences?.length) return null;
            
            return (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-emerald)]">
                  <BookOpen size={11} />
                  <span>{uiLang === "ar" ? "المراجع السيرية" : "Biographical References"}</span>
                </div>
                <div className="space-y-1.5">
                  {bio.biographicalReferences.map((ref, idx) => (
                    <div key={idx} className="text-[10px] bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded p-2">
                      <div className="font-medium text-[var(--color-ink)]">
                        {ref.workTitle[uiLang] || ref.workTitle.ar}
                      </div>
                      <div className="text-[9px] text-[var(--color-sub)]">
                        {ref.author[uiLang] || ref.author.ar}
                        {ref.locator && ` — ${ref.locatorType === "tarjamaNumber" ? "ت" : ref.locatorType === "volumePage" ? "ج/ص" : ref.locatorType === "yearEntry" ? "سنة" : "ص"} ${ref.locator}`}
                      </div>
                      {ref.gradeOrNote && (
                        <div className="text-[9px] mt-0.5 italic text-[var(--color-sub)]">
                          {ref.gradeOrNote[uiLang] || ref.gradeOrNote.ar}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${ref.provenance === "primary" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span className="text-[9px] text-[var(--color-sub)]">
                          {ref.provenance === "primary" ? (uiLang === "ar" ? "مصدر أصلي" : "Primary") : (uiLang === "ar" ? "مُولَّد" : "AI")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {activeNode.attributes.kind === "book" && (
            <div className="text-[10.5px] text-[var(--color-sub)] mb-2">
              {activeNode.attributes.eraLabel[uiLang]}
            </div>
          )}

          {isBookEntity && (
            <button
              onClick={() => onOpenSource(activeNode.id)}
              className="w-full text-start bg-[var(--color-panel-2)] border border-[var(--color-line)] rounded-[10px] p-2.5"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10.5px] text-[var(--color-emerald)] font-bold">{t.digitizedBadge}</span>
                <span className="text-[10px] text-[var(--color-sub)]">
                  {formatPct(bookProgress.pct, bookProgress.indexedUnits)}
                </span>
              </div>
              <SourceProgressBar pct={bookProgress.pct} />
            </button>
          )}

          {referencedBooks.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--color-sub)] mb-1.5 mt-1">{t.referencedIn}</div>
              <div className="flex flex-wrap gap-1.5">
                {referencedBooks.map((book) => (
                  <SourceChip key={book.id} node={book} onOpen={onOpenSource} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
