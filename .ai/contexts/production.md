# Production Context

This context is for deployment, maintenance, and monitoring of the production environment.

## State of Mind
-   **Mode**: OPERATION
-   **Focus**: Stability, Uptime, Data Integrity.

## Pre-Deployment Checklist (`/deploy`)
1.  **Tests Pass**: CI must be green.
2.  **Migrations**: Are database changes safe? (Non-destructive).
3.  **Contracts**: Are we adhering to the contracts?

## Maintenance Tasks
-   **Cleanup**: Remove old temp files (if automated cleanup failed).
-   **Monitoring**: Check Vercel logs for 500s.
-   **Backups**: Ensure database backups are running (provider managed).

## Emergency Procedures
1.  **Rollback**: Revert to last stable commit on `main`.
2.  **Data Fix**: If data is corrupted, pause processing (`env.processing_enabled = false`) and investigate.
