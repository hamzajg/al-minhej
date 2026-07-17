---
id: KM-000
title: KNOWLEDGE MODEL
version: 1.0.0
status: Stable
type: Canonical Domain Specification
---

# KNOWLEDGE MODEL

## Purpose

This folder defines the canonical business model of AlMinhej.

It is the authoritative definition of every domain object managed by the platform.

These documents do not describe databases.

They describe business concepts.

Every implementation must derive its models from these specifications.

---

# Design Goals

The model must

- preserve authenticity
- preserve provenance
- support multiple projections
- support multiple editions
- support AI-assisted enrichment
- support future Islamic sciences
- remain technology independent

---

# Domain Layers

The knowledge model consists of three independent layers.

```
Bibliographic Layer

↓

Knowledge Layer

↓

Projection Layer
```

---

## Bibliographic Layer

Represents

- physical books
- manuscripts
- editions
- publishers
- printings
- pages

Purpose

Provenance.

---

## Knowledge Layer

Represents

- entities
- fragments
- concepts
- relationships
- references

Purpose

Semantic knowledge.

---

## Projection Layer

Represents

- reading
- learning
- research
- graph
- timeline
- AI companion

Purpose

User experience.

---

# Canonical Object Hierarchy

```
Collection

↓

Work

↓

Edition

↓

Volume

↓

Page

↓

Knowledge Fragment

↓

Entity

↓

Relationship
```

This hierarchy never changes.

---

# Design Principles

Every business object must satisfy the following principles.

## Stable Identity

Every object owns a permanent identifier.

Names may change.

Identifiers never change.

---

## Immutable Provenance

Every published object records

- source
- edition
- page
- references

This information cannot be removed.

---

## Shared Knowledge

Knowledge should never be duplicated.

Relationships reference existing entities whenever possible.

---

## Projection Independence

Reading mode.

Graph.

Timeline.

Learning.

AI.

All consume the same domain model.

None own domain data.

---

## Human Validation

Knowledge enters the system through review.

AI suggestions never become canonical automatically.

---

# Domain Categories

The knowledge model is divided into the following specifications.

| Document | Responsibility |
|----------|----------------|
| bibliography.md | Books, editions, pages and provenance |
| knowledge-fragments.md | Smallest indexed knowledge units |
| entities.md | People, concepts, places and reusable objects |
| relationships.md | Semantic connections between entities |
| projections.md | User-facing projections of knowledge |
| review-workflow.md | Validation lifecycle |
| identifiers.md | Global identifier strategy |

---

# Technology Independence

These documents intentionally avoid

- React
- Spring Boot
- MongoDB
- Firebase
- Graph databases
- REST

Technology adapts to this model.

Never the opposite.

---

# Implementation Contract

Every implementation repository must derive

- TypeScript interfaces
- Kotlin domain classes
- Repository interfaces
- REST contracts
- Database schemas

from this folder.

These documents are the canonical source.

---

Status

Stable