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

## Local Docker Compose example

If you want a local instance, a minimal Compose setup looks like this:

```yaml
services:
  searxng:
    image: ghcr.io/searxng/searxng:latest
    ports:
      - "127.0.0.1:8888:8080"
    environment:
      SEARXNG_BASE_URL: http://127.0.0.1:8888/
      FORCE_OWNERSHIP: "false"
    volumes:
      - ./config:/etc/searxng
      - ./data:/var/cache/searxng
```

With a matching `config/settings.yml`:

```yaml
use_default_settings: true

server:
  secret_key: change-me
  limiter: false
  image_proxy: false

search:
  formats:
    - html
    - json
```

Then point OpenSearch at it:

```bash
export OPENSEARCH_WEB_URL="http://127.0.0.1:8888"
```

Optional shell aliases:

```bash
alias searstart='docker compose -f ~/.config/opencode/searxng/docker-compose.yml up -d'
alias searstop='docker compose -f ~/.config/opencode/searxng/docker-compose.yml down -v --remove-orphans'
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
