# Bug Fixes Summary

**Date:** February 22, 2026  
**Status:** All Critical Bugs Fixed

---

## Fixed Issues

### 1. Login Error - JobStatus CANCELLED Enum
**Issue:** Login failed with `Invalid input value: invalid input value for enum "JobStatus": "CANCELLED"`

**Root Cause:** Production database missing `CANCELLED` value in `JobStatus` enum

**Fix Applied:**
- Added `CANCELLED` to `JobStatus` enum in production database via SQL

### 2. Admin Dashboard - ProRequest Table Missing
**Issue:** Admin page threw error about `proRequest` relation not existing

**Root Cause:** `ProRequest` table didn't exist in production database

**Fix Applied:**
- Created `ProRequest` table in production database with all required columns and indexes

### 3. User Favorite Feature - UserFavorite Table Missing  
**Issue:** API routes failed with `Property 'userFavorite' does not exist on type 'PrismaClient'`

**Root Cause:** `UserFavorite` table didn't exist in production database

**Fix Applied:**
- Created `UserFavorite` table in production database with foreign keys and indexes

### 4. Audit Action Types - Missing Enum Values
**Issue:** TypeScript errors for various audit action types not in enum

**Root Cause:** Production database missing audit action enum values

**Fix Applied:** Added to production database:
- `JOB_RETRY`
- `JOB_CANCELLED`
- `JOB_FORCE_RUN`
- `IMAGE_DOWNLOADED`
- `ALBUM_DOWNLOADED`
- `PRO_REQUEST_SUBMITTED`
- `PROJECT_EXPORT_REQUESTED`
- `FACE_RECOGNITION_REQUESTED`
- `WATERMARK_REQUESTED`

### 5. TypeScript Errors - Storage Route
**Issue:** `groupBy` query had incorrect typing in `app/api/admin/storage/route.ts`

**Fix Applied:**
- Removed incorrect type casting
- Fixed groupBy query to use proper Prisma types

### 6. TypeScript Errors - Test Mock
**Issue:** Test file had incorrect mock setup in `__tests__/app/api/requests/route.test.ts`

**Fix Applied:**
- Changed mock to use `vi.fn().mockResolvedValue()` instead of importing auth

### 7. UX Bug - Help Form State Preservation
**Issue:** Form data lost when switching between "Ask a Question" and "Request Access" tabs

**Fix Applied:**
- Added localStorage persistence for both forms in `app/help/page.tsx`

### 8. UX Bug - Success Message Auto-Dismiss
**Issue:** Success messages stayed on screen indefinitely

**Fix Applied:**
- Added 5-second auto-dismiss timer in `app/help/page.tsx`

---

## Files Modified

| File | Change |
|------|--------|
| `app/help/page.tsx` | Added localStorage persistence + auto-dismiss |
| `app/api/admin/storage/route.ts` | Fixed TypeScript error |
| `__tests__/app/api/requests/route.test.ts` | Fixed mock setup |
| `AGENTS.md` | Updated MCP docs + agent safety note |
| `.ai/mcp/mcp-config.json` | Updated Supabase MCP config |
| `BUGS.md` | Marked all fixed bugs |
| `PHASE6.md` | Created Phase 6 implementation plan |

---

## Database Changes Applied

All changes applied directly to production database (Supabase):
- Enum value additions
- Table creations (ProRequest, UserFavorite)
- Index and foreign key creation

**Note:** Local database may need syncing with `pnpm db:push` for local development.
