---
id: DDD-002
title: REPOSITORIES
version: 1.0.0
status: Stable
type: Domain Driven Design
depends_on:
  - aggregates.md
---

# REPOSITORIES

## Purpose

Repositories provide the persistence boundary for Aggregate Roots.

They hide infrastructure details from the domain.

Repositories are responsible for retrieving and persisting aggregate roots.

They are **not generic CRUD services**.

They express the ubiquitous language of the domain.

---

# Repository Philosophy

A Repository answers business questions.

It does not expose storage mechanics.

Good

```
publishFragment()

findFragmentsOnPage()

findNarratorBiography()

comparePrintings()
```

Bad

```
save()

update()

delete()

findAll()
```

---

# Repository Rules

## Rule 1

One Aggregate Root.

One Repository.

---

## Rule 2

Repositories return Aggregate Roots.

Never DTOs.

---

## Rule 3

Repositories never expose database technology.

---

## Rule 4

Repositories never implement business rules.

---

## Rule 5

Repositories never coordinate multiple aggregates.

That belongs to Application Services.

---

# Bibliographic Repository

Responsible for

- Works
- Editions
- Printings
- Volumes
- Pages

Example operations

```
findWork()

findEdition()

findPrinting()

findPage()

findPageImage()

findPages()

findVolume()

compareEditions()

comparePrintings()
```

---

# Knowledge Fragment Repository

Responsible for retrieving Fragments.

Example operations

```
findFragment()

findFragmentsOnPage()

findFragmentsInEdition()

findFragmentsByType()

publishFragment()

archiveFragment()

restoreFragment()

searchFragments()

findReferencedFragments()
```

---

# Entity Repository

Responsible for canonical entities.

Example operations

```
findEntity()

findEntityByAlias()

findEntityByArabicName()

findEntityByTranslation()

mergeEntities()

splitEntity()

publishEntity()

searchEntities()
```

---

# Relationship Repository

Responsible for scholarly assertions.

Example operations

```
findRelationship()

findRelationships()

findIncomingRelationships()

findOutgoingRelationships()

findEvidence()

publishRelationship()

findRelationshipHistory()
```

---

# Review Repository

Responsible for review lifecycle.

Example operations

```
startReview()

approve()

reject()

requestRevision()

findPendingReviews()

findReviewHistory()
```

---

# Identity Repository

Responsible for identity resolution.

Example operations

```
resolveIdentifier()

resolveAlias()

findExternalMappings()

registerAlias()

mergeIdentity()

splitIdentity()
```

---

# Projection Repository

Projection repositories are read-only.

Examples

```
loadReadingProjection()

loadTimelineProjection()

loadKnowledgeGraph()

loadLearningJourney()

loadResearchWorkspace()
```

Projection repositories never modify canonical knowledge.

---

# Query Language

Repositories should expose the language of the business.

Examples

Instead of

```
findByForeignKey()
```

Use

```
findNarrationsOfScholar()
```

Instead of

```
findByParent()
```

Use

```
findPagesOfEdition()
```

Instead of

```
findRelated()
```

Use

```
findRelatedConcepts()
```

---

# Transactions

Repositories never manage transactions.

Transaction boundaries belong to Application Services.

---

# Pagination

Repositories may return

```
Slice

Page

Cursor
```

depending on the use case.

Pagination strategy is an implementation concern.

---

# Search

Repositories may support

- exact search
- prefix search
- full-text search
- semantic search

The domain does not depend on the search engine.

---

# Versioning

Repositories always return the latest published version by default.

Historical versions require explicit requests.

Example

```
findFragmentVersion()

findEntityVersion()

findRelationshipVersion()
```

---

# Events

Repositories never publish events.

Application Services publish Domain Events after successful persistence.

---

# Caching

Caching belongs to infrastructure.

Repositories expose no cache API.

---

# Technology Independence

The same repository contracts must support

- MongoDB
- Firebase
- PostgreSQL
- Event Store
- In-Memory Repository

without changing the domain layer.

---

# Summary

Repositories protect the Domain Model from persistence concerns.

Their contracts express the language of Islamic knowledge engineering rather than generic database operations.

Infrastructure evolves independently while the domain language remains stable.

---

Status

Stable