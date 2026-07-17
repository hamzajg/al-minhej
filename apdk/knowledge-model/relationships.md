---
id: KM-004
title: RELATIONSHIPS
version: 1.0.0
status: Stable
type: Canonical Domain Specification
depends_on:
  - bibliography.md
  - knowledge-fragments.md
  - entities.md
---

# RELATIONSHIPS

## Purpose

Relationships connect canonical knowledge objects.

Unlike traditional graph databases, relationships are not simple edges.

A Relationship is an authenticated scholarly statement supported by evidence.

Every relationship has provenance, lifecycle, validation status and supporting references.

Relationships are first-class domain objects.

---

# Definition

A Relationship expresses a semantic assertion between two or more canonical objects.

Examples

- Narrated By
- Mentions
- Explains
- Quotes
- Refers To
- Explains Verse
- Commentary On
- Student Of
- Teacher Of
- Located In
- Occurred During
- Publisher Of
- Edition Of

---

# Why Relationships Matter

Knowledge does not exist in isolation.

Understanding emerges from connections.

Example

```
Hadith

↓

Narrator

↓

Biography

↓

Historical Event

↓

Quran Verse

↓

Commentary

↓

Arabic Concept

↓

Related Hadith
```

The platform is fundamentally a network of validated relationships.

---

# Relationship Identity

Every relationship owns a permanent identifier.

Example

```
REL-00004821
```

Identity never changes.

Metadata may evolve.

---

# Relationship Structure

Every relationship contains

```
Source Object

↓

Relationship Type

↓

Target Object

↓

Evidence

↓

Review

↓

Publication
```

---

# Supported Sources

A relationship may originate from

- Knowledge Fragment
- Entity
- Bibliographic Object

---

# Supported Targets

A relationship may point to

- Entity
- Fragment
- Page
- Edition
- Book
- Concept
- Event
- Place
- Timeline
- Another Relationship

Relationships between relationships are supported.

---

# Relationship Categories

## Bibliographic

Examples

Edition Of

Printing Of

Volume Of

Page Of

Published By

Based On Manuscript

Derived From

---

## Semantic

Examples

Mentions

Defines

Explains

References

Expands

Summarizes

Corrects

Supports

Contradicts

---

## Scholarly

Examples

Commentary On

Verified By

Critiqued By

Preferred By

Explained By

Authenticated By

---

## Historical

Examples

Occurred During

Occurred At

Participant

Successor

Predecessor

---

## Educational

Examples

Prerequisite

Recommended Next

Introduces

Builds Upon

---

## Linguistic

Examples

Root Of

Derived From

Synonym

Antonym

Plural Of

Singular Of

---

# Evidence

Every published relationship requires evidence.

Evidence may include

- Knowledge Fragment
- Page
- Footnote
- Critical Edition
- External Source
- Scholarly Reference

Relationships without evidence remain Draft.

---

# Confidence

Relationships contain confidence.

Values

```
Confirmed

Strong

Probable

Weak

Unknown
```

AI confidence is separate from scholarly confidence.

---

# Review Status

Every relationship follows

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

---

# Temporal Validity

Some relationships change over time.

Example

Student Of

only exists during a period.

Historical Event

occurs on a date.

Timeline information belongs to the relationship.

---

# Relationship Metadata

Relationships may contain

- Notes
- Review comments
- External citations
- Tags
- Historical remarks
- Editorial remarks

Metadata never changes the assertion.

---

# Direction

Relationships may be

Directed

```
Teacher

↓

Student
```

Undirected

```
Related Concept

↔

Related Concept
```

Direction is part of the relationship definition.

---

# Cardinality

Supported cardinalities

```
1 → 1

1 → N

N → N
```

No artificial restrictions.

---

# Relationship Versioning

Relationship identity remains constant.

Evidence

Confidence

Notes

Review

may evolve through versions.

Published versions remain immutable.

---

# AI Suggestions

AI may propose

- new relationships
- missing links
- duplicate links
- stronger evidence
- alternative relationship types

AI never publishes relationships.

---

# Graph Projection

The Knowledge Graph is generated from approved relationships.

Editors never edit the graph.

Editors edit relationships.

The graph is rebuilt automatically.

---

# Validation Rules

Rule 1

Every relationship has a source.

---

Rule 2

Every relationship has a target.

---

Rule 3

Every published relationship has evidence.

---

Rule 4

Relationship type is mandatory.

---

Rule 5

Draft relationships may be AI generated.

---

Rule 6

Published relationships require human approval.

---

Rule 7

Relationships inherit provenance from their supporting evidence.

---

Rule 8

Relationships never overwrite contradictory relationships.

Competing scholarly opinions coexist with their own evidence.

---

# Contradictory Knowledge

Scholarly disagreement is preserved.

Example

Scholar A

↓

Accepts Relationship

Scholar B

↓

Rejects Relationship

Both assertions remain available.

Each carries its own evidence and provenance.

The platform preserves disagreement.

It does not resolve it.

---

# Summary

Relationships are the semantic foundation of AlMinhej.

They transform isolated books into a living knowledge network.

Every relationship is evidence-based, versioned, reviewable and traceable back to authenticated sources.

The graph is therefore not merely a visualization—it is a projection of validated scholarly knowledge.

---

Status

Stable