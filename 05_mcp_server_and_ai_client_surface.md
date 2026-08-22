# Stage 05 — Real MCP Server and AI Client Surface

## Mission
Implement the real MCP layer through which authorized AI workers/clients can use the operating system.

## Required work
- Implement standards-conformant MCP server transport supported by the selected stack.
- Expose only bounded tools/resources/prompts required by the system.
- Include task creation/read, context retrieval, approval status/actions, files/media references, agent directory, workflow status, and outputs where authorized.
- Authenticate MCP clients.
- Ensure MCP calls use the same production persistence, permissions, and event history as the web app.
- Do not implement a separate fake MCP universe.

## Acceptance gate
Run a real MCP client test proving:
- initialize/connect;
- capability discovery;
- authenticated tool call;
- unauthorized tool call rejection;
- state written by MCP is visible through server/web API and vice versa.
