# TypeScript Coding Standards

This guide defines the TypeScript coding standards for the FRAME project.

## Core Principles

1. **Strict Typing**: No `any`, strict null checks enabled
2. **Explicit Interfaces**: Define interfaces for all data structures
3. **Immutable by Default**: Use `readonly` where appropriate
4. **Functional Style**: Prefer pure functions and immutability

## Naming Conventions

### Files & Directories
- **PascalCase** for components: `UserCard.tsx`
- **kebab-case** for utilities and hooks: `use-auth.ts`, `date-utils.ts`
- **camelCase** for other files: `apiClient.ts`

### Code Symbols
- **PascalCase**: Classes, Interfaces, Types, Enums, React Components
- **camelCase**: Variables, functions, methods, properties
- **UPPER_CASE**: Constants, Environment Variables

## Type Safety

### No `any`
Avoid `any` at all costs. Use `unknown` if the type is truly not known yet, and narrow it down.

\`\`\`typescript
// ❌ Bad
function process(data: any) {
  return data.value;
}

// ✅ Good
function process(data: unknown) {
  if (isProcessable(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}
\`\`\`

### Explicit Return Types
Always define return types for functions, especially exported ones.

\`\`\`typescript
// ❌ Bad
export function getUser(id: string) {
  return db.user.findUnique({ where: { id } });
}

// ✅ Good
export function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}
\`\`\`

### Type vs Interface
Use `interface` for object definitions and `type` for unions/intersections.

\`\`\`typescript
// ✅ Interface for objects
interface User {
  id: string;
  name: string;
}

// ✅ Type for unions
type UserStatus = 'active' | 'inactive' | 'suspended';
\`\`\`

## Best Practices

### Enums vs Union Types
Prefer String Literal Unions over Enums for simplicity and smaller bundle size.

\`\`\`typescript
// ❌ Avoid if possible
enum Status {
  Active = 'active',
  Inactive = 'inactive'
}

// ✅ Preferred
type Status = 'active' | 'inactive';
\`\`\`

### Null vs Undefined
Use `null` for "intentional absence of value" (API responses, database).
Use `undefined` for "value not initialized" (optional parameters).

### Async/Await
Always use async/await over raw Promises.

\`\`\`typescript
// ❌ Bad
function getData() {
  return fetch('/api').then(res => res.json());
}

// ✅ Good
async function getData() {
  const res = await fetch('/api');
  return res.json();
}
\`\`\`

## React Specifics

### Component Props
Always define a specialized interface for component props.

\`\`\`typescript
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  // ...
}
\`\`\`

### Hooks
Prefix custom hooks with `use`.

## Error Handling

Use typed error handling where possible, or standardized error classes.

\`\`\`typescript
try {
  await callback();
} catch (error) {
  if (error instanceof AppError) {
    handleAppError(error);
  } else {
    handleUnknownError(error);
  }
}
\`\`\`
