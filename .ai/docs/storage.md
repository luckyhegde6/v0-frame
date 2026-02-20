# Storage Architecture & Conventions

**Version**: 3.0.0  
**Last Updated**: 2026-02-20

---

## Overview

FRAME supports multiple storage backends:
- **Local Filesystem** (development/Windows)
- **Supabase Storage** (production/Vercel serverless)
- **Cloud R2/S3** (future alternative)

This document defines the canonical storage structure, naming conventions, and bucket organization.

---

## Storage Backend Detection

The system automatically detects the storage backend based on environment variables:

```typescript
// lib/storage/index.ts
export const USE_SUPABASE_STORAGE = isStorageConfigured()

// Checks for:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
```

### Backend Priority
1. **Supabase Storage** - When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
2. **Local Filesystem** - Fallback for development

---

## Supabase Storage (Vercel/Production)

Supabase Storage is the recommended backend for Vercel deployments because:
- **Serverless-compatible**: No filesystem dependencies
- **CDN-backed**: Fast global delivery
- **Built-in transforms**: Image resizing/optimization
- **Signed URLs**: Secure temporary access

### Bucket Structure

```typescript
// lib/storage/supabase.ts
export const BUCKETS = {
  TEMP: 'temp',           // Ephemeral uploads
  USER_GALLERY: 'user-gallery',   // User personal images
  PROJECT_ALBUMS: 'project-albums', // Project album media
  THUMBNAILS: 'thumbnails',   // Generated thumbnails (public)
  PROCESSED: 'processed',     // Processed images
} as const
```

### Bucket Configuration

| Bucket | Public | Purpose | Retention |
|--------|--------|---------|-----------|
| `temp` | No | Upload staging | 24-48 hours |
| `user-gallery` | No | User gallery images | Permanent |
| `project-albums` | No | Project album media | Permanent |
| `thumbnails` | Yes | Pre-generated thumbnails | Permanent |
| `processed` | No | Quality-adjusted images | Permanent |

### Creating Buckets (SQL)

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('temp', 'temp', false),
  ('user-gallery', 'user-gallery', false),
  ('project-albums', 'project-albums', false),
  ('thumbnails', 'thumbnails', true),
  ('processed', 'processed', false)
ON CONFLICT (id) DO NOTHING;
```

### Storage API Usage

```typescript
import { storeFile, storeBuffer, retrieveFile, getFileUrl } from '@/lib/storage'

// Store a file from local path
const result = await storeFile(tempPath, {
  bucket: BUCKETS.USER_GALLERY,
  path: `${userId}/Gallery/images/${imageId}.jpg`,
  contentType: 'image/jpeg',
})

// Store a buffer (for thumbnails/processed)
const thumbResult = await storeBuffer(thumbBuffer, {
  bucket: BUCKETS.THUMBNAILS,
  path: `${imageId}/thumb-512.jpg`,
  contentType: 'image/jpeg',
})

// Get public URL for thumbnail
const url = await getFileUrl({
  bucket: BUCKETS.THUMBNAILS,
  path: `${imageId}/thumb-512.jpg`,
})

// Get signed URL for private file
const signedUrl = await getFileUrl({
  bucket: BUCKETS.USER_GALLERY,
  path: `${userId}/Gallery/images/${imageId}.jpg`,
}, 3600) // 1 hour expiry
```

### Environment Variables

```bash
# Required for Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...  # Server-side operations
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...         # Client-side (optional)
```

---

## Storage Types

FRAME uses two distinct storage types with separate ownership models:

| StorageType | Ownership | Location | API Endpoint |
|-------------|-----------|----------|--------------|
| `GALLERY` | User-owned | `user/{userId}/Gallery/` | `/api/images` |
| `ALBUM` | Album-owned | `projects/{projectId}/albums/{albumId}/` | `/api/albums/{id}/images` |

### Gallery Images
- Personal user images not part of any project
- Owned by the uploading user
- Appear only in user's gallery view
- Can be organized into Collections

### Album Images
- Project-scoped media uploaded to specific albums
- Owned by the album context (not user's gallery)
- Appear only in the album view
- Do NOT appear in user's gallery

---

## Storage Structure

### Root Directory

```
storage/
├── temp/              # Temporary uploads (ephemeral)
├── user/              # User gallery images
├── projects/          # Project-based media
├── thumbnails/        # Generated thumbnails
├── processed/        # Compressed/processed images
├── tasks/            # Processing job files
└── bin/              # Soft-deleted files (30-day retention)
```

---

## Environment-Specific Paths

### Local Development (Windows)

```typescript
// Base storage directory
const STORAGE_DIR = process.env.STORAGE_DIR || 'F:\\Local_git\\v0-frame\\storage'

