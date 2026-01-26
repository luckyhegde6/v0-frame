# Phase 6 — Intelligence & ML Contracts

**Status**: AUTHORITATIVE  
**Version**: 1.0.0  
**Phase**: 6 – ML & Semantics  
**Last Updated**: 2026-01-26

---

## Scope

### ✅ Covers
- Face detection
- Object detection
- Semantic embeddings
- pgvector storage
- Semantic search

### ❌ Excludes
- ❌ Blocking UI flows
- ❌ Inline ML execution
- ❌ Cloud ML dependencies

---

## Intelligence Rules

- All ML runs as background jobs
- ML failures must not block ingestion
- Embeddings are append-only
- Search is read-only

---

## Agent Rejection Criteria

- ML in API routes
- ML in upload flow
- Blocking inference
