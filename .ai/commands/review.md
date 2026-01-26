---
command: /review
description: Review code quality
agent: refactor
skill: coding-standards/typescript-react-nodejs
---

# Review Command

## Usage
`/review <file-or-pr>`

## Context
Use this command to perform a code review on a specific file, set of files, or diff.

## Steps
1. **Analyze**: Check against:
   - Coding Standards (TS, React, Node).
   - Security Rules.
   - Project Contracts (Phase 1).
2. **identify Issues**: List code smells, anti-patterns, or bugs.
3. **Suggest Improvements**: Provide concrete refactoring suggestions.
4. **Report**: Summary of findings.