// Structure
storage/
├── temp/ingest/{imageId}.{ext}
├── user/{userId}/Gallery/images/{imageId}.{ext}
├── projects/{projectId}/albums/{albumId}/{imageId}.{ext}
├── thumbnails/{imageId}/thumb-128.jpg
├── thumbnails/{imageId}/thumb-256.jpg
├── thumbnails/{imageId}/thumb-512.jpg
├── processed/{imageId}/{quality}.{ext}
├── tasks/{jobId}/input/
├── tasks/{jobId}/output/
└── bin/{originalPath}/{imageId}.{ext}
```

### Linux Server (Production)

```typescript
// Base storage directory
const STORAGE_DIR = process.env.STORAGE_DIR || '/var/frame/storage'

// Same structure as Windows
storage/
├── temp/ingest/{imageId}.{ext}
├── user/{userId}/Gallery/images/{imageId}.{ext}
├── projects/{projectId}/albums/{albumId}/{imageId}.{ext}
├── thumbnails/{imageId}/thumb-128.jpg
├── thumbnails/{imageId}/thumb-256.jpg
├── thumbnails/{imageId}/thumb-512.jpg
├── processed/{imageId}/{quality}.{ext}
├── tasks/{jobId}/input/
├── tasks/{jobId}/output/
└── bin/{originalPath}/{imageId}.{ext}
```

### Cloud R2/S3 (Future)

```typescript
// Bucket naming convention
const BUCKET_PREFIX = process.env.BUCKET_PREFIX || 'frame'

