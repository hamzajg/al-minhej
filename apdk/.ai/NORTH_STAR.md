---
id: APDK-001
title: NORTH_STAR
version: 1.0.0
status: Frozen
type: Foundation
owner: Product Architecture
---

# NORTH STAR

## Mission

Build the world's most trustworthy AI-native platform for preserving, indexing, connecting and understanding authentic Islamic knowledge while always preserving the integrity of the original sources.

AlMinhej is not a Learning Management System.

AlMinhej is not a digital library.

AlMinhej is not an AI chatbot.

AlMinhej is a Knowledge Platform.

Learning is a projection of knowledge.

---

# Vision

Every authentic Islamic book should become a living digital knowledge network.

Instead of reading isolated pages, users should be able to explore the complete context surrounding every paragraph, narration, scholar, concept and historical event while always keeping the original source as the center of the experience.

---

# Product Philosophy

The platform exists to answer one question:

> "How can we make authentic Islamic knowledge easier to understand without changing the original sources?"

Everything else is secondary.

---

# Core Principle

Original knowledge is immutable.

Everything else is metadata.

Examples

Original text

✓ immutable

Book hierarchy

✓ immutable

Page numbering

✓ immutable

Edition information

✓ immutable

Knowledge relationships

✓ extendable

Translations

✓ extendable

Commentaries

✓ extendable

AI explanations

✓ generated

Learning journeys

✓ generated

User notes

✓ personal

The original source is never modified.

---

# Product Identity

AlMinhej is built upon three independent layers.

## Layer 1

Knowledge Preservation

Digitize authentic works exactly as published.

No simplification.

No rewriting.

No AI modifications.

---

## Layer 2

Knowledge Engineering

Transform books into structured knowledge.

Identify

- entities
- narrators
- scholars
- concepts
- places
- events
- references
- relationships

Knowledge becomes navigable.

---

## Layer 3

Knowledge Projection

Present the same knowledge differently depending on the user.

Examples

- beginner reading
- scholar research
- AI assistant
- knowledge graph
- timeline
- comparative editions
- guided study

The data remains identical.

Only the presentation changes.

---

# Primary Users

Knowledge Studio

Used by

- editors
- researchers
- translators
- reviewers
- scholars
- knowledge engineers

Purpose

Build knowledge.

---

Knowledge Workspace

Used by

- readers
- students
- teachers
- researchers

Purpose

Consume knowledge.

---

# Core Domain

The core domain is **Knowledge Engineering**.

Not courses.

Not lessons.

Not AI.

Not chat.

Not quizzes.

Knowledge.

Everything revolves around preserving, structuring and connecting authentic knowledge.

---

# What We Build

The platform manages

- Collections
- Books
- Editions
- Riwayat
- Manuscripts
- Publishers
- Volumes
- Pages
- Knowledge Fragments
- Entities
- Relationships
- Sources
- References

Nothing else is considered a first-class domain object.

---

# Source First

Every feature begins with an authentic source.

Examples

Quran

↓

Verse

↓

Knowledge

Hadith Collection

↓

Book

↓

Page

↓

Knowledge

Tafsir

↓

Volume

↓

Page

↓

Knowledge

Knowledge is extracted from sources.

Never the opposite.

---

# AI Philosophy

AI is an assistant.

Never an authority.

AI may

- detect entities
- suggest references
- propose relationships
- summarize
- explain
- classify

AI may never

- replace original text
- invent references
- publish automatically
- modify authenticated sources
- change historical facts

Every AI suggestion requires human validation.

---

# Knowledge Relationships

Relationships are first-class citizens.

Examples

Hadith

→ Narrator

Hadith

→ Quran Verse

Scholar

→ Commentary

Concept

→ Related Concept

Narrator

→ Biography

Historical Event

→ Timeline

Book

→ Edition

Edition

→ Publisher

Every relationship has provenance.

---

# Bibliographic Integrity

Every digital object must preserve its origin.

Examples

Work

↓

Riwayah

↓

Manuscript

↓

Critical Edition

↓

Publisher

↓

Printing

↓

Volume

↓

Page

The platform never collapses multiple textual traditions into a single anonymous version.

---

# Learning Philosophy

Learning is generated.

Not authored.

The system creates personalized learning journeys from authenticated knowledge relationships.

Lessons are projections.

Knowledge is permanent.

---

# UX Philosophy

The interface should always reduce complexity.

The data model may be complex.

The user experience must never expose unnecessary complexity.

Beginners should feel guided.

Researchers should feel empowered.

Experts should feel unrestricted.

---

# Engineering Philosophy

Build vertical slices.

Every iteration must produce working software.

Avoid speculative architecture.

Avoid unfinished features.

Avoid dead code.

Prefer simplicity over cleverness.

---

# Success Criteria

The platform succeeds when

A beginner can understand difficult Islamic texts with confidence.

A researcher can trace every statement back to its authentic source.

Editors can build and maintain knowledge efficiently.

AI accelerates knowledge engineering without compromising authenticity.

The same knowledge can power multiple learning experiences without duplication.

---

# Non-Goals

The platform is not intended to

- replace scholars
- generate religious rulings
- rewrite classical texts
- simplify authenticated sources
- become another generic CMS
- become another AI chatbot
- prioritize AI over authenticity

---

# Decision Priority

When two decisions conflict, always follow this order.

1. Authenticity
2. Knowledge Integrity
3. User Understanding
4. Simplicity
5. Maintainability
6. Performance
7. Technology Preference

Technology must never dictate the domain model.

---

# North Star Statement

> Preserve the source.
>
> Engineer the knowledge.
>
> Project the understanding.
>
> Keep authenticity at the center of every experience.

---
Status

Frozen

This document defines the permanent direction of the AlMinhej platform and should only change if the product vision fundamentally changes.