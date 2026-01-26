# AGENT_RULES — AI Engineering Governance for FRAME

This file defines the non-negotiable rules that all AI agents
must follow when contributing to this repository.

Agents are assistants, not architects.
They operate under strict boundaries.

Violation of these rules invalidates the output.

---

## 1. GLOBAL PRINCIPLES (APPLY TO ALL AGENTS)

1. Correctness > performance > features
2. Explicit state transitions are mandatory
3. All heavy work must be asynchronous
4. Originals are immutable and lossless
5. Cloud storage is ephemeral and disposable
6. Home server is the canonical source of truth
7. Failures are expected and must be handled explicitly
8. Streaming is preferred over buffering
9. Boring, readable code beats clever abstractions

No agent is allowed to violate these principles.

---

## 2. IMAGE LIFECYCLE (NON-NEGOTIABLE)

Every image MUST conform to the lifecycle below:

\`\`\`
UPLOADED
↓
INGESTED (temporary cloud storage)
↓
STORED (home server confirmed)
↓
PROCESSING (background pipeline)
↓
PROCESSED
\`\`\`

Rules:
- Agents may NOT skip states
- Agents may NOT merge states
- Agents must preserve idempotency
- Agents must handle retries safely

---

## 3. PROMPT-SPECIFIC RULES

---

### 🛠 CREATE AGENT  
(prompt-create.prompt.yml)

#### When to use
- Adding ingestion stages
- Adding job types
- Adding gallery features
- Adding home-server APIs

#### Allowed
- Add new functionality **within the current phase**
- Introduce new job types with explicit contracts
- Extend the image lifecycle without breaking it
- Add TODOs for future phases

#### Forbidden
- Adding ML features before ingestion is complete
- Performing heavy work in API routes
- Introducing new infrastructure casually
- Coupling UI logic to background processing

#### Required Behavior
- Explain design before code
- Implement one concern at a time
- Respect async boundaries
- Update documentation if behavior changes

---

### ⚡ OPTIMIZE AGENT  
(prompt-optimize.prompt.yml)

#### When to use
- Slow gallery loads
- High memory usage
- Large ZIP downloads
- DB query inefficiencies

#### Allowed
- Streaming optimizations
- Query optimization
- Index improvements
- Memory usage reductions

#### Forbidden
- Behavior changes
- Removing safety checks
- Optimizing unmeasured code
- Introducing caching without invalidation strategy

#### Required Behavior
- Identify bottlenecks first
- Justify each optimization
- Explain trade-offs
- Preserve correctness above all

---

### 🐞 DEBUG AGENT  
(prompt-debug.prompt.yml)

#### When to use
- Uploads stuck in processing
- Files missing
- Jobs retrying endlessly
- Inconsistent DB state

#### Required Debugging Process
1. Reconstruct execution timeline
2. Identify violated lifecycle rule
3. Trace async boundaries
4. Identify root cause
5. Propose minimal fix

#### Forbidden
- Deleting data as a fix
- “Just retry” answers
- Ignoring idempotency issues
- Masking failures

---

### 🧹 REFACTOR AGENT  
(prompt-refactor.prompt.yml)

#### When to use
- Cleaning v0 artifacts
- Introducing domain folders
- Simplifying API routes
- Making jobs easier to reason about

#### Allowed
- Rename variables and files
- Move code into clearer boundaries
- Reduce duplication
- Improve readability

#### Forbidden
- Changing behavior
- Adding features
- Modifying APIs
- Introducing new dependencies

#### Required Behavior
- Explain why refactor is needed
- Keep diffs reviewable
- Preserve all existing contracts

---

### 🧭 MAINTAIN AGENT  
(prompt-maintain.prompt.yml)

#### When to use
- End of a phase
- Before adding major features
- Before sharing repo publicly

#### Allowed
- README updates
- TODO audits
- Dead code detection
- Configuration sanity checks
- Documentation improvements

#### Forbidden
- Feature additions
- Architectural changes
- Silent behavior changes

---

## 4. CODE QUALITY STANDARDS

All agent-generated code must:
- Use explicit types
- Avoid magic values
- Include error handling
- Prefer clarity over cleverness
- Add TODOs instead of assumptions

---

## 5. FAILURE HANDLING RULES

Agents must assume:
- Network failures
- Disk pressure
- Partial writes
- Duplicate job execution
- Home server unavailability

All designs must degrade gracefully.

---

## 6. RULE OF THUMB (MANDATORY)

If unsure which prompt to use:

| Situation | Prompt |
|--------|--------|
Adding functionality | create |
Things are slow | optimize |
Something broke | debug |
Code feels messy | refactor |
Repo hygiene | maintain |

Using the wrong prompt is a failure.

---

## 7. FINAL MENTOR NOTE (READ THIS)

This setup effectively gives you:

- A virtual staff engineer (create)
- A performance engineer (optimize)
- A reliability engineer (debug)
- A code health guardian (refactor & maintain)

Agents do not replace judgment.
They amplify it.

If an agent’s output violates these rules,
discard it without hesitation.
