# Using Agents

This guide demonstrates how to invoke and work with AI agents in the FRAME project.

## Basic Invocation

To invoke an agent, simply address them by name in your prompt or use the slash command.

**Example**:
> @create please add a user profile page

**Slash Command**:
> /implement user profile page

## Agent Roles

| Agent | Responsibility | When to Use |
|-------|----------------|-------------|
| **Create** | Feature implementation | Adding new pages, components, APIs |
| **Debug** | Troubleshooting | Fixing bugs, errors, crashes |
| **Optimize** | Performance | Improving speed, memory, loading times |
| **Refactor** | Code Quality | Cleanup, restructuring, modernizing |
| **Maintain** | Docs & Hygiene | Updating README, TODOs, cleanup |
| **Architect** | System Design | Planning complex features, schema changes |
| **Security** | Vulnerabilities | Auditing code for security issues |
| **Test** | TDD & Coverage | Writing tests, ensuring quality |

## Best Practices

1. **Be Specific**: "Add a button to the nav bar" is better than "Update the UI".
2. **Context Matters**: Provide context or ask the agent to read specific files.
3. **One Task at a Time**: Don't overload a single request with multiple disparate tasks.
4. **Review**: Always review the agent's work/plan before approving execution.

## Example Workflow

1. **Plan**: `/plan add user profile` (Architect/Create) -> Generates implementation plan.
2. **Approve**: User approves plan.
3. **Implement**: `/implement user profile` (Create) -> Writes code.
4. **Debug**: "Using @debug, fix the visual glitch on the profile page" -> Fixes bugs.
5. **Test**: `/test profile` (Test) -> Verifies correctness.
