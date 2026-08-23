# Stage 02 — Remote Web Application and Server Foundation

## Mission
Create the real production-oriented web application/server foundation. The production target must be remote/off-site and must not depend on Dayna's PC.

## Required work
- Use the project's selected web-application framework/runtime or choose one appropriate to the existing codebase.
- Create a real server/API process and real web application surface.
- Add environment-based configuration suitable for remote deployment.
- Eliminate localhost assumptions from production configuration while allowing local development/testing only as development tooling.
- Add health/readiness endpoints.
- Add deployment manifests/adapters for at least two reasonable remote hosting targets so the build is not trapped by one host. Do not use Cloudflare.
- Keep deployment credentials external to source.
- Build CI/start commands that a repo-native coding agent or hosting platform can execute automatically.

## Acceptance gate
- Web app and server start in test/dev mode.
- Production config contains no localhost dependency.
- Deployment config validates for at least two non-Cloudflare remote targets.
- Server health test passes.
- UI response comes from server-backed app, not a static unrelated file.

## Stop rule
Do not claim remote deployment complete until Stage 14.
