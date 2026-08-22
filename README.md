# Dayna MCP/LLM Build Control Repo

This repo exists to stop chat-context drift and false completion claims.

The repo, not a chat transcript, is the source of truth for build state.

## Operating rule

One coding agent executes one stage at a time against the real application repository. A stage is complete only when its required code is integrated, its tests pass, and its evidence is written to `BUILD_LEDGER.md` and `LAST_HANDOFF.md`.

No stage may be marked complete because files exist, code was generated, or a plan was written.

## Current non-negotiable platform constraints

- Production server is remote/off-site. No localhost or user's PC as production host.
- Cloudflare is out of scope unless explicitly reintroduced later.
- The old Well Lived domain requirement is removed.
- The product remains an MCP + LLM operating system with guardrails, permanent occupational agents, remote storage, automated workflows, living context, and a live user-facing HTML/web application for Dayna and authorized AI workers.
- The build is larger than the 40-role workforce alone.
- The UI must be a real website/web application connected to production state, not a chat-page mockup or an Antigravity-only surface.
- Low-cost/new-business economics matter, but cost does not authorize deleting required functionality.

## Stage protocol

1. Open `contracts/CURRENT_BUILD_CONTRACT.md`.
2. Open `BUILD_LEDGER.md` and `LAST_HANDOFF.md`.
3. Execute exactly one file from `stages/`.
4. Run its acceptance tests.
5. Update ledger + handoff with evidence.
6. Stop. The next agent/session begins from repo state, not chat memory.

## Hard prohibition

Do not create another architecture plan in place of building. Do not declare the system complete until Stage 15 passes.
