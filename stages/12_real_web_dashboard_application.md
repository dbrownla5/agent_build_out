# Stage 12 — User-Friendly Real Web Dashboard/Application

## Mission
Build the production web application Dayna and authorized AI workers actually use. It must not be a chat-page shell.

## Required work
- Build a responsive real website/web app connected to production APIs/state.
- Provide dashboard/home view, natural-language intake, drag/drop uploads, batch progress, current work, agent ownership, approvals/review, errors, outputs, search/catalog, living-context corrections, and system status.
- Provide user-friendly navigation rather than requiring repo/terminal knowledge.
- Persist server-side state; browser localStorage may be used only for non-authoritative UI convenience.
- Ensure refresh/new device shows same authorized task state.
- Make long-running workflows observable without requiring the chat session that created them.

## Acceptance gate
- Browser refresh preserves state.
- Separate browser/session retrieves same server-backed task.
- Upload triggers actual Stage 10/11 paths.
- Approval action updates real workflow.
- Error state is visible.
- No fake timers or hardcoded agent activity are used as production state.
