---
id: KM-002
title: KNOWLEDGE FRAGMENTS
version: 1.0.0
status: Stable
type: Canonical Domain Specification
depends_on:
  - bibliography.md
---

# KNOWLEDGE FRAGMENTS

## Purpose

Knowledge Fragments are the fundamental units of knowledge engineering within AlMinhej.

Pages are physical.

Knowledge Fragments are semantic.

The platform indexes, validates, connects and projects Knowledge Fragments rather than entire pages.

Every projection, search result, relationship and AI suggestion ultimately references one or more Knowledge Fragments.

---

# Definition

A Knowledge Fragment is the smallest meaningful unit of authenticated knowledge extracted from a source.

It is not defined by length.

It is defined by meaning.

Examples

- One Hadith
- One Quran Verse
- One Paragraph
- One Scholarly Note
- One Editorial Footnote
- One Definition
- One Biography Section
- One Heading
- One Chapter Introduction

---

# Why Fragments?

Books were written for human reading.

Knowledge engineering requires smaller reusable units.

Example

```
Page 123

↓

Introduction

↓

Hadith

↓

Footnote

↓

Editorial Note
```

Each becomes its own Knowledge Fragment.

---

# Fragment Hierarchy

```
Page

↓

Knowledge Fragment

↓

Entity References

↓

Relationships

↓

Learning Projections
```

Pages are containers.

Fragments are the indexed knowledge.

---

# Identity

Every fragment receives a permanent identifier.

Example

```
KF-000001
```

Identifiers never change.

---

# Ownership

Every fragment belongs to exactly one Page.

A Page may contain many Fragments.

Fragments never span multiple pages.

If a logical section continues onto another page, separate fragments are created and linked through relationships.

---

# Fragment Types

The initial taxonomy includes

## Primary Text

Examples

- Hadith
- Quran Verse
- Main Body
- Poetry
- Quotation

---

## Structural

Examples

- Chapter
- Section
- Heading
- Title
- Divider

---

## Editorial

Examples

- Footnote
- Verification
- Variant Note
- Publisher Remark
- OCR Correction

---

## Scholarly

Examples

- Commentary
- Explanation
- Cross Reference
- Linguistic Analysis

---

## Metadata

Examples

- Numbering
- Classification
- Tags

---

# Fragment Lifecycle

```
Created

↓

Indexed

↓

AI Analysed

↓

Reviewed

↓

Validated

↓

Published

↓

Archived
```

Only validated fragments become part of the canonical knowledge graph.

---

# Fragment Properties

Every fragment contains

- identifier
- fragment type
- provenance
- original text
- language
- status
- version
- review state
- creation metadata
- modification history

---

# Original Text

Original text is immutable.

Corrections never overwrite it.

Corrections create new editorial records.

---

# Derived Information

A fragment may contain generated information.

Examples

- OCR text
- normalized text
- transliteration
- translations
- AI summaries
- AI explanations
- keywords
- search index

Derived information is replaceable.

Original text is not.

---

# Entity References

Fragments reference entities.

Examples

```
Fragment

↓

Narrator

↓

Scholar

↓

Place

↓

Book

↓

Concept
```

Fragments never duplicate entity information.

---

# Relationships

Fragments may connect to

- other fragments
- entities
- bibliography
- historical events
- concepts
- commentaries

Relationships are external objects.

Fragments remain independent.

---

# AI Assistance

AI may

- detect entities
- classify fragment type
- suggest references
- suggest relationships
- summarize
- translate

AI never validates fragments.

---

# Search

Search indexes fragments.

Not pages.

Benefits

- precise results
- contextual ranking
- semantic search
- reusable knowledge

---

# Projection

The same fragment can appear in

- Reading View
- Graph
- Timeline
- Research View
- AI Companion
- Learning Journey

Fragments remain identical.

Only presentation changes.

---

# Design Rules

Rule 1

Every fragment has provenance.

---

Rule 2

Original Arabic text is immutable.

---

Rule 3

Fragments never duplicate entities.

---

Rule 4

Fragments never contain relationships.

Relationships exist independently.

---

Rule 5

Fragments are reusable.

One fragment may participate in unlimited projections.

---

Rule 6

Fragments may evolve through new metadata.

Their identity never changes.

---

# Why This Model?

Traditional digital libraries index pages.

Traditional LMS platforms index lessons.

Traditional CMS platforms index documents.

AlMinhej indexes knowledge.

Knowledge Fragments are the atomic units from which every higher-level experience is generated.

They are the bridge between physical books and digital knowledge.

---

Status

Stable