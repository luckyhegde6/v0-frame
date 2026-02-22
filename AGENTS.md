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
#   Windows: npx kill-port 3000 (do NOT use taskkill /F /IM node.exe - it kills the agent itself!)
#   Linux/Mac: pkill -f "next dev"      OR   npx kill-port 3000
# IMPORTANT: The AI agent runs on http://127.0.0.1:4096/ - do NOT kill this process!
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
- `AUTH_SECRET` or `NEXTAUTH_SECRET` - Session encryption key
- `ADMIN_EMAIL` - Email for SUPERADMIN account
- `ADMIN_PASSWORD` - Password for SUPERADMIN account
- `SETUP_SECRET` - Secret for ensure-superadmin API endpoint
- `AUTH_TRUST_HOST=true` - Required for non-localhost URLs

For Supabase Storage (Vercel/Production):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side storage operations
- `SUPABASE_ANON_KEY` - Client-side storage access (optional)

Check `.env.example` for all required variables.

### SUPERADMIN Setup

The application requires a SUPERADMIN account for administrative access. Two methods are available:

#### Method 1: CLI Script (Recommended for local/CI)

```bash
# Local development
pnpm db:ensure-admin

# Production/CI with environment variables
ADMIN_EMAIL="admin2@example.com" ADMIN_PASSWORD="secure-pass" pnpm db:ensure-admin
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

## Permission Requirements

**IMPORTANT**: The AI agent must ask for user permission before performing any of the following actions:

### Package Installation
- ❌ **ASK BEFORE** running `pnpm add`, `npm install`, or any package installation
- ❌ **ASK BEFORE** adding new dependencies to `package.json`
- ✅ Reason: New packages affect bundle size, security, and maintenance burden
- ✅ Format: "May I install [package-name] for [reason]?"

### Git Commits
- ❌ **ASK BEFORE** running `git commit` or `git add` followed by commit
- ❌ **ASK BEFORE** creating any commit message
- ✅ Reason: User may want to review changes before committing
- ✅ Format: "May I commit these changes with message: [message]?"

### Git Merges
- ❌ **ASK BEFORE** running `git merge` on any branch
- ❌ **ASK BEFORE** merging branches to main/master
- ✅ Reason: Merges can cause conflicts and affect the main branch
- ✅ Format: "May I merge [branch] into [target-branch]?"

### File Deletion
- ❌ **ASK BEFORE** deleting any file using `rm`, `del`, or similar commands
- ❌ **ASK BEFORE** removing directories
- ✅ Reason: Deletion is irreversible and may remove important files
- ✅ Format: "May I delete [file/path]? Reason: [why]"

### Database Changes
- ❌ **ASK BEFORE** running `prisma db push` (modifies database schema)
- ❌ **ASK BEFORE** running destructive SQL queries
- ✅ Reason: Database changes can cause data loss
- ✅ Format: "May I apply these schema changes: [summary]?"

### Environment Changes
- ❌ **ASK BEFORE** modifying `.env`, `.env.local`, or environment files
- ✅ Reason: May contain sensitive configuration
- ✅ Format: "May I update the environment configuration for [reason]?"

### Summary Table

| Action | Permission Required | Reason |
|--------|-------------------|--------|
| `pnpm add <package>` | ✅ YES | Bundle size, security |
| `git commit` | ✅ YES | Code review |
| `git merge` | ✅ YES | Conflict risk |
| File deletion | ✅ YES | Irreversible |
| `prisma db push` | ✅ YES | Schema changes |
| `.env` modification | ✅ YES | Sensitive config |
| Code editing | ❌ NO | Core functionality |
| `pnpm dev` / testing | ❌ NO | Development workflow |
| `git status` / `git diff` | ❌ NO | Read-only |

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

Supabase MCP provides direct database access for querying and migrations. Two options available:

#### Option 1: Remote Supabase MCP (Recommended)
Uses Supabase's hosted MCP server with OAuth authentication:

```
URL: https://mcp.supabase.com/mcp?project_ref=viuvufbhcscavvdfoqqn
```

Configure in `.ai/mcp/mcp-config.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=viuvufbhcscavvdfoqqn",
      "enabled": true
    }
  }
}
```

**Authentication**: Supabase MCP uses OAuth 2.1 - it will prompt for login when first connecting. Uses your Supabase account for authentication.

#### Option 2: Local Postgres MCP
For direct database connections without OAuth:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/frame?schema=public"
      },
      "enabled": true
    }
  }
}
```

**Note**: For production Supabase, use the remote MCP option instead (see Option 1 above).

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
- **MUST test UI changes with Playwright** - After any UI modification, always verify the page loads correctly using Playwright MCP before considering the task complete. Navigate to the page, check for console errors, and verify key elements are visible.

### When to Use Playwright Testing (Required)

Playwright testing is **REQUIRED** when:

1. **UI Modifications** - Any change to React components, pages, or visual elements
2. **New Pages** - Adding new routes or page components
3. **Form Changes** - Modifying form fields, validation, or submission logic
4. **API Integration in UI** - Changes to how frontend consumes API responses
5. **Navigation Changes** - Adding or modifying links, redirects, or routing

