# FRAME - Self-Hosted Photo Management System

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/luckyhegde6s-projects/v0-photo-management-system)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/s9FW5cvDCkQ)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/luckyhegde6s-projects/v0-photo-management-system](https://vercel.com/luckyhegde6s-projects/v0-photo-management-system)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/s9FW5cvDCkQ](https://v0.app/chat/s9FW5cvDCkQ)**

App - [https://framev6.vercel.app/](https://framev6.vercel.app/)

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

----

# FRAME — Self-Hosted Photo Management
``` mermaid
graph TD
    UPLOADED[UPLOADED] --> INGESTED[INGESTED]
    INGESTED --> PROCESSING[PROCESSING]
    PROCESSING --> PROCESSED[PROCESSED]
    ANY --> FAILED[FAILED]
```
Failures are expected and recoverable. The home server is the single system of record.

## Architecture

``` mermaid
flowchart LR
    User[User Upload] -->|Next.js| Server[Home Server]
    Server -->|API/UI| Node[Node.js Runtime]
    Node -->|Jobs| Runner[Job Runner]
    Runner -->|Write| Disk[(/frame-data/)]
    Runner -->|Index| DB[(PostgreSQL)]
```

## Key Design Decisions
### Single Source of Truth
There is no serverless split-brain. The home server (Next.js in Node runtime) acts as the UI, API, and background job execution layer.

### Lossless Originals
Original images are preserved byte-for-byte in `/frame-data/images/{id}/original`. All optimizations happen on derived copies.

### Long-lived Job Runner
A persistent job runner loop executes within the Next.js runtime, picking up tasks from the database.

### Streaming Everywhere
- Uploads and downloads are streamed directly to/from the filesystem.
- No buffering large files in memory.

---

## Current Status

- UI scaffold complete
- Upload and gallery UX validated
- **Phase 1: Ingestion Foundation** ✅ Complete
- **Phase 2: Job Runner** ✅ Complete
- **Phase 3: Auth & Access Control** ✅ Complete
- **Phase 4: Professional Projects** - Coming next

### What's New in Phase 3

- **Authentication System**: NextAuth.js v5 with JWT sessions
- **Role-Based Access Control**: USER, PRO, CLIENT, ADMIN roles
- **Protected Routes**: /gallery, /upload require login
- **Admin Dashboard**: System stats and user management
- **Enhanced Navigation**: Header with breadcrumbs and back buttons
- **Dynamic Landing Page**: Shows Logout when authenticated

### Authentication Demo

Visit `/auth/signin` to test the authentication system:

**Demo Accounts:**
- `admin@frame.app` / admin123 (Full admin access)
- `user@frame.app` / user123 (Standard user)
- `pro@frame.app` / pro123 (Professional user)
- `client@frame.app` / client123 (Client access)

---

## Roadmap

See [TODO.md](./TODO.md) for the authoritative execution plan.

---

## For Reviewers & Interviewers

This repository intentionally emphasizes:
- System boundaries
- Data lifecycle clarity
- Failure-aware design
- Long-term maintainability

Feature velocity is secondary by design.

---

## Running Locally

```bash
pnpm install
pnpm local

pnpm dev # for vercel
```

create an env file with below or copy from here or from Keep

```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_JWT_SECRET
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
```

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/frame?schema=public"
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/frame?schema=public"
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:5432/frame?schema=public"
```
---

## 🤖 AI Agent System

This project uses a standardized [**.ai/**](./.ai/) directory for AI agent configuration, rules, and workflows.

If you are an AI assistant working on this repo:
1. **Read the rules** in [.ai/rules/](./.ai/rules/)
2. **Follow the contracts** in [.ai/contracts/](./.ai/contracts/)
3. **Use the appropriate agent** definition from [.ai/agents/](./.ai/agents/)

See [.ai/README.md](./.ai/README.md) for more details.

## Demo
![demo](./demo.gif)

- Signin page: http://localhost:3000/auth/signin
    **Demo accounts**:
       - admin@frame.app / admin123 (Admin access)
       - user@frame.app / user123 (Regular user)
       - pro@frame.app / pro123 (Pro user)
       - client@frame.app / client123 (Client user)

