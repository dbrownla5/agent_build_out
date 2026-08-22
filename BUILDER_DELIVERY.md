# Builder Delivery Instructions

This repository is intended to be handed to a repo-native software coding agent or full-stack web-app builder that can read/write the real repository, run tests, and deploy the resulting web application.

It is not intended to be executed as one enormous chat prompt.

## Required execution pattern

- Give the builder access to the real application repository plus this build-control repo.
- Start with `AGENT_START_PROMPT.md`.
- The builder reads `LAST_HANDOFF.md` and executes only the named stage.
- After the stage gate passes, it updates the ledger/handoff and stops.
- A fresh agent/context can continue the next stage without needing the previous conversation.
- Source control commits should correspond to stage/substage boundaries so working behavior can be recovered.

## Build surface versus production surface

The coding agent may run development/test processes in its own coding environment.

The finished product is a real remotely hosted website/web application + server + MCP + LLM/agent runtime. It is not hosted on Dayna's computer, not a localhost product, not an Antigravity chat page, and not dependent on the original builder session remaining open.

## Context-limit rule

If the agent approaches its context/tool limit before finishing a stage, it must:
1. preserve compilable/runnable repo state;
2. run the tests available so far;
3. update `LAST_HANDOFF.md` with the exact unfinished subtask and failures;
4. never mark the stage passed;
5. stop so a new coding context continues from files, tests, and evidence.
