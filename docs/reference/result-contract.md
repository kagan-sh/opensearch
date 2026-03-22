---
title: Result contract
description: The JSON shape returned by the opensearch tool.
---

# Result contract

Every `opensearch` response is strict JSON.

## Top-level fields

| Field | Meaning |
| --- | --- |
| `status` | Explicit outcome of the request |
| `answer` | Final synthesized or fallback answer |
| `confidence` | `high`, `medium`, `low`, or `none` |
| `evidence[]` | Claims with cited source IDs |
| `sources[]` | Normalized result items |
| `followups[]` | Useful next searches or next actions |
| `meta` | Request and execution metadata |

## Status values

| Status | Meaning |
| --- | --- |
| `ok` | Sources ran and synthesis succeeded |
| `raw` | Sources ran and synthesis was disabled |
| `raw_fallback` | Sources ran but synthesis failed |
| `no_sources` | No requested source was available |
| `no_results` | Sources ran but returned no usable evidence |

## `meta`

`meta` includes:

- `query`
- `duration`
- `sources_requested`
- `sources_queried`
- `sources_yielded`
- `sources_unavailable[]`
- `source_errors[]`

`sources_requested` counts what the caller asked for.

`sources_queried` counts the sources that actually ran.

`source_errors[]` records request-time or response-shape failures without hiding them behind an empty result set.