**Testing Checklist:**
```
1. Start dev server if not running
2. Navigate to the modified page
3. Take snapshot to verify structure
4. Check console for errors (level: error)
5. Interact with any new UI elements
6. Verify expected behavior
7. Close browser when done
```

### Verifying Completed Tasks with Playwright MCP

When a user asks to verify that a task is complete (especially for todo-style tasks that have been marked as completed), use Playwright MCP to visually verify the implementation:

1. **For Todo Lists**: When tasks are completed, use Playwright MCP to verify:
   - Navigate to the relevant page
   - Check that the completed feature is visible and working
   - Look for strikethrough or completed status indicators
   - Verify key UI elements are present

2. **Example Workflow for Task Verification**:
```
1. Navigate to the modified page
2. Take snapshot to verify the new feature is visible
3. Check for console errors
4. If it's a form, test the form submission
5. If it's a list, verify items are displayed correctly
6. Close browser when done
```

3. **Key Verification Points**:
   - Page loads without errors
   - New components/buttons are visible
   - Navigation links work
   - Forms can be submitted
   - Data is displayed correctly
   - No critical console errors

4. **When Task is Complete**:
   - Run Playwright to verify the feature works
   - If verification passes, the task is truly complete
   - Report verification results to the user

## Storage Conventions

See `.ai/docs/storage.md` for complete storage documentation.

### Storage Backend Detection

The system automatically uses Supabase Storage when configured:
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for cloud storage (Vercel)
- Falls back to local filesystem for development

### Quick Reference

| Type | Local Path | Supabase Bucket/Key |
|------|------------|---------------------|
| Temp | `storage/temp/ingest/{id}.{ext}` | `temp/ingest/{id}.{ext}` |
| User Gallery | `storage/user/{userId}/Gallery/images/{id}.{ext}` | `user-gallery/{userId}/Gallery/images/{id}.{ext}` |
| Project Album | `storage/projects/{projectId}/albums/{albumId}/{id}.{ext}` | `project-albums/{projectId}/albums/{albumId}/{id}.{ext}` |
| Thumbnails | `storage/thumbnails/{imageId}/thumb-{size}.jpg` | `thumbnails/{imageId}/thumb-{size}.jpg` |
| Processed | `storage/processed/{imageId}/{quality}.{ext}` | `processed/{imageId}/{quality}.{ext}` |
| Bin | `storage/bin/{originalPath}/{id}.{ext}` | `bin/{originalPath}/{id}.{ext}` |

### Storage API

Use the unified storage API from `@/lib/storage`:

```typescript
import { storeFile, storeBuffer, retrieveFile, getFileUrl, BUCKETS } from '@/lib/storage'

// Store a file (auto-detects backend)
const result = await storeFile(tempPath, {
  bucket: BUCKETS.USER_GALLERY,
  path: `${userId}/Gallery/images/${imageId}.jpg`,
  contentType: 'image/jpeg',
})

// Get URL (public or signed)
const url = await getFileUrl({ bucket: BUCKETS.THUMBNAILS, path: `${imageId}/thumb-512.jpg` })
```

### Album vs Gallery
- **Gallery** (`/admin/gallery`): Direct user images
- **Albums** (`/admin/albums`): Project-organized media

## Task System

The admin task system provides a unified interface for managing background operations. Access it at `/admin/tasks`.

### Task Types

| Type | Route | Description |
|------|-------|-------------|
| `COMPRESS_IMAGES` | `/admin/tasks/COMPRESS_IMAGES` | Compress images to reduce file size |
| `GENERATE_THUMBNAILS` | `/admin/tasks/GENERATE_THUMBNAILS` | Regenerate missing thumbnails |
| `REGENERATE_METADATA` | `/admin/tasks/REGENERATE_METADATA` | Re-extract EXIF metadata |
| `EXTRACT_ARCHIVE` | `/admin/tasks/EXTRACT_ARCHIVE` | Extract ZIP/TAR archives |
| `SYNC_STORAGE` | `/admin/tasks/SYNC_STORAGE` | Sync with cloud providers |
| `BACKUP_DATABASE` | `/admin/tasks/BACKUP_DATABASE` | Create database backups |
| `CLEANUP_TEMP` | `/admin/tasks/CLEANUP_TEMP` | Clean up temporary files |
| `OPTIMIZE_STORAGE` | `/admin/tasks/OPTIMIZE_STORAGE` | Remove duplicates and orphans |
| `OFFLINE_UPLOAD` | `/admin/tasks/OFFLINE_UPLOAD` | Batch upload from local/cloud |
| `SYNC_USERS` | `/admin/tasks/SYNC_USERS` | Sync with external auth providers |

### OFFLINE_UPLOAD Task

The OFFLINE_UPLOAD task has specialized UI for batch uploading:

**Upload Sources:**
- **Computer**: Local file/folder picker using HTML5 File API
- **Google Drive**: OAuth integration (requires `/api/cloud/auth` endpoint)
- **Dropbox**: OAuth integration (requires `/api/cloud/auth` endpoint)

