---
id: APDK-007
title: DESIGN_LANGUAGE
version: 1.0.0
status: Stable
type: Foundation
owner: Product Architecture
depends_on:
  - NORTH_STAR.md
  - PRODUCT.md
  - CORE_DOMAIN.md
---

# DESIGN LANGUAGE

## Purpose

This document defines the visual language, interaction principles and user experience philosophy of AlMinhej.

The design system exists to make complex knowledge feel approachable without hiding its richness.

The interface should communicate trust, authenticity and clarity.

---

# Design Philosophy

AlMinhej is not a marketing website.

It is not a dashboard.

It is not a document editor.

It is a professional knowledge workspace.

The interface should feel closer to

- Figma
- Notion
- Linear
- Obsidian
- VS Code

than to a traditional CMS.

Users should feel they are working inside a living knowledge system.

---

# Design Principles

## Knowledge First

The interface exists to present knowledge.

Decorative elements should never compete with the content.

---

## Source First

The original Arabic text is always the visual anchor.

Everything else supports the source.

---

## Progressive Disclosure

Show only the information required for the current task.

Allow users to progressively reveal more context.

---

## Context Everywhere

Every screen should answer:

- Where am I?
- What am I reading?
- What is connected?
- What can I do next?

---

## Direct Manipulation

Knowledge should be manipulated directly.

Examples

- Drag relationships
- Expand nodes
- Connect entities
- Inspect references

Avoid modal-heavy workflows.

---

## Immediate Feedback

Every interaction should provide immediate visual confirmation.

Examples

- Saved
- Linked
- Indexed
- Suggested
- Reviewed
- Published

---

# Visual Identity

The interface should communicate

- authenticity
- calmness
- precision
- scholarship
- modernity

Never luxury.

Never entertainment.

Never gaming.

---

# Information Density

The platform targets professional users.

Information density should be medium to high.

Avoid excessive whitespace.

Avoid clutter.

---

# Layout Philosophy

Every workspace follows the same structure.

```
Header

↓

Navigation

↓

Primary Workspace

↓

Secondary Inspector

↓

Context Panel
```

Users should never lose context.

---

# Primary Layout

```
+-------------------------------------------------------+

Header

+-----+---------------------------+---------------------+

Navigation

Workspace

Inspector

+-----+---------------------------+---------------------+

Status Bar

+-------------------------------------------------------+
```

---

# Workspace

The workspace is the primary focus.

Examples

- Book Viewer
- Page Editor
- Graph
- Timeline
- Search Results

Only one primary workspace exists at a time.

---

# Inspector

The inspector displays metadata.

Examples

Entity

Relationships

References

History

Properties

Suggestions

The inspector never replaces the workspace.

---

# Navigation

Navigation is hierarchical.

Collection

↓

Work

↓

Edition

↓

Volume

↓

Page

↓

Knowledge Fragment

Users always know their location.

---

# Color Philosophy

Color communicates meaning.

Not decoration.

---

## Primary

Used for

- primary actions
- active selections

---

## Neutral

Used for

- typography
- surfaces
- borders

---

## Success

Used for

- approved
- validated
- published

---

## Warning

Used for

- review required
- incomplete
- missing references

---

## Danger

Used for

- delete
- conflicts
- broken references

---

## AI

Reserved exclusively for

- suggestions
- generated content
- confidence indicators

AI colors should never appear on authenticated knowledge.

---

# Typography

Two independent typography systems.

---

## Arabic

Optimized for reading.

Requirements

- Quran-friendly rendering
- proper ligatures
- high readability
- excellent line spacing
- scalable

Arabic always has visual priority.

---

## Interface

Modern sans-serif.

Used for

- navigation
- metadata
- buttons
- properties
- panels

The interface typography should never compete with Arabic text.

---

# Iconography

Icons assist recognition.

Never replace labels.

Icons should be

- minimal
- consistent
- outline style

---

# Motion

Animations communicate state changes.

Maximum duration

200ms

Avoid decorative animations.

Prefer meaningful transitions.

---

# Accessibility

Minimum target

WCAG AA

Requirements

- keyboard navigation
- visible focus
- screen reader labels
- scalable typography
- sufficient contrast

---

# Responsive Strategy

Desktop First

Primary target

Knowledge Studio

Secondary targets

Tablet

Large laptop

Mobile support is required but not optimized for editing workflows.

---

# Component Hierarchy

Primitive Components

↓

Shared Components

↓

Domain Components

↓

Feature Components

↓

Pages

No page should contain business logic.

---

# Design Tokens

Spacing

```
4
8
12
16
24
32
48
64
```

Border Radius

```
4
8
12
16
```

Elevation

```
Level 0

Level 1

Level 2

Level 3
```

Typography Scale

```
Display

Heading

Title

Body

Caption

Metadata
```

---

# Knowledge Visualization

Knowledge is visualized through multiple complementary views.

Reading View

Primary

Knowledge Graph

Relationships

Timeline

Historical context

Tree

Hierarchy

Table

Metadata

Cards

Quick browsing

Each visualization represents the same knowledge.

No visualization owns data.

---

# Graph Design Principles

The graph is a navigation tool.

Not decoration.

Nodes represent

- entities
- books
- scholars
- concepts
- places
- events

Edges represent validated relationships.

Users edit relationships.

The graph updates automatically.

---

# AI Interaction Pattern

AI suggestions are visually distinct.

Every suggestion displays

- confidence
- source
- explanation
- review status

Users can

Accept

Reject

Modify

Every accepted suggestion becomes normal knowledge.

AI identity disappears after approval.

---

# Knowledge Editing Pattern

Every editing workflow follows

Inspect

↓

Edit

↓

Validate

↓

Review

↓

Publish

Users always understand the current state.

---

# Empty States

Empty states educate.

Never display

"No Data"

Instead explain

- why
- what happens next
- available actions

---

# Loading States

Prefer skeletons over spinners.

Loading should preserve layout stability.

---

# Search Experience

Search is universal.

Users can search

- books
- pages
- entities
- scholars
- narrators
- concepts
- places
- events

Search should support Arabic and translated metadata.

---

# Workspace Modes

The platform supports multiple modes.

Reading

Editing

Review

Research

Comparison

Presentation

Modes reuse components.

They do not duplicate screens.

---

# Consistency Rules

Every feature must

- use shared tokens
- reuse shared components
- preserve navigation
- preserve terminology
- preserve interaction patterns

Avoid feature-specific visual languages.

---

# User Experience Goal

A beginner should feel guided.

An editor should feel productive.

A researcher should feel unrestricted.

All three users should feel they are interacting with the same coherent platform.

---

# Design Principle Summary

The interface should disappear.

The knowledge should become the focus.

Every design decision should increase trust, reduce cognitive load and strengthen the connection between the user and the original authenticated sources.

---

Status

Stable