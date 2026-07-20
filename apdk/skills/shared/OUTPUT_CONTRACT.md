---
title: APDK Output Contract
version: 1.0.0
status: Stable
scope: Global
appliesTo: All APDK Skills
---

# Output Contract

## Purpose

This document defines the standard response format for all APDK skills.

The objective is to provide:

- consistent responses
- machine-readable outputs
- provenance preservation
- verification visibility
- interoperability between agents

---

# Core Response Structure

Every APDK skill response MUST contain:

```json
{
  "content": {},
  "metadata": {},
  "provenance": {},
  "verification": {},
  "request": {}
}
```

---

# Request Object

Describes the original request.

Example:

```json
{
  "skill": "quran-text-retrieval",
  "operation": "retrieve",
  "requestedAt": "2026-01-01T00:00:00Z"
}
```

---

# Content Object

Contains the actual retrieved information.

The structure depends on the skill.

Example Quran:

```json
{
  "arabic": "...",
  "surah": 1,
  "ayah": 1
}
```

Example Hadith:

```json
{
  "arabic": "...",
  "collection": "Sahih Muslim",
  "hadithNumber": "..."
}
```

---

# Metadata Object

Contains descriptive information.

Common fields:

```json
{
  "title": "",
  "author": "",
  "language": "",
  "edition": "",
  "publisher": ""
}
```

Domain-specific metadata is added by individual skills.

---

# Provenance Object

Every response MUST include provenance.

Example:

```json
{
  "provider": "",
  "sourceRole": "",
  "sourceIdentifier": "",
  "datasetVersion": "",
  "retrievedAt": "",
  "license": ""
}
```

---

# Verification Object

Every response MUST expose verification status.

Example:

```json
{
  "verified": true,
  "verificationLevel": 4,
  "verificationMethod": [
    "checksum",
    "source_validation"
  ]
}
```

---

# Verification Levels

Defined by:

```
shared/VERIFICATION_POLICY.md
```

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

# Content Integrity

Retrieved content must preserve:

- original text
- original identifiers
- original metadata

No transformation should happen before storage.

---

# Domain Extension

Every skill may add domain-specific fields.

Example:

Quran:

```json
{
 "surah": "",
 "ayah": "",
 "juz": "",
 "script": ""
}
```

Qira'at:

```json
{
 "qiraah": "",
 "rawi": "",
 "tariq": "",
 "reference": ""
}
```

Hadith:

```json
{
 "collection": "",
 "book": "",
 "chapter": "",
 "hadithNumber": ""
}
```

---

# Response Status

Every response must include status.

Possible values:

```
SUCCESS

PARTIAL

FAILED

UNVERIFIED
```

---

# Success Response

Example:

```json
{
 "status":"SUCCESS",
 "content": {},
 "metadata": {},
 "provenance": {},
 "verification": {}
}
```

---

# Failed Response

Example:

```json
{
 "status":"FAILED",
 "error":{
   "code":"APDK-0100",
   "message":"Ayah not found"
 }
}
```

---

# Partial Response

Used when:

- some metadata unavailable
- provider incomplete
- optional fields missing

Example:

```json
{
 "status":"PARTIAL",
 "content": {},
 "missing":[
   "publisher"
 ]
}
```

---

# Unverified Response

Used only when explicitly allowed.

Example:

```json
{
 "status":"UNVERIFIED",
 "verification":{
   "verified":false
 }
}
```

Unverified content must never be treated as authoritative.

---

# Multiple Results

When multiple sources exist:

Return separate objects.

Example:

```json
{
 "results":[
   {
    "provider":"A",
    "content":"..."
   },
   {
    "provider":"B",
    "content":"..."
   }
 ]
}
```

The system must not merge sources automatically.

---

# Citation Object

Skills may expose citation information.

Example:

```json
{
 "work":"",
 "author":"",
 "volume":"",
 "page":"",
 "chapter":""
}
```

---

# Human Readable Output

Applications may transform the machine output into UI views.

However:

The UI must preserve:

- original content
- attribution
- verification status

---

# AI Agent Rules

Agents consuming APDK outputs must:

- preserve provenance
- respect verification status
- not remove metadata
- not hide uncertainty

---

# Serialization

Preferred format:

JSON

Optional:

- JSON-LD
- RDF
- Markdown rendering

The canonical representation remains structured data.

---

# Versioning

The output contract version must be included.

Example:

```json
{
 "contractVersion":"1.0.0"
}
```

Breaking changes require a new major version.

---

# Design Philosophy

The APDK output is not simply an answer.

It is a knowledge object.

A complete knowledge object contains:

- the content
- where it came from
- how it was verified
- how it can be reproduced

This allows AI agents to operate over Islamic knowledge while preserving scholarly traceability.