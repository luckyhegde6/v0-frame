# AGENTS.md - AI Agent Guidelines

This document provides guidelines for AI agents working on this FRAME image gallery application.

## Project Overview

- **Framework**: Next.js 16.1.5 + React 19 + TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Package Manager**: pnpm
- **Architecture**: Async job-based image processing pipeline

## Build Commands

```bash
# Development
pnpm dev                    # Start development server (Next.js)
pnpm local                  # Full local setup: docker + db + seed + dev

# IMPORTANT: Always kill the dev server after debugging/testing
# Run "pnpm dev" in background, then kill when done:
#   Windows: taskkill /F /IM node.exe   OR   npx kill-port 3000
#   Linux/Mac: pkill -f "next dev"      OR   npx kill-port 3000
# Failing to do so will cause port/lock conflicts:
#   "Port 3000 is in use" / "Unable to acquire lock"

# Build
pnpm build                  # Production build (includes db:generate)

# Linting
pnpm lint                   # Run ESLint on entire codebase

# Database
pnpm db:push                # Push Prisma schema to database
pnpm db:generate            # Generate Prisma client
pnpm db:seed                # Run database seeders
pnpm db:studio              # Open Prisma Studio GUI
pnpm db:ensure-admin        # Ensure SUPERADMIN exists (from ADMIN_EMAIL/ADMIN_PASSWORD env vars)

# Docker
pnpm docker:up              # Start PostgreSQL container
pnpm docker:down            # Stop containers
pnpm docker:clean           # Remove volumes and orphans

# Installation
pnpm install                # Install dependencies (auto-runs prisma generate)

# Testing
pnpm test                  # Run tests in watch mode
pnpm test:run             # Run tests once
pnpm test:coverage        # Run tests with coverage report
pnpm test:ui              # Run tests with UI
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - Always use proper types, no `any` without justification
- Use interfaces for props: `interface ComponentProps { ... }`
- Prefer type inference for simple cases, explicit types for APIs
- Target: ES6, Module: ESNext

### Imports

```typescript
// 1. React/Next imports first
import { useState, useEffect } from 'react'
import { NextRequest, NextResponse } from 'next/server'

// 2. Third-party libraries
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

// 3. Absolute project imports (use @/* alias)
import prisma from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// 4. Relative imports (only when necessary)
import { siblingUtil } from './utils'
```

### Formatting

- **Single quotes** for strings and imports
- **No semicolons** (except when required)
- **2 spaces** indentation
- **Trailing commas** in multi-line objects/arrays
- Line width: ~100 characters

### Naming Conventions

- **Components**: PascalCase (`ImageCard`, `GalleryPage`)
- **Functions**: camelCase (`fetchImages`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Files**: kebab-case (`image-card.tsx`, `route.ts`)
- **Database models**: PascalCase in Prisma, camelCase in code
- **Environment variables**: UPPER_SNAPE_CASE with appropriate prefix

### React Components

```typescript
'use client'  // Always add for client components (server is default)

interface ImageCardProps {
  id: string
  title: string
  isLoading?: boolean  // Optional props use ?
}

export function ImageCard({ id, title, isLoading = false }: ImageCardProps) {
  // Component logic
  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}
