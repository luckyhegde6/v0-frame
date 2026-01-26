# Bug Fix Workflow

This document outlines the standard workflow for fixing bugs in the FRAME project.

## Workflow Status
- **Agent**: Debug Agent
- **Mode**: Investigation -> Fix -> Verification

## Process

### 1. Investigation Phase
- **Reproduce**: Create a reproduction case (minimal example).
- **Isolate**: Identify the specific component/line causing the issue.
- **Root Cause**: Understand *why* it's happening, not just *what*.
- **Impact Analysis**: What else does this affect?

### 2. Fix Phase
- **Test Case**: Write a failing test case (Red).
- **Minimal Fix**: Apply the smallest possible change to fix the issue.
- **Rules Check**: Ensure no contracts (lifecycle, persistence) are violated.
- **Pass Test**: Ensure the test passes (Green).

### 3. Verification Phase
- **Regression Check**: Run related tests to ensure no regressions.
- **Manual Verify**: Verify the fix in the running application.
- **Audit**: Check if data cleanup/migration is needed for affected records.

## Debugging Checklist
- [ ] Have I identified the root cause?
- [ ] Is data integrity preserved? (No data loss)
- [ ] Is the fix idempotent?
- [ ] Does it handle failures gracefully?

## Common Fix Patterns

### Stuck Job
1. Identify why job failed.
2. Fix the worker logic.
3. Reset stuck jobs to `PENDING` (via database query).

### Upload Failure
1. Check logs.
2. Verify temp storage permissions/capacity.
3. Fix error handling.
4. Retry from client.
