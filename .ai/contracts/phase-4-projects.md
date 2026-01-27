# Phase 4 — Professional Projects Contracts

**Status**: AUTHORITATIVE  
**Version**: 1.0.0  
**Phase**: 4 – Projects & Sharing  
**Last Updated**: 2026-01-26

---

## Scope

### ✅ Covers
- Projects
- Project-scoped uploads
- Client sharing
- Storage quotas

### ❌ Excludes
- ❌ Admin override
- ❌ Billing
- ❌ Analytics

---

## Project Isolation Contract

Each project:
- Has a dedicated directory
- Has a dedicated DB namespace
- Cannot access other projects

Filesystem:
\`\`\`
/users/{userId}/projects/{projectId}/
\`\`\`
---

## Client Access Contract

- Read-only
- Token-based
- Optional expiry
- No upload
- No delete

---

## Agent Rejection Criteria

- Cross-project access
- Client uploads
- Shared project directories
---
