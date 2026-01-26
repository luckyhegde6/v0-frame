# v0 & Vercel Deployment Rules

These rules ensure the codebase remains strictly compatible with the **v0.app** development flow and **Vercel** deployment environment.

## v0.app Compatibility

1. **Component-Driven Development**
   - Prefer modular, self-contained components that can be easily updated or replaced by v0.
   - Use **Tailwind CSS** for all styling to maintain consistency with v0's generation patterns.
   - Utilize **shadcn/ui** primitives (Radix UI) which are native to the v0 ecosystem.

2. **Clean UI/Logic Separation**
   - Keep complex business logic out of UI components.
   - Use **Server Actions** or specialized `lib/` hooks for logic to allow v0 to focus on the presentation layer.

3. **Incremental UI Updates**
   - Avoid massive monolithic components.
   - Break UI into smaller pieces so v0 can iterate on specific parts of the page without side effects.

## Vercel Deployment

1. **Ephemeral Storage**
   - **RULE**: Memory and `/tmp` storage are strictly ephemeral.
   - All temp files in `/tmp` must be treated as disposable.
   - Durable persistence MUST happen on the Home Server (Phase 2+) or external Blobs.

2. **Serverless Function Constraints**
   - Respect Vercel's execution time limits (10s on Hobby, 60s+ on Pro).
   - Use **Streaming** for large file transfers (Contract §2) to avoid memory overhead and timeouts.

3. **Environment Variables**
   - All external service credentials (DB, API Keys) must be configured via Vercel Environment Variables.
   - Fallback to `.env.local` only for local Docker development.

4. **Database Pooling**
   - Use Prisma with connection pooling (`pgbouncer=true` or Supabase/Neon specialized strings) to avoid exhausting DB connections in a serverless environment.

## Review Checklist
- [ ] Is the component v0-friendly (clean Shadcn patterns)?
- [ ] Does it use `/tmp` correctly for Vercel?
- [ ] Are heavy operations streamed or offloaded?
- [ ] Are environment variables used for all config?
