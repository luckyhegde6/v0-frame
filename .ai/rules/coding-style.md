# Coding Style Rules

These rules enforce code quality and consistency across the FRAME project.
Code that violates these rules will be rejected during review.

## General Principles

1.  **D.R.Y. (Don't Repeat Yourself)**
    -   Extract common logic into utilities or hooks.
    -   Do not copy-paste code blocks > 5 lines.

2.  **Explicit > Implicit**
    -   Variable names must match the business domain (e.g., `imageUploadParams`, not `data`).
    -   Avoid implementation details in variable names (e.g., `userMap`, not `obj`).

3.  **Functions Should Do One Thing**
    -   Limit functions to a single responsibility.
    -   If a function needs "and" in its name, split it.

## Stack-Specific Rules

### TypeScript
-   **Strict Typing Mandatory**: `noImplicitAny` is enabled. No `any` allowed without explicit exemption comments.
-   **Interfaces over Types**: Use `interface` for object definitions, `type` for unions/intersections.
-   **No Non-Null Assertions**: Avoid `!` unless absolutely certain (e.g., after a check).

### React / Next.js
-   **Server Components First**: Default to Server Components. Use `'use client'` strictly at leaf nodes.
-   **Hook Rules**: Adhere to Rules of Hooks (top-level only, no loops/conditions).
-   **Props Interface**: Every component must export its Props interface.

### Project Structure
-   **Colocation**: Tests sit next to the file they test (`utils.ts`, `utils.spec.ts`).
-   **Imports**: Use absolute imports `@/` for project files.

## Review Checklist
- [ ] No `console.log` in production code.
- [ ] No commented-out code.
- [ ] No strict lint errors.
