---
title: APDK Metadata Schema
version: 1.0.0
status: Stable
scope: Global
appliesTo: All APDK Skills
---

# Metadata Schema

## Purpose

This document defines the standard metadata model used by all APDK skills.

The purpose is to ensure:

- consistent terminology
- reliable provenance
- interoperability
- accurate attribution
- reproducible retrieval

---

# Core Principle

Metadata is part of knowledge.

A retrieved object without metadata is incomplete.

---

# Metadata Categories

APDK metadata is divided into:

```
Identity

↓

Source

↓

Publication

↓

Content

↓

Verification

↓

Technical
```

---

# 1. Identity Metadata

Defines the object itself.

---

## identifier

Unique identifier.

Example:

```
quran:2:255
```

---

## title

Human-readable title.

Examples:

```
Sahih al-Bukhari

Tafsir Ibn Kathir
```

---

## type

Resource type.

Examples:

```
quran_ayah

hadith

book

translation

manuscript
```

---

## domain

Knowledge domain.

Examples:

```
quran

hadith

fiqh

arabic_language
```

---

# 2. Source Metadata

Defines where information came from.

---

## provider

Digital provider.

Examples:

```
Tanzil

Shamela

Dorar
```

---

## sourceRole

Role assigned according to:

```
SOURCE_ROLES.md
```

Examples:

```
canonical_text

digital_library

hadith_takhrij
```

---

## sourceIdentifier

Provider-specific identifier.

Example:

```
dataset-id-12345
```

---

## sourceUrl

Original location when applicable.

---

# 3. Work Metadata

Defines the original intellectual work.

---

## workTitle

Name of original work.

Examples:

```
صحيح البخاري

الموافقات
```

---

## author

Author of the work.

Example:

```
Muhammad ibn Ismail al-Bukhari
```

---

## authorArabic

Arabic author name.

---

## deathYear

Author death year when known.

---

## editor

Editor of edition.

---

## translator

Translator name.

---

# 4. Publication Metadata

Defines the published edition.

---

## publisher

Publishing organization.

---

## edition

Edition identifier.

Example:

```
3rd edition
```

---

## publicationYear

Publication year.

---

## publicationPlace

Publishing location.

---

## volume

Volume number.

---

## page

Page number.

---

## chapter

Chapter identifier.

---

# 5. Quran Specific Metadata

Used by Quran-related skills.

---

## surahNumber

Numeric surah identifier.

---

## surahNameArabic

Arabic surah name.

---

## surahName

Localized surah name.

---

## ayahNumber

Verse number.

---

## juz

Juz number.

---

## hizb

Hizb number.

---

## rub

Rub identifier.

---

## scriptType

Examples:

```
Uthmani

Simple

Indopak
```

---

## qiraah

Qira'ah identifier.

Examples:

```
Hafs

Warsh

Qalun
```

---

## riwayah

Narration identifier.

---

## tariq

Transmission path.

---

# 6. Hadith Specific Metadata

---

## collection

Hadith collection.

Examples:

```
Sahih al-Bukhari

Sahih Muslim
```

---

## bookNumber

Collection book identifier.

---

## chapterNumber

Chapter identifier.

---

## hadithNumber

Hadith numbering.

---

## narrator

Primary narrator.

---

## chain

Isnad information.

---

# 7. Language Metadata

---

## language

Content language.

ISO format preferred.

Example:

```
ar

en

fr
```

---

## script

Writing system.

Examples:

```
Arabic

Latin
```

---

# 8. Licensing Metadata

---

## license

Usage license.

---

## copyright

Copyright information.

---

## attributionRequired

Boolean.

---

# 9. Verification Metadata

---

## verified

Boolean.

---

## verificationLevel

Values:

```
0 Unknown

1 Source Verified

2 Metadata Verified

3 Content Verified

4 Cryptographically Verified

5 Institution Verified
```

---

## verificationMethod

Examples:

```
checksum

institution_reference

dataset_comparison
```

---

## checksum

Integrity hash.

---

## hashAlgorithm

Example:

```
SHA-256
```

---

# 10. Technical Metadata

---

## datasetVersion

Dataset release version.

---

## retrievedAt

Retrieval timestamp.

---

## updatedAt

Source update timestamp.

---

## format

Examples:

```
JSON

XML

PDF

IMAGE
```

---

## encoding

Examples:

```
UTF-8
```

---

# Required Metadata by Domain

## Quran Text

Required:

```
provider

sourceRole

surahNumber

ayahNumber

scriptType

verificationLevel
```

---

## Quran Translation

Required:

```
translator

language

provider

sourceRole

edition
```

---

## Hadith

Required:

```
collection

hadithNumber

provider

edition

verificationLevel
```

---

## Classical Books

Required:

```
workTitle

author

edition

publisher

volume
```

---

# Metadata Rules

## Preserve Original Names

Arabic names should be preserved.

Translations may be added but must not replace originals.

---

## No Loss During Transformation

Any conversion must preserve original metadata.

---

## Unknown Values

Unknown fields should be:

```
null
```

or

```
unknown
```

Never guessed.

---

# Metadata Validation

Before publication:

Validate:

- required fields exist
- identifiers are valid
- source is approved
- provenance exists

---

# Design Philosophy

Metadata is the bridge between digital technology and scholarly tradition.

The APDK does not only store texts.

It preserves:

- who wrote them
- who published them
- where they came from
- how they were verified
- how they can be found again