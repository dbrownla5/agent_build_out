# Workflow Requirements

These are functional requirements. Implementation details may vary by platform.

## Photo/media intake
- Accept large photo batches through the real web app.
- Preserve originals remotely before downstream processing.
- Generate checksum/provenance records.
- Analyze visual content.
- Group related images/batches/items.
- Detect duplicates and unusable images.
- Perform content-informed managed renaming without destroying original identity.
- Create non-destructive derivatives.
- Catalog media and connect it to item/project/client/workflow records.
- Route uncertain material to review instead of inventing answers.
- Trigger downstream occupational workflows automatically.
- Never clear a temporary/mobile/cache source until durable remote preservation is verified.

## Document intake
- Preserve original remotely.
- Extract text/content where appropriate.
- Classify and catalog with provenance.
- Route to correct qualified role/workflow.
- Keep corrections and derived outputs linked to source.

## Living context
- Separate Dayna's direct words from agent inference.
- Preserve corrections, provenance, uncertainty, permissions, supersession, current state, unfinished work.
- Authorized AI workers must read the same durable current state.
- A correction must propagate to affected future work without erasing history.

## Dashboard/web app
- Real remote web application, not browser-local simulation.
- Shows intake, workflows, agent ownership, approvals, errors, outputs, living-context changes, and system state.
- State survives refresh/device changes.
