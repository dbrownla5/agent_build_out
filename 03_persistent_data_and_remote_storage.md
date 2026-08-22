# Stage 03 — Persistent Data and Remote Storage Containers

## Mission
Build production-grade persistence for system state and remote object/file storage for originals, derivatives, queues, outputs, catalogs, and archives.

## Required work
- Replace production dependence on local SQLite/local filesystem if present; local implementations may remain only for tests/dev adapters.
- Implement storage interfaces so provider choice is swappable.
- Define persistent records for users/workspaces, tasks, events, approvals, agent runs, living context, media manifests, documents, item records, workflow state, evidence, outputs, and audit trail.
- Define remote storage containers/buckets/prefixes for originals, derivatives, intake, review, outputs, catalog/archive.
- Originals must have immutable/logically write-once handling after verified ingest.
- Implement checksums and original-to-derivative lineage.
- Implement signed/authorized access patterns rather than public raw file URLs.

## Acceptance gate
- Restart test proves task/catalog state persists.
- File test proves original survives process restart and can be retrieved through authorized path.
- Mutation test proves original cannot be silently overwritten.
- Derivative lineage test passes.