// R2/S3 Structure
frame-temp/              # Temporary uploads
frame-user/              # User gallery images
frame-projects/          # Project-based media  
frame-thumbnails/        # Generated thumbnails
frame-processed/         # Compressed/processed images
frame-tasks/             # Processing job files
frame-bin/               # Soft-deleted files
```

---

## Bucket/Path Naming Conventions

### 1. Temporary Storage (`temp/` or `frame-temp/`)

**Purpose**: Ephemeral storage for uploaded files during ingestion

**Naming**: `{imageId}.{extension}`

**Examples**:
```
temp/ingest/img_2026-02-19_abc123.jpg
temp/ingest/img_2026-02-19_def456.png
```

**Retention**: 24-48 hours, then auto-cleanup

---

### 2. User Gallery (`user/` or `frame-user/`)

**Purpose**: Individual user's personal gallery images

**Naming**: `{userId}/Gallery/images/{imageId}.{extension}`

**Examples**:
```
user/user_abc123/Gallery/images/img_2026-02-19_abc123.jpg
user/user_abc123/Gallery/images/img_2026-02-19_def456.png
user/user_def456/Gallery/images/img_2026-02-19_ghi789.webp
```

---

### 3. Project Albums (`projects/` or `frame-projects/`)

**Purpose**: Project-scoped album media

**Naming**: `projects/{projectId}/albums/{albumId}/{imageId}.{extension}`

**Examples**:
```
projects/proj_abc123/albums/album_wedding/images/img_001.jpg
projects/proj_abc123/albums/album_ceremony/images/img_002.jpg
projects/proj_abc123/albums/album_reception/images/img_003.png
```

---

### 4. Thumbnails (`thumbnails/` or `frame-thumbnails/`)

**Purpose**: Pre-generated thumbnails for faster loading

**Naming**: `{imageId}/{size}.jpg`

**Sizes**:
- `thumb-128.jpg` - 128px (grid view)
- `thumb-256.jpg` - 256px (preview)
- `thumb-512.jpg` - 512px (detail view)

**Examples**:
```
thumbnails/img_abc123/thumb-128.jpg
thumbnails/img_abc123/thumb-256.jpg
thumbnails/img_abc123/thumb-512.jpg
```

---

### 5. Processed (`processed/` or `frame-processed/`)

**Purpose**: Compressed or quality-adjusted images

**Naming**: `{imageId}/{quality}.{extension}`

**Quality Levels**:
- `original` - Original quality
- `high` - 4000px max dimension
- `medium` - 2560px max dimension
- `low` - 1920px max dimension

**Examples**:
```
processed/img_abc123/original.jpg
processed/img_abc123/high.jpg
processed/img_abc123/medium.jpg
processed/img_abc123/low.jpg
```

---

### 6. Tasks (`tasks/` or `frame-tasks/`)

**Purpose**: Temporary processing files for background jobs

**Naming**: `tasks/{jobId}/{stage}/`

**Stages**:
- `input/` - Original file for processing
- `output/` - Processed result
- `temp/` - Intermediate files

**Examples**:
```
tasks/job_abc123/input/image.jpg
tasks/job_abc123/output/processed.jpg
tasks/job_abc123/temp/intermediate.png
```

---

### 7. Bin (`bin/` or `frame-bin/`)

**Purpose**: Soft-deleted files retained for recovery

**Naming**: `{originalPath}/{imageId}.{extension}`

**Retention**: 30 days (configurable), then permanent deletion

**Examples**:
```
bin/projects/proj_abc123/albums/album_wedding/img_001.jpg
bin/user/user_abc123/Gallery/images/img_002.jpg
```

---

## Image ID Generation

```typescript
// Deterministic image ID format
// {prefix}_{date}_{shortHash}.{ext}

// Examples:
// img_2026-02-19_a1b2c3d4.jpg
// img_2026-02-19_e5f6g7h8.png

function generateImageId(originalName: string): string {
  const date = new Date().toISOString().split('T')[0]
  const hash = crypto.randomBytes(4).toString('hex')
  const ext = path.extname(originalName).toLowerCase().slice(1)
  return `img_${date}_${hash}.${ext}`
}
```

---

## Storage Operations

### File Paths (Local)

```typescript
import path from 'path'

function getStoragePath(type: StorageType, params: StorageParams): string {
  const { STORAGE_DIR } = process.env
  
  switch (type) {
    case 'temp':
      return path.join(STORAGE_DIR, 'temp', 'ingest', params.fileName)
      
    case 'user':
      return path.join(
        STORAGE_DIR, 
        'user', 
        params.userId, 
        'Gallery', 
        'images',
        params.fileName
      )
      
    case 'project':
      return path.join(
        STORAGE_DIR,
        'projects',
        params.projectId,
        'albums',
        params.albumId,
        params.fileName
      )
      
    case 'thumbnail':
      return path.join(
        STORAGE_DIR,
        'thumbnails',
        params.imageId,
        `thumb-${params.size}.jpg`
      )
      
    case 'processed':
      return path.join(
        STORAGE_DIR,
        'processed',
        params.imageId,
        `${params.quality}.${params.extension}`
      )
      
    case 'task':
      return path.join(
        STORAGE_DIR,
        'tasks',
        params.jobId,
        params.stage,
        params.fileName
      )
      
    case 'bin':
      return path.join(
        STORAGE_DIR,
        'bin',
        params.originalPath,
        params.fileName
      )
  }
}
```

### S3/R2 Paths (Cloud)

```typescript
function getS3Key(type: StorageType, params: StorageParams): string {
  switch (type) {
    case 'temp':
      return `temp/ingest/${params.fileName}`
      
    case 'user':
      return `user/${params.userId}/Gallery/images/${params.fileName}`
      
    case 'project':
      return `projects/${params.projectId}/albums/${params.albumId}/${params.fileName}`
      
    case 'thumbnail':
      return `thumbnails/${params.imageId}/thumb-${params.size}.jpg`
      
    case 'processed':
      return `processed/${params.imageId}/${params.quality}.${params.extension}`
      
    case 'task':
      return `tasks/${params.jobId}/${params.stage}/${params.fileName}`
      
    case 'bin':
      return `bin/${params.originalPath}/${params.fileName}`
  }
}
```

---

## Cleanup Policies

| Storage Type | Retention | Trigger |
|-------------|-----------|---------|
| temp/ingest | 24-48 hours | Scheduled cron |
| bin/ | 30 days | Scheduled cron (ADMIN configurable) |
| tasks/*/temp | Job completion | Job handler |
| processed/ | Permanent | N/A |
| thumbnails/ | Permanent | N/A |

---

## Environment Variables

```bash
# Storage Configuration
STORAGE_DIR=/path/to/storage          # Local: filesystem path
STORAGE_BACKEND=local                  # local | s3 | r2

