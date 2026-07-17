---
id: KM-006
title: KNOWLEDGE VALIDATION WORKFLOW
version: 1.0.0
status: Stable
type: Canonical Domain Specification
depends_on:
  - bibliography.md
  - knowledge-fragments.md
  - entities.md
  - relationships.md
---

# KNOWLEDGE VALIDATION WORKFLOW

## Purpose

Knowledge becomes canonical only after structured validation.

The review workflow protects authenticity, provenance and scholarly integrity.

Neither AI nor individual editors can publish canonical knowledge directly.

Every published object follows the same validation lifecycle.

---

# Validation Philosophy

The workflow validates knowledge.

It does not validate users.

Every decision must be traceable.

Every modification must remain reversible.

Every published object has an approval history.

---

# Supported Domain Objects

The workflow applies to

- Bibliographic Objects
- Knowledge Fragments
- Entities
- Relationships
- AI Suggestions
- Editorial Notes
- Variants

Every object follows the same lifecycle.

---

# Workflow

```
Created

↓

Draft

↓

AI Analysis

↓

Human Review

↓

Revision

↓

Approved

↓

Published

↓

Archived
```

---

# State Definitions

## Created

Object exists.

No validation has occurred.

Visible only to its creator.

---

## Draft

Ready for editing.

May contain incomplete information.

May contain AI generated content.

Cannot be consumed by readers.

---

## AI Analysis

The platform performs

- Entity Detection
- Relationship Discovery
- Duplicate Detection
- Similarity Analysis
- Reference Suggestions

Results remain suggestions.

Nothing becomes canonical.

---

## Human Review

Editors inspect

- authenticity
- provenance
- references
- correctness
- completeness

Editors may

Approve

Reject

Request Revision

---

## Revision

Editors update the object.

Multiple revision cycles are allowed.

Every revision is preserved.

---

## Approved

The object satisfies scholarly validation.

No further changes are allowed.

Publishing is still optional.

---

## Published

Canonical knowledge.

Visible to all projections.

Used by

- Search
- Graph
- Timeline
- Learning
- AI Companion

---

## Archived

Object remains historically available.

Cannot receive new edits.

Can still be referenced.

---

# AI Responsibilities

AI may

✓ Detect

✓ Suggest

✓ Explain

✓ Classify

✓ Compare

AI may never

✗ Publish

✗ Approve

✗ Modify canonical knowledge

✗ Delete knowledge

---

# Human Responsibilities

Editors

- edit
- validate
- revise

Reviewers

- verify evidence
- approve
- reject

Administrators

- manage permissions
- resolve conflicts

---

# Validation Rules

Every approval must verify

- provenance
- source integrity
- evidence
- bibliographic references
- semantic correctness
- duplicate detection

---

# Review Evidence

Every approval stores

Reviewer

↓

Timestamp

↓

Decision

↓

Comment

↓

Evidence

↓

Revision Number

The complete review history is permanent.

---

# Version History

Every approved revision creates

```
Version 1

↓

Version 2

↓

Version 3
```

Older versions remain accessible.

History is immutable.

---

# AI Confidence

AI confidence is informative only.

Examples

95%

72%

41%

Confidence never replaces human validation.

---

# Scholarly Confidence

Human reviewers classify certainty.

Examples

Confirmed

Strong

Probable

Weak

Disputed

Unknown

This is distinct from AI confidence.

---

# Conflicting Knowledge

Contradictory scholarly opinions may coexist.

Each maintains

- independent evidence
- independent provenance
- independent reviewers

The platform preserves scholarly diversity.

It does not enforce consensus.

---

# Audit Trail

Every action produces an audit event.

Examples

Fragment Created

↓

Entity Suggested

↓

Relationship Approved

↓

Knowledge Published

↓

Relationship Deprecated

Nothing is deleted from history.

---

# Publication Rules

An object becomes canonical only when

✓ Provenance exists

✓ Evidence exists

✓ Review completed

✓ Approval recorded

✓ Version created

Otherwise

The object remains Draft.

---

# Design Principles

Rule 1

Original sources are immutable.

---

Rule 2

Every approval is reversible through a new version.

---

Rule 3

Review history is permanent.

---

Rule 4

AI never publishes knowledge.

---

Rule 5

Human accountability is mandatory.

---

Rule 6

Every published object is fully traceable.

---

# Summary

The Knowledge Validation Workflow guarantees that every piece of canonical knowledge in AlMinhej has been reviewed, evidenced, versioned and approved by humans.

AI accelerates knowledge engineering.

Humans preserve authenticity.

The workflow is therefore the trust layer of the entire platform.

---

Status

Stable