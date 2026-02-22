# Scaling & Optimization Guide

**Version:** 1.0  
**Last Updated:** February 2026  

---

## 1. Performance Optimization

### 1.1 Frontend Optimization

#### Image Optimization
- **Lazy Loading**: All images use native lazy loading
- **Next.js Image**: Use `<Image />` component for automatic optimization
- **Thumbnail First**: Load smallest size first, upgrade on click
- **Progressive Loading**: Blur-up effect for thumbnails

```typescript
// Recommended image loading pattern
<Image 
  src={thumbnailUrl}
  placeholder="blur"
  blurDataURL={blurHash}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

#### Code Splitting
- **Route-based splitting**: Automatic with Next.js App Router
- **Component lazy loading**: For heavy components
- **Dynamic imports**: For modals and dialogs

```typescript
// Lazy load heavy components
const HeavyModal = dynamic(() => import('@/components/HeavyModal'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

#### Caching Strategy
- **Static assets**: Long cache with hash versioning
- **API responses**: SWR/React Query for caching
- **User data**: Session storage for non-sensitive data

### 1.2 Backend Optimization

#### Database Queries
- **Indexes**: All frequently queried fields indexed
- **Select only needed fields**: Avoid `select: *`
- **Pagination**: Always paginate large datasets
- **Batch operations**: Use `Promise.all` for parallel queries

```typescript
// Good: Select only needed fields
const images = await prisma.image.findMany({
  select: { id: true, thumbnailPath: true, title: true },
  where: { userId },
  take: 20,
  skip: offset
})

// Bad: Select everything
const images = await prisma.image.findMany({ where: { userId } })
```

#### API Response Optimization
- **Compression**: Gzip enabled by default on Vercel
- **Pagination**: Limit response size
- **Field filtering**: Allow clients to specify fields

---

## 2. Database Scaling

### 2.1 Connection Pooling

```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 2.2 Query Optimization

#### N+1 Problem Prevention
```typescript
// Bad: N+1 queries
const users = await prisma.user.findMany()
for (const user of users) {
  const images = await prisma.image.findMany({ where: { userId: user.id } })
}

// Good: Include relations
const users = await prisma.user.include({
  images: { take: 10 }
})
```

### 2.3 Indexing Strategy

| Table | Indexes | Query Pattern |
|-------|---------|---------------|
| Image | userId, status, createdAt | Gallery queries |
| Project | ownerId | User projects |
| Album | ownerId, projectId | Album listing |
| Job | status, type, createdAt | Job processing |
| AuditLog | userId, action, createdAt | Audit queries |

---

## 3. Job Processing Optimization

### 3.1 Batch Configuration

#### High-Throughput Server
```typescript
// For powerful servers
startJobRunner({
  batchSize: 10,
  pollInterval: 2000,  // 2 seconds
  maxRetries: 3
})
```

#### Low-Resource Server
```typescript
// For small servers
startJobRunner({
  batchSize: 2,
  pollInterval: 10000,  // 10 seconds
  maxRetries: 3
})
```

### 3.2 Job Priorities

| Priority | Job Types | Weight |
|----------|-----------|--------|
| Critical | Thumbnail, Preview | 10 |
| High | EXIF Enrichment | 5 |
| Medium | Offload, Cleanup | 1 |
| Low | Optimization | 0 |

### 3.3 Parallel Processing

```typescript
// Process multiple jobs in parallel
const jobs = await getPendingJobs(batchSize)

await Promise.all(
  jobs.map(job => processJob(job))
)
```

---

## 4. Storage Optimization

### 4.1 Thumbnail Strategy

| Size | Use Case | Format |
|------|----------|--------|
| 64px | Grid view | JPEG Q80 |
| 128px | Thumbnails | JPEG Q80 |
| 256px | Medium view | JPEG Q85 |
| 512px | Large view | JPEG Q85 |
| 2000px | Previews | JPEG Q85 |

### 4.2 Storage Backends

#### Local Filesystem (Development)
- Simple setup
- No additional cost
- Limited scalability

#### Supabase Storage (Production)
- S3-compatible
- CDN integration
- Automatic scaling

```typescript
// Storage backend selection
const storage = process.env.SUPABASE_URL 
  ? new SupabaseStorage()
  : new LocalStorage()
```

### 4.3 Cleanup Strategies

```sql
-- Cleanup old completed jobs
DELETE FROM job 
WHERE status = 'COMPLETED' 
  AND updated_at < NOW() - INTERVAL '30 days';

-- Cleanup orphaned temp files
DELETE FROM image 
WHERE status = 'FAILED' 
  AND created_at < NOW() - INTERVAL '7 days';
```

---

## 5. Caching Strategy

### 5.1 Application Cache

| Data | Cache Strategy | TTL |
|------|---------------|-----|
| User session | JWT (stateless) | 30 days |
| Image metadata | React Query | 5 minutes |
| Project list | React Query | 1 minute |
| System stats | API cache | 30 seconds |

### 5.2 Static Assets

```
/_next/static/*     -> Long-term cache (1 year)
/images/*          -> Hash-based versioning
/thumbnails/*      -> CDN cache (1 day)
```

### 5.3 API Caching

```typescript
// ISR for stable data
export const revalidate = 60  // Revalidate every 60 seconds

// Or caching headers
export async function GET(request: NextRequest) {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

---

## 6. Vercel Optimization

### 6.1 Serverless Function Settings

```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30,
      "runtime": "nodejs18.x"
    }
  }
}
```

### 6.2 Edge Functions

For simple operations, use Edge functions:
- Authentication checks
- Rate limiting
- Redirects

### 6.3 Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  }
}
```

---

## 7. Horizontal Scaling

### 7.1 Multi-Instance Setup

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Vercel 1   │     │  Vercel 2   │     │  Vercel N   │
│  (Node.js)  │     │  (Node.js)  │     │  (Node.js)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL  │
                    │  (Database)  │
                    └──────────────┘
```

### 7.2 Job Distribution

- **Advisory Locking**: Prevents duplicate processing
- **Shared Database**: All instances use same DB
- **Stateless Sessions**: JWT for user sessions

```typescript
// Job locking mechanism
const acquireLock = async (jobId: string, workerId: string) => {
  const result = await prisma.job.updateMany({
    where: { id: jobId, lockedAt: null },
    data: { lockedAt: new Date(), lockedBy: workerId }
  })
  return result.count > 0
}
```

### 7.3 Load Balancing

- **Vercel**: Automatic global load balancing
- **CDN**: Static asset distribution
- **Database**: Connection pooling

---

## 8. Monitoring & Performance

### 8.1 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Page load time | < 2s | > 5s |
| API response | < 500ms | > 2s |
| Job success rate | > 99% | < 95% |
| Error rate | < 1% | > 5% |

### 8.2 Vercel Analytics

- Web Vitals tracking
- Server timing
- Function invocations

### 8.3 Custom Metrics

```typescript
// Track custom metrics
export function trackMetric(name: string, value: number) {
  console.log(`[METRIC] ${name}:`, value)
}
```

---

## 9. Capacity Planning

### 9.1 User Estimates

| Plan | Storage | Users | Images |
|------|---------|-------|--------|
| Free | 5 GB | 10 | 1,000 |
| Pro | 100 GB | 100 | 20,000 |
| Business | 1 TB | 1,000 | 200,000 |

### 9.2 Resource Requirements

| Workload | CPU | Memory | Storage |
|----------|-----|--------|---------|
| 10 users | 0.5 core | 512 MB | 10 GB |
| 100 users | 2 cores | 2 GB | 100 GB |
| 1000 users | 8 cores | 8 GB | 1 TB |

### 9.3 Cost Estimation

| Resource | Free Tier | Paid |
|----------|-----------|------|
| Vercel | 100 GB-hrs | $20+/mo |
| Supabase | 500 MB | $25+/mo |
| PostgreSQL | $0 | $15+/mo |

---

## 10. Optimization Checklist

### Performance
- [ ] Images optimized with Next.js Image
- [ ] Lazy loading enabled
- [ ] Code splitting configured
- [ ] API responses paginated

### Database
- [ ] Indexes on frequently queried fields
- [ ] Connection pooling configured
- [ ] Query optimization applied

### Jobs
- [ ] Batch size tuned for workload
- [ ] Poll interval optimized
- [ ] Dead letter queue implemented

### Caching
- [ ] Static assets cached
- [ ] API responses cached
- [ ] React Query configured

### Monitoring
- [ ] Performance metrics tracked
- [ ] Error alerting configured
- [ ] Logs centralized

---

## 11. Common Issues & Solutions

### High Memory Usage
- Reduce job batch size
- Increase poll interval
- Use smaller thumbnail sizes

### Slow Database Queries
- Add missing indexes
- Optimize N+1 queries
- Implement pagination

### Rate Limiting
- Cache expensive operations
- Implement request coalescing
- Use CDN for static assets

### Cold Starts (Vercel)
- Keep functions warm with cron
- Reduce function size
- Use Edge for simple operations

---

*Last Updated: February 2026*
