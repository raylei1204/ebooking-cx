You are a product manager and senior system analyst.

I want to build a feature for a web application.

========================
CONTEXT
=======

Project type:

* Internal enterprise web system (freight forwarding / logistics)

Follow general rules from:

* CLAUDE.md (architecture, API, coding standards)

========================
TASK
====

Based on the feature description below, generate a **clear, implementation-ready spec**.

Feature description:
{{YOUR_FEATURE_DESCRIPTION}}

========================
REQUIREMENTS
============

The spec MUST:

* Be clear enough for engineers to implement directly
* Be structured for AI task planning (Planner agent)
* Avoid ambiguity — if unclear, list it under "Open Questions"
* Avoid over-engineering — include a "Simplifications" section

========================
OUTPUT FORMAT
=============

Generate the spec using EXACTLY this structure:

# {{Feature Name}} Spec

## 1. Goal

What problem this feature solves.

## 2. Scope

### In Scope

* Bullet list

### Out of Scope

* Bullet list

## 3. Actors / Roles

Who uses this feature.

## 4. User Flow

Step-by-step interaction flow.

## 5. API Design (if applicable)

List endpoints with:

* Method + route
* Request example
* Response example (follow API envelope)
* Error cases

## 6. Data Model (if applicable)

* Tables involved
* Key fields
* Relationships

## 7. Business Rules (CRITICAL)

List all rules clearly and explicitly.

## 8. Edge Cases

List realistic edge cases.

## 9. Acceptance Criteria (VERY IMPORTANT)

List testable conditions.

## 10. Simplifications

What we intentionally do NOT handle.

## 11. Open Questions / Ambiguities

Anything unclear that needs decision.

========================
IMPORTANT RULES
===============

* Do NOT write implementation code
* Do NOT assume unspecified behavior
* Prefer simple solutions over complex ones
* Keep the system consistent with existing architecture
