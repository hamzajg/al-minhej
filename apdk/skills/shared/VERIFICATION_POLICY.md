---
title: Verification Policy
version: 1.0.0
status: Stable
scope: Global
appliesTo: All APDK Skills
---

# Verification Policy

## Purpose

This document defines the verification requirements applied to all knowledge retrieved by the APDK ecosystem.

The purpose is to ensure that retrieved information is:

- authentic
- unchanged
- attributable
- reproducible
- traceable

---

# Core Principle

A retrieved object is not considered valid unless its origin and integrity can be verified.

Availability must never override authenticity.

If verification fails:

The system must fail safely.

---

# Verification Layers

APDK verification operates through multiple layers.

```
Source Verification

        ↓

Content Verification

        ↓

Metadata Verification

        ↓

Integrity Verification

        ↓

Provenance Verification
```

---

# Layer 1 — Source Verification

## Purpose

Verify that the provider is approved for the requested role.

Example:

Request:

```
domain: Quran

role: canonical_text
```

The system verifies:

- provider exists
- provider is approved
- provider supports Quran
- provider supports canonical_text role

---

Failure example:

A translation website cannot be used as a Quran Arabic source.

---

# Layer 2 — Content Verification

## Purpose

Verify the retrieved content matches the expected source.

Examples:

Quran:

- Surah identifier
- Ayah identifier
- Arabic text
- Script type

Hadith:

- Collection
- Book
- Chapter
- Hadith number
- Arabic text

Books:

- Title
- Author
- Edition
- Volume
- Page

---

# Layer 3 — Metadata Verification

Every retrieved object should validate available metadata.

Required metadata:

- source provider
- original work
- author
- edition
- version
- license
- retrieval timestamp

---

Additional metadata depends on domain.

Examples:

Quran:

- Surah
- Ayah
- Juz'
- Script

Hadith:

- Collection
- Narrator
- Chain reference

Book:

- Volume
- Page

---

# Layer 4 — Integrity Verification

## Purpose

Ensure content was not modified after retrieval.

Supported mechanisms:

- checksum
- cryptographic hash
- digital signature
- dataset version
- provider version

---

Example:

```json
{
 "hashAlgorithm": "SHA-256",
 "checksum": "...",
 "verified": true
}
```

---

# Layer 5 — Provenance Verification

Every output must preserve its origin.

Minimum provenance:

```json
{
 "provider": "...",
 "source": "...",
 "edition": "...",
 "retrievedAt": "...",
 "verified": true
}
```

---

# Verification Levels

## Level 0 — Unknown

No verification.

Never used in production.

---

## Level 1 — Source Verified

Provider is approved.

Content integrity not confirmed.

---

## Level 2 — Metadata Verified

Source and metadata verified.

---

## Level 3 — Content Verified

Content matches approved dataset.

---

## Level 4 — Cryptographically Verified

Content integrity verified using checksum/signature.

---

## Level 5 — Institution Verified

Verified against official institutional publication.

---

# Domain Verification Requirements

---

# Quran

Minimum:

Level 3

Recommended:

Level 4+

Required:

- approved source
- surah identifier
- ayah identifier
- script identifier
- text verification

Never accepted:

- AI generated text
- unverified copy/paste text

---

# Quran Qira'at

Minimum:

Level 3

Required:

- Imam of Qira'ah
- Rawi
- Tariq
- Reference work
- Edition

Examples:

- Al-Shatibiyyah
- Al-Durrah
- Tayyibat al-Nashr

---

# Hadith

Minimum:

Level 3

Required:

- collection
- book
- chapter
- hadith number
- edition
- source

Additional:

- takhrij
- grading source

---

# Classical Books

Minimum:

Level 2

Recommended:

Level 3+

Required:

- title
- author
- edition
- publisher

---

# Translation

Minimum:

Level 2

Required:

- translator
- language
- edition
- publisher

---

# Verification Failure Rules

If verification fails:

The system must:

1. Stop automatic publication.
2. Mark the object as unverified.
3. Record the failure reason.
4. Notify the requesting process.

---

# Forbidden Actions After Failure

The system must never:

- repair the text using AI
- select random alternatives
- remove provenance information
- hide verification failures
- present uncertain content as authentic

---

# Human Review

Certain content requires human review before production use.

Examples:

- new Quran datasets
- new Qira'at references
- manuscript transcriptions
- scholarly classifications
- disputed historical material

---

# Verification Cache

Verified results may be cached.

The cache must preserve:

- original verification status
- source version
- checksum
- retrieval timestamp

A cached object cannot lose its provenance.

---

# Audit Log

Every verification event should record:

```
verificationId

timestamp

provider

resource

skill

result

verificationLevel

errors
```

---

# Design Philosophy

The APDK considers verification part of the knowledge itself.

A text without provenance is incomplete knowledge.

The platform prioritizes:

1. Authenticity
2. Traceability
3. Reproducibility
4. Availability

in that order.