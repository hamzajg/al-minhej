---
id: APDK-000
title: AlMinhej AI Product Development Kit (APDK)
version: 1.0.0
status: Stable
owner: Product Architecture
type: Foundation
---

# AlMinhej AI Product Development Kit (APDK)

## Purpose

This repository is the single source of truth for the design, architecture, product vision and implementation workflow of the AlMinhej platform.

It is intended to be consumed by both human contributors and AI coding agents.

This repository does **not** contain production source code.

Production code is implemented in separate repositories using the documents and prompts contained here.

---

# Project Vision

AlMinhej is an AI-native knowledge platform dedicated to the digital preservation, indexing, mapping and projection of authentic Islamic knowledge.

Unlike traditional digital libraries, AlMinhej does not simply display books.

Its primary objective is to transform authentic Islamic literature into a structured, interconnected knowledge graph while always preserving the original source material.

The platform enables users to:

- Read authentic Islamic books.
- Understand difficult texts.
- Explore relationships between concepts.
- Navigate scholars, narrators and historical events.
- Discover related verses, hadiths and references.
- Learn through contextual knowledge rather than isolated documents.

---

# Primary Objectives

The platform has four primary objectives.

## 1. Preserve

Digitize authentic Islamic literature while preserving:

- Original Arabic text
- Book hierarchy
- Editions
- Manuscripts
- Riwayat
- Pagination
- Editorial verification

Nothing replaces the original source.

---

## 2. Index

Convert books into structured knowledge.

Examples include:

- Books
- Chapters
- Pages
- Paragraphs
- Hadith
- Quran verses
- Narrators
- Scholars
- Places
- Historical events
- Concepts
- Arabic vocabulary
- References

Everything becomes searchable.

---

## 3. Connect

Build explicit relationships between knowledge.

Examples:

- Hadith → Narrator
- Hadith → Quran
- Hadith → Historical Event
- Scholar → Commentary
- Concept → Related Concepts
- Book → Other Books
- Page → Sources

Relationships are first-class citizens.

---

## 4. Project

Present knowledge differently depending on the audience.

Examples:

- Beginner learning
- Research
- Reading mode
- Knowledge graph
- AI assistant
- Timeline
- Comparative editions

The knowledge remains the same.

Only the projection changes.

---

# Products

The AlMinhej ecosystem consists of multiple products.

## Knowledge Studio

Back-office application.

Used by:

- Editors
- Researchers
- Knowledge engineers
- Translators
- Reviewers

Responsibilities:

- Digitization
- Indexing
- Knowledge mapping
- Validation
- AI-assisted linking
- Review workflow

---

## Knowledge Workspace

User application.

Used by:

- Readers
- Students
- Teachers
- Researchers

Responsibilities:

- Reading
- Understanding
- Exploration
- Personalized learning
- AI guidance

---

## Shared Backend

Shared services powering both applications.

Responsibilities:

- REST APIs
- Knowledge Engine
- Search
- Authentication
- AI Services
- Storage

---

# Repository Structure

```
apdk/

.ai/
knowledge-model/
prompts/
roadmap/
templates/
ux/
validation/

README.md
CHANGELOG.md
LICENSE
```

---

# Repository Philosophy

The repository exists to answer four questions.

## Why are we building this?

Product Vision

---

## What are we building?

Product Specifications

---

## How should it be built?

Architecture and Engineering

---

## What should be built next?

Iteration Roadmap

---

# Development Principles

The project follows these principles.

## Source First

The original authenticated text is always preserved.

AI never replaces the source.

---

## Knowledge First

The platform models knowledge.

It does not model lessons.

Learning experiences are generated from knowledge.

---

## Relationships First

Every piece of knowledge exists within a network of relationships.

Relationships are core domain objects.

---

## AI Assisted

AI assists.

Humans validate.

AI never publishes knowledge automatically.

---

## Iterative Development

Every iteration produces working software.

No iteration exists only as documentation.

---

## Vertical Slices

Every implementation should complete one workflow from start to finish.

Avoid partially implemented features.

---

# AI Development Workflow

Every AI coding agent follows the same workflow.

```
Read Foundation Documents

↓

Read Current Iteration

↓

Implement Only Requested Scope

↓

Self Review

↓

Human Review

↓

Merge

↓

Next Iteration
```

---

# Foundation Documents

These documents rarely change.

- NORTH_STAR.md
- CONTEXT.md
- PRODUCT.md
- CORE_DOMAIN.md
- ARCHITECTURE.md
- ENGINEERING.md
- DESIGN_LANGUAGE.md

---

# Execution Documents

These documents evolve during development.

- ITERATIONS.md
- MASTER.md
- ITERATION-XX.md
- REVIEW.md

---

# Reference Documents

Supporting documentation.

- Domain model
- UX specifications
- Templates
- ADRs
- Validation documents

---

# Product Scope

The initial MVP focuses on one authentic work.

Al-Arba'in al-Nawawiyyah.

The platform architecture must support future expansion to:

- Sahih al-Bukhari
- Sahih Muslim
- Sunan collections
- Tafsir
- Aqidah
- Fiqh
- Arabic language sciences
- Usul al-Hadith
- Usul al-Fiqh
- Other Islamic sciences

without architectural redesign.

---

# Technology Principles

Implementation repositories should use modern, strongly typed technologies.

Current target stack:

Frontend

- React
- TypeScript
- Vite
- TailwindCSS

Backend

- Spring Boot
- Kotlin
- REST APIs

Storage

Development

- JSON
- In-memory repositories

Production

- MongoDB

Future integrations may include:

- Firebase
- Vector databases
- Search engines

These technologies are implementation details and must not influence the domain model.

---

# Definition of Done

An iteration is complete only if:

- The application builds successfully.
- The application runs successfully.
- Acceptance criteria are satisfied.
- Existing functionality remains operational.
- Documentation is updated where required.
- Code passes quality checks.

---

# Versioning

The APDK follows semantic versioning.

Major versions represent architectural changes.

Minor versions introduce new capabilities.

Patch versions correct or clarify existing documentation.

---

# Target Audience

This repository is intended for:

- Product Owners
- Software Architects
- Frontend Developers
- Backend Developers
- UX Designers
- AI Coding Agents
- Reviewers
- Contributors

---

# Contributing

Changes to Foundation documents require architectural review.

Changes to iteration documents occur during normal development.

All implementation work must reference an approved iteration document.

---

# Repository Status

Current Status

Version: 1.0.0

State: Active

Development Model: AI-Native Incremental Delivery

License: Apache 2.0