# Phase 3 — Authentication & Access Control Contracts

**Status**: AUTHORITATIVE  
**Version**: 1.0.0  
**Phase**: 3 – Auth & RBAC  
**Last Updated**: 2026-01-26

---

## Scope

### ✅ Covers
- Authentication
- Role model
- Route protection
- Resource isolation

### ❌ Excludes
- ❌ Projects
- ❌ Admin UI
- ❌ Intelligence
- ❌ Billing

---

## Role Model (Frozen)

USER
PRO
CLIENT
ADMIN

Rules:
- Roles are explicit
- No implicit elevation
- CLIENT is read-only
- ADMIN does not bypass safety checks

---

## Auth Rules   

- Auth lives in Next.js
- Home server APIs require signed requests
- No unauthenticated writes

---

## Isolation Contract

- Users access only their resources
- Filesystem access must match DB ownership
- No cross-user reads

---

## Agent Rejection Criteria

- Role inference
- Shared directories
- Auth logic inside job runner

---
