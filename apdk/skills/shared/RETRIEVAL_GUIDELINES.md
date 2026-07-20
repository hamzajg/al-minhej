---
title: Retrieval Guidelines
version: 1.0.0
status: Stable
scope: Global
appliesTo: All APDK Retrieval Skills
---

# Retrieval Guidelines

## Purpose

This document defines the standard retrieval workflow used by all APDK knowledge retrieval skills.

The objective is to ensure every retrieved object is:

- obtained from an approved source
- validated before use
- preserved with provenance
- reproducible
- auditable

---

# Core Principle

Retrieval is a controlled process.

The system must never:

- search randomly
- select unknown sources
- silently replace providers
- return content without provenance
- hide verification failures

---

# Retrieval Lifecycle

Every retrieval operation follows:

```
Request

↓

Skill Validation

↓

Source Discovery

↓

Provider Selection

↓

Content Retrieval

↓

Verification

↓

Metadata Attachment

↓

Cache

↓

Response
```

---

# Step 1 — Request Validation

Before retrieval begins, the skill validates:

- requested domain
- requested resource
- required role
- identifiers
- language
- edition requirements

Example:

```
Domain:
Quran

Role:
canonical_text

Request:
Surah 2 Ayah 255
```

---

# Step 2 — Source Discovery

The skill queries the approved provider registry.

Selection criteria:

- domain compatibility
- source role compatibility
- trust level
- availability
- user preference
- deployment configuration

---

# Step 3 — Provider Selection

Provider selection priority:

1. Explicit user requested provider
2. Configured preferred provider
3. Highest trust approved provider
4. Backup approved provider

The selected provider must be recorded.

---

# Provider Switching Rules

Automatic fallback is allowed only when:

- the fallback provider supports the same role
- the fallback provider is approved
- the switch is recorded

Example:

Allowed:

```
Tanzil unavailable

↓

Approved Quran text mirror selected

↓

Provenance updated
```

Not allowed:

```
Quran text provider unavailable

↓

Random website selected
```

---

# Step 4 — Retrieval

The provider retrieves the requested resource.

The skill must preserve:

- original content
- source identifiers
- metadata
- version information

---

# Content Handling Rules

Retrieved content must not be modified.

Forbidden:

- rewriting
- normalization
- correction
- completion
- translation
- summarization

unless another dedicated processing skill explicitly performs that operation.

---

# Step 5 — Verification

After retrieval:

The skill performs:

1. Source verification
2. Metadata verification
3. Content verification
4. Integrity verification (when available)

Verification follows:

```
shared/VERIFICATION_POLICY.md
```

---

# Step 6 — Metadata Attachment

Every response receives provenance metadata.

Minimum:

```
provider

source

version

retrievedAt

verificationStatus
```

Domain skills add additional metadata.

---

# Step 7 — Caching

Caching is encouraged for performance.

However:

Cached data must preserve:

- original source
- version
- checksum
- verification state

---

# Cache Rules

## Allowed

Store verified retrieved content.

---

## Forbidden

Store modified content as if it came from the source.

---

# Cache Invalidation

Cache should be invalidated when:

- provider version changes
- source is deprecated
- verification fails
- checksum changes

---

# Offline Retrieval

APDK supports offline deployments.

Offline datasets must include:

- original provider metadata
- dataset version
- checksum
- license information

Offline does not mean unverified.

---

# Search Strategy

Search may be performed through:

- provider APIs
- local indexes
- full-text databases
- knowledge graphs

Search results are discovery aids only.

Final content must come from an approved retrieval source.

---

# Multiple Source Handling

When multiple sources contain the same work:

The system should preserve:

- each source identity
- edition differences
- provider differences

The system must not merge them automatically.

---

# Edition Handling

Classical works often exist in multiple editions.

The system should represent:

```
Work

↓

Edition

↓

Publisher

↓

Digital Provider
```

Example:

```
Sahih al-Bukhari

↓

Edition A

↓

Publisher A

↓

Digital Provider
```

---

# User Source Preference

Users may request:

- specific edition
- specific publisher
- specific provider
- specific translation

The system should respect this when available.

---

# Retrieval Logging

Every retrieval operation should record:

```
retrievalId

timestamp

skill

provider

resource

request

verificationResult

errors
```

---

# Failure Handling

Failures must be explicit.

Examples:

- provider unavailable
- content unavailable
- verification failure
- unsupported request
- missing metadata

The system must return structured failures.

---

# Retry Policy

Retries are allowed for:

- network failures
- temporary provider errors

Retries are not allowed to bypass:

- verification failure
- source policy violation

---

# Rate Limiting

Providers may impose limits.

Skills should support:

- throttling
- batching
- local caching

---

# Reproducibility

A retrieval operation should be reproducible.

Given:

- same provider
- same version
- same identifier

the system should retrieve the same object.

---

# AI Interaction Rules

AI agents using retrieval skills must:

- invoke the skill
- wait for verified results
- preserve provenance
- not replace missing data

AI must not directly access external sources outside approved retrieval skills.

---

# Design Philosophy

The retrieval layer is the bridge between digital libraries and AI agents.

Its responsibility is not to create knowledge.

Its responsibility is to provide reliable access to existing authenticated knowledge while preserving trust, provenance, and scholarly traceability.