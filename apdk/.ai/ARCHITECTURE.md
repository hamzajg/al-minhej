---
id: APDK-005
title: ARCHITECTURE
version: 1.0.0
status: Stable
type: Foundation
owner: Product Architecture
depends_on:
  - NORTH_STAR.md
  - CONTEXT.md
  - PRODUCT.md
  - CORE_DOMAIN.md
---

# ARCHITECTURE

## Purpose

This document defines the logical architecture of the AlMinhej platform.

It explains how the domain is decomposed into applications, modules and services while ensuring that technology remains independent from the business domain.

This document intentionally avoids implementation details.

Technology stacks may evolve.

The architecture should remain stable.

---

# Architecture Principles

The architecture follows these principles.

- Domain First
- Modular by Default
- API First
- AI Native
- Backend Driven
- Event Ready
- Frontend Independent
- Technology Agnostic

---

# High-Level Architecture

```
                    Users
                       │
        ┌──────────────┴──────────────┐
        │                             │
Knowledge Studio             Knowledge Workspace
        │                             │
        └──────────────┬──────────────┘
                       │
                REST API Gateway
                       │
        ┌──────────────┼──────────────┐
        │              │              │
 Knowledge      Bibliography      AI Services
   Engine           Engine
        │              │
        └──────────────┼──────────────┘
                       │
              Persistence Layer
```

The applications are independent.

The backend owns the business logic.

---

# Product Applications

The platform consists of four primary applications.

---

## Knowledge Studio

Purpose

Knowledge creation.

Primary users

- Editors
- Researchers
- Reviewers
- Translators

Responsibilities

- Book import
- Digitization
- Page indexing
- Entity management
- Relationship management
- AI-assisted knowledge engineering
- Review workflow
- Publication

---

## Knowledge Workspace

Purpose

Knowledge exploration.

Primary users

- Readers
- Students
- Teachers
- Researchers

Responsibilities

- Reading
- Navigation
- Knowledge graph
- Timeline
- AI explanations
- Learning journey

---

## Backend Platform

Purpose

Business capabilities.

Responsibilities

- Domain logic
- REST APIs
- Validation
- Search
- Authentication
- Persistence
- AI orchestration

The backend is the source of truth.

---

## AI Services

Purpose

Knowledge assistance.

Responsibilities

- Entity extraction
- Relationship suggestion
- Classification
- Similarity detection
- Knowledge enrichment

AI services never become the system of record.

---

# Modular Monolith

The first production architecture is a Modular Monolith.

Reasons

- simpler deployment
- faster development
- easier debugging
- lower operational cost
- strong module boundaries

The architecture must allow future extraction into microservices if required.

---

# Backend Modules

The backend is divided into business modules.

```
Bibliography

Knowledge

Entities

Relationships

AI

Search

Users

Review

Publication
```

Each module owns

- its domain
- application services
- repositories
- API endpoints

Modules communicate through interfaces.

Never through database tables.

---

# Frontend Architecture

The frontend is organized by features rather than pages.

```
Application

↓

Feature

↓

Module

↓

Components

↓

Shared UI
```

Every feature encapsulates

- components
- hooks
- services
- models
- routes

---

# Storage Strategy

Development

```
JSON Files

↓

In-Memory Repository
```

Purpose

Rapid iteration.

No infrastructure dependency.

---

Production

```
MongoDB
```

Reason

The domain naturally maps to document aggregates.

---

Future

Optional integrations

- Firebase
- PostgreSQL
- Graph Database
- Elasticsearch
- Vector Database

These remain infrastructure concerns.

They never affect the domain model.

---

# Aggregate Storage

Each aggregate has its own collection.

Examples

```
works

editions

pages

knowledgeFragments

entities

relationships

sources

users

reviews
```

Collections reference each other by identifiers.

Avoid deep embedding of shared domain objects.

---

# Repository Pattern

Each aggregate exposes one repository interface.

Example

```
WorkRepository

EditionRepository

PageRepository

KnowledgeFragmentRepository

EntityRepository

RelationshipRepository
```

Repositories return domain objects.

They never expose persistence models.

---

# Service Layers

The backend follows four layers.

```
Presentation

↓

Application

↓

Domain

↓

Infrastructure
```

---

## Presentation

Responsible for

- REST APIs
- DTOs
- Validation
- Authentication

Contains no business logic.

---

## Application

Responsible for

- Use Cases
- Transactions
- Orchestration

Coordinates domain services.

---

## Domain

Responsible for

Business Rules

Entities

Value Objects

Aggregates

Domain Services

Domain Events

Pure business logic.

No framework dependencies.

---

## Infrastructure

Responsible for

Database

Search

Files

AI Providers

Messaging

External APIs

Can be replaced independently.

---

# API Design

The backend exposes REST APIs.

Principles

- Resource Oriented
- Stateless
- Versioned
- JSON
- Predictable

Example

```
/api/v1/works

/api/v1/pages

/api/v1/entities

/api/v1/relationships

/api/v1/search

/api/v1/review
```

REST contracts are defined separately.

---

# Knowledge Pipeline

Every piece of knowledge follows the same pipeline.

```
Book Import

↓

Page Creation

↓

Knowledge Fragment

↓

Entity Detection

↓

Relationship Suggestion

↓

Human Validation

↓

Publication

↓

Projection
```

Every stage is observable.

---

# AI Integration

AI never modifies the database directly.

Workflow

```
Domain Object

↓

AI Request

↓

Suggestion

↓

Human Review

↓

Approval

↓

Persistence
```

The database only stores approved knowledge.

---

# Search Architecture

Search is a dedicated capability.

It indexes

- Arabic text
- translations
- entities
- concepts
- bibliography
- references

Search indexes are rebuildable.

They are not the source of truth.

---

# Graph Architecture

The graph is a projection.

It is generated from

- entities
- relationships

The graph itself is never manually edited.

Users edit relationships.

The graph updates automatically.

---

# Authentication

Authentication is a platform capability.

Authorization is role based.

Initial roles

- Administrator
- Editor
- Reviewer
- Translator
- Viewer

Additional roles may be introduced without changing the domain.

---

# Review Workflow

Every change follows

```
Draft

↓

Review

↓

Approved

↓

Published
```

AI suggestions enter only as Draft.

---

# Versioning

Knowledge is versioned.

Published objects remain immutable.

New revisions create new versions.

History must always be preserved.

---

# Dependency Rules

Allowed

```
Presentation

↓

Application

↓

Domain

↓

Infrastructure
```

Forbidden

```
Domain

↓

Presentation

Domain

↓

Framework

Domain

↓

Database

Presentation

↓

Database
```

The domain must never depend on technology.

---

# Architecture Evolution

Current Architecture

```
Modular Monolith
```

Future Options

```
Module Extraction

↓

Microservices

↓

Distributed Services
```

The business model should remain unchanged.

---

# Architectural Decisions

Every architectural change requires an ADR (Architecture Decision Record).

No major architectural decision should exist only in chat conversations.

---

# Summary

The AlMinhej architecture is designed around one principle:

> Preserve a stable business domain while allowing technology, infrastructure and user experiences to evolve independently.

The backend owns business rules.

The frontend owns user experience.

AI assists workflows.

The domain remains the permanent foundation of the platform.

---

Status

Stable