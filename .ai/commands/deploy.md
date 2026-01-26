---
command: /deploy
description: Deploy to production/preview
agent: maintain
skill: workflows/deployment-workflow
---

# Deploy Command

## Usage
`/deploy [env]`

## Context
Use this command to trigger deployment or prepare for deployment.

## Steps
1. **Pre-flight Checks**:
   - Tests pass?
   - Contracts valid?
   - Lint clean?
2. **Migration**: Check if DB migration is needed.
3. **Deploy**: Push changes to remote.
4. **Verify**: Check deployment health (`/api/health`).
