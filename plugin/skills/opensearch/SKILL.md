---
name: opensearch
description: Use OpenSearch for broad, evidence-backed investigation across the web and public code when a user asks to search, research, compare sources, or gather official docs and examples. Invokes the opensearch MCP tool automatically.
---

# OpenSearch

Evidence-backed search across web and public code. Searches SearXNG and grep.app in parallel, returns structured JSON with sources, relevance scores, and follow-up suggestions.

## When to Use

- The user says `search`, `look up`, `research`, `investigate`, or `find examples`
- The answer should combine official docs, public code patterns, and web sources
- The task needs contradictory-source checking before implementation
- The user wants official references, best practices, or GitHub examples
- A question requires current information beyond your training data

## When NOT to Use

- A local `Read`, `Grep`, or `Glob` is enough to answer the question
- The task is a straightforward edit in a known file
- The user explicitly wants a pure code change with no research step
- The information is already available in the conversation context

## Workflow

1. Call `opensearch` with a well-crafted query for broad or ambiguous research questions.
2. Prefer `depth: "thorough"` for broad or ambiguous research; keep `"quick"` for focused lookups.
3. Select sources based on need: `"web"` for docs and guides, `"code"` for implementation examples.
4. Summarize what the tool found, highlight contradictions or gaps, then continue with implementation or recommendation.

## Query Patterns

- Official docs and examples:
  - `React Server Components caching behavior official docs GitHub examples`
- Contradiction check:
  - `semantic-release trusted publishing npm GitHub Actions official guidance 2025`
- Implementation patterns:
  - `MCP server tool registration TypeScript example`

## Source Selection Guide

| Source | Best for |
|--------|----------|
| `web` | Official docs, changelogs, current vendor guidance, blog posts |
| `code` | Public implementation examples, real usage patterns, library internals |

## Output Expectations

- Return the strongest evidence first
- Call out missing or unavailable sources explicitly
- Keep citations grounded in the tool response instead of guessing
- When web search is unavailable (no SearXNG URL configured), note it and rely on code search
