---
title: OpenSearch Docs
description: Concise docs for using and contributing to @kagan-sh/opensearch.
---

# OpenSearch

`@kagan-sh/opensearch` is an evidence-backed search tool for AI coding agents.

It searches the live web and public code in parallel, then returns structured JSON your agent can act on. Works as an **OpenCode plugin** and as a **Claude Code MCP server**.

- Docs: <https://kagan-sh.github.io/opensearch/>
- Repo: <https://github.com/kagan-sh/opensearch>

## Get started

| Runtime | Install guide |
| --- | --- |
| **Claude Code** (MCP server) | [Claude Code guide](guides/claude-code.md) |
| **OpenCode** (plugin) | [Quickstart](quickstart.md) |

Both paths need a [SearXNG instance](guides/searxng.md) for web search. Code search works out of the box.

## Reference

| Topic | Page |
| --- | --- |
| Environment variables and config shapes | [Configuration](reference/configuration.md) |
| JSON response shape | [Result contract](reference/result-contract.md) |
| Built-in sources and extension status | [Sources](reference/sources.md) |
| LLM skill prompt | [SKILL.md](https://raw.githubusercontent.com/kagan-sh/opensearch/main/SKILL.md) |
| Contributing | [Contributing](guides/contributing.md) |
| Feature requests | [Feature requests](guides/feature-requests.md) |

## What it is good at

- broad research before implementation
- comparing signals across internal and external evidence
- collecting citations for a structured answer

## What it is not

- a general-purpose search engine
- a dynamic plugin ecosystem for arbitrary datasources
- a substitute for domain-specific ranking or private enterprise search

Today, new datasources still require changes in core. That is intentional for now: one small tool, one obvious path, minimal moving parts.
