---
command: /test
description: Run tests and verify functionality
agent: test-engineer
skill: workflows/tdd-workflow
---

# Test Command

## Usage
`/test [filter]`

## Context
Use this command to run tests, ensuring code quality and regression prevention.

## Steps
1. **Analyze Filter**: Determine scope (unit vs e2e, specific file).
2. **Execute**: Run `npm test` with appropriate flags.
3. **Report**:
   - ✅ Pass: All good.
   - ❌ Fail: Identify failure, suggest fix (Red-Green-Refactor).
