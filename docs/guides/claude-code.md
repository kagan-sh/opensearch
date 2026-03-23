---
title: Claude Code install guide
description: Set up @kagan-sh/opensearch as a native MCP server in Claude Code.
---

# Claude Code install guide

OpenSearch runs as a native MCP server in Claude Code over stdio. No build step, no global install. One command and you are searching.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and working
- Node.js 18+ (for `npx`)
- Optional: a self-hosted [SearXNG](searxng.md) instance for web search

## Install

### One-liner (code search only)

```bash
claude mcp add opensearch -- npx -y @kagan-sh/opensearch
```

This enables the `code` source (public code via grep.app) out of the box. No configuration needed.

### With web search

To also search the web via a SearXNG instance:

```bash
claude mcp add opensearch \
  -e OPENSEARCH_WEB_URL=http://localhost:8080 \
  -- npx -y @kagan-sh/opensearch
```

Replace `http://localhost:8080` with your SearXNG base URL. See [SearXNG setup](searxng.md) for instance requirements.

### Project-level config

Drop a `.mcp.json` in your project root to share the configuration with your team:

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "npx",
      "args": ["-y", "@kagan-sh/opensearch"],
      "env": {
        "OPENSEARCH_WEB_URL": "http://localhost:8080"
      }
    }
  }
}
```

Leave `OPENSEARCH_WEB_URL` as an empty string to disable web search and use code search only.

### Bun users

If you prefer Bun over Node:

```bash
claude mcp add opensearch -- bunx @kagan-sh/opensearch
```

## Verify

After adding the server, start a Claude Code session and ask:

> Search for how MCP servers handle tool registration

You should see the `opensearch` tool invoked in the conversation. The result is structured JSON with sources, relevance scores, and follow-up suggestions.

## Available sources

| Source | Available | Description |
| --- | --- | --- |
| `web` | When `OPENSEARCH_WEB_URL` is set | SearXNG web search |
| `code` | Always | Public code search via grep.app |
| `session` | No | OpenCode-only; not available in MCP mode |

## Configuration

All configuration is via environment variables passed through the MCP server config.

| Variable | Default | Meaning |
| --- | --- | --- |
| `OPENSEARCH_WEB_URL` | unset | SearXNG instance URL. Required for web search. |
| `OPENSEARCH_SOURCE_WEB` | `true` | Enable web search (still needs URL) |
| `OPENSEARCH_SOURCE_CODE` | `true` | Enable code search |
| `OPENSEARCH_DEPTH` | `quick` | Default search depth (`quick` or `thorough`) |

Example with all options:

```bash
claude mcp add opensearch \
  -e OPENSEARCH_WEB_URL=http://localhost:8080 \
  -e OPENSEARCH_DEPTH=thorough \
  -- npx -y @kagan-sh/opensearch
```

## How it differs from the OpenCode plugin

| | OpenCode plugin | Claude Code MCP |
| --- | --- | --- |
| Sources | session + web + code | web + code |
| Synthesis | LLM synthesis via OpenCode | Claude synthesizes natively |
| Config | `opencode.json` + env vars | `.mcp.json` + env vars |
| Transport | Plugin SDK | MCP stdio |

The `session` source and built-in synthesis are OpenCode-specific. In Claude Code, synthesis is unnecessary because Claude itself processes the structured results directly.

## Uninstall

```bash
claude mcp remove opensearch
```
