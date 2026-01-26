# TDD Workflow

This document outlines the Test-Driven Development (TDD) workflow for the FRAME project.

## Overview
TDD is a development process where you write tests before writing the actual code. This ensures high code quality, better design, and fewer bugs.

## Workflow Steps

### 1. 🟥 RED: Write a Failing Test
Define the expected behavior in a test file before implementing logic.

1. **Create/Open** the test file (e.g., `lib/image/metadata.spec.ts`).
2. **Describe** the feature or bug case.
3. **Write assertions** that should pass once implemented.
4. **Run tests** to confirm failure.

```typescript
describe('extractMetadata', () => {
  it('should throw error for invalid file type', async () => {
    await expect(extractMetadata('invalid.txt'))
      .rejects.toThrow('Invalid file type');
  });
});
```

### 2. 🟩 GREEN: Make it Pass
Write the minimal amount of code required to pass the test.

1. **Implement** the logic in the source file.
2. **Focus** only on passing the current test case.
3. **Ignore** code quality or optimization for now.
4. **Run tests** to confirm success.

```typescript
export async function extractMetadata(file: string) {
  if (file.endsWith('.txt')) {
    throw new Error('Invalid file type');
  }
  // ...
}
```

### 3. 🟦 REFACTOR: Improve Code
Clean up the code while keeping tests green.

1. **Refactor** the implementation for readability and performance.
2. **Remove** duplication.
3. **Improve** naming.
4. **Run tests** again to ensure no regressions.

```typescript
const ALLOWED_EXTENSIONS = ['.jpg', '.png'];

export async function extractMetadata(file: string) {
  const ext = path.extname(file);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new AppError('Invalid file type', 'INVALID_FILE');
  }
  // ...
}
```

## Testing Checklist

- [ ] Does the test fail initially?
- [ ] Does the implementation pass the test?
- [ ] Are all edge cases covered?
- [ ] Is the code readable?
- [ ] Are variable names descriptive?

## Tools

- **Runner**: Jest / Vitest
- **E2E**: Playwright
- **Mocking**: `jest.mock()`, `msw` (for API)

## When to use TDD?

- **Complex Logic**: Algorithms, data transformations.
- **Bug Fixes**: Reproduce bug with test, then fix.
- **API Contracts**: Defining request/response shapes.
- **Utility Functions**: Helpers, validation logic.

## When NOT to use TDD (or be flexible)?

- **UI Prototyping**: Purely visual changes.
- **Exploratory Coding**: Learning a new library.
- **Simple Configuration**: Setup scripts.
