# Contributing

OpenSearch is a pnpm monorepo for privacy-oriented assistant search.

## Requirements

- Node 22+
- pnpm 10+

## Setup

```bash
pnpm install
```

## Local Development

API + web:

```bash
pnpm dev
```

Mobile:

```bash
pnpm dev:mobile
```

Optional server-side web search:

```bash
SEARXNG_BASE_URL=http://localhost:8080 pnpm dev:api
```

## Validate Changes

```bash
pnpm run ci
```

## Project Structure

- `apps/api` standalone search API and SSE transport
- `apps/web` Vite + shadcn + Jotai web client
- `apps/mobile` Expo + Jotai native client
- `packages/contracts` shared wire contracts and schemas
- `packages/core` ranking, thread execution, answer generation
- `packages/sources` datasource registry and adapters
- `packages/sdk` typed client for web and mobile
- `packages/prompts` answer-model prompts
- `packages/testkit` fixtures and fake registries

## Testing Policy

- prefer behavior-first tests
- keep package tests small and contract-driven
- test API flows through HTTP/SSE behavior, not private helpers
- test web/mobile through stores and visible UI outcomes
- add a test when a behavior changes or a bug escapes

## Datasource Contribution Rules

Datasource connectors are server-only.

- never move datasource credentials into web or mobile clients
- add new connectors in `packages/sources`
- expose only normalized search results through shared contracts
- keep connector config explicit: `id`, `category`, `capabilities`, `credentialMode`
- default to opt-in enablement for connectors that touch private systems

## Architecture Rules

- no Bun
- no legacy aliases
- no backward-compatibility shims
- no dead code
- keep clients thin over the shared SDK
- keep privacy posture obvious in code and docs
