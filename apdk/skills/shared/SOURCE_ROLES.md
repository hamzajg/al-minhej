---
title: Source Roles
version: 1.0.0
status: Stable
scope: Global
appliesTo: All APDK Skills
---

# Source Roles

## Purpose

This document defines the allowed roles that a knowledge provider may perform within the APDK ecosystem.

A provider is never globally trusted.

A provider is approved only for specific roles.

Example:

A provider may be approved for:

- Quran text retrieval

but not approved for:

- Tafsir retrieval

or:

- Hadith grading

---

# Core Principle

Trust is capability-specific.

The APDK evaluates:

Source + Role

not:

Source alone.

---

# Role Categories

---

# 1. canonical_text

## Purpose

Retrieval of original primary texts.

Examples:

- Quran Arabic text
- Hadith Arabic text
- Classical book original text

Requirements:

- verified edition
- stable identifiers
- provenance metadata
- no modification

Allowed operations:

- retrieve
- display
- index

Forbidden:

- generate
- normalize
- rewrite

---

# 2. meaning_translation

## Purpose

Retrieve published human translations.

Examples:

- Quran meaning translations
- Hadith translations
- Classical work translations

Requirements:

- translator attribution
- language metadata
- publication information

Forbidden:

- AI-generated translation presented as official

---

# 3. digital_library

## Purpose

Provide access to digitized Islamic works.

Examples:

- scanned books
- OCR text
- PDF editions

Requirements:

- work identification
- edition metadata
- publisher information

---

# 4. manuscript_archive

## Purpose

Provide access to manuscript images and metadata.

Requirements:

- library identification
- manuscript identifier
- folio information
- catalog reference

---

# 5. metadata

## Purpose

Provide structured information about works.

Examples:

- author
- book information
- edition
- publication details

Metadata providers do not replace original texts.

---

# 6. search_index

## Purpose

Provide search capabilities.

Examples:

- keyword search
- full-text search
- indexing

Search results must always link back to the original source.

---

# 7. hadith_takhrij

## Purpose

Provide hadith research information.

Examples:

- source locations
- references
- chains
- grading information

Requirements:

- scholar attribution
- reference documentation

---

# 8. hadith_grading

## Purpose

Provide documented hadith authentication information.

Examples:

- Sahih
- Hasan
- Daif
- Mawdu'

Requirements:

Must include:

- scholar
- source
- methodology reference

The system must never infer grading.

---

# 9. narrator_biography

## Purpose

Provide narrator information.

Examples:

- birth
- death
- teachers
- students
- jarh and ta'dil

Requirements:

- biographical source
- scholar attribution

---

# 10. qiraat_reference

## Purpose

Provide Quranic recitation science references.

Examples:

- Shatibiyyah
- Durrah
- Tayyibat al-Nashr
- An-Nashr

Requirements:

- edition
- author
- commentary source

---

# 11. tafsir_reference

## Purpose

Provide Tafsir works.

Examples:

- Al-Tabari
- Ibn Kathir
- Al-Qurtubi
- Ibn Ashur

Requirements:

- author
- edition
- volume
- page

---

# 12. fiqh_reference

## Purpose

Provide jurisprudence works.

Examples:

- Madhhab texts
- commentaries
- legal encyclopedias

Requirements:

- author
- school
- edition

---

# 13. language_reference

## Purpose

Provide Arabic language resources.

Examples:

- dictionaries
- grammar books
- morphology books

Includes:

- Lisan al-Arab
- Taj al-Arus
- Maqayis al-Lughah
- classical grammar works

---

# 14. audio

## Purpose

Provide authenticated audio recordings.

Examples:

- Quran recitations
- Hadith readings
- scholarly lectures

Requirements:

- reciter/speaker
- recording metadata

---

# 15. image

## Purpose

Provide visual assets.

Examples:

- manuscript images
- Mushaf pages
- book scans

Requirements:

- ownership
- source
- identifier

---

# 16. educational_material

## Purpose

Provide structured learning resources.

Examples:

- courses
- lessons
- educational content

Must not replace primary sources.

---

# Provider Capability Declaration

Every provider registry file must declare:

Example:

```yaml
id: tanzil

roles:

  - canonical_text

domains:

  - quran

languages:

  - arabic

trustLevel: 3
```

---

Example:

```yaml
id: dorar

roles:

  - hadith_takhrij
  - hadith_grading
  - metadata

domains:

  - hadith

trustLevel: 2
```

---

Example:

```yaml
id: shamela

roles:

  - digital_library
  - search_index

domains:

  - quran
  - hadith
  - tafsir
  - fiqh
  - arabic_language

trustLevel: 3
```

---

# Skill Provider Selection

Skills must request providers by role.

Example:

Incorrect:

```
Find Quran source
```

Correct:

```
Find provider:

domain: Quran

role: canonical_text
```

---

# Conflict Resolution

If multiple providers provide the same role:

Priority order:

1. Official institutional source
2. Verified scholarly source
3. Community verified source
4. Research source

The selected provider must always be recorded.

---

# Prohibited Usage

A provider must not be used outside its approved roles.

Examples:

Tanzil:

Allowed:

- Quran Arabic retrieval

Not allowed:

- Tafsir retrieval

Dorar:

Allowed:

- Hadith metadata

Not allowed:

- replacing original hadith editions

Sunnah.com:

Allowed:

- English hadith access

Not allowed:

- acting as the canonical publication source

---

# Design Philosophy

The APDK does not ask:

"Is this website trusted?"

It asks:

"What role is this source trusted to perform?"

This distinction allows a large ecosystem of Islamic digital resources to work together while preserving scholarly accuracy and provenance.