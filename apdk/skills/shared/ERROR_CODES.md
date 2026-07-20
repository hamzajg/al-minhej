---
title: APDK Error Codes
version: 1.0.0
status: Stable
scope: Global
appliesTo: All APDK Skills
---

# Error Codes

## Purpose

This document defines standardized error codes used throughout the APDK ecosystem.

The objectives are:

- consistent error handling
- predictable agent behavior
- transparent failure reporting
- easier debugging
- preservation of knowledge integrity

---

# Error Structure

Every failure response should follow:

```json
{
  "status": "FAILED",
  "error": {
    "code": "APDK-XXXX",
    "category": "",
    "message": "",
    "details": ""
  }
}
```

---

# Error Code Format

Pattern:

```
APDK-XXXX
```

Where:

```
APDK

+

Category

+

Number
```

---

# Categories

```
0000

General System Errors


0100

Quran Errors


0200

Translation Errors


0300

Hadith Errors


0400

Source Errors


0500

Verification Errors


0600

Metadata Errors


0700

License Errors


0800

Security Errors


0900

Provider Errors
```

---

# General Errors

---

## APDK-0001

Unknown error

Meaning:

Unexpected failure.

---

## APDK-0002

Invalid request

Meaning:

Request does not match skill requirements.

---

## APDK-0003

Unsupported operation

Meaning:

Requested operation is not supported.

---

## APDK-0004

Missing required parameter

Meaning:

Required identifier is missing.

---

# Quran Errors

---

## APDK-0100

Surah not found

Meaning:

Requested surah identifier does not exist.

---

## APDK-0101

Ayah not found

Meaning:

Requested ayah does not exist.

---

## APDK-0102

Invalid ayah range

Meaning:

Requested range is invalid.

---

## APDK-0103

Unsupported Quran script

Meaning:

Requested script is unavailable.

Example:

```
Indopak requested

provider supports only Uthmani
```

---

## APDK-0104

Quran source unavailable

Meaning:

Approved Quran provider unavailable.

---

## APDK-0105

Quran verification failed

Meaning:

Retrieved Quran text failed verification.

---

# Translation Errors

---

## APDK-0200

Translation unavailable

Meaning:

Requested translation does not exist.

---

## APDK-0201

Unsupported language

Meaning:

Requested language is unavailable.

---

## APDK-0202

Translator unavailable

Meaning:

Requested translator is not registered.

---

## APDK-0203

Translation source not approved

Meaning:

Provider cannot be used for translations.

---

# Hadith Errors

---

## APDK-0300

Hadith not found

Meaning:

Requested hadith identifier does not exist.

---

## APDK-0301

Collection unavailable

Meaning:

Requested hadith collection unavailable.

---

## APDK-0302

Edition unavailable

Meaning:

Requested publication edition unavailable.

---

## APDK-0303

Hadith verification failed

Meaning:

Retrieved hadith content failed verification.

---

## APDK-0304

Chain information unavailable

Meaning:

Requested isnad information unavailable.

---

# Source Errors

---

## APDK-0400

Unknown provider

Meaning:

Provider is not registered.

---

## APDK-0401

Provider not approved

Meaning:

Provider exists but is not approved.

---

## APDK-0402

Provider role not allowed

Meaning:

Provider cannot perform requested role.

Example:

```
Translation provider used for Quran canonical text
```

---

## APDK-0403

Source deprecated

Meaning:

Provider or dataset has been deprecated.

---

# Verification Errors

---

## APDK-0500

Verification failed

Meaning:

General verification failure.

---

## APDK-0501

Checksum mismatch

Meaning:

Content integrity check failed.

---

## APDK-0502

Metadata verification failed

Meaning:

Required metadata is invalid.

---

## APDK-0503

Provenance missing

Meaning:

Origin information unavailable.

---

## APDK-0504

Verification level insufficient

Meaning:

Content does not meet required verification level.

---

# Metadata Errors

---

## APDK-0600

Missing metadata

Meaning:

Required metadata fields are missing.

---

## APDK-0601

Invalid identifier

Meaning:

Identifier format invalid.

---

## APDK-0602

Edition metadata unavailable

Meaning:

Publication details missing.

---

## APDK-0603

Author metadata unavailable

Meaning:

Author information missing.

---

# Licensing Errors

---

## APDK-0700

License unknown

Meaning:

Source license unavailable.

---

## APDK-0701

Distribution not allowed

Meaning:

Content cannot be redistributed.

---

## APDK-0702

Attribution required

Meaning:

Required attribution information missing.

---

# Security Errors

---

## APDK-0800

Unauthorized source access

Meaning:

Provider access denied.

---

## APDK-0801

Policy violation

Meaning:

Operation violates APDK policy.

Example:

Attempt to generate Quran text.

---

## APDK-0802

Unsafe transformation blocked

Meaning:

Modification of protected content blocked.

---

# Provider Errors

---

## APDK-0900

Provider unavailable

Meaning:

Provider cannot be reached.

---

## APDK-0901

Provider timeout

Meaning:

Provider did not respond.

---

## APDK-0902

Provider rate limited

Meaning:

Request limit exceeded.

---

## APDK-0903

Provider returned invalid data

Meaning:

Provider response failed validation.

---

# Agent Behavior Rules

When an agent receives an error:

It must:

- preserve the error code
- explain the failure clearly
- not retry with unapproved sources
- not fabricate replacement content

---

# Retry Rules

Retry allowed:

- timeout
- temporary provider unavailable
- network failure

Retry forbidden:

- verification failure
- checksum mismatch
- policy violation
- license failure

---

# Logging

Every error event should record:

```
errorCode

timestamp

skill

provider

request

verificationStatus
```

---

# Design Philosophy

In APDK, failure transparency is a feature.

A missing authenticated source is safer than an invented answer.

The system must always prefer:

verified absence

over

unverified presence.