# Using Skills

Skills are reusable bundles of knowledge and workflows that agents use to perform tasks consistently.

## How Agents Use Skills

Agents automatically load relevant skills based on their configuration (`.ai/config.json`) and the current context.

**Example**:
- The **Create Agent** automatically loads `coding-standards` and `workflows/feature-implementation`.
- The **Test Agent** loads `workflows/tdd-workflow`.

## Manual Reference

You (the user) can also reference skills directly to understand project standards.

**Useful Skills**:
- **Coding Standards**: `.ai/skills/coding-standards/` (TS, React, Node)
- **Image Lifecycle**: `.ai/skills/domain-knowledge/image-lifecycle.md`
- **Security**: `.ai/skills/security/security-checklist.md`

## Creating New Skills

1. Create a markdown file in `.ai/skills/<category>/<skill-name>.md`.
2. Define the skill clearly using the standard format.
3. Update `.ai/config.json` if you want it auto-loaded for specific agents.
