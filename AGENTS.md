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

# Build
pnpm build                  # Production build (includes db:generate)

# Linting
pnpm lint                   # Run ESLint on entire codebase

# Database
pnpm db:push                # Push Prisma schema to database
pnpm db:generate            # Generate Prisma client
pnpm db:seed                # Run database seeders
pnpm db:studio              # Open Prisma Studio GUI

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
- Check `.env.example` for all required variables

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

The project uses Vitest for testing. Run tests with:
- `pnpm test` - Run in watch mode
- `pnpm test:run` - Run once
- `pnpm test:coverage` - Run with coverage
- `pnpm test:ui` - Run with UI

Place tests in `__tests__/` directory:
- Unit tests: `__tests__/lib/**/*.test.ts`
- Component tests alongside source: `Component.test.tsx`

Follow TDD principles - write tests before implementation for complex logic.

---

**Note**: This is an AI-generated guide. Update it as the codebase evolves.
