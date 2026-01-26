# Security Rules

These rules are mandatory for maintaining system security. Violations are considered critical blockes.

## Core Rules

1.  **Zero Trust Input**
    -   NEVER trust user input (body, query, headers, files).
    -   Validate all inputs against strict schemas (Zod).
    -   Sanitize filenames before use.

2.  **Principle of Least Privilege**
    -   Database connections should only have permissions they need.
    -   Users can only access resources they own (Row Level Security logic).

3.  **Secrets Management**
    -   **NEVER** commit API keys, tokens, or passwords.
    -   Use environment variables for all secrets.
    -   Do not log secrets (check logger output).

4.  **Authentication & Authorization**
    -   All private routes MUST check for a valid session.
    -   All resource access MUST verify ownership or permission.
    -   API Routes must handle 401/403 states explicitly.

## Implementation Requirements

-   **HTTPS**: All traffic must be encrypted.
-   **Deps**: No dependencies with critical vulnerabilities (`npm audit` clean).
-   **Headers**: Secure headers (HSTS, No-Sniff, XSS-Protection) configured via Next.js config or middleware.

## Review Checklist
- [ ] Is input validation strictly typed?
- [ ] Is authorization checked for every database hit?
- [ ] Are secrets excluded from client bundles?
