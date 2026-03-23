---
title: Claude Code install guide
description: Set up @kagan-sh/opensearch as a Claude Code plugin or standalone MCP server.
---

# Claude Code install guide

OpenSearch works as a **Claude Code plugin** (recommended) or a **standalone MCP server**. The plugin bundles the MCP server with skills and commands for a richer experience.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and working (v1.0.33+ for plugin support)
- Node.js 18+ (for `npx`)
- Optional: a self-hosted [SearXNG](searxng.md) instance for web search

## Option 1: Plugin install (recommended)

The plugin includes everything — the MCP server, a skill (so Claude knows when to search automatically), and the `/opensearch:search` command.

### From the marketplace

```bash
/plugin install opensearch
```

### From source (development)

```bash
claude --plugin-dir ./plugin
```

### What the plugin adds

| Component | What it does |
| --- | --- |
| **MCP server** | `opensearch` tool — searches web + code in parallel |
| **Skill** | Tells Claude when and how to invoke opensearch automatically |
| **Command** | `/opensearch:search <query>` for manual searches |

### Configure web search

By default the plugin enables code search only. To add web search, set the `OPENSEARCH_WEB_URL` environment variable in the plugin's MCP config.

Edit `~/.claude/plugins/cache/opensearch/.mcp.json` (after install) or, for development, edit `plugin/.mcp.json` directly:

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

## Option 2: Standalone MCP server

Use this if you need compatibility with other tools (Cursor, Windsurf, etc.) or prefer manual MCP configuration.

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

After installing (plugin or MCP), start a Claude Code session and ask:

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

## Plugin vs MCP vs OpenCode

| | Claude Code plugin | Standalone MCP | OpenCode plugin |
| --- | --- | --- | --- |
| Install | `/plugin install opensearch` | `claude mcp add ...` | `opencode.json` |
| Skill guidance | Yes — Claude searches automatically | No | No |
| `/opensearch:search` | Yes | No | No |
| Sources | web + code | web + code | session + web + code |
| Synthesis | Claude synthesizes natively | Claude synthesizes natively | LLM synthesis via OpenCode |
| Cross-tool compat | Claude Code only | Claude Code, Cursor, Windsurf, etc. | OpenCode only |

The `session` source and built-in synthesis are OpenCode-specific. In Claude Code, synthesis is unnecessary because Claude processes the structured results directly.

## Uninstall

### Plugin

```bash
/plugin uninstall opensearch
```

### MCP

```bash
claude mcp remove opensearch
```