```

### API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.model.findMany()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Operation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Error Handling

- Always wrap async operations in try/catch
- Use the centralized error handler from `@/lib/error-handler.tsx`
- Critical errors: Use `logCritical()` - logs to console and shows toast
- Regular errors: Use `logError()` - logs to console
- User-facing errors: Use `handleApiError()` - shows toast and logs
- Use `showNonBlockingError()` for non-critical errors that should show as toast
- Return user-friendly error messages in API responses
- Use early returns to reduce nesting

```typescript
// API route error handling
import { logCritical, handleApiError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.model.findMany()
    return NextResponse.json({ data })
  } catch (error) {
    logCritical('Failed to fetch data', 'APIEndpoint', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// Client-side error handling
import { handleApiError, showSuccess } from '@/lib/error-handler'

const handleSubmit = async () => {
  try {
    await apiCall()
    showSuccess('Operation successful')
  } catch (error) {
    handleApiError(error, 'OperationName')
  }
}
```

### Styling (Tailwind CSS)

- Use `@/lib/utils` `cn()` helper for conditional classes
- Prefer semantic color tokens: `bg-primary`, `text-foreground`
- Custom colors defined in `app/globals.css`
- Primary: `#00D9FF` (cyan)
- Dark theme is default

```typescript
// Good
className={cn(
  "bg-card border border-border rounded-lg",
  isActive && "border-primary",
  className
)}
```

### Prisma/Database

- Always use transactions for multi-step operations
- Include related data with `include` when needed
- Use proper typing for query results

### Async Patterns

This codebase uses a job queue for background processing:
- Images flow through states: `UPLOADED` → `PROCESSING` → `STORED`
- Jobs are processed asynchronously via the job runner
- Always handle intermediate states in UI

### File Organization

```
app/                    # Next.js App Router
  api/                  # API routes
  page.tsx              # Page components
  layout.tsx            # Root layout
  globals.css           # Global styles
components/             # React components
  ui/                   # shadcn/ui components
lib/                    # Utility functions
  jobs/                 # Job queue & handlers
  prisma.ts             # Prisma client setup
  error-handler.tsx     # Centralized error handling
prisma/
  schema.prisma         # Database schema
__tests__/              # Test files
  lib/                  # Unit tests for lib functions
```

### Environment Variables

Required in `.env`:
- `DATABASE_URL` or `POSTGRES_PRISMA_URL` - PostgreSQL connection
- `ADMIN_EMAIL` - Email for SUPERADMIN account
- `ADMIN_PASSWORD` - Password for SUPERADMIN account
- `SETUP_SECRET` - Secret for ensure-superadmin API endpoint
- Check `.env.example` for all required variables

### SUPERADMIN Setup

The application requires a SUPERADMIN account for administrative access. Two methods are available:

#### Method 1: CLI Script (Recommended for local/CI)

```bash
# Local development
pnpm db:ensure-admin

# Production/CI with environment variables
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="secure-pass" pnpm db:ensure-admin
```

#### Method 2: API Endpoint (For Vercel/serverless)

```bash
# Check if superadmin exists
curl "https://your-app.vercel.app/api/admin/ensure-superadmin?secret=YOUR_SETUP_SECRET"

# Create/update superadmin
curl -X POST "https://your-app.vercel.app/api/admin/ensure-superadmin" \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: YOUR_SETUP_SECRET" \
  -d '{}'
```

The API endpoint uses `SETUP_SECRET` for authentication (set in environment variables).

### Phase 4 - PRO Features & Projects

#### PRO Profile
- Profile page at `/profile` for PRO users
- Business fields: name, logo, location, contact, social links, portfolio
- Use `ProProfile` model with user relation

#### Project Enhancements
- New fields: `eventName`, `startDate`, `branding`, `watermarkImage`, `coverImage`
- Use BigInt for storage quotas (`quotaBytes`, `storageUsed`)
- Share service popup with QR code generation

#### Album Settings
- Settings page at `/albums/[id]/settings`
- Quality enums: `ImageQuality`, `VideoQuality`, `ShortQuality`
- Watermark configuration with position and opacity
- Face recognition toggle creates `AdminTask` for processing

#### Client Access Management
- `ClientProjectAccess` and `ClientAlbumAccess` models
- Access levels: `READ`, `WRITE`, `FULL`
- Grant/revoke through project detail page

#### Audit Logging
- `AuditLog` model for tracking all operations
- Actions: `PROJECT_CREATED`, `ALBUM_DELETED`, `USER_LOGIN`, etc.
- Audit page at `/admin/audit` for ADMIN/SUPERADMIN only
- Filter by action, user, entity, date range

## Agent Principles

1. **Correctness > Features** - Ensure code works before adding features
2. **Explicit over clever** - Favor clear, readable code
3. **Fail gracefully** - Handle all error cases
4. **Async-aware** - Respect the job-based architecture
5. **Type-safe** - No loose typing without comments explaining why

## Testing

The project uses Vitest for unit testing and Playwright MCP for E2E testing. Run tests with:
- `pnpm test` - Run in watch mode
- `pnpm test:run` - Run once
- `pnpm test:coverage` - Run with coverage
- `pnpm test:ui` - Run with UI

Place tests in `__tests__/` directory:
- Unit tests: `__tests__/lib/**/*.test.ts`
- Component tests alongside source: `Component.test.tsx`

Follow TDD principles - write tests before implementation for complex logic.

### Playwright MCP for E2E Testing

Playwright MCP provides browser automation for end-to-end testing and debugging. Use it to:
- Test user flows and interactions
- Verify UI rendering and state
- Debug issues in the running application
- Take screenshots for documentation

#### Key Playwright MCP Tools

| Tool | Purpose | Example Usage |
|------|---------|----------------|
| `playwright_browser_navigate` | Navigate to URL | Navigate to login page |
| `playwright_browser_snapshot` | Get page accessibility tree | Better than screenshots for assertions |
| `playwright_browser_click` | Click elements | Click buttons, links |
| `playwright_browser_type` | Type text | Fill form fields |
| `playwright_browser_wait_for` | Wait for conditions | Wait for element/text |
| `playwright_browser_evaluate` | Run JavaScript | Fetch API data from page |
| `playwright_browser_take_screenshot` | Capture screenshot | Document UI state |
| `playwright_browser_console_messages` | Get console logs | Check for errors |
| `playwright_browser_network_requests` | Get network requests | Verify API calls |

#### Best Practices for Playwright MCP

1. **Use `snapshot` over `screenshot`** - Accessibility trees are more reliable for assertions
2. **Wait for page load** - Use `wait_for` with time or text after navigation
3. **Check console errors** - Always verify no console errors after actions
4. **Close browser when done** - Always call `playwright_browser_close` to free resources
5. **Use `evaluate` for API checks** - Fetch internal API data from the browser context

#### Example: Testing User Flow

```
1. Navigate to page: playwright_browser_navigate
2. Wait for load: playwright_browser_wait_for (time: 2)
3. Take snapshot: playwright_browser_snapshot
4. Click element: playwright_browser_click
5. Verify result: playwright_browser_snapshot
6. Check console: playwright_browser_console_messages (level: error)
7. Close browser: playwright_browser_close
```

#### Example: Debugging API Issues

```
1. Navigate to page with issue
2. Use playwright_browser_evaluate to fetch('/api/endpoint')
3. Inspect response data
4. Check playwright_browser_network_requests
5. Check playwright_browser_console_messages for errors
```

### Memory MCP for Knowledge Graph

Memory MCP provides a persistent knowledge graph for storing information across sessions:

| Tool | Purpose |
|------|---------|
| `memory_create_entities` | Store new information |
| `memory_create_relations` | Link entities |
| `memory_add_observations` | Add details to entities |
| `memory_search_nodes` | Find stored information |
| `memory_read_graph` | Get all stored data |

Use Memory MCP to:
- Track project progress across sessions
- Store discovered patterns and solutions
- Remember user preferences and requirements
- Build a knowledge base of the codebase

### Supabase MCP for Database Operations

Supabase MCP provides direct database access for querying and migrations:

| Tool | Purpose |
|------|---------|
| `supabase_execute_sql` | Run SQL queries |
| `supabase_apply_migration` | Apply DDL changes |
| `supabase_list_tables` | List database tables |
| `supabase_list_migrations` | View migration history |
| `supabase_get_logs` | Get service logs |
| `supabase_get_advisors` | Security/performance checks |

### Filesystem MCP for File Operations

Standard filesystem operations are available:
- Read/write files
- Create/delete directories
- Search for files
- Get file info

### When to Use Each Tool

| Scenario | Recommended Tool |
|----------|-----------------|
| Test user interactions | Playwright MCP |
| Debug UI rendering | Playwright MCP |
| Check API responses | Playwright `evaluate` |
| Store session knowledge | Memory MCP |
| Query database directly | Supabase MCP |
| File operations | Filesystem MCP |

### Debugging Workflow

1. **Identify the issue** - What's not working?
2. **Navigate to affected page** - Use Playwright MCP
3. **Check console errors** - `playwright_browser_console_messages`
4. **Check network requests** - `playwright_browser_network_requests`
5. **Inspect API responses** - `playwright_browser_evaluate`
6. **Fix the issue** - Edit code files
7. **Verify the fix** - Refresh and test with Playwright
8. **Close browser** - Free resources

### Important Notes

- **Always close the browser** after testing with `playwright_browser_close`
- **Dev server must be running** for Playwright to work (`pnpm dev`)
- **Use snapshot, not screenshot** for assertions - it's more reliable
- **Check console errors** after every significant action
- **Store important discoveries** in Memory MCP for future reference

## Storage Conventions

See `.ai/docs/storage.md` for complete storage documentation.

### Quick Reference

| Type | Local Path | S3/R2 Key |
|------|------------|-----------|
| Temp | `storage/temp/ingest/{id}.{ext}` | `temp/ingest/{id}.{ext}` |
| User Gallery | `storage/user/{userId}/Gallery/images/{id}.{ext}` | `user/{userId}/Gallery/images/{id}.{ext}` |
| Project Album | `storage/projects/{projectId}/albums/{albumId}/{id}.{ext}` | `projects/{projectId}/albums/{albumId}/{id}.{ext}` |
| Thumbnails | `storage/thumbnails/{imageId}/thumb-{size}.jpg` | `thumbnails/{imageId}/thumb-{size}.jpg` |
| Processed | `storage/processed/{imageId}/{quality}.{ext}` | `processed/{imageId}/{quality}.{ext}` |
| Bin | `storage/bin/{originalPath}/{id}.{ext}` | `bin/{originalPath}/{id}.{ext}` |

### Album vs Gallery
- **Gallery** (`/admin/gallery`): Direct user images
- **Albums** (`/admin/albums`): Project-organized media

---

**Note**: This is an AI-generated guide. Update it as the codebase evolves.
