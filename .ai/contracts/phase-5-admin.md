# Phase 5 — Admin Control Plane Contracts

**Status**: AUTHORITATIVE  
**Version**: 1.0.0  
**Phase**: 5 – Admin & Operations  
**Last Updated**: 2026-01-26

---

## Scope

### ✅ Covers
- Admin UI
- Job retry / cancel
- Storage stats
- Swagger (admin-only)

### ❌ Excludes
- ❌ Feature development
- ❌ Business analytics

---

## Admin Rules

- Admin APIs are privileged
- Swagger must be admin-only
- Manual intervention allowed
- All actions must be logged

---

## Agent Rejection Criteria

- Admin logic in user routes
- Public Swagger
- Silent destructive actions
