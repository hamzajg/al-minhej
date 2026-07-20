# ChainOfNarration Side Pane Optimization Plan

## Current State Analysis

### Current Structure (ChainOfNarration.tsx)
```
1. Chain Header (Who narrated it / All paths of the chain)
2. Authenticity badge
3. Primary Chain (vertical list with depth indicators)
   - Each narrator: name + role + clickable
4. "Transmitted by" label
5. Branch Narrators (horizontal chips)
   - Format: "Narrator → Anchor"
   - Active/inactive states
6. Book Sources (vertical cards)
   - Book title + page locator
   - Clickable to open source
7. Active Narrator Detail Panel
   - Name, dates, grade
   - Lineage (single line with bin connectors)
   - Biographical References
   - Referenced Books (SourceChips)
```

### Problems Identified
1. **Info Duplication**: Narrator names shown in chain + detail panel
2. **Cognitive Load**: Lineage + biography refs + books all in detail panel
3. **Book Section Redundancy**: Book cards duplicate chain navigation
3. **Fragmented UX**: Lineage hidden in detail panel, not in chain
4. **Branch/Book Separation**: Related hadith books separated from branch narrators

---

## Target UX Design

### New Structure

```
1. Chain Header
2. Authenticity badge
3. Primary Chain (vertical) - ENHANCED
   - Each narrator: name + role + INLINE LINEAGE (single line)
   - Click → Biography References + Library Link
3. "Transmitted by" label
4. Branch Narrators + Other Path Books - UNIFIED (horizontal chips)
   - Primary branch narrators: "Narrator → Anchor" (gold)
   - Other path books: "Book Name" (emerald/neutral)
   - Click → open source/book
4. Active Narrator Detail Panel - SIMPLIFIED
   - Name, dates, grade
   - Biography References (clickable)
   - "View Full Biography" → Library link
   - NO lineage (shown inline in chain)
   - NO books (moved to branch area)
```

---

## Detailed Changes

### 1. Primary Chain Enhancement (`isnad.primary.map`)

**Current**: Name + role only
**New**: Name + role + **inline lineage** (single line, small font)

```tsx
// In isnad.primary.map():
<div className="flex items-start gap-2.5 w-full py-1.5 relative text-start">
  {/* existing dot + name + role */}
  <div>
    <div className="text-[12.5px] font-bold">{name}</div>
    <div className="text-[10.5px] text-[var(--color-sub)]">{role}</div>
    {/* NEW: Inline lineage */}
    {getLineageString(person.node, uiLang) && (
      <div className="text-[9px] text-[var(--color-sub)] mt-0.5 leading-relaxed">
        {getLineageString(person.node, uiLang)}
      </div>
    )}
  </div>
</div>
```

**Helper function**: `getLineageString(node, uiLang)` → returns "Ahmad bin Ali bin Hasan..."

---

### 2. Active Narrator Panel Simplification

**Remove from detail panel**:
- ❌ Lineage (now inline in chain)
- ❌ Referenced Books section

**Keep in detail panel**:
- ✅ Name, dates, grade
- ✅ Biography References (with provenance badges)
- ✅ **NEW**: "View Full Biography" button → links to narrator in Library

```tsx
{biographyBlock && (
  <div className="mt-2 pt-2 border-t">
    <button 
      onClick={() => navigate(`/library/narrator/${activeNode.id}`)}
      className="text-xs text-emerald hover:underline"
    >
      {t.viewFullBiography}
    </button>
  </div>
)}
```

---

### 3. Branch Narrators + Other Path Books Unification

**Current separate sections**:
```tsx
// Branch Narrators (horizontal chips)
<div className="flex flex-wrap gap-1.5 ps-4.5 mb-3.5">
  {isnad.branches.map(...)}

// Book Sources (vertical cards)
<div className="flex gap-2 ps-4.5 mb-4">
  {isnad.books.map(...)}
```

**New unified section**:
```tsx
<div className="flex flex-wrap gap-1.5 ps-4.5 mb-3.5">
  {/* Branch Narrators - gold chips */}
  {isnad.branches.map(branch => 
    branch.members.map(member => (
      <button key={member.node.id} className="gold-chip">
        {member.name} → {anchor.name}
      </button>
    ))
  )}
  
  {/* Other Path Books - emerald/neutral chips */}
  {isnad.books.map(({node, locator}) => (
    <button key={node.id} className="emerald-chip">
      {node.title[uiLang]} 
      <span className="opacity-60">{locator[uiLang]}</span>
    </button>
  ))}
</div>
```

