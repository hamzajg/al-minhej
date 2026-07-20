---
name: Quran Text Retrieval
description: Retrieve the original Arabic Quran text from authenticated community-trusted digital library sources without modification, generation, completion, or interpretation.
version: 1.0.0
category: Quran
author: APDK
license: Apache-2.0
maturity: Stable
---

# Quran Text Retrieval

## Purpose

This skill retrieves the original Arabic text of the Noble Quran from authenticated digital library sources.

The skill is responsible only for retrieving canonical Quran text.

It MUST NOT:

- generate Quran text
- autocomplete verses
- reconstruct missing text
- paraphrase verses
- normalize wording
- simplify spelling
- modernize orthography
- translate
- interpret
- summarize
- explain
- compare readings

Those responsibilities belong to dedicated skills.

---

# Guiding Principles

## Authenticity First

The Quran is the primary source of Islam.

Every retrieved verse must originate from an authenticated source.

AI is never considered a source of Quranic text.

---

## Retrieval Only

The skill retrieves existing verified content.

It never creates new content.

---

## Preserve Originality

The retrieved text must remain identical to the source.

No modification is permitted.

This includes:

- punctuation
- harakat
- Unicode normalization
- ligatures
- spelling
- symbols
- ayah markers

unless explicitly requested through another specialized processing skill.

---

## Traceability

Every response must identify exactly where the text originated.

The consumer must always be able to verify the source independently.

---

# Scope

This skill is responsible for:

- retrieving complete surahs
- retrieving individual ayat
- retrieving ayah ranges
- retrieving Juz'
- retrieving Hizb
- retrieving Rub'
- retrieving page references (when available)
- retrieving metadata
- retrieving source information

The skill does not provide:

- translations
- tafsir
- tajweed
- qira'at
- audio
- grammar
- vocabulary
- explanations

---

# Supported Sources

Only authenticated and trusted community sources may be used.

Examples include:

- Tanzil Project
- King Fahd Complex for the Printing of the Holy Quran
- Verified Uthmani Mushaf datasets
- Community-reviewed offline Quran databases
- Future approved institutional repositories

The implementation should allow multiple providers.

Providers must be configurable.

---

# Source Priority

The application configuration determines the preferred provider.

Example

1. Local verified database
2. Local offline mirror
3. Remote authenticated API
4. Backup provider

The skill itself must remain provider independent.

---

# Source Metadata

Every provider should expose:

- provider name
- dataset version
- script type
- publication date
- edition
- verification status
- license
- checksum (when available)

---

# Supported Script Types

Examples include:

- Uthmani Script
- Uthmani Minimal
- Simple Arabic

The requested script must exist within the provider.

The skill must never convert between scripts.

---

# Retrieval Capabilities

Supported requests include:

## Retrieve by Surah and Ayah

Example

Surah 2

Ayah 255

---

## Retrieve Ayah Range

Example

Surah 18

Ayah 1–10

---

## Retrieve Complete Surah

Example

Surah Al-Fatihah

---

## Retrieve Complete Juz'

---

## Retrieve Complete Hizb

---

## Retrieve Complete Rub'

---

## Retrieve by Page

When supported by the selected provider.

---

# Validation Rules

Before returning data the skill must verify:

- Surah exists
- Ayah exists
- Requested range is valid
- Provider returned authenticated data
- Metadata is complete

---

# Output Requirements

Every response must include:

- Arabic text
- Surah number
- Surah name
- Ayah number
- Provider
- Dataset version
- Script type
- Retrieval timestamp

Whenever available also include:

- Hizb
- Juz'
- Rub'
- Page
- Revelation type
- Makki/Madani

---

# Output Contract

Example

{
  "surah": 1,
  "surahNameArabic": "الفاتحة",
  "surahNameEnglish": "Al-Fatihah",
  "ayah": 1,
  "text": "...",
  "provider": "...",
  "datasetVersion": "...",
  "script": "...",
  "verified": true,
  "license": "...",
  "retrievedAt": "...",
  "checksum": "..."
}

---

# Error Handling

Possible errors include:

- Surah not found
- Ayah not found
- Invalid range
- Provider unavailable
- Provider returned invalid data
- Verification failed
- Unsupported script

The skill must never silently substitute data from another provider without recording the source.

---

# Security Rules

The skill must never:

- hallucinate verses
- guess missing text
- merge verses
- merge providers
- rewrite spelling
- remove harakat
- insert harakat
- normalize Unicode unless configured
- repair corrupted text using AI

If verification fails, retrieval must fail.

---

# AI Restrictions

The language model must never answer Quran retrieval requests from its internal knowledge.

All Quran text displayed to the user must originate from an authenticated provider.

If no authenticated source is available, the skill must report that retrieval failed.

It must never fabricate or approximate the requested verse.

---

# Performance Guidelines

Preferred retrieval order:

1. Local cache
2. Local verified database
3. Offline mirror
4. Remote provider

Providers should support caching while preserving provenance metadata.

---

# Examples

## Retrieve a Single Ayah

Input

Surah: 112

Ayah: 1

Output

Authenticated Arabic text with complete metadata.

---

## Retrieve a Range

Input

Surah: 18

Ayah: 1-10

Output

Authenticated ayah collection.

---

## Retrieve Entire Surah

Input

Surah: Al-Mulk

Output

Complete authenticated surah.

---

# Dependencies

None.

This is a foundational skill.

Higher-level skills depend on this skill, including:

- Quran Translation Retrieval
- Quran Qira'at Retrieval
- Quran Audio Retrieval
- Tafsir Retrieval
- Asbab al-Nuzul Retrieval
- Tajweed Analysis
- Vocabulary Analysis
- Grammar Analysis
- Cross Reference Engine
- Memorization Assistant
- Quran Knowledge Graph

---

# Non-Goals

This skill intentionally does not:

- explain verses
- compare qira'at
- provide tafsir
- perform semantic search
- classify themes
- generate educational content
- teach tajweed

Dedicated skills provide those capabilities.

---

# Design Philosophy

This skill is the root of trust for all Quran-related capabilities within the APDK ecosystem.

Every higher-level Quran skill must retrieve the canonical Arabic text through this skill rather than accessing external sources directly.

This architecture ensures:

- a single verification pipeline
- consistent provenance
- centralized source management
- reproducible retrieval
- auditable outputs
- protection against AI-generated scripture

The integrity of the Quranic text takes precedence over availability, convenience, or performance.