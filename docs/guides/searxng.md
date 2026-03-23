---
title: SearXNG setup
description: Configure an OSS-friendly web source for OpenSearch.
---

# SearXNG setup

OpenSearch uses `SearXNG` as its `web` provider.

## Requirements

Your instance must:

- be reachable from the machine running OpenCode
- expose `/search`
- support `format=json`

Example local URL:

```bash
export OPENSEARCH_WEB_URL="http://localhost:8080"
```

## Why self-hosting is preferred

Public instances often:

- disable JSON output
- rate-limit automated queries
- change enabled engines without notice

Self-hosting gives you stable behavior and avoids vendor lock-in.

## Quick check

This should return JSON:

```bash
curl "http://localhost:8080/search?q=opensearch&format=json"
```

If you get `403`, JSON output is probably disabled on the instance.
