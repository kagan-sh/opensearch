# Architecture

## Positioning

OpenSearch is an answer-oriented search layer for LLM assistants.

It is built to help assistants search cheaply, privately, and with explicit evidence across a growing set of datasources.

## Core Shape

- `apps/api` owns threads, datasource execution, and streaming answers
- `apps/web` and `apps/mobile` are thin clients over `@opensearch/sdk`
- `packages/contracts` is the shared source of truth
- `packages/sources` is the server-only datasource registry
- `packages/core` turns datasource results into ranked, answer-ready turns

## Alpha Security Model

Alpha should stay simple:

- datasource connectors run on the server only
- clients send datasource ids, never credentials
- secrets stay in environment variables or server-side secret stores
- connectors expose one narrow search interface and return normalized `SearchSource` items
- the server publishes datasource descriptors so clients can render scope controls safely

This gives OpenSearch a usable extension model without pretending to sandbox arbitrary third-party code.

## PMF Path

When OpenSearch finds product-market fit, evolve the connector model without changing the client contract:

1. `Trusted connector allowlist`
   - ship connectors as reviewed packages or signed manifests
2. `Tenant-scoped connector instances`
   - keep per-workspace enablement, quotas, and audit trails
3. `Scoped secrets`
   - store secrets per datasource instance, not globally
4. `Remote connector runtime`
   - move risky or enterprise connectors into sidecars or remote workers
5. `Policy layer`
   - rate limits, outbound allowlists, result filtering, redaction hooks

## Datasource Contract

Each datasource descriptor should stay small:

- `id`
- `label`
- `description`
- `category`
- `capabilities`
- `credentialMode`
- `enabled`

This is enough for alpha and stable enough for PMF.

## Why This Model Works

- simple enough for one self-hosted alpha binary
- secure enough to keep secrets off the client
- scalable enough to add connectors without changing web/mobile state
- explicit enough for assistants to reason about search scope
