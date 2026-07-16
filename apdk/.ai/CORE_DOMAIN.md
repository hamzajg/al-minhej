---
id: APDK-004
title: CORE_DOMAIN
version: 1.0.0
status: Stable
type: Foundation
owner: Product Architecture
depends_on:
  - NORTH_STAR.md
  - CONTEXT.md
  - PRODUCT.md
---

# CORE DOMAIN

## Purpose

This document defines the business domain of AlMinhej.

It establishes the ubiquitous language, business capabilities, bounded contexts and domain model that every implementation must follow.

Technology choices must never change the concepts defined here.

---

# Core Domain

The core domain of AlMinhej is

# Knowledge Engineering

Knowledge Engineering is the process of transforming authentic Islamic sources into structured, interconnected and reusable knowledge while preserving authenticity and provenance.

Knowledge Engineering is the competitive advantage of the platform.

Everything else exists to support it.

---

# Domain Statement

AlMinhej does not create Islamic knowledge.

It preserves, structures, validates and projects existing authenticated knowledge.

The platform is therefore centered around **knowledge**, not around documents or lessons.

---

# Knowledge Lifecycle

Every piece of knowledge follows the same lifecycle.

```
Authentic Source

↓

Digitization

↓

Knowledge Extraction

↓

Knowledge Mapping

↓

Validation

↓

Publication

↓

Projection

↓

Continuous Enrichment
```

---

# The Three Fundamental Layers

The platform consists of three independent but connected layers.

## Layer 1

### Bibliographic Knowledge

Represents physical and intellectual works.

Responsible for answering:

> Where does this knowledge come from?

Examples

- Collection
- Work
- Author
- Compiler
- Riwayah
- Manuscript
- Critical Edition
- Publisher
- Printing
- Volume
- Page

Nothing in this layer contains interpretations.

Its purpose is provenance.

---

## Layer 2

### Knowledge Engineering

Represents extracted knowledge.

Responsible for answering

> What knowledge exists?

Examples

- Hadith
- Quran Verse
- Narrator
- Scholar
- Concept
- Place
- Event
- Definition
- Commentary
- Source Reference

This is the heart of the platform.

---

## Layer 3

### Knowledge Projection

Represents user experiences.

Responsible for answering

> How should this knowledge be presented?

Examples

- Reading Mode
- Learning Journey
- Knowledge Graph
- Timeline
- AI Companion
- Research View
- Comparison View

Projection never changes knowledge.

---

# Ubiquitous Language

The following vocabulary is mandatory across the entire project.

## Work

An intellectual work.

Examples

- Sahih al-Bukhari
- Sahih Muslim
- Al-Arba'in al-Nawawiyyah

---

## Edition

A published representation of a work.

Examples

Critical Edition

Publisher Edition

Digital Edition

---

## Page

A physical page within a specific edition.

Pages belong to editions.

Not works.

---

## Knowledge Fragment

The smallest meaningful unit extracted from a page.

Examples

A hadith

A paragraph

A Quran verse

A definition

A commentary

A title

A footnote

Knowledge Fragments are the primary indexing units.

---

## Entity

A uniquely identifiable object.

Examples

Person

Place

Book

Concept

Scholar

Narrator

Organization

Event

---

## Relationship

A semantic connection between two entities.

Examples

Narrated By

Commented By

Explained In

Related To

Occurred During

Quotes

Explains

References

Relationships are first-class domain objects.

---

## Source

The authenticated origin supporting a knowledge fragment or relationship.

Every knowledge object must be traceable to one or more sources.

---

## Provenance

Complete historical origin of a knowledge object.

Example

```
Work

↓

Edition

↓

Volume

↓

Page

↓

Knowledge Fragment
```

Nothing may lose provenance.

---

# Business Capabilities

The platform consists of the following capabilities.

## Bibliographic Management

Responsible for

- Collections
- Books
- Editions
- Publishers
- Manuscripts
- Riwayat
- Pages

---

