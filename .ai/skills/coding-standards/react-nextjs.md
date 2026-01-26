# React & Next.js Coding Standards

This guide defines the coding standards for React and Next.js development in the FRAME project.

## Core Principles

1. **Server Components by Default**: Use Server Components for all non-interactive UI.
2. **Client Components at Leaves**: Push `use client` down the tree as far as possible.
3. **Composition over Inheritance**: Use children props and composition patterns.
4. **Accessibility First**: Use Radix UI primitives and semantic HTML.

## Next.js App Router

### Directory Structure
- `app/`: Routes and pages
- `components/`: Reusable UI components
- `lib/`: Utilities and business logic (framework agnostic)
- `hooks/`: Custom React hooks

### Data Fetching
- Fetch data in Server Components directly.
- Use `lib/` services for data access, not API routes (when calling from Server Components).
- Use API routes only for Client Components data fetching or external integrations.

```typescript
// ✅ Good: Server Component Fetching
import { getImages } from '@/lib/images';

export default async function GalleryPage() {
  const images = await getImages();
  return <Gallery images={images} />;
}
```

### Route Handlers
- Use standard HTTP methods (`GET`, `POST`, etc.).
- Always validate inputs (Zod/Valibot).
- Return standard JSON responses.

## React Components

### Functional Components
Always use functional components with named exports.

```typescript
// ✅ Good
export function Button({ children }: ButtonProps) {
  return <button>{children}</button>;
}
```

### Hooks Rules
- Only call hooks at the top level.
- Only call hooks from React function components or custom hooks.
- Prefix custom hooks with `use`.

### State Management
- Prefer local state (`useState`) for UI state.
- Use URL parameters for shareable state (filters, pagination).
- Use Context only for truly global state (Theme, Auth).

## Styling (Tailwind CSS)

### Utility First
Use Tailwind utility classes for styling. avoid `@apply` in CSS files unless creating reusable abstractions that can't be components.

### Class Sorting
Classes should be logically ordered (layout -> box model -> typography -> visual).
*Note: We highly recommend using a prettier plugin for automatic sorting.*

### `cn` Utility
Use the `cn` (clsx + tailwind-merge) utility for conditional class merging.

```typescript
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("rounded-lg border bg-card", className)} {...props} />;
}
```

## Performance

### Images
- Use `next/image` for all images.
- Define explicit width/height to prevent layout shift.
- Use valid entry from `phase-1-ingestion.md` lifecycle.

### Code Splitting
- Lazy load heavy client components using `next/dynamic`.
- Keep client bundles small.

## Accessibility (a11y)

- All interactive elements must have focus states.
- Images must have `alt` text.
- Use semantic HTML tags (`main`, `nav`, `section`, `article`).
- Use accessible primitives (Radix UI) for complex components.
