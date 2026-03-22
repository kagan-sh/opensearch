---
title: Feature requests
description: How to propose new features and datasource support for OpenSearch.
---

# Feature requests

Use the GitHub feature request template for any user-facing change:

<https://github.com/kagan-sh/opensearch/issues/new?template=feature-request.yml>

That is especially important for datasource requests, because they change the product surface, the evidence model, and the maintenance burden.

## Open a request when

- you need a new datasource
- you need a new output field or status
- you need a new search mode or ranking behavior
- you need a new configuration surface

## Include enough detail to evaluate it

Every good request should answer:

1. What problem are you solving?
2. Why is the current `session`, `web`, and `code` set not enough?
3. What should the user be able to ask after this ships?
4. What evidence should the new source return?

## If you are requesting a new datasource

Please include:

- datasource name and product URL
- auth model (`API key`, `OAuth`, local CLI, etc.)
- searchable objects (`issues`, `pages`, `releases`, `tickets`, `packages`)
- 3-5 example queries
- expected citations or URLs in the final result
- rate limits, privacy concerns, and known API constraints

## Current extension status

OpenSearch does **not** support third-party datasource plugins yet.

New datasources are implemented in core, so requests are prioritized by:

- user value
- implementation clarity
- API stability
- maintenance cost
- evidence quality

If your request is really about extensibility itself, say that directly. "I want a generic datasource registry" is a different request from "I want GitHub search."
