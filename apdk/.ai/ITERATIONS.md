---
id: APDK-008
title: ITERATIONS
version: 1.0.0
status: Living
type: Foundation
owner: Product Architecture
depends_on:
  - NORTH_STAR.md
  - PRODUCT.md
  - CORE_DOMAIN.md
  - ARCHITECTURE.md
  - ENGINEERING.md
  - DESIGN_LANGUAGE.md
---

# ITERATIONS

## Purpose

This document defines the implementation roadmap of the AlMinhej platform.

The roadmap is divided into incremental iterations.

Each iteration must produce a usable, demonstrable and testable piece of software.

No iteration exists solely to prepare for future work.

---

# Development Philosophy

Every iteration must satisfy five rules.

## Rule 1

Produce working software.

---

## Rule 2

Deliver one complete business capability.

---

## Rule 3

Do not redesign previous iterations.

---

## Rule 4

Every iteration builds upon the previous one.

---

## Rule 5

Every iteration ends with a demonstration.

---

# Definition of a Vertical Slice

A vertical slice includes everything required for one capability.

Example

```
UI

↓

Application Logic

↓

API

↓

Persistence

↓

Validation

↓

Tests
```

Partial implementations are not considered complete.

---

# MVP Goal

The MVP validates the complete workflow of building structured knowledge from an authentic Islamic book.

The initial scope is intentionally small.

Book

Al-Arba'in al-Nawawiyyah

Knowledge Scope

First Hadith

User

Knowledge Editor

The objective is validating the workflow, not the amount of content.

---

# Phase 1

## Foundation

Goal

Create the technical foundation.

Deliverables

- React
- TypeScript
- Vite
- TailwindCSS
- Theme System
- Routing
- Layout
- Mock Repository
- Shared Components

Success

Application starts successfully.

No business functionality yet.

---

# Phase 2

## Bibliographic Foundation

Goal

Represent authentic books.

Deliverables

- Collections
- Works
- Editions
- Volumes
- Pages
- Navigation
- Metadata

Success

Editors can browse authentic books.

---

# Phase 3

## Page Workspace

Goal

Create page editing experience.

Deliverables

- Page Viewer
- Arabic Text
- Metadata
- Inspector
- Page Properties

Success

Editors can navigate and inspect pages.

---

# Phase 4

## Knowledge Fragment Editor

Goal

Transform pages into structured knowledge.

Deliverables

- Knowledge Fragments
- Fragment Types
- Selection Tools
- Fragment Inspector
- Validation

Success

Editors can identify meaningful knowledge units.

---

# Phase 5

## Entity Management

Goal

Build reusable entities.

Deliverables

- Scholars
- Narrators
- Places
- Concepts
- Organizations
- Historical Events

Success

Entities become reusable across books.

---

# Phase 6

## Relationship Management

Goal

Connect knowledge.

Deliverables

- Relationship Types
- Relationship Editor
- Relationship Validation
- Relationship Inspector

Success

Knowledge becomes interconnected.

---

# Phase 7

## Graph Visualization

Goal

Visualize the knowledge network.

Deliverables

- Interactive Graph
- Expand
- Collapse
- Highlight
- Filtering
- Navigation

Success

Relationships become visually explorable.

---

# Phase 8

## AI Assistance

Goal

Accelerate knowledge engineering.

Deliverables

- Entity Detection
- Relationship Suggestions
- Duplicate Detection
- Missing Link Suggestions
- Confidence Indicators

Success

Editors review AI suggestions before approval.

---

# Phase 9

## Review Workflow

Goal

Validate knowledge.

Deliverables

- Draft
- Review
- Approve
- Reject
- History

Success

Knowledge passes through structured review.

---

# Phase 10

## Publication

Goal

Publish validated knowledge.

Deliverables

- Published State
- Version History
- Audit Trail

Success

Knowledge becomes available to consumers.

---

# Phase 11

## Knowledge Workspace

Goal

Deliver reader experience.

Deliverables

- Reading Mode
- Context Panel
- Knowledge Navigation
- Related Resources

Success

Readers experience contextual learning.

---

# Phase 12

## Learning Projection

Goal

Generate guided learning experiences.

Deliverables

- Reading Journey
- Topic Navigation
- Guided Exploration
- Personal Progress

Success

Learning emerges from knowledge.

---

# Phase 13

## Bibliographic Comparison

Goal

Support scholarly comparison.

Deliverables

- Riwayat
- Manuscripts
- Critical Editions
- Publishers
- Printings
- Comparison View

Success

Editors compare authentic textual traditions.

---

# Phase 14

## Research Workspace

Goal

Support advanced research.

Deliverables

- Advanced Search
- Citation Explorer
- Timeline
- Relationship Analytics
- Knowledge Coverage

Success

Researchers navigate complex knowledge efficiently.

---

# Phase 15

## Production MVP

Goal

Prepare production release.

Deliverables

- Authentication
- Authorization
- Performance
- Accessibility
- Documentation
- Deployment

Success

First production-ready MVP.

---

# Iteration Workflow

Every implementation follows the same lifecycle.

```
Planning

↓

Implementation

↓

Self Review

↓

Human Review

↓

Revision

↓

Acceptance

↓

Merge

↓

Demo

↓

Next Iteration
```

---

# Deliverable Rules

Every iteration must produce

- Running application
- Updated documentation
- Passing tests
- Demo scenario
- Review checklist

---

# Acceptance Criteria

Every iteration must satisfy

- Functional requirements
- UI requirements
- Accessibility
- Responsiveness
- Code quality
- Documentation updates

---

# Out of Scope Rule

Anything not explicitly listed in the current iteration is out of scope.

AI coding agents must never implement additional features.

---

# Iteration Freeze

Once accepted

- APIs become stable
- UX becomes stable
- Domain models become stable

Changes require a future iteration.

---

# AI Agent Rules

For every iteration the AI agent must

1. Read FOUNDATION documents.
2. Read current iteration prompt.
3. Review existing code.
4. List assumptions.
5. Implement only requested scope.
6. Perform self-review.
7. Report completed deliverables.
8. Report remaining work.
9. Stop.

---

# Human Review

Every completed iteration is reviewed against

- Product Vision
- Domain Integrity
- UX Consistency
- Architecture
- Engineering Standards
- Acceptance Criteria

Only then may the next iteration begin.

---

# Roadmap Evolution

This document is a living roadmap.

Iterations may be split or merged as the project evolves.

However

The Product Vision

The Core Domain

The Architecture

must remain stable.

---

Status

Living