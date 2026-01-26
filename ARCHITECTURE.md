# FRAME Architecture

## Overview
FRAME is a self-hosted, production-grade photo management platform.
Next.js runs on the home server and acts as:
- UI layer
- API layer
- Background job execution layer

There is no serverless split-brain. The home server is the single source of truth.

## Core Principles
- Originals are immutable
- All processing is asynchronous
- Jobs are idempotent and retryable
- Filesystem + PostgreSQL are authoritative
- UI never blocks on processing

## System Topology
Client -> Next.js (Home Server) -> Filesystem + PostgreSQL

## Image Lifecycle
UPLOADED -> INGESTED -> PROCESSING -> PROCESSED

## Processing Pipeline
- Metadata extraction
- Thumbnail generation
- Preview compression
- Face detection
- Object detection
- Vector embedding
- Cleanup jobs

All implemented as background jobs within Next.js runtime.
