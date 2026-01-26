---
command: /implement
description: Implement a feature from a plan
agent: create
skill: workflows/feature-implementation
---

# Implement Command

## Usage
`/implement <plan-summary>`

## Context
Use this command to execute the code changes for a feature, following the `feature-implementation` workflow.

## Steps
1. **Review Plan**: Read the approved implementation plan.
2. **Execute Phase**:
   - Create/Update DB Schema.
   - Implement Core Logic (lib/).
   - Implement API.
   - Implement UI.
3. **Verify**: Run tests and verify manually.
4. **Report**: Summarize changes.
