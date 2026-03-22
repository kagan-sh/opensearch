---
title: Configuration
description: Runtime configuration for @kagan-sh/opensearch.
---

# Configuration

OpenSearch is configured with environment variables and plugin config.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `OPENSEARCH_SYNTH` | `true` | Enable structured synthesis after collecting raw results |
| `OPENSEARCH_DEPTH` | `quick` | Default search depth |
| `OPENSEARCH_SOURCE_SESSION` | `true` | Enable session-history search |
| `OPENSEARCH_SOURCE_WEB` | `true` | Enable web search when a key is present |
| `OPENSEARCH_SOURCE_CODE` | `true` | Enable public code search |
| `OPENSEARCH_WEB_KEY` | unset | Exa API key for web search |
| `EXA_API_KEY` | unset | Fallback Exa API key |

## Plugin config shape

```json
{
  "opensearch": {
    "sources": {
      "session": true,
      "web": { "enabled": true, "key": "..." },
      "code": true
    },
    "depth": "quick",
    "synth": true
  }
}
```

## Availability rules

- `session` is available when enabled
- `code` is available when enabled
- `web` is available only when enabled **and** a key exists

If you request a source that is unavailable, the tool reports it explicitly in `meta.sources_unavailable`.

## Invalid config behavior

Invalid plugin config is not ignored.

The plugin now fails explicitly so bad config does not silently degrade behavior.
