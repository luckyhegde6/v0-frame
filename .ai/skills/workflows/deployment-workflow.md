# Deployment Workflow

This document outlines the deployment workflow for the FRAME project.

## Environments

### 1. Preview (Pull Requests)
- **Host**: Vercel
- **DB**: Local (Docker) or Dev Branch (Neon/Supabase)
- **Goal**: Verify changes in isolation.

### 2. Production (Main Branch)
- **Host**: Vercel
- **DB**: Production (Supabase/Neon)
- **Home Server**: Production instance
- **Goal**: Stable, live system.

## Workflow

### 1. Pre-Deployment Checks
- [ ] All tests passed (`npm test`).
- [ ] Linting passed (`npm run lint`).
- [ ] Type check passed (`tsc --noEmit`).
- [ ] Contract compliance verified (Phase 1 checks).

### 2. Database Migration
- **Dev/Preview**: `npx prisma db push`
- **Production**: `npx prisma migrate deploy`
  - Ensure migrations are strictly additive/backward compatible.
  - Backup DB before critical migrations.

### 3. Application Deployment
1. Push to `main` branch.
2. Vercel automatically builds and deploys.
3. Verify Vercel deployment status (Green).

### 4. Post-Deployment Verification
- [ ] Check logs for immediate errors.
- [ ] Verify connection to Home Server.
- [ ] Test critical path (Upload -> Ingest).

## Rolling Back
If functionality is broken:
1. Revert commit on `main`.
2. Vercel redeploys previous version.
3. (If DB migration involved) Manually rollback DB schema if safe, or forward-fix.
