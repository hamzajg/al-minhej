---
id: APDK-006
title: ENGINEERING
version: 1.0.0
status: Stable
type: Foundation
owner: Product Architecture
depends_on:
  - NORTH_STAR.md
  - PRODUCT.md
  - CORE_DOMAIN.md
  - ARCHITECTURE.md
---

# ENGINEERING

## Purpose

This document defines the engineering standards used across every AlMinhej implementation repository.

It is intended for both human developers and AI coding agents.

It specifies *how software is built*, not *what software does*.

---

# Engineering Principles

Every implementation must follow these principles.

1. Build vertical slices.
2. Deliver working software every iteration.
3. Preserve architecture.
4. Favor readability over cleverness.
5. Optimize after correctness.
6. Avoid speculative abstractions.
7. Prefer composition over inheritance.
8. Every feature must be testable.
9. Every public API must be documented.
10. Every business rule belongs in the domain.

---

# Repository Philosophy

Each repository has one responsibility.

Examples

```
alminhej-apdk

alminhej-knowledge-studio

alminhej-workspace

alminhej-backend

alminhej-ai-services
```

Repositories communicate through APIs.

Never through shared code.

---

# Branch Strategy

```
main

develop

feature/*

fix/*

release/*
```

Every iteration is merged into `develop`.

Only validated iterations reach `main`.

---

# Commit Convention

```
feat:

fix:

refactor:

docs:

test:

style:

build:

ci:

chore:
```

Example

```
feat(knowledge): add page indexing workflow
```

---

# Code Quality

Every pull request must satisfy:

- Builds successfully
- No TypeScript errors
- No lint errors
- No dead code
- No duplicated logic
- Accessible UI
- Responsive layout

---

# Project Structure

Feature-first organization.

Example

```
features/

shared/

layout/

pages/

hooks/

services/

models/

types/

utils/
```

Avoid organizing by file type only.

---

# Naming Conventions

Components

```
KnowledgeGraph.tsx
```

Hooks

```
useKnowledgeGraph.ts
```

Services

```
knowledge.service.ts
```

Types

```
knowledge.types.ts
```

Constants

```
knowledge.constants.ts
```

Routes

```
knowledge.routes.ts
```

---

# TypeScript

Always use

- strict mode
- explicit types for public APIs
- discriminated unions where appropriate
- readonly where possible

Avoid

- any
- implicit any
- type assertions unless required

---

# React

Use

- functional components
- hooks
- composition

Avoid

- class components
- prop drilling
- duplicated state

Prefer server synchronization over local duplication.

---

# State Management

Priority

1. Local component state
2. Feature state
3. Shared application state

Do not introduce global state unless justified.

---

# REST API Standards

Resources use plural names.

```
/works

/pages

/entities

/relationships
```

HTTP verbs

```
GET

POST

PUT

PATCH

DELETE
```

Never encode actions in URLs.

---

# DTO Rules

Separate

- Domain
- DTO
- Persistence

Never expose persistence models directly.

---

# Error Handling

Every API returns

- success
- validation errors
- domain errors
- unexpected errors

Never expose stack traces.

---

# Logging

Structured logging only.

Never log

- passwords
- tokens
- secrets
- personal data

---

# Testing Strategy

Priority

1. Domain tests
2. Application tests
3. API tests
4. UI tests
5. End-to-end tests

Business rules receive the highest test coverage.

---

# AI Coding Rules

AI agents must never

- redesign architecture
- rename stable domain objects
- introduce unrelated libraries
- modify frozen documents
- implement features outside the current iteration

If ambiguity exists,

stop and explain the ambiguity before coding.

---

# Definition of Done

A task is complete when

- acceptance criteria are satisfied
- code builds
- tests pass
- documentation updated
- review checklist completed

---

# Review Checklist

Every implementation must answer

- Does it preserve the domain?
- Does it preserve architecture?
- Is it reusable?
- Is it testable?
- Is it accessible?
- Is it responsive?
- Is it maintainable?
- Can the next iteration build on it?

If any answer is "No", the implementation is not complete.

---

Status

Stable