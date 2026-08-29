# Stage 14 — Remote Deployment, Operations, Cost Controls, and Recovery

## Mission
Deploy the actual system off-site and prove it does not depend on Dayna's computer.

## Required work
- Select one of the validated remote deployment adapters based on current application requirements and low-cost/new-business constraints.
- Deploy web app/server, database/persistence, remote storage, worker/background processing if required, and MCP endpoint.
- Configure secrets securely.
- Configure backups and recovery procedure.
- Configure health checks/logs and reasonable cost/usage limits.
- Ensure no Cloudflare dependency.
- Ensure production does not require localhost, local SQLite, local filesystem storage, or Dayna's PC to remain online.

## Acceptance gate
- Publicly reachable authenticated HTTPS web app URL exists.
- Remote MCP endpoint exists and passes Stage 05 client test.
- Turn off/stop local dev process and prove remote system remains available.
- Upload/retrieve test persists remotely.
- Backup/recovery test succeeds.
- Deployment evidence and exact environment/version are written to ledger/handoff.
