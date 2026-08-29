# Stage 04 — Authentication, Permissions, Approvals, and Guardrails

## Mission
Implement the enforcement layer that separates technical capability from occupational authority.

## Required work
- Add authentication for Dayna and authorized AI/service clients.
- Add task-scoped authorization and role/tool permissions.
- Distinguish READ, ANALYZE, DRAFT/PROPOSE, MODIFY, EXECUTE/PUBLISH/SEND/DELETE authorities.
- Implement approval records and blocking states.
- Enforce permanent-role prohibitions at runtime, not only in prompts.
- Block raw-secret exposure to agents.
- Record every consequential action and approval in audit history.

## Acceptance gate
Demonstrate automated tests for:
- unauthorized action blocked;
- approval-required action stops;
- approval permits exactly scoped action;
- expired/revoked permission fails;
- role cannot call forbidden tool despite model request;
- secrets are not passed into agent-visible context.
