---
title: Source Policy
version: 1.0.0
status: Stable
scope: Global
appliesTo: All APDK Skills
---

# Source Policy

## Purpose

This document defines the governance rules for every knowledge source used by the APDK ecosystem.

Its objective is to ensure that all retrieved Islamic knowledge is:

- authentic
- attributable
- reproducible
- verifiable
- traceable

Every retrieval skill MUST comply with this policy.

---

# Guiding Principles

## Retrieval Before Generation

Primary and secondary Islamic knowledge shall always be retrieved from approved sources.

AI must never replace an authenticated source.

---

## Provenance

Every retrieved object shall include sufficient metadata to identify:

- original work
- author
- editor
- publisher
- edition
- provider
- retrieval date
- version

---

## Multiple Sources

The APDK supports multiple providers.

Different providers may distribute the same work.

The work and the provider are distinct concepts.

Example

Work:

Sahih al-Bukhari

Provider:

Shamela

or

Archive.org

or

publisher digital library

---

# Source Classification

Every source belongs to one of the following categories.

---

## Category A

Primary Religious Sources

Examples

- Quran
- Canonical Hadith collections

Highest verification requirements.

---

## Category B

Classical Scholarly Literature

Examples

- Tafsir
- Fiqh
- Aqidah
- Usul
- Arabic Language Sciences
- Seerah
- History

---

## Category C

Reference Works

Examples

- Dictionaries
- Biographical dictionaries
- Bibliographies
- Manuscript catalogues

---

## Category D

Digital Libraries

Repositories that preserve or distribute works.

Examples

- Shamela
- Waqfeya
- Internet Archive
- Maktaba collections

---

## Category E

Metadata Providers

Examples

- Dorar
- Quran APIs
- Search indexes

These services facilitate discovery.

They are not necessarily authoritative for the underlying texts.

---

## Category F

Institutional Publishers

Examples

- King Fahd Complex
- Al-Azhar publications
- University research repositories

---

# Trust Levels

Every provider receives a trust classification.

## Level 1

Canonical

Original verified source.

Highest confidence.

---

## Level 2

Official Institutional

Maintained by recognized institutions.

---

## Level 3

Community Verified

Open projects with transparent review processes.

---

## Level 4

Research

Useful for academic work.

Requires source verification.

---

## Level 5

Experimental

Never used in production.

---

# Provider Requirements

Every provider should document:

- provider name
- organization
- website
- license
- dataset version
- update frequency
- supported collections
- supported languages
- API availability
- checksum strategy

---

# Approved Quran Providers

Examples include:

## Tanzil Project

Role

Verified digital Quran text.

Common uses

- Arabic text
- Uthmani script
- verse indexing

---

## King Fahd Complex

Role

Official Mushaf publication.

Common uses

- reference editions
- publication metadata

---

## QuranEnc (King Fahd Global Center)

Role

Published translations of the meanings of the Qur'an in many languages, with translator attribution and licensing.

Common uses

- approved meaning translations
- multilingual retrieval

---

## Local Verified Mirror

Role

Offline deployment.

Must preserve provenance.

---

# Approved Hadith Providers

Examples include:

## Shamela

Role

Digital Islamic library.

Provides access to numerous authenticated editions.

---

## Dorar

Role

Research and indexing.

Provides:

- takhrij
- grading metadata
- references

Original text should still identify its published edition.

---

## Sunnah.com

Role

Distribution platform.

Useful for multilingual access and referencing.

Edition metadata should always be preserved.

---

## Local Verified Mirror

Offline deployment.

---

# Approved Classical Library Providers

Examples include:

- Shamela
- Waqfeya
- Al-Maktaba Al-Shamela releases
- Publisher repositories
- University digital collections

---

# Source Registration

Every new provider must define:

Name

Category

Trust Level

Website

License

Maintainer

Supported Works

Supported Languages

Checksum Strategy

Versioning Policy

Approval Status

Review Date

---

# Provider Independence

Skills must not depend on a single provider.

The provider implementation should remain replaceable.

---

# Provenance Requirements

Every retrieved object should retain:

Provider

Original Work

Edition

Publisher

Volume

Page

Version

License

Retrieval Timestamp

Verification Status

---

# Versioning

Multiple editions may coexist.

The platform must never silently replace:

- editions
- publishers
- revisions

Users should be able to choose preferred editions when supported.

---

# Deprecation

A provider may be deprecated when:

- authenticity becomes questionable
- licensing changes
- maintenance ceases
- corruption is detected
- community review fails

Deprecated providers remain documented for historical reproducibility.

---

# Governance

Adding a new provider requires documented review.

The review should evaluate:

- authenticity
- scholarly acceptance
- institutional reputation
- licensing
- reproducibility
- maintenance
- community adoption

Approval should be documented before the provider becomes available in production.

---

# Design Philosophy

The APDK separates:

- the original work
- the published edition
- the digital provider

This distinction preserves scholarly accuracy while allowing multiple distribution channels to coexist.

The platform remains independent of any single website or API and can evolve as new trusted digital libraries emerge.