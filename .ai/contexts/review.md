# Review Context

This context is for reviewing code, identifying refactoring opportunities, and ensuring security.

## State of Mind
- **Mode**: CRITIQUING
- **Focus**: Code quality, security holes, contract violations, long-term maintainability.

## Checklist

### 1. Contract Compliance
- Does this violate `phase-1-ingestion.md`?
- Are forbidden operations (compression, ML) present?
- Are new states introduced?

### 2. Security (`rules/security.md`)
- Is input validated?
- Are permissions checked?
- Are secrets safe?

### 3. Code Quality (`rules/coding-style.md`)
- Is it readable?
- Are types strict?
- Is it adhering to async patterns?

## Actions
- **Request Changes**: Violations of rules/contracts.
- **Sugggest Refactor**: Complex code that could be simpler.
- **Approve**: Meets all criteria.
