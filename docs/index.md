---
title: OpenSearch Docs
description: Concise docs for using and contributing to @kagan-sh/opensearch.
---

# OpenSearch

`@kagan-sh/opensearch` is a small OpenCode plugin for broad investigation.

It searches three evidence surfaces in parallel:

- session history
- the live web
- public code

Then it returns structured JSON your agent can act on.

- Docs: <https://kagan-sh.github.io/opensearch/>
- Repo: <https://github.com/kagan-sh/opensearch>

## Start here

| Goal | Page |
| --- | --- |
| Install and run your first search | [Quickstart](quickstart.md) |
| Configure sources, depth, and synthesis | [Configuration](reference/configuration.md) |
| Understand the JSON response | [Result contract](reference/result-contract.md) |
| See what sources ship today | [Sources and extension status](reference/sources.md) |
| Work on the repo | [Contributing](guides/contributing.md) |
| Propose a feature or new datasource | [Feature requests](guides/feature-requests.md) |

## What it is good at

- broad research before implementation
- comparing signals across internal and external evidence
- collecting citations for a structured answer

## What it is not

- a general-purpose search engine
- a dynamic plugin ecosystem for arbitrary datasources
- a substitute for domain-specific ranking or private enterprise search

Today, new datasources still require changes in core. That is intentional for now: one small tool, one obvious path, minimal moving parts.
