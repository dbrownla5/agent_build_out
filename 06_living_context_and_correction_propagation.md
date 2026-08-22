# Stage 06 — Durable Living Context and Corrections

## Mission
Build shared durable context for Dayna and authorized AI workers without turning inference into false memory.

## Required work
- Implement typed records for direct user statements, verified facts, evidence, agent inference, decisions, preferences, temporary ideas, corrections, superseded values, active state, and unfinished work.
- Preserve author/source/time/confidence/scope/permissions/supersession.
- Implement relevant-context retrieval by task and role.
- Implement correction propagation to affected future work while retaining history.
- Ensure web app, MCP, agent runtime, and workflows use the same living-context store.

## Acceptance gate
- Create fact -> retrieve through second client.
- Correct fact -> second agent/task sees corrected value.
- History retains superseded value.
- Unauthorized role cannot retrieve restricted record.
- Agent inference remains labeled inference and cannot silently become Dayna's statement.
