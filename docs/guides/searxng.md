---
title: SearXNG setup
description: Configure an OSS-friendly web source for OpenSearch.
---

# SearXNG setup

OpenSearch uses `SearXNG` as its `web` provider.

Official SearXNG references:

- [Installation overview](https://docs.searxng.org/admin/installation.html)
- [Installation container](https://docs.searxng.org/admin/installation-docker.html)
- [Installation script](https://docs.searxng.org/admin/installation-scripts.html)
- [`search.formats` settings](https://docs.searxng.org/admin/settings/settings_search.html)
- [Public instances](https://searx.space)

## Requirements

Your instance must:

- be reachable from the machine running OpenCode
- expose `/search`
- support `format=json`

The official settings docs show that `json` must be enabled in `search.formats`, not just `html`.

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

If you just want to get moving, the SearXNG docs recommend the container install or installation script.

## Quick check

This should return JSON:

```bash
curl "http://localhost:8080/search?q=opensearch&format=json"
```

If you get `403`, JSON output is probably disabled on the instance.
