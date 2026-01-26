---
command: /debug
description: Debug an issue
agent: debug
skill: workflows/bug-fix-workflow
---

# Debug Command

## Usage
`/debug <issue-description-or-logs>`

## Context
Use this command to investigate and fix a reported issue or error log.

## Steps
1. **Investigate**: Analyze the issue (logs, symptoms).
2. **Reproduce**: Create a minimal reproduction case.
3. **Analyze Root Cause**: Determine *why* it's failing.
4. **Propose Fix**: Draft a minimal fix plan.
5. **Implement**: Apply fix and verify.
