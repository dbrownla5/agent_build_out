# Rules Every Stage Agent Must Follow

1. Build; do not replace execution with a new plan.
2. Read current repo state before changing files.
3. Preserve unrelated working code.
4. No mocks in production paths unless the stage explicitly requires a temporary test double; test doubles must never satisfy a production gate.
5. No localhost as production architecture.
6. No Cloudflare-specific implementation.
7. Do not reintroduce the removed old-domain requirement.
8. Every claimed working component needs runtime evidence.
9. Add regression tests for every newly working component.
10. Never delete a source photo/file merely because a copy command returned success; verify durable remote persistence first.
11. Do not collapse the 40 occupational roles into generic agents.
12. Do not declare the whole build complete before Stage 15 passes.
13. At context limit risk: stop coding cleanly, commit/save state, update `LAST_HANDOFF.md`, and name the exact next unfinished subtask.