**Upload Modes:**
- **Files**: Select individual image/video files
- **Folder**: Upload entire folder (creates album from folder name)

**Destination Types:**
- **Project**: Select project, optionally create new album (for folder mode)
- **Album**: Select existing album to add files

**Key Files:**
- Task configuration: `app/admin/tasks/[type]/client.tsx`
- Main task list: `app/admin/tasks/page.tsx`
- All task types view: `app/admin/tasks/all/client.tsx`
- Task API: `app/api/admin/tasks/route.ts`

### Task Configuration Pattern

Each task type defines its configuration in `TASK_CONFIGS`:

```typescript
const TASK_CONFIGS: Record<string, TaskConfig> = {
  TASK_NAME: {
    label: 'Display Name',
    icon: LucideIcon,
    description: 'Task description',
    requiresSource: boolean,
    requiresDestination: boolean,
    sourceTypes: ('project' | 'album' | 'images')[],
    configOptions: [
      {
        name: 'optionName',
        label: 'Display Label',
        type: 'select' | 'number' | 'toggle',
        options: [{ value: 'key', label: 'Label' }], // for select
        default: any,
        min: number, // for number
        max: number  // for number
      }
    ]
  }
}
```

### Extending Tasks

To add a new task type:

1. Add the enum value to `TaskType` in `prisma/schema.prisma`
2. Add the task configuration to `TASK_CONFIGS` in `app/admin/tasks/[type]/client.tsx`
3. Add the task info to `TASK_TYPES` in `app/admin/tasks/page.tsx`
4. Add the task info to `TASK_TYPES` in `app/admin/tasks/all/client.tsx`
5. Implement the task handler in the job processor

## Job Processing System

The application uses a job queue for background image processing tasks like thumbnail generation, EXIF extraction, and file offloading.

### Job Types

| Type | Handler | Description |
|------|---------|-------------|
| `OFFLOAD_ORIGINAL` | `handleOffloadOriginal` | Move original file to permanent storage |
| `THUMBNAIL_GENERATION` | `handleThumbnailGeneration` | Generate thumbnails in multiple sizes |
| `PREVIEW_GENERATION` | `handlePreviewGeneration` | Generate preview image |
| `EXIF_ENRICHMENT` | `handleExifEnrichment` | Extract EXIF metadata |

### Job Lifecycle

```
PENDING → RUNNING → COMPLETED
                 ↘ FAILED (with retry)
```

### Processing on Vercel (Serverless)

On Vercel, jobs are processed via Vercel Cron Jobs:

1. **Cron Endpoint**: `/api/cron/jobs` - Processes pending jobs in batches of 5
2. **Schedule**: Every 5 minutes (configurable in `vercel.json`)
3. **Security**: Requires `CRON_SECRET` environment variable

**Configuration (`vercel.json`):**
```json
{
  "crons": [{
    "path": "/api/cron/jobs",
    "schedule": "*/5 * * * *"
  }]
}
```

**Environment Variables:**
- `CRON_SECRET` - Secret token for cron endpoint authentication

### Processing Locally (Development)

For local development, use the job runner:

```typescript
import { startJobRunner } from '@/lib/jobs/runner'
import { initializeJobHandlers } from '@/lib/jobs/handlers'

initializeJobHandlers()
startJobRunner(5, 5000) // batchSize=5, pollInterval=5000ms
```

Or use the processor directly:

```typescript
import { processPendingJobs } from '@/lib/jobs/processor'

const result = await processPendingJobs(5)
// { total: 3, processed: 3, succeeded: 2, failed: 1, errors: [...] }
```

### Inngest Integration (Alternative)

Inngest provides serverless-friendly job processing with retries and scheduling:

**Files:**
- `lib/inngest/client.ts` - Inngest client configuration
- `app/inngest/functions.ts` - Job functions
- `app/api/inngest/route.ts` - API endpoint for Inngest

**Setup:**
1. Create Inngest account at inngest.com
2. Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` environment variables
3. Deploy - Inngest will automatically connect to `/api/inngest`

**Trigger jobs via Inngest:**
```typescript
import { inngest } from '@/lib/inngest/client'

await inngest.send({
  name: 'job/thumbnail-generation',
  data: { imageId, originalPath, jobId }
})
```

### Adding New Job Handlers

1. Create handler in `lib/jobs/handlers/`:
```typescript
export async function handleMyNewJob(payload: any, jobId: string): Promise<void> {
  // Process job
}
```

2. Register in `lib/jobs/handlers/index.ts`:
```typescript
registerJobHandler('MY_NEW_JOB', handleMyNewJob)
```

3. Add to Inngest functions in `app/inngest/functions.ts` (optional)

### Client Utilities

Client utilities for image status polling are in `lib/client-utils.ts`:

```typescript
import { 
  pollImageStatus, 
  getImageStatusLabel, 
  formatBytes,
  formatDate 
} from '@/lib/client-utils'

// Poll for image processing status
await pollImageStatus(imageId, (image) => {
  console.log(getImageStatusLabel(image.status))
})
```

---

**Note**: This is an AI-generated guide. Update it as the codebase evolves.
