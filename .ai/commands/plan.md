---
command: /plan
description: Create an implementation plan for a feature
agent: architect
skill: workflows/feature-implementation
---

# Plan Command

## Usage
`/plan <feature-description>`

## Context
Use this command to generate a comprehensive implementation plan before writing code.

## Steps
1. **Analyze Requirements**: Understand the goal and constraints.
2. **Review Architecture**: Check existing patterns and contracts (Contracts §0).
3. **Identify Components**: What needs to change? (DB, API, UI).
4. **Draft Plan**: Create a markdown plan with:
   - Goals
   - Schema Changes
   - API Changes
   - Verification Plan
5. **Request Review**: Ask user for approval.
