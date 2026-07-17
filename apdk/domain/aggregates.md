---
id: DDD-001
title: AGGREGATES
version: 1.0.0
status: Stable
type: Domain Driven Design
depends_on:
  - knowledge-model/*
---

# AGGREGATES

## Purpose

This document defines the aggregate roots of AlMinhej.

Aggregate boundaries protect business consistency.

Every aggregate owns its internal state.

Other aggregates interact only through identifiers.

---

# Aggregate Overview

The platform contains seven aggregate roots.

```
Bibliographic Aggregate

Knowledge Fragment Aggregate

Entity Aggregate

Relationship Aggregate

Review Aggregate

Projection Aggregate

Identity Aggregate
```

---

# Why These Aggregates?

These aggregates map directly to the core business capabilities discovered during domain analysis.

They are not based on database collections.

They are based on consistency boundaries.

---

# Bibliographic Aggregate

## Responsibility

Manage authentic bibliographic provenance.

Owns

- Collection
- Work
- Riwayah
- Manuscript
- Critical Edition
- Publisher Edition
- Printing
- Volume
- Page

Guarantees

- provenance integrity
- immutable publication hierarchy

Never owns

- entities
- relationships
- projections

---

# Knowledge Fragment Aggregate

## Responsibility

Represent authenticated units of knowledge extracted from pages.

Owns

- Fragment
- Fragment Metadata
- AI Suggestions
- Editorial Notes
- Local References

Guarantees

- fragment integrity
- immutable original text
- provenance inheritance

This is the primary aggregate of the platform.

---

# Entity Aggregate

## Responsibility

Manage reusable canonical knowledge objects.

Owns

- Person
- Scholar
- Narrator
- Place
- Concept
- Event
- Book
- Organization

Guarantees

- uniqueness
- aliases
- multilingual names
- canonical identity

---

# Relationship Aggregate

## Responsibility

Represent validated semantic assertions.

Owns

- Relationship
- Evidence
- Confidence
- Review References

Guarantees

- valid source
- valid target
- evidence
- provenance

---

# Review Aggregate

## Responsibility

Protect authenticity.

Owns

- Reviews
- Decisions
- Comments
- Approval History
- Publication State

Guarantees

- review workflow
- approval rules
- audit history

---

# Projection Aggregate

## Responsibility

Manage generated user experiences.

Owns

- Reading Projection
- Learning Projection
- Timeline Projection
- Graph Projection
- AI Projection

Projection data is disposable.

Canonical knowledge never lives here.

---

# Identity Aggregate

## Responsibility

Maintain permanent identities.

Owns

- canonical identifiers
- aliases
- external mappings
- merge history

Guarantees

- global uniqueness
- stable identity
- import compatibility

---

# Aggregate Communication

```
Bibliography

↓

Knowledge Fragment

↓

Entity

↓

Relationship

↓

Projection
```

Review and Identity support every aggregate.

---

# Cross Aggregate Rules

Fragments reference Entities.

Relationships reference Fragments and Entities.

Bibliography never references Relationships.

Projections never own canonical data.

Review never changes business objects directly.

Identity is immutable.

---

# Aggregate Size

Aggregates should remain small.

If an aggregate becomes difficult to load into memory, the boundary is probably incorrect.

---

# Transaction Boundary

A single transaction modifies exactly one aggregate.

Business processes spanning multiple aggregates are coordinated through Application Services and Domain Events.

---

# Aggregate Invariants

Bibliographic Aggregate

- provenance chain must remain complete

Knowledge Fragment Aggregate

- original text is immutable
- provenance is mandatory

Entity Aggregate

- canonical identifier is unique

Relationship Aggregate

- evidence is mandatory before publication

Review Aggregate

- approval history is immutable

Projection Aggregate

- projections never own canonical data

Identity Aggregate

- identifiers never change

---

# Summary

These aggregate boundaries form the implementation backbone of AlMinhej.

Every repository, command, REST endpoint, event and persistence model must respect these boundaries to preserve domain integrity and ensure long-term maintainability.

---

Status

Stable