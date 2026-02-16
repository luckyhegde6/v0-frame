# Phase 4 — Professional Projects Contracts

**Status**: IN PROGRESS  
**Version**: 1.1.0  
**Phase**: 4 – Projects & Sharing  
**Last Updated**: 2026-02-17

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

### Database Schema

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  quotaBytes  BigInt   @default(10737418240) // 10GB default
  storageUsed BigInt   @default(0)
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  images      ProjectImage[]
  shareTokens ShareToken[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([name, ownerId])
  @@index([ownerId])
}

model ProjectImage {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  imageId   String
  image     Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  addedAt   DateTime @default(now())

  @@unique([projectId, imageId])
  @@index([projectId])
  @@index([imageId])
}

model ShareToken {
  id          String    @id @default(cuid())
  token       String    @unique
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  expiresAt   DateTime?
  maxAccesses Int?
  accessCount Int       @default(0)
  createdAt   DateTime  @default(now())
  createdById String

  @@index([projectId])
  @@index([token])
}
```

### Filesystem

```
/users/{userId}/projects/{projectId}/
```

---

## Client Access Contract

- Read-only
- Token-based with optional expiry
- Token has optional max access limits
- No upload
- No delete

### Share Token Flow

1. Owner generates share token via UI
2. Token created with optional expiry and max accesses
3. Client receives share link: `/share/{token}`
4. Client can view project images (read-only)
5. Token access is logged

---

## Storage Quota Contract

- Default quota: 10GB per project
- quotaBytes: Total storage allowed
- storageUsed: Current bytes used
- Calculated from all images in project
- API prevents upload when quota exceeded

---

## API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Project Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/images` | List project images |
| POST | `/api/projects/:id/images` | Add image to project |
| DELETE | `/api/projects/:id/images/:imageId` | Remove image from project |

### Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:id/share` | Generate share token |
| DELETE | `/api/projects/:id/share/:tokenId` | Revoke share token |
| GET | `/api/share/:token` | Access shared project (public) |

---

## Agent Rejection Criteria

- Cross-project access
- Client uploads
- Shared project directories
- Exceeding quota without warning
