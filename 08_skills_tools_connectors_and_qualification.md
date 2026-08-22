# Stage 08 — Skills, Tools, Connectors, and Qualification

## Mission
Build the actual capabilities agents use and prove qualification rather than generating skill descriptions.

## Required work
- Implement skill/tool registry with version, inputs, outputs, permissions, compatible roles, failure behavior, and tests.
- Implement/connect core tools needed for web research, file/document parsing, hashing, image metadata/vision, image derivatives, storage, catalog/database, calculator/spreadsheet operations, notifications/approvals, and other required workflows.
- Keep external connectors behind permission-scoped interfaces.
- Build qualification runner that tests role + skill + tool + permissions + task type.
- Store qualification state and evidence.

## Acceptance gate
- At least one qualified skill executes for each major domain family: intake/research, writing, finance/records, resale/media, technical.
- Unqualified role/skill combination is blocked.
- Failed qualification cannot be treated as available.
