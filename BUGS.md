# FRAME - Bugs & Issues Documentation

**Version:** 1.0  
**Last Updated:** February 2026  

---

## 1. Critical Bugs (TypeScript Errors)

These are LSP errors that prevent the build from completing successfully.

### 1.1 Prisma Schema Sync Issues

| ID | File | Error | Severity | Status |
|----|------|-------|----------|--------|
| BUG-001 | `app/admin/page.tsx:32` | `Type '"CANCELLED"' is not assignable to type 'JobStatus'` | HIGH | **FIXED** |
| BUG-002 | `app/admin/page.tsx:42` | `Property 'proRequest' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |
| BUG-003 | `app/admin/page.tsx:43` | `Property 'proRequest' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |

**Root Cause:** The `JobStatus` enum in Prisma schema doesn't include `CANCELLED`, and the `proRequest` relation isn't properly defined in the schema.

**Fix Required:**
1. Add `CANCELLED` to the `JobStatus` enum in `prisma/schema.prisma`
2. Verify `ProRequest` model has correct relations

**Fix Applied:** 
- Added CANCELLED to JobStatus enum in production database
- Created ProRequest table in production database
- Regenerated Prisma client

### 1.2 Audit Action Type Errors

| ID | File | Error | Severity | Status |
|----|------|-------|----------|--------|
| BUG-004 | `lib/audit.ts:85` | `Type '"JOB_RETRY"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-005 | `lib/audit.ts:87` | `Type '"JOB_CANCELLED"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-006 | `lib/audit.ts:89` | `Type '"JOB_FORCE_RUN"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-007 | `lib/audit.ts:113` | `Type '"IMAGE_DOWNLOADED"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-008 | `lib/audit.ts:115` | `Type '"ALBUM_DOWNLOADED"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-009 | `lib/audit.ts:117` | `Type '"PRO_REQUEST_SUBMITTED"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-010 | `lib/audit.ts:119` | `Type '"PROJECT_EXPORT_REQUESTED"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-011 | `lib/audit.ts:121` | `Type '"FACE_RECOGNITION_REQUESTED"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |
| BUG-012 | `lib/audit.ts:123` | `Type '"WATERMARK_REQUESTED"' is not comparable to type 'AuditAction'` | HIGH | **FIXED** |

**Root Cause:** The `AuditAction` enum in the Prisma schema doesn't include the action types that are being used in `lib/audit.ts`.

**Fix Applied:** Added all missing enum values to production database

**Fix Required:** Add the following to `AuditAction` enum in `prisma/schema.prisma`:
```prisma
JOB_RETRY
JOB_CANCELLED
JOB_FORCE_RUN
IMAGE_DOWNLOADED
ALBUM_DOWNLOADED
PRO_REQUEST_SUBMITTED
PROJECT_EXPORT_REQUESTED
FACE_RECOGNITION_REQUESTED
WATERMARK_REQUESTED
```

### 1.3 Job Cancel API Error

| ID | File | Error | Severity | Status |
|----|------|-------|----------|--------|
| BUG-013 | `app/api/admin/jobs/[id]/cancel/route.ts:43` | `Type '"CANCELLED"' is not assignable to type 'JobStatus'` | HIGH | **FIXED** |

**Root Cause:** Same as BUG-001 - missing `CANCELLED` in `JobStatus` enum.

**Fix Applied:** Added CANCELLED to JobStatus enum in production database

### 1.4 User Favorite API Errors

| ID | File | Error | Severity | Status |
|----|------|-------|----------|--------|
| BUG-014 | `app/api/images/route.ts:23` | `Property 'userFavorite' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |
| BUG-015 | `app/api/images/route.ts:40` | `Parameter 'fav' implicitly has an 'any' type` | MEDIUM | **FIXED** |
| BUG-016 | `app/api/images/route.ts:86` | `Property 'userFavorite' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |
| BUG-017 | `app/api/images/route.ts:93` | `Parameter 'f' implicitly has an 'any' type` | MEDIUM | **FIXED** |

