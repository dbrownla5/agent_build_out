# Server foundation — Phase 1.
# Host-agnostic container: works as a plain container, on Cloud Run, or on any
# runtime that gives the process a PORT. No npm install step exists because the
# runtime has ZERO npm dependencies (node: builtins only).
FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

WORKDIR /app

# node:alpine ships a non-root "node" user (uid 1000). Own the app dir with it.
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node roles ./roles

USER node

EXPOSE 8080

# Loopback here is container-internal only — it is the healthcheck probing the
# process in its own network namespace, not a production URL assumption.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
