---
id: KM-005
title: KNOWLEDGE PROJECTIONS
version: 1.0.0
status: Stable
type: Canonical Domain Specification
depends_on:
  - bibliography.md
  - knowledge-fragments.md
  - entities.md
  - relationships.md
---

# KNOWLEDGE PROJECTIONS

## Purpose

Knowledge Projections define how canonical knowledge is presented to different users without modifying the underlying domain.

The knowledge model remains immutable.

Only the presentation changes.

A Projection is therefore a read model generated from validated knowledge.

---

# Why Projections?

Traditional educational platforms create lessons.

Traditional digital libraries display books.

Traditional graph systems display nodes.

AlMinhej generates experiences.

The same knowledge can become

- a reading experience
- a guided lesson
- a research workspace
- a timeline
- a graph
- an AI conversation

without duplicating any knowledge.

---

# Architecture

```
Bibliographic Knowledge

↓

Knowledge Fragments

↓

Entities

↓

Relationships

↓

Projection Engine

↓

Reading

Research

Timeline

Learning Journey

Knowledge Graph

Comparison

AI Companion
```

Everything below the Projection Engine is generated.

Nothing below it owns data.

---

# Projection Principles

Every projection must satisfy the following rules.

---

## Rule 1

Never modify canonical knowledge.

---

## Rule 2

Never duplicate canonical knowledge.

---

## Rule 3

Every displayed statement remains traceable to its provenance.

---

## Rule 4

Users may switch projections without changing the underlying knowledge.

---

## Rule 5

Projection state is temporary.

Knowledge state is permanent.

---

# Projection Types

## Reading Projection

Purpose

Read authentic texts.

Primary Focus

Original Arabic.

Supporting Features

- Translation
- Vocabulary
- References
- Footnotes
- Context Panel

---

## Knowledge Graph Projection

Purpose

Explore semantic relationships.

Nodes

- Entities
- Fragments
- Works

Edges

Validated Relationships

Capabilities

- Expand
- Collapse
- Filter
- Highlight
- Trace

---

## Timeline Projection

Purpose

Understand chronological context.

Objects

- Historical Events
- Scholars
- Narrators
- Works
- Publications

Supports

- zoom
- filtering
- comparison

---

## Research Projection

Purpose

Support advanced exploration.

Capabilities

- citation explorer
- relationship explorer
- provenance explorer
- textual variants
- edition comparison

---

## Comparison Projection

Purpose

Compare multiple textual traditions.

Examples

- Riwayah comparison
- Manuscript comparison
- Publisher comparison
- Edition comparison
- Variant comparison

Differences are visualized.

Nothing is merged.

---

## Learning Journey Projection

Purpose

Guide beginners.

Generated from

- prerequisites
- concepts
- dependencies
- relationships

The learning path is generated.

It is never authored manually.

---

## AI Companion Projection

Purpose

Natural language interaction.

The AI Companion may

- explain
- summarize
- answer questions
- recommend related knowledge

Every response must contain provenance.

---

# Projection Context

Every projection receives

- User
- Preferences
- Language
- Permissions
- Current Context

The canonical model remains unchanged.

---

# Personalization

The same knowledge may be presented differently according to

- language
- expertise level
- reading mode
- accessibility settings
- preferred projection

Personalization affects presentation only.

Never knowledge.

---

# Projection Metadata

Each projection may maintain temporary state.

Examples

- expanded graph nodes
- reading position
- selected filters
- open inspector panels
- zoom level

This state belongs to the projection.

Not the domain.

---

# Multiple Projections

Several projections may exist simultaneously.

Example

```
Reading View

+

Knowledge Graph

+

Timeline

+

Inspector
```

Each consumes the same canonical knowledge.

---

# Navigation Between Projections

Navigation should preserve context.

Example

Reading

↓

Narrator

↓

Biography

↓

Timeline

↓

Historical Event

↓

Return to Reading

The user never loses their place.

---

# AI Integration

AI does not create projections.

AI enhances existing projections.

Examples

Reading Projection

↓

Explain difficult paragraph

Knowledge Graph

↓

Suggest unexplored relationships

Timeline

↓

Explain historical context

---

# Future Projections

The architecture intentionally supports future experiences.

Examples

- Story Mode
- Teaching Mode
- Presentation Mode
- Debate Mode
- Manuscript Explorer
- Citation Network
- Geographic Map
- Family Trees

No changes to the domain model should be required.

---

# Design Rules

Rule 1

Projection owns no business data.

---

Rule 2

Projection never changes canonical knowledge.

---

Rule 3

Projection may cache generated views.

---

Rule 4

Projection state is disposable.

---

Rule 5

Knowledge remains the single source of truth.

---

# Summary

Knowledge Projections are the final layer of the AlMinhej architecture.

They transform validated knowledge into experiences tailored to different audiences while preserving authenticity, provenance and consistency.

The same knowledge should be reusable across unlimited projections without duplication or divergence.

---

Status

Stable