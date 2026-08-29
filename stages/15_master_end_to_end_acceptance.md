# Stage 15 — Master End-to-End Acceptance and Release Gate

## Mission
Determine whether the system is actually built. This is the only stage authorized to mark the project end-to-end WORKING.

## Required test A — Photo batch
From the deployed web app on a non-server device:
- upload photo batch;
- preserve originals remotely;
- catalog/checksum;
- vision analyze;
- group/deduplicate/quality flag;
- generate managed names;
- create derivatives;
- route through relevant agents;
- review one uncertain item;
- show all state in dashboard;
- resume from another session/device.

## Required test B — Document
Upload a real test document and prove preservation -> extraction -> classification -> routing -> evidence-linked output -> correction -> corrected future agent context.

## Required test C — MCP/AI worker
Authorized MCP client connects remotely, discovers capabilities, reads bounded context, creates/continues work, and its state appears in the web app.

## Required test D — Guardrails
Prove a forbidden action is blocked and an approval-required action cannot execute before approval.

## Required test E — Recovery
Interrupt an active workflow/service, restore/restart it, and prove durable work resumes without fabricated completion or loss of living context.

## Release gate
Only mark all applicable ledger rows WORKING if the tests above execute against the deployed production path.

If any test fails, project status remains PARTIAL. Fix the failure; do not write a new plan and do not claim completion.
