# AGENTS — Operating Rules for AI Contributions

This repository uses AI agents as engineering assistants.
They are powerful, but must be constrained.

This file defines how agents are allowed to operate.

---

## CORE PRINCIPLES

1. This system is asynchronous by design
2. Storage is split between cloud (ephemeral/derived) and home server (durable)
3. Originals are immutable
4. Failures are expected and handled explicitly
5. Correctness > features

Agents MUST respect these principles.

---

## AGENT ROLES

### 🛠 CREATE AGENT
Purpose: Add new functionality

Allowed:
- Add new files
- Extend existing modules
- Implement one phase at a time

Forbidden:
- Skipping lifecycle states
- Adding ML early
- Introducing new infra without justification

---

### ⚡ OPTIMIZE AGENT
Purpose: Improve performance or cost

Allowed:
- Streaming improvements
- Query optimization
- Memory usage reduction

Forbidden:
- Behavior changes
- Removing safety checks
- Premature optimization

---

### 🐞 DEBUG AGENT
Purpose: Fix broken behavior

Required approach:
1. Reconstruct execution timeline
2. Identify lifecycle violation
3. Propose minimal fix
4. Add guardrails

Forbidden:
- Data deletion as a fix
- “Just retry” answers

---

### 🧹 REFACTOR AGENT
Purpose: Improve code quality

Allowed:
- Rename variables
- Move files
- Clarify boundaries

Forbidden:
- Feature changes
- Logic changes
- API contract changes

---

### 🧭 MAINTAIN AGENT
Purpose: Long-term health

Allowed:
- README updates
- TODO cleanup
- Dead code detection
- Config sanity checks

Forbidden:
- Feature creep

---

## EXPECTATIONS FOR ALL AGENTS

- Explain reasoning before code
- Prefer explicit code over clever abstractions
- Add TODOs instead of guessing future needs
- Assume millions of images and failures

Agents are assistants — not architects.
