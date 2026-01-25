# Photo management system

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

# FRAME — A Hybrid Photo Management System
``` mermaid
UPLOADED
↓
INGESTED (temp cloud storage)
↓
STORED (home server confirmed)
↓
PROCESSING (ML pipeline)
↓
PROCESSED
```
Failures are expected and recoverable.
No step assumes perfect infrastructure.

## Architecture

``` mermaid
flowchart LR
    User[User Upload] -->|Next.js| Cloud[Cloud Storage]
    Cloud -->|Offload Job| Home[Home Server]
    Home -->|Confirm| Cloud
    Cloud -->|Derived Assets| Cloud
    Home -->|ML Pipeline| Home
    Home -->|Vectors| DB[(pgvector)]
    Cloud -->|Search API| User
    Home -->|Originals| User
```

## Key Design Decisions
### Lossless Originals
Original images are preserved byte-for-byte.
All optimizations happen on derived copies.

### Asynchronous by Default
Uploads, storage, ML, and downloads are decoupled.
No user request blocks on heavy work.

### Streaming Everywhere
- Uploads are streamed
- Downloads are streamed
- ZIP archives are streamed
No buffering large files in memory.

### Explicit Failure Handling
Retries, backoff, and idempotency are first-class concepts.

---

## Current Status

- UI scaffold complete
- Upload and gallery UX validated
- Deployment pipeline live

The system is currently in **Phase 1: Ingestion Foundation**.

---

## Roadmap

See `TODO.md` for the authoritative execution plan.

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
npm install
npm run dev
```
