---
description: Write the current plan to PLAN.md (or PLAN-<scope>.md) for handoff to Command Code Desktop (executes with DS V4.1 Flash)
agent: planner
---

Write a self-contained plan document to `PLAN.md` at the repo root (overwrite it if present) so the current session's plan can be handed off to **Command Code Desktop** for execution. Command Code will NOT see this conversation — everything it needs must be in the file.

If another plan is already in flight, write to `PLAN-<scope>.md` (e.g. `PLAN-deploy.md`) instead so an existing `PLAN.md` is not clobbered — this planner only writes `PLAN*.md` files and never edits source code.

Use the current conversation as the source of truth. For repo facts (structure, commands, conventions) read `AGENTS.md` and the relevant source files. Do not invent work that was not discussed.

Task focus: $ARGUMENTS

Structure `PLAN.md` exactly like this:

```markdown
# <Task title — imperative, e.g. "Add soft-delete to Order">

> **Executor:** Command Code Desktop  ·  **Model:** `deepseek/deepseek-v4.1-flash` (DeepSeek V4.1 Flash, Go plan)

## Goal
What success looks like, in one or two sentences.

## Context & Decisions
Background, why now, and the trade-offs agreed during planning in opencode.

## Current State
What already exists and is untouched. Note explicitly what this plan does NOT change.

## Files & Entry Points
- `path/to/file.ts:123` — what to look at here

## Constraints & Conventions
The rules that MUST be respected. Pull these from AGENTS.md (e.g. DB routes proxy to Spring Boot with hardcoded JSON fallback, async `params` in Next.js 16, checkout field limits, branch workflow). Add anything agreed in planning.

## Implementation Steps
Ordered list of concrete changes: one bullet per edit, with the target file path and exactly what to change.

## Verification
Exact commands to run, e.g. `bun run lint`, `bun run build`, `curl` checks. State the expected outcome.

## Open Questions
Anything unresolved. For each, state the default/assumption to build against.
```

Then append:

```markdown
---
Plan written by opencode. Execute in Command Code Desktop: open this repo, then start a thread referencing `@PLAN.md`.
```