---
title: Contributing
description: Local development and validation workflow for @kagan-sh/opensearch.
---

# Contributing

Keep the published README user-facing. Put maintainer and contributor detail here.

## Requirements

- Bun 1.2+
- Node 20+
- OpenCode CLI (`opencode`)
- Python 3.11+ for MkDocs

## Local setup

```bash
bun install
npm install -g opencode-ai
python3 -m pip install -r requirements-docs.txt
```

## Run the plugin from source

For local development, point `opencode.json` at the source entrypoint instead of the published package:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["file:///absolute/path/to/opensearch/src/index.ts"]
}
```

## Validate code changes

```bash
bun run check
```

That runs:

1. `bun run typecheck`
2. `bun run test`
3. `bun run build`

Acceptance tests boot a real OpenCode server process.

## Work on docs

```bash
mkdocs serve
```

Build locally before opening a PR:

```bash
mkdocs build --strict
```

## Release notes

- releases run through `semantic-release` on `main`
- npm publish is configured for GitHub Actions trusted publishing via OIDC
- the package must be linked to this repository in npm before the first public release

For deeper maintainer detail, see the repository root `CONTRIBUTING.md`.
