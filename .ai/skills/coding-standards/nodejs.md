# Node.js Coding Standards

This guide defines the coding standards for Node.js backend code in the FRAME project (API Routes, Workers, Scripts).

## Core Principles

1. **Async/Await**: Use modern async patterns. No callbacks.
2. **Modular Architecture**: Separate concerns (Service, Repository, Controller).
3. **Error Handling**: Explicit try/catch blocks with typed error handling.
4. **Environment Configuration**: Strict 12-factor app config.

## File Structure

- `lib/`: Shared code
- `scripts/`: Standalone scripts
- `workers/`: Background job processors

## Modules & Imports

- Use ES Modules (`import`/`export`) everywhere.
- Prefer named exports over default exports.
- Use absolute imports (`@/lib/...`) over relative (`../../lib/...`).

## Async Patterns

### Promisification
Use `util.promisify` or `fs/promises` instead of callback-based APIs.

```typescript
// ❌ Bad
fs.readFile('file.txt', (err, data) => { ... });

// ✅ Good
import fs from 'fs/promises';
const data = await fs.readFile('file.txt');
```

### Concurrent Execution
Use `Promise.all` for independent operations, but be mindful of concurrency limits.

```typescript
// ✅ Good: Parallel fetch
const [user, posts] = await Promise.all([
  fetchUser(id),
  fetchPosts(id)
]);
```

## Error Handling

### Custom Errors
Define application-specific error classes for better handling.

```typescript
export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}
```

### Global Handlers
Ensure unhandled rejections and uncaught exceptions are logged before exit.

## Streams & Files

### Optimization
Always use streams for file processing to keep memory footprint low (See `optimization.md`).

```typescript
// ✅ Good: Pipe streams
import { pipeline } from 'stream/promises';
await pipeline(readStream, transform, writeStream);
```

### Cleanup
Ensure file handles and resources are closed in `finally` blocks or using `using` (Stage 3 proposal / TS 5.2+).

## Logging

- Use console methods for now (Phase 1).
- Structured logging format: `[Context] Message { details }`.
- Do not log sensitive data (passwords, tokens).

```typescript
console.log('[JobQueue] Processing job', { jobId: job.id });
console.error('[JobQueue] Failed job', { jobId: job.id, error: err.message });
```

## Scripts

- Use `#!/usr/bin/env node` shebang.
- Handle CLI arguments robustly (e.g. `commander` or simple parsing).
- Ensure scripts are idempotent where possible.
