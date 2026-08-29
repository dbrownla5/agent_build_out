# Stage 07 — 40 Permanent Occupational Agents and Runtime

## Mission
Turn the exact 40 occupational contracts into runtime-enforced workers, not prompt cards.

## Required work
- Load the exact controlling definitions for all 40 roles.
- Represent scope, prohibitions, inputs, outputs, tools, context scope, handoffs, evaluation rules, and approval requirements in executable configuration/contracts.
- Implement agent runtime that loads one bounded role for a task.
- Connect the real LLM path; no hardcoded success text.
- Add structured inputs/outputs and runtime validation.
- Ensure a role cannot acquire authority merely by prompt instruction.

## Acceptance gate
- Registry validation proves exactly the controlling 40 roles are available.
- Execute at least three materially different roles through the real LLM/runtime.
- Prohibited-role action test fails closed.
- Output schema violations are rejected/retried/fail visibly.
