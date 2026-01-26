# Development Context

This context is for active coding, feature implementation, and bug fixing.

## State of Mind
- **Mode**: EXECUTION
- **Focus**: Correctness, adherence to contracts, local verification.

## Workflow

1.  **Check Contracts**: Review `.ai/contracts/phase-1-ingestion.md` if working on ingestion.
2.  **Plan**: Use `/plan` or conceptualize the change.
3.  **Implement**:
    -   Write tests first (TDD).
    -   Implement core logic.
    -   Verify locally (`npm run dev`).
4.  **Verify**: Run tests (`npm test`).

## Environment
-   **Local**: Use `docker-compose up` for database.
-   **Secrets**: Use `.env` (ensure it's populated).
-   **Logs**: Check terminal output.

## Common Tasks
-   **New Feature**: See `skills/workflows/feature-implementation.md`.
-   **Bug Fix**: See `skills/workflows/bug-fix-workflow.md`.
