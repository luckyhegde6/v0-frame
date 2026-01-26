# Common Vulnerabilities

## 1. Injection
- **SQL Injection**: Use Prisma (safe by default). Avoid raw queries.
- **XSS**: React escapes output by default. Avoid `dangerouslySetInnerHTML`.
- **Command Injection**: Avoid `exec` with user input.

## 2. Broken Authentication
- Use managed auth providers (Supabase Auth).
- Do not roll your own crypto.

## 3. Sensitive Data Exposure
- Never commit `.env` files.
- Use `git-secrets` or similar to scan commits.
- Don't log PII (Personally Identifiable Information).

## 4. Broken Access Control
- "Insecure Direct Object References" (IDOR): Always verify the user owns the object ID being requested.

\`\`\`typescript
// ❌ Bad
await db.image.delete({ where: { id } });

// ✅ Good
await db.image.delete({
  where: { id, userId: currentUser.id }
});
\`\`\`
