---
id: KM-007
title: GLOBAL IDENTITY SYSTEM
version: 1.0.0
status: Stable
type: Canonical Domain Specification
depends_on:
  - bibliography.md
  - knowledge-fragments.md
  - entities.md
  - relationships.md
---

# GLOBAL IDENTITY SYSTEM

## Purpose

This document defines the global identity strategy for every canonical object managed by AlMinhej.

Identity is permanent.

Names evolve.

Metadata evolves.

Relationships evolve.

Identity never changes.

The identity system guarantees stable references across APIs, databases, AI agents, knowledge graphs and future integrations.

---

# Design Goals

The identity system must provide

- Global uniqueness
- Permanent references
- Human readability
- Technology independence
- URL stability
- Import compatibility
- Distributed generation
- Future scalability

---

# Identity Principles

## Rule 1

Every canonical object owns exactly one permanent identifier.

---

## Rule 2

Identifiers never contain business meaning.

Business data changes.

Identifiers do not.

---

## Rule 3

Identifiers are immutable.

An object's identity never changes after creation.

---

## Rule 4

Identifiers remain stable across

- databases
- APIs
- exports
- imports
- AI prompts
- search indexes
- graph nodes

---

## Rule 5

Deleted objects are never reused.

Identifiers remain permanently reserved.

---

# Canonical Identifier Format

Every identifier consists of

```
PREFIX-NUMBER
```

Examples

```
WORK-000001

PAGE-000432

KF-000981

ENT-001204

REL-000512
```

The numeric component is opaque.

It carries no semantic meaning.

---

# Object Prefixes

## Bibliography

```
COL

Collection

WORK

Intellectual Work

RIW

Transmission (Riwayah)

MAN

Manuscript

CED

Critical Edition

PUB

Publisher Edition

PRN

Printing

VOL

Volume

PAGE

Page
```

---

## Knowledge

```
KF

Knowledge Fragment

ENT

Entity

REL

Relationship
```

---

## Review

```
REV

Review

VER

Version

AUD

Audit Event
```

---

## AI

```
AIS

AI Suggestion

AIT

AI Task

AIR

AI Response
```

AI objects are temporary.

Canonical objects never depend on AI identifiers.

---

## User

```
USR

User

ROLE

Role

TEAM

Team
```

User identities remain separate from knowledge identities.

---

# Internal vs External Identity

Every canonical object may expose two identifiers.

Internal Identifier

```
KF-000341
```

Permanent.

Used by APIs and databases.

External Slug

```
first-hadith-intention
```

Readable.

May evolve.

Never replaces the canonical identifier.

---

# URL Strategy

URLs use stable identifiers.

Example

```
/works/WORK-000021

/entities/ENT-000872

/fragments/KF-000182

/relationships/REL-000932
```

Readable aliases may redirect.

Canonical URLs never change.

---

# Imports

External datasets retain their own identifiers.

Examples

```
Shamela

IIIF

TEI

OpenITI

Library Catalogs
```

External identities are mapped.

They never replace canonical identifiers.

---

# Aliases

Objects may have unlimited aliases.

Examples

```
ENT-000021

↓

Wikidata

↓

Shamela

↓

OpenITI

↓

Custom Mapping
```

The canonical identifier remains primary.

---

# Identity Resolution

The platform maintains an Identity Resolver.

It answers

```
External ID

↓

Canonical ID

↓

Domain Object
```

Every service uses the resolver.

---

# Identity References

Relationships always reference identifiers.

Never object copies.

Example

```
REL-000812

Source

ENT-000021

Target

ENT-000431
```

This prevents duplication.

---

# Versioning

Versions do not receive new identities.

Example

```
ENT-000152

↓

Version 1

↓

Version 2

↓

Version 3
```

Identity remains constant.

Version history evolves.

---

# Merging

Duplicate objects may be merged.

Example

```
ENT-000221

↓

Merged Into

↓

ENT-000017
```

The deprecated identifier remains resolvable.

Historical references never break.

---

# Splitting

If an object was incorrectly modeled

```
ENT-000321

↓

Split

↓

ENT-000654

+

ENT-000655
```

The original identity remains archived.

A complete migration history is preserved.

---

# Graph Identity

Knowledge Graph nodes use canonical identifiers.

Node labels may change.

Node identities never change.

---

# AI References

AI prompts always reference canonical identifiers.

Never free text.

Example

```
Explain

ENT-000031

using

KF-000882
```

This reduces ambiguity and hallucination.

---

# Design Rules

Rule 1

Identity is immutable.

---

Rule 2

Identity is globally unique.

---

Rule 3

Business meaning never belongs inside identifiers.

---

Rule 4

Aliases never replace canonical identity.

---

Rule 5

Historical identifiers remain resolvable forever.

---

Rule 6

External systems map to canonical identifiers.

---

Rule 7

Every relationship references identifiers rather than embedded objects.

---

# Summary

The Global Identity System provides the permanent backbone of the AlMinhej platform.

By separating identity from names, versions and external mappings, the platform guarantees stable references across all layers, from bibliographic provenance to knowledge projections.

This enables long-term maintainability, interoperability and reliable AI-assisted workflows.

---

Status

Stable