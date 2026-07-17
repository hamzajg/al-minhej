---
id: KM-003
title: ENTITIES
version: 1.0.0
status: Stable
type: Canonical Domain Specification
depends_on:
  - knowledge-fragments.md
---

# ENTITIES

## Purpose

Entities represent reusable real-world or conceptual knowledge objects.

They are shared across the entire platform.

Unlike Knowledge Fragments, Entities are not extracted text.

They are canonical concepts that are referenced by Knowledge Fragments.

---

# Definition

An Entity is a uniquely identifiable object that exists independently of any single book, page or Knowledge Fragment.

Entities are reused.

They are never duplicated.

---

# Why Entities Exist

Many books reference the same people, places and concepts.

Without reusable entities, every book would duplicate the same information.

Example

```
Sahih al-Bukhari
        │
        │
        ▼
Abu Hurairah
        ▲
        │
Sahih Muslim
        │
        ▼
Riyadh al-Salihin
        │
        ▼
Sharh Muslim
```

The biography exists once.

Books reference it.

---

# Canonical Identity

Every Entity owns one permanent identifier.

Example

```
ENT-00001234
```

Identity never changes.

Names may evolve.

Translations may evolve.

Aliases may grow.

---

# Entity Hierarchy

```
Knowledge Fragment

↓

Entity Reference

↓

Canonical Entity
```

Knowledge Fragments reference Entities.

Entities never belong to Fragments.

---

# Entity Categories

## Person

Examples

- Prophet Muhammad ﷺ
- Abu Hurairah
- Imam al-Bukhari
- Imam Nawawi

---

## Book

Examples

- Sahih al-Bukhari
- Sahih Muslim
- Tafsir al-Tabari

---

## Concept

Examples

- Ikhlas
- Taqwa
- Ihsan
- Tawhid

---

## Place

Examples

- Makkah
- Madinah
- Badr
- Uhud

---

## Historical Event

Examples

- Hijrah
- Battle of Badr
- Treaty of Hudaybiyyah

---

## Organization

Examples

- Dar al-Hadith
- Dar al-Salam

---

## Tribe

Examples

- Quraysh
- Aws
- Khazraj

---

## Language

Examples

- Arabic
- Persian

---

## Manuscript

Represents historically significant manuscript witnesses.

---

## Edition

Represents canonical published editions.

---

Additional categories may be introduced without affecting the domain model.

---

# Entity Properties

Every Entity contains

- Identifier
- Category
- Canonical Name
- Original Script
- Translations
- Aliases
- Description
- Provenance
- References
- Review Status
- Version

---

# Names

Every Entity supports multiple names.

Example

Canonical Arabic

```
أبو هريرة
```

English

```
Abu Hurairah
```

French

```
Abou Hourayra
```

Aliases

```
Abu Hurayrah

Abu Huraira
```

Searching any name resolves to the same Entity.

---

# Entity Provenance

Every Entity stores evidence describing why it exists.

Examples

- Biography books
- Classical dictionaries
- Hadith collections
- Historical sources

Entities must be evidence-backed.

---

# Entity References

Knowledge Fragments never embed entity data.

Instead

```
Fragment

↓

Entity Reference

↓

Entity
```

This avoids duplication.

---

# Entity Lifecycle

```
Detected

↓

Draft

↓

Reviewed

↓

Approved

↓

Published

↓

Deprecated
```

AI may create Draft entities.

Only humans publish them.

---

# AI Assistance

AI may

- detect entities
- merge duplicates
- suggest aliases
- classify category
- suggest biographies

AI never publishes an Entity automatically.

---

# Duplicate Detection

The platform continuously searches for duplicate entities.

Examples

```
أبو هريرة

↓

Abu Hurairah

↓

Abu Huraira

↓

Abu Hurayrah
```

All resolve to the same canonical Entity after review.

---

# Cross-Book Reuse

One Entity may be referenced by

- thousands of books
- millions of fragments
- multiple editions
- many relationships

Entities are global.

---

# Versioning

Entity identity is permanent.

Metadata evolves through versions.

Historical revisions remain available.

---

# Design Rules

Rule 1

Every Entity has a permanent identifier.

---

Rule 2

Entities are globally unique.

---

Rule 3

Fragments reference Entities.

Entities never belong to Fragments.

---

Rule 4

Entities are reusable.

---

Rule 5

Every published Entity has supporting evidence.

---

Rule 6

Entities may exist before any Fragment references them.

---

Rule 7

Deleting a Fragment never deletes an Entity.

---

# Summary

Entities are the reusable vocabulary of the AlMinhej knowledge ecosystem.

Knowledge Fragments describe specific passages from authentic sources.

Entities describe the people, books, concepts, places and historical objects that those passages reference.

By separating Fragments from Entities, AlMinhej builds a scalable knowledge network where information is authored once and reused consistently across the entire platform.

---

Status

Stable