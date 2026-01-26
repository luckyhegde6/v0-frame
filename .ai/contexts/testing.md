# Testing Context

This context is for validating system behavior and preventing regressions.

## State of Mind
-   **Mode**: VERIFICATION
-   **Focus**: Breaking the system, finding edge cases, coverage.

## Workflow

1.  **Define Scope**: What are we testing? (Unit, Integration, Contract).
2.  **Write Test**: Create `file.spec.ts`.
3.  **Run**: `npm test` or `npx jest path/to/file`.
4.  **Refactor**: Improve test quality (D.R.Y., readability).

## Test Types

### Unit Tests
-   **Target**: Utilities, Hooks, Pure logic.
-   **Location**: `src/lib/**/*.spec.ts`.
-   **Command**: `npm run test:unit`.

### Integration Tests
-   **Target**: API Routes, Database interactions.
-   **Location**: `src/app/api/**/*.spec.ts`.
-   **Command**: `npm run test:integration`.

## Contract Verification
-   Ensure all tests verifying `phase-1-ingestion.md` pass.
-   Check `validate-lifecycle.js` script status.
