---
title: Sources and extension status
description: Built-in sources today and how to ask for more.
---

# Sources and extension status

## Built-in sources

### Session

Searches OpenCode session titles and transcript text for relevant prior work.

Use it when the answer may already exist in local agent history.

### Web

Uses Exa for live web search.

Use it for official docs, announcements, changelogs, and current external guidance.

### Code

Uses grep.app for public code search.

Use it for real-world usage patterns and implementation examples.

## What extension means today

OpenSearch is adapter-shaped internally, but it does not have a third-party datasource registry yet.

Today, adding a datasource still means a core change:

- add a source adapter
- update source typing and schemas
- update orchestration and tests

That is deliberate. The current goal is a small, explicit, reliable surface.

## Good next datasource candidates

If you want OpenSearch to grow, high-value candidates are:

- GitHub issues, PRs, releases, and discussions
- official docs retrieval for version-aware library docs
- package registries like npm or PyPI
- issue trackers such as Jira or Linear
- team knowledge bases such as Notion or Confluence

If you want one of these, use the [feature request flow](../guides/feature-requests.md).
