# Stage 09 — Workflow Engine, Routing, Handoffs, Review, Recovery

## Mission
Build durable multi-step work execution so the system is not 40 isolated chatbots.

## Required work
- Implement intake -> planning -> bounded specialist assignment -> result integration flow.
- Implement durable task/workflow states and event history.
- Implement explicit role handoffs with structured contracts.
- Implement waiting/review/approval/failure/retry/resume states.
- Prevent circular delegation and hidden work expansion.
- Ensure restart/recovery resumes from persisted state.

## Acceptance gate
- Multi-role workflow executes with at least three occupational roles.
- Handoff evidence is visible.
- Forced interruption resumes at correct step.
- Failure is visible and does not produce fake success.
- Circular handoff protection test passes.
