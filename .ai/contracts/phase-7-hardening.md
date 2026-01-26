# Phase 7 — Hardening & Maintenance Contracts

**Status**: AUTHORITATIVE  
**Version**: 1.0.0  
**Phase**: 7 – Stability & Operations  
**Last Updated**: 2026-01-26

---

## Scope

### ✅ Covers
- Cleanup jobs
- Disk pressure handling
- Backups
- Observability
- Performance tuning

---

## Hardening Rules

- Cleanup must be safe and logged
- Originals must never be deleted silently
- Backups must be verifiable
- Monitoring must be passive

---

## Agent Rejection Criteria

- Deleting originals
- Silent cleanup
- Optimizations without metrics