| ID | File | Error | Severity | Status |
|----|------|-------|----------|--------|
| BUG-018 | `app/api/images/[id]/favorite/route.ts:17` | `Property 'userFavorite' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |
| BUG-019 | `app/api/images/[id]/favorite/route.ts:27` | `Property 'userFavorite' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |
| BUG-020 | `app/api/images/[id]/favorite/route.ts:32` | `Property 'userFavorite' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |
| BUG-021 | `app/api/images/[id]/favorite/route.ts:61` | `Property 'userFavorite' does not exist on type 'PrismaClient'` | HIGH | **FIXED** |

**Root Cause:** The `UserFavorite` model exists in the schema but the Prisma client hasn't been regenerated, or the model isn't properly exported.

**Fix Applied:** 
1. Created UserFavorite table in production database
2. Regenerated Prisma client

**Fix Required:**
1. Run `pnpm db:generate` to regenerate Prisma client
2. Check that `UserFavorite` model is properly defined
3. Add explicit types to lambda parameters

---

## 2. UX Observations & Issues

### 2.1 Authentication Flow

| ID | Observation | Severity | Status |
|----|-------------|----------|--------|
| UX-001 | Password reset requires admin approval, no self-service option for verified users | MEDIUM | BY DESIGN |
| UX-002 | Demo accounts shown on signin page, but not all roles visible | LOW | BY DESIGN |
| UX-003 | No "remember me" checkbox on login | LOW | ENHANCEMENT |

### 2.2 Admin Dashboard

| ID | Observation | Severity | Status |
|----|-------------|----------|--------|
| UX-004 | Stats use Promise.all but one failure cascades | LOW | OBSERVATION |
| UX-005 | No loading skeleton on initial load | LOW | ENHANCEMENT |
| UX-006 | No refresh button for stats | LOW | ENHANCEMENT |

### 2.3 Public Pages

| ID | Observation | Severity | Status |
|----|-------------|----------|--------|
| UX-007 | Help page has two forms but no state preservation when switching | LOW | **FIXED** |
| UX-008 | Success message doesn't auto-dismiss | LOW | **FIXED** |

**Fix Applied:** 
- UX-007: Added localStorage persistence for form state in `app/help/page.tsx`
- UX-008: Added 5-second auto-dismiss timer for success messages

### 2.4 Navigation & Routing

| ID | Observation | Severity | Status |
|----|-------------|----------|--------|
| UX-009 | No breadcrumb navigation on nested pages | LOW | ENHANCEMENT |
| UX-010 | Some admin pages accessible via direct URL without role check on client | LOW | BY DESIGN (middleware handles) |

---

## 3. Missing Features (Not Bugs)

### 3.1 Phase 7 Security Items

| ID | Item | Status |
|----|------|--------|
| MF-001 | Row Level Security (RLS) on Supabase tables | PENDING |
| MF-002 | Rate limiting middleware | PENDING |
| MF-003 | IP allowlisting | PENDING |

### 3.2 Phase 6 Intelligence

| ID | Item | Status |
|----|------|--------|
| MF-004 | Face recognition processing | PENDING |
| MF-005 | Object detection | PENDING |
| MF-006 | Vector search (pgvector) | PENDING |

---

## 4. Performance Observations

### 4.1 Potential Optimizations

| ID | Area | Observation | Priority |
|----|------|-------------|----------|
| PERF-001 | Database | Multiple Promise.all in admin page could fail entire load | MEDIUM |
| PERF-002 | Images | No image lazy loading indicators | LOW |
| PERF-003 | Jobs | Poll interval hardcoded, not configurable | LOW |

---

## 5. Fix Priority

### Immediate (Blocker)
1. **BUG-001 to BUG-013**: TypeScript errors preventing build
2. **BUG-014 to BUG-021**: Favorite feature broken

### High Priority
1. Add missing AuditAction enum values
2. Add CANCELLED to JobStatus enum
3. Regenerate Prisma client

### Medium Priority
1. UX improvements (loading states, breadcrumbs)
2. Error boundary improvements

### Low Priority
1. Performance optimizations
2. UI polish

---

## 6. Testing Notes

### Manual Testing Required

| Scenario | Page | Status |
|----------|------|--------|
| Login with admin | /auth/signin | ✅ Works |
| Login with user | /auth/signin | ✅ Works |
| Login with invalid creds | /auth/signin | ✅ Shows error |
| Password reset flow | /auth/signin | ⚠️ Needs testing |
| Help page query form | /help | ⚠️ Needs testing |
| Help page access request | /help | ⚠️ Needs testing |
| Admin dashboard | /admin | ⚠️ Needs testing |
| View audit logs | /admin/audit | ⚠️ Needs testing |

---

## 7. Recommended Actions

### Before Next Phase

1. **Run `pnpm db:generate`** to regenerate Prisma client
2. **Add missing enum values** to Prisma schema
3. **Fix TypeScript errors** to ensure build passes
4. **Test all authentication flows** manually

### For Phase 7 Hardening

1. Enable RLS on all Supabase tables
2. Add rate limiting
3. Implement proper error boundaries

---

*Last Updated: February 2026*
