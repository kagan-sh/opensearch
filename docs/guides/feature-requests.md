---
title: Feature requests
description: How to propose new capabilities and datasource support for OpenSearch.
---

# Feature requests

Use the GitHub feature request template:

<https://github.com/kagan-sh/opensearch/issues/new?template=feature-request.yml>

## Open a request when

- you need a new datasource
- you need a new output field or status
- you need a new search mode or ranking behavior
- you need a new configuration surface

## Include

1. the problem you are solving
2. why `session`, `web`, and `code` are not enough
3. example prompts that should work after the change
4. the evidence shape you expect back

## Datasource requests

Please include:

- provider name and URL
- auth model
- searchable objects
- 3-5 example queries
- expected citations or URLs
- rate limits and privacy constraints

OpenSearch does not support third-party datasource plugins yet; new datasources are still implemented in core.
