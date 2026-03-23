# OpenSearch

OpenSearch is a privacy-oriented search stack for LLM assistants.

Think `OpenCode`, but for evidence-backed search: a standalone API, a Vite web client, an Expo mobile client, and a server-side datasource registry that keeps secrets off the client.

## What It Is

- `apps/api` typed HTTP + SSE search backend
- `apps/web` Vite + React + shadcn + Jotai answer interface
- `apps/mobile` Expo + Expo Router + Jotai native client
- `packages/*` shared contracts, core pipeline, datasource adapters, SDK, prompts, and testkit

The current alpha is optimized for local-first and self-hosted use:

- server-side datasource execution only
- no client-side datasource credentials
- built-in privacy-friendly web search via SearXNG
- public code search via grep.app
- thread-aware session history search inside the API

## Quick Start

Requirements:

- Node 22+
- pnpm 10+

Install everything:

```bash
pnpm install
```

Run the API and web app together:

```bash
pnpm dev
```

Run mobile:

```bash
pnpm dev:mobile
```

Optional web search backing:

```bash
SEARXNG_BASE_URL=http://localhost:8080 pnpm dev:api
```

Default local endpoints:

- web: `http://127.0.0.1:5173`
- api: `http://127.0.0.1:3001`

## Product Positioning

OpenSearch is not a general chatbot shell.

It is a search fabric for assistants that need:

- cheap and privacy-aware retrieval
- explicit sources and follow-ups
- reusable search threads
- third-party datasource extensibility
- a small, inspectable, self-hostable core

## Datasource Model

Each datasource is a server-registered connector with:

- `id`
- `label`
- `category`
- `capabilities`
- `credentialMode`

Clients can request datasource ids, but only the server can execute them.

Built-ins today:

- `session-history`
- `grep-app-code`
- `searxng-web` when `SEARXNG_BASE_URL` is configured

See `ARCHITECTURE.md` for the alpha-to-PMF security and extensibility model.

## Validation

```bash
pnpm run ci
```

That runs:

1. `pnpm run typecheck`
2. `pnpm run test`
3. `pnpm run build`

## Monorepo Layout

```text
apps/
  api/
  mobile/
  web/
packages/
  contracts/
  core/
  prompts/
  sdk/
  sources/
  testkit/
```

## License

[MIT](LICENSE)