# S3/R2 Configuration (when using cloud)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=frame-storage
R2_ACCOUNT_ID=                         # For Cloudflare R2
R2_BUCKET_NAME=frame-storage

# Cleanup Configuration
TEMP_FILE_TTL_HOURS=24
BIN_RETENTION_DAYS=30
```

---

## Migration Notes

### From Local to R2/S3

1. Update `STORAGE_BACKEND` to `r2` or `s3`
2. Configure cloud credentials
3. Run migration script to copy existing files
4. Update file paths in database (if stored)

### Bucket Setup (R2/S3)

```bash
# Create buckets
r2 bucket create frame-temp
r2 bucket create frame-user
r2 bucket create frame-projects
r2 bucket create frame-thumbnails
r2 bucket create frame-processed
r2 bucket create frame-tasks
r2 bucket create frame-bin

# Or use single bucket with prefixes
r2 bucket create frame-storage
```

---

## Album vs Gallery Separation

### Key Principles

1. **Separate Storage**: Gallery and Album images are completely independent
2. **Separate Ownership**: Gallery images are user-owned, Album images are album-owned
3. **Separate APIs**: Different endpoints for different contexts
4. **No Cross-Contamination**: Deleting from Gallery does NOT affect albums

### StorageType Enum

```prisma
enum StorageType {
  GALLERY    // Personal gallery images (user-owned)
  ALBUM      // Album-specific images (album-owned)
}
```

### Database Relations

```
Image
├── storageType: GALLERY | ALBUM
├── userId: String (always set - the uploader)
├── albumId: String? (only set when storageType = ALBUM)
└── album: Album? (relation to owning album)
```

### Storage Paths

| Type | Path Pattern |
|------|--------------|
| Gallery | `storage/user/{userId}/Gallery/images/{imageId}.{ext}` |
| Album | `storage/projects/{projectId}/albums/{albumId}/{imageId}.{ext}` |

### API Endpoints

| Action | Gallery API | Album API |
|--------|-------------|-----------|
| List | `GET /api/images` | `GET /api/albums/{id}/images` |
| Upload | `POST /api/upload` (no albumId) | `POST /api/upload?albumId=X` |
| Delete | `DELETE /api/images/{id}` | `DELETE /api/albums/{id}/images` |

### Admin Access

- `/admin/gallery` - View all GALLERY type images
- `/admin/albums` - Manage albums and their ALBUM type images

### Migration from Junction Table

Previously, images used a many-to-many relationship via `AlbumImage` junction table.
New architecture uses direct ownership:

**Before:**
```typescript
Image.userId = owner
AlbumImage = { albumId, imageId } // junction table
```

**After:**
```typescript
Image.storageType = 'ALBUM'
Image.albumId = owning album
Image.userId = uploader (not owner)
```

See `.ai/docs/gallery-album-separation.md` for full migration details.