## Knowledge Management

Responsible for

- Knowledge Fragments
- Concepts
- Definitions
- References

---

## Entity Management

Responsible for

- Scholars
- Narrators
- Places
- Organizations
- Historical Events

---

## Relationship Management

Responsible for

- Semantic Links
- Validation
- Confidence
- Provenance

---

## AI Assistance

Responsible for

- Entity Detection
- Relationship Suggestions
- Duplicate Detection
- Missing Link Suggestions

AI never modifies validated knowledge automatically.

---

## Publication

Responsible for

- Review
- Approval
- Versioning
- Visibility

---

## Projection

Responsible for

- Reading
- Learning
- Research
- Graph
- Timeline

---

# Bounded Contexts

The platform is divided into six bounded contexts.

---

## Bibliography Context

Owns

- Works
- Editions
- Publishers
- Volumes
- Pages

---

## Knowledge Context

Owns

- Knowledge Fragments
- Definitions
- References

---

## Entity Context

Owns

- Persons
- Concepts
- Places
- Organizations
- Events

---

## Relationship Context

Owns

- Semantic Relationships
- Evidence
- Confidence

---

## AI Context

Owns

- Suggestions
- Detection
- Classification

AI never owns knowledge.

---

## Projection Context

Owns

- Reading Experience
- Learning Experience
- Research Experience
- Graph Visualization

Projection never stores domain knowledge.

---

# Aggregate Roots

The following objects are aggregate roots.

- Work
- Edition
- Page
- Knowledge Fragment
- Entity
- Relationship

Everything else belongs to one of these aggregates.

---

# Entity Identity

Every entity has a permanent identifier.

Example

```
ENT-000123
```

Identity never changes.

Names may change.

Aliases may grow.

Translations may change.

Identity remains permanent.

---

# Relationship Identity

Relationships are independent objects.

Example

```
REL-000245

Source

Narrator A

Target

Hadith 12

Type

Narrated

Evidence

Page 43
```

Relationships can contain metadata.

---

# Domain Invariants

The following rules must always hold.

## Rule 1

Every Knowledge Fragment belongs to exactly one page.

---

## Rule 2

Every page belongs to exactly one edition.

---

## Rule 3

Every edition belongs to exactly one work.

---

## Rule 4

Every published relationship must reference supporting evidence.

---

## Rule 5

Knowledge may reference many entities.

---

## Rule 6

Entities may exist before being referenced.

---

## Rule 7

Deleting a page never deletes shared entities.

---

## Rule 8

Relationships cannot exist without source and target.

---

## Rule 9

Every AI-generated suggestion remains a suggestion until approved.

---

## Rule 10

Original source text is immutable.

---

# Domain Events

Examples

- WorkImported
- EditionCreated
- PageIndexed
- FragmentCreated
- EntityDetected
- RelationshipSuggested
- RelationshipApproved
- KnowledgePublished

Events describe business actions.

They are not technical events.

---

# Domain Services

Some business operations do not belong to a single aggregate.

Examples

Knowledge Extraction

Relationship Discovery

Bibliographic Comparison

Edition Comparison

Duplicate Detection

Knowledge Projection

These should be implemented as domain services.

---

# Repositories

Every aggregate has its own repository.

Examples

WorkRepository

EditionRepository

KnowledgeFragmentRepository

EntityRepository

RelationshipRepository

Repositories expose domain objects.

Never database models.

---

# Strategic Design Principles

The domain model is independent of

- REST APIs
- React
- Spring Boot
- MongoDB
- Firebase
- JSON
- Graph databases

Technology adapts to the domain.

Never the opposite.

---

# Summary

The platform revolves around three permanent concepts.

Bibliographic Knowledge

↓

Knowledge Engineering

↓

Knowledge Projection

Knowledge Engineering is the core domain.

Bibliography provides authenticity.

Projection provides user experience.

The separation of these responsibilities is fundamental and must be preserved throughout the lifetime of the project.

---

Status

Stable