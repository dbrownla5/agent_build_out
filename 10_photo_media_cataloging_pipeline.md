# Stage 10 — High-Volume Photo/Media Intake, Analysis, Cataloging, and Renaming

## Mission
Build the real automatic photo workflow that has repeatedly been reduced to shells.

## Required work
- Add bulk photo upload from the real web app/API.
- Preserve remote original before processing.
- Generate checksum, manifest, source identity, upload/batch records.
- Analyze visual content with the authorized vision model/tool.
- Group related photos into batches/items using evidence and confidence.
- Detect exact/near duplicates and unusable/low-quality images without deleting originals.
- Identify candidate purpose/item/category and retain uncertainty.
- Create content-informed managed filenames for working/catalogued copies while retaining immutable original identity and original filename.
- Place records/files into appropriate storage containers/workflow locations automatically.
- Create non-destructive derivatives and retain lineage.
- Connect media to resale/item/project/client records where evidence supports it.
- Route ambiguous results to review.
- Trigger next occupational workflow automatically.
- Implement temporary/cache cleanup only after verified durable remote preservation; cleanup failure must not corrupt catalog state.

## Acceptance gate
Run a real multi-photo batch and prove, with database/storage evidence:
1. originals preserved;
2. checksums/manifests recorded;
3. grouping occurred;
4. duplicate/quality flags recorded;
5. vision analysis recorded with provenance;
6. managed names generated;
7. derivatives linked;
8. catalog/item links created;
9. ambiguous item enters review;
10. next workflow triggers;
11. failed remote storage prevents cache/source cleanup.
