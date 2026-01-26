# .ai/ — AI Agent Configuration System

The `.ai/` directory contains standardized configuration files for AI coding assistants working on the FRAME photo management system. This system is designed to work across multiple AI environments including Antigravity, Windsurf, Claude Code, Cursor, and similar tools.

---

## 🚀 Quick Start

### For AI Agents

When you initialize in this project:
1.  **Identity**: Check `agents/` to find your designated role.
2.  **Rules**: Read `rules/global.md` and `rules/lifecycle.md`. These are non-negotiable.
3.  **Context**: Check `contexts/` for your current environment (dev, review, test).
4.  **Skills**: Load required skills from `skills/` based on your `config.json` definition.

### For Developers

1.  **Initialize**: `node .ai/scripts/setup/init-ai-env.js`
2.  **Validate**: `node .ai/scripts/validation/validate-config.js`
3.  **Command**: Try using a slash command like `/plan` or `/implement`.

---

## 📂 Directory Structure

\`\`\`
.ai/
├── config.json                 # Main configuration
├── README.md                   # This file
├── agents/                     # Specialized AI agents (roles)
├── skills/                     # Reusable workflows and domain knowledge
│   ├── coding-standards/       # Language/Framework standards
│   ├── workflows/             # Standard operating procedures
│   ├── domain-knowledge/      # Project-specific logic (e.g. lifecycle)
│   └── security/              # Security checklists
├── rules/                      # Enforced guidelines (Rules of Engagement)
├── commands/                   # Slash command definitions
├── hooks/                      # Event-based automations
│   ├── hooks.json              # Hook registry
│   └── scripts/                # Hook implementation scripts
├── mcp/                        # Model Context Protocol configurations
│   ├── mcp-config.json         # MCP server registry
│   └── servers/                # Server-specific configurations
├── contexts/                   # Situational context definitions
├── templates/                  # Code and file boilerplates
├── scripts/                    # Automation and validation scripts
└── examples/                   # Real-world usage examples
\`\`\`

---

## 🤖 Agent Invocation

Agents are specialized personas triggered by specific tasks or environments.

### Available Agents

| Agent | Responsibility | Key File |
|-------|----------------|----------|
| **Architect** | System design and planning | `agents/architect.md` |
| **Create** | Feature implementation | `agents/create.md` |
| **Debug** | Troubleshooting and fixing | `agents/debug.md` |
| **Optimize** | Performance tuning | `agents/optimize.md` |
| **Refactor** | Code quality and cleanup | `agents/refactor.md` |
| **Maintain** | Documentation and hygiene | `agents/maintain.md` |
| **Security** | Security auditing | `agents/security-reviewer.md` |
| **Test** | TDD and test coverage | `agents/test-engineer.md` |

### How to Invoke
- **Role-based**: "@create add a new login page"
- **Command-based**: `/implement user profiles` (automatically selects the `create` agent)
- **Automatic**: Agents are selected based on the `intent` detected in your request.

---

## 🛠️ Skills and Workflows

Skills are modular instructions that empower agents with specific capabilities.

### Using Skills
Agents load skills automatically based on their configuration in `config.json`.
- **Workflow Skills**: Step-by-step guides like `tdd-workflow.md`.
- **Standards Skills**: Guidelines like `typescript.md`.
- **Domain Skills**: Critical logic like `image-lifecycle.md`.

### Adding a Skill
1. Create a `.md` file in the appropriate `skills/` subdirectory.
2. Link it to an agent in `config.json` under the `skills` array.

---

## ⌨️ Command Usage

Slash commands provide a fast path to complex workflows.

| Command | Usage | Agent |
|---------|-------|-------|
| `/plan` | `/plan <feature>` | Architect |
| `/implement` | `/implement <plan>` | Create |
| `/test` | `/test <file>` | Test Engineer |
| `/debug` | `/debug <error>` | Debug |
| `/review` | `/review <diff>` | Refactor |
| `/optimize` | `/optimize <fn>` | Optimize |
| `/deploy` | `/deploy [env]` | Maintain |

---

## 🪝 Hook System

Hooks are scripts that run automatically during specific events.

### Configured Hooks (`hooks.json`)
- **`session-start`**: Triggered when a new AI session begins.
- **`post-edit`**: Triggered after a file is modified.
- **`pre-commit`**: Triggered before code is committed to Git.

### Managing Hooks
Update `.ai/hooks/hooks.json` to enable/disable or add new hook events.

---

## 🔌 MCP Integration

The Model Context Protocol (MCP) connects AI models to external tools and data.

### Configuration (`mcp-config.json`)
We use MCP to provide agents with:
- **GitHub Access**: Searching repos, managing PRs.
- **Database Access**: Querying Postgres/Prisma schemas.
- **System Access**: Running specialized local tools.

---

## 📜 Rules of Engagement

Rules are the "Non-Negotiables" of the project.

| Rule File | Enforces |
|-----------|----------|
| `global.md` | Core engineering principles |
| `lifecycle.md` | Correct image state transitions |
| `coding-style.md` | TS/React/CSS consistency |
| `security.md` | Zero-trust and secret protection |
| `testing.md` | TDD and coverage requirements |
| `git-workflow.md`| Branching and commit standards |

---

## 📜 Phase 1 Ingestion Contracts

> [!IMPORTANT]
> **Code that violates these contracts is wrong, even if it works.**
> Reference: `contracts/phase-1-ingestion.md`

---

## 🏗️ Architecture

### AI System Flow
\`\`\`mermaid
graph TB
    AI[AI Agent] --> Config[config.json]
    AI --> Rules[rules/]
    AI --> Agent[agents/]
    Agent --> Skills[skills/]
    Agent --> Templates[templates/]
    AI --> Commands[commands/]
    Commands --> Agent
    Hooks[hooks/] --> Scripts[scripts/]
    MCP[mcp/] --> External[External Services]
    Contexts[contexts/] --> AI
\`\`\`

### Image Lifecycle (Source of Truth)
\`\`\`mermaid
graph TD
    UPLOADED --> INGESTED
    INGESTED --> STORED
    STORED --> PROCESSING
    PROCESSING --> PROCESSED
    ANY --> FAILED
    FAILED --> UPLOADED
\`\`\`

---

## ❓ FAQ

**Q: Why separate agents into roles?**
A: To manage context tokens and ensure the AI doesn't get distracted by unrelated instructions (e.g. testing rules when doing feature work).

**Q: Can I ignore a rule if I'm in a hurry?**
A: **No.** Rules are enforced via automated scripts and hooks.

**Q: How do I add a new command?**
A: Create a file in `commands/`, add the YAML frontmatter, and it will be picked up by compatible AI environments.

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-26  
**Maintainer**: FRAME AI Operations Team
