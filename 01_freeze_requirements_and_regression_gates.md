# Stage 01 — Freeze Requirements and Create Regression Gates

## Mission
Convert the controlling requirements into executable acceptance tests and invariants so later agents cannot drift the product or turn working components back into shells.

## Required work
- Import/reference the exact controlling permanent-workforce definitions supplied by Dayna without collapsing or rewriting them.
- Create machine-readable requirement IDs for MCP, remote server, dashboard, LLM, guardrails, 40 roles, skills, workflows, storage, photo cataloging, documents, living context, approvals, recovery, and cross-device persistence.
- Create test scaffolding for each requirement.
- Add negative tests for prohibited behavior: local-production assumption, mocked production runner, browser-only task state, destructive original-media mutation, unauthorized occupational action, unsupported certainty.
- Add a single master acceptance-test entry point that later stages progressively satisfy.

## Acceptance gate
- Requirement IDs exist and map to tests.
- Negative guard tests execute.
- No functional requirement is deleted to make tests pass.

## Evidence
Write exact tests and results into `evidence/stage01_contract_tests.md` and update ledger/handoff.
