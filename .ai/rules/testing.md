# Testing Rules

High-quality testing is non-negotiable for system reliability.

## Test Coverage Requirements

1.  **Unit Tests**: >80% coverage for utilities and core logic.
2.  **Integration Tests**: Failure paths must be tested (not just happy paths).
3.  **Contracts**: All "Contract" implementations (contracts/*.md) must be verified.

## TDD (Test-Driven Development)

-   Follow Red-Green-Refactor loop.
-   Write the test *before* the implementation for complex logic.

## Testing Best Practices

1.  **Isolation**: Tests should not depend on external services (use mocks).
2.  **Determinism**: Tests must produce the same result every time (seed randoms, freeze time).
3.  **Speed**: Tests should run fast. Slow tests discourage running them.
4.  **Descriptive Names**: `it('should return 400 when file is missing')` not `it('test error')`.

## Mocks & Stubs
-   Mock database calls in Unit tests.
-   Use an in-memory DB or Docker container for Integration tests.
-   NEVER mock the thing you are testing.

## Review Checklist
- [ ] Do tests cover edge cases (null, empty, error)?
- [ ] Are mocks accurate representations of reality?
