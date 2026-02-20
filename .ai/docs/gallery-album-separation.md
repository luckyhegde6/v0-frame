# Gallery vs Album Separation Architecture

**Version**: 1.0.0  
**Last Updated**: 2026-02-19  
**Status**: Approved  

---

## Problem Statement

Previously, images uploaded to albums were owned by the uploading user (`userId`) and appeared in their personal Gallery. This caused:
1. Album images showing in user's Gallery view
2. Deleting from Gallery removing images from albums
3. Confusion between personal gallery and project albums

---

## Solution Overview

Separate image ownership into two distinct storage types:
- **GALLERY**: Personal user images (directly owned, not in albums)
- **ALBUM**: Project-scoped album images (owned by album context)

---

## Database Schema Changes

### New Enum

```prisma
enum StorageType {
  GALLERY    // Personal gallery images
  ALBUM      // Album-specific images
}
```

### Updated Image Model

```prisma
model Image {
  id        String      @id @default(cuid())
  status    ImageStatus
  title     String?
  
  // Storage type determines ownership context
  storageType  StorageType @default(GALLERY)
  
  // Phase 1: Required for ingestion
  tempPath  String
  checksum  String      @unique
  mimeType  String
  width     Int
  height    Int
  sizeBytes Int
  
  // Phase 2: Derived assets
  thumbnailPath   String?
  previewPath     String?
  
  // Ownership - context depends on storageType
  // GALLERY: userId is the owner
  // ALBUM: userId is uploader, but albumId determines context
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Album context (only set when storageType = ALBUM)
  albumId         String?
  album           Album?   @relation(fields: [albumId], references: [id], onDelete: Cascade)
  
  // Project context (for both types)
  projectId       String?
  
  // EXIF metadata
  make            String?
  model           String?
  exposureTime    String?
  fNumber         Float?
  iso             Int?
  focalLength     Float?
  lensModel       String?
  software        String?
  dateTaken       DateTime?
  lat             Float?
  lng             Float?
  alt             Float?
  
  // Relations
  collections     Collection[]
  jobs            Job[]
  projectImages   ProjectImage[]
  
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  @@index([storageType])
  @@index([userId])
  @@index([albumId])
  @@index([projectId])
  @@index([createdAt])
}
```

### Updated Album Model

```prisma
model Album {
  id          String       @id @default(cuid())
  name        String
  description String?
  category    AlbumCategory @default(PHOTO_ALBUM)
  
  // Ownership
  ownerId     String
  owner       User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  // Project relation
  projectId   String?
  project     Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)
  
  // Relations - images now directly owned by album
  images      Image[]      // Direct images (storageType = ALBUM)
  settings    AlbumSettings?
  clientAccess ClientAlbumAccess[]
  
  coverImage  String?
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([name, ownerId])
  @@index([ownerId])
  @@index([projectId])
}
```

---

## Storage Path Conventions

### Gallery Images
```
storage/user/{userId}/Gallery/images/{imageId}.{ext}
```

### Album Images
```
storage/projects/{projectId}/albums/{albumId}/{imageId}.{ext}
```

---

## API Behavior Changes

### Upload API (`/api/upload`)

| Parameter | StorageType | Ownership | Storage Path |
|-----------|-------------|-----------|--------------|
| No project/album | GALLERY | userId | `user/{userId}/Gallery/images/` |
| projectId only | GALLERY | userId | `user/{userId}/Gallery/images/` |
| albumId provided | ALBUM | albumId context | `projects/{projectId}/albums/{albumId}/` |

### Gallery API (`/api/images`)

```typescript
// Only returns storageType = GALLERY images
const images = await prisma.image.findMany({
  where: {
    userId: session.user.id,
    storageType: 'GALLERY'
  }
})
```

### Album Images API (`/api/albums/{id}/images`)

```typescript
// Returns images where albumId = requested album
// These images have storageType = ALBUM
const images = await prisma.image.findMany({
  where: {
    albumId: albumId
  }
})
```

---

## Delete Behavior

### Delete from Gallery
- Deletes the image record
- Only affects GALLERY type images
- Does NOT affect album images

### Delete from Album
- Removes image from album
- For ALBUM type images: deletes the image record
- For shared/copy scenarios: removes the album link only

---

## Migration Strategy

### Phase 1: Schema Update
1. Add `StorageType` enum
2. Add `storageType` field with default `GALLERY`
3. Add `albumId` field (nullable)
4. Create relation to Album

### Phase 2: Data Migration
```sql
-- Set existing album images to ALBUM type
UPDATE "Image"
SET "storageType" = 'ALBUM',
    "albumId" = ai."albumId"
FROM "AlbumImage" ai
WHERE "Image".id = ai."imageId";

-- Remove AlbumImage junction table entries (no longer needed)
-- After migration, drop AlbumImage table
```

### Phase 3: API Updates
1. Update upload API to set storageType
2. Update gallery API to filter by storageType
3. Update album images API
4. Update delete logic

---

## Access Control Matrix

| Action | Gallery Owner | Album Owner | Project Owner | ADMIN | SUPERADMIN |
|--------|---------------|-------------|---------------|-------|------------|
| View Gallery | ✅ Own only | ❌ | ❌ | ✅ All | ✅ All |
| Upload to Gallery | ✅ | ❌ | ❌ | ✅ | ✅ |
| Delete from Gallery | ✅ Own | ❌ | ❌ | ✅ | ✅ |
| View Album | ❌ | ✅ | ✅ | ✅ All | ✅ All |
| Upload to Album | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete from Album | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## Benefits

1. **Clear Separation**: Gallery and Album images are completely independent
2. **Simplified Deletion**: Deleting from gallery doesn't affect albums
3. **Better Organization**: Each album owns its images
4. **Storage Isolation**: Different storage paths for different contexts
5. **Permission Clarity**: Clear ownership model

---

## Breaking Changes

1. **AlbumImage Junction Table**: Will be deprecated after migration
2. **Image.userId**: Now represents uploader, not necessarily owner
3. **Gallery API**: Will only return GALLERY type images
4. **Upload Response**: Will include `storageType` field

---

## Rollback Plan

If issues arise:
1. Revert API changes
2. Keep `storageType` field (default GALLERY maintains compatibility)
3. Images can still be accessed via AlbumImage junction table

---

## Testing Checklist

- [ ] Gallery shows only GALLERY images
- [ ] Albums show only their images
- [ ] Upload to gallery creates GALLERY image
- [ ] Upload to album creates ALBUM image
- [ ] Delete from gallery doesn't affect albums
- [ ] Delete from album removes image correctly
- [ ] ADMIN can see all images
- [ ] Storage paths are correct

---

**Document Status**: Approved for Implementation  
**Target Completion**: Phase 4 Enhancement