**Chip Styles**:
- Branch narrators: `bg-[var(--color-gold)] text-[#241c0a] border-[var(--color-gold)]`
- Other path books: `bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border-[var(--color-emerald)]/30`

---

### 3. Remove Book Cards Section

**Delete entirely** (lines 110-129 in current):
```tsx
// DELETE THIS ENTIRE BLOCK:
<div className="flex gap-2 ps-4.5 mb-4">
  {isnad.books.map(({ node, locator }) => (
    <button className="flex-1 text-start p-2.5 rounded-lg border">
      <div className="text-[11.5px] font-bold">{node.title}</div>
      <div className="text-[10px] opacity-75 mt-0.5">{locator}</div>
    </button>
  ))}
</div>
```

---

### 4. Detail Panel Biography Link

Add to `BiographyDisplay` or detail panel:

```tsx
{biographyBlock && (
  <div className="mt-3 pt-2 border-t">
    <Link 
      to={`/library/narrator/${activeNode.id}`}
      className="text-xs text-[var(--color-emerald)] hover:underline flex items-center gap-1"
    >
      <ExternalLink size={10} />
      {uiLang === "ar" ? "عرض السيرة الكاملة في المكتبة" : "View full biography in Library"}
    </Link>
  </div>
}
```

---

## Implementation Priority

| Phase | Task | Files |
|-------|------|-------|
| 1 | Add `getLineageString()` helper to `contentBlocks.ts` | `lib/contentBlocks.ts` |
| 2 | Update primary chain to show inline lineage | `components/chain/ChainOfNarration.tsx` |
| 3 | Simplify detail panel (remove lineage, books; add library link) | `components/chain/ChainOfNarration.tsx` |
| 4 | Unify branch narrators + other path books into single chip area | `components/chain/ChainOfNarration.tsx` |
| 4 | Remove book cards section | `components/chain/ChainOfNarration.tsx` |
| 5 | Add "View Full Biography" link to detail panel | `components/chain/ChainOfNarration.tsx` |
| 6 | Update i18n for new strings | `data/i18n/en.json`, `ar.json` |

---

## String Additions (i18n)

**en.json**:
```json
"viewFullBiography": "View full biography in Library",
"otherPaths": "Other Paths",
"branchNarrator": "Branch",
```

**ar.json**:
```json
"viewFullBiography": "عرض السيرة الكاملة في المكتبة",
"otherPaths": "طرق أخرى",
"branchNarrator": "فرع",
```

---

## Visual Mockup (ASCII)

```
┌─────────────────────────────────────┐
│ Who narrated it    All paths of chain│
│ ✓ Graded Sahih — agreed upon...     │
├─────────────────────────────────────┤
│ ● Umar ibn al-Khattab               │
│   Companion — heard directly        │
│   عمر بن الخطاب بن نفيل بن عبد العزى│
│                                     │
│ ● Yahya ibn Sa'id al-Ansari         │
│   Successor (Tabi'i)                │
│   يحيى بن سعيد بن قيس بن عبيد...    │
│                                     │
│ ● Malik ibn Anas                    │
│   Imam of Madinah                   │
│   مالك بن أنس بن مالك بن أبي عامر... │
├─────────────────────────────────────┤
│ Transmitted by                      │
│ [Malik → Yahya] [Yahya al-Tamimi]   │
│ [Sahih al-Bukhari · Page 1]         │  ← emerald chip
│ [Sahih Muslim · Page 42]            │  ← emerald chip
├─────────────────────────────────────┤
│ Malik ibn Anas          [●] Primary │
│ Imam of Madinah                     │
│ Malik bin Anas bin Malik...         │  ← inline lineage
│ ─────────────────────────────────   │
│ 📚 Biographical References          │
│ Taqrib al-Tahdhib — ت ٥٧٩٤ (Primary) │
│ Siyar A'lam al-Nubala' (Primary)    │
│ ─────────────────────────────────   │
│ 🔗 View full biography in Library   │
└─────────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] Lineage visible inline in primary chain (no horizontal scroll)
- [ ] Clicking narrator in chain opens detail panel with biography refs
- [ ] "View full biography" links to narrator in Library
- [ ] Branch narrators + other path books unified in single chip row
- [ ] Book cards removed from bottom
- [ ] No lineage in detail panel
- [ ] No book cards in detail panel
- [ ] All existing functionality preserved (click handlers, active states)
- [ ] Build/lint/validation pass

---

## Notes

- `getLineageString(node, uiLang)` should truncate very long lineages with "..." if needed
- Ensure RTL support for Arabic lineage (flex-direction: row-reverse for ar?)
- Consider tooltip on branch chips showing full book locator on hover
- Library navigation should use existing routes (`/library/narrator/:slug`)