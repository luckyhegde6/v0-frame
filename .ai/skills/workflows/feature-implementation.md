# Feature Implementation Workflow

This document outlines the standard workflow for implementing new features in the FRAME project.

## Workflow Status
- **Agent**: Create Agent
- **Mode**: Planning -> Execution -> Verification

## Process

### 1. Planning Phase
- **Contracts**: Review relevant contracts (e.g., `phase-1-ingestion.md`).
- **Requirements**: Understand the user goal.
- **Design**:
  - Identify affected components.
  - Define new data models (Prisma).
  - Define API contracts.
  - Plan async boundaries.
- **Verification**: Get approval if design is complex.

### 2. Implementation Phase
- **Database**:
  1. Update `schema.prisma`.
  2. `npx prisma generate`.
  3. `npx prisma db push` (dev).
- **Core Logic**:
  1. Implement services/lib functions first.
  2. Implement unit tests (TDD).
- **API Layer**:
  1. Implement API Routes / Server Actions.
  2. Validate inputs.
  3. Connect to core services.
- **UI Layer**:
  1. Create components.
  2. Connect to API.

### 3. Verification Phase
- **Manual Test**: Verify the happy path.
- **Edge Cases**: Test error conditions.
- **Lifecycle**: Verify no invariant violations.
- **Documentation**: Update README/TODO if needed.

## Lifecycle Check
Before marking complete, verify adherence to `image-lifecycle.md`:
- [ ] Are all state transitions explicit?
- [ ] Are failures handled?
- [ ] Is async work properly offloaded?

## Example: Adding "Star Image" Feature

1. **Design**: Add `isStarred` boolean to `Image` model. Add API `POST /api/images/:id/star`.
2. **DB**: Update schema, migrate.
3. **Service**: Add `starImage(id)` function in `lib/images`.
4. **API**: Create route handler using service.
5. **UI**: Add Star button to Gallery card.
6. **Verify**: Click star, refresh page, check DB.
