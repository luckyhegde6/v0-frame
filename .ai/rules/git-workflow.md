# Git Workflow Rules

We follow a strict Feature Branch Workflow.

## Core Rules

1.  **Main is Sacred**: The `main` branch must always be deployable. Never push directly to main.
2.  **Pull Requests**: All changes must go through a PR.
3.  **Atomic Commits**: Commits should do one thing. If you find yourself writing "and" in the commit message, split it.

## Branch Naming Convention

Format: `type/description`

-   `feat/add-user-profile`
-   `fix/upload-timeout`
-   `docs/update-readme`
-   `refactor/api-routes`
-   `test/add-unit-tests`

## Commit Message Convention (Conventional Commits)

Format: `type(scope): description`

-   `feat(auth): add login page`
-   `fix(upload): handle large file errors`
-   `docs(readme): update installation steps`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## PR Process

1.  **Create Branch**: `git checkout -b feat/my-feature`
2.  **Work**: Commit changes.
3.  **Push**: `git push origin feat/my-feature`
4.  **Open PR**: Target `main`.
5.  **Review**: Address feedback.
6.  **Verify**: CI must pass.
7.  **Merge**: Squash and merge.

## Review Checklist
- [ ] Are commits atomic?
- [ ] Do commit messages follow convention?
- [ ] Is the branch naming correct?
