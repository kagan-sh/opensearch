---
title: Quickstart
description: Install @kagan-sh/opensearch and run it from OpenCode.
---

# Quickstart

Board up. Search available. Under five minutes.

## 1. Install the plugin

Add the package to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@kagan-sh/opensearch"]
}
```

OpenCode installs npm plugins automatically at startup.

## 2. Enable optional web search

The `web` source uses `SearXNG`, so web search needs a SearXNG instance with `format=json` enabled.

```bash
export OPENSEARCH_WEB_URL="http://localhost:8080"
```

See [SearXNG setup](guides/searxng.md) for the exact instance requirements.

## 3. Use it when the task is broad

Reach for `opensearch` when you need to search, compare evidence, gather official docs, or combine local context with public references.

Good prompts:

- "Search how this repo handles plugin loading and compare it with official docs"
- "Look into rate limiting patterns for SearXNG and grep.app"
- "Gather evidence for how source adapters should be extended"

## 4. Narrow the search when needed

The tool accepts:

- `query`
- `sources?: ("session" | "web" | "code")[]`
- `depth?: "quick" | "thorough"`

Examples:

```json
{
  "query": "plugin loading order",
  "sources": ["session", "code"],
  "depth": "quick"
}
```

```json
{
  "query": "semantic-release trusted publishing github actions",
  "sources": ["web"],
  "depth": "thorough"
}
```

## 5. Read the result status first

The response always includes an explicit `status`.

- `ok` means synthesis succeeded
- `raw` means synthesis was disabled
- `raw_fallback` means source collection worked but synthesis failed
- `no_sources` means nothing eligible could run
- `no_results` means searches ran but returned no usable evidence

See [Result contract](reference/result-contract.md) for the full shape.
