<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/logo-light.svg">
    <img alt="OpenSearch — evidence-backed search for OpenCode" src="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/logo-dark.svg" width="100%">
  </picture>
</p>
<p align="center">
  <a href="https://github.com/kagan-sh/opensearch/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/kagan-sh/opensearch/ci.yml?style=for-the-badge&label=CI" alt="CI"></a>
  <a href="https://kagan-sh.github.io/opensearch/"><img src="https://img.shields.io/badge/docs-github%20pages-181717?style=for-the-badge&logo=github" alt="Docs"></a>
  <a href="https://opensource.org/license/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
  <a href="https://github.com/kagan-sh/opensearch/stargazers"><img src="https://img.shields.io/github/stars/kagan-sh/opensearch?style=for-the-badge" alt="Stars"></a>
</p>
<h3 align="center">
  <a href="https://kagan-sh.github.io/opensearch/">Docs</a> ·
  <a href="https://kagan-sh.github.io/opensearch/quickstart/">Quickstart</a> ·
  <a href="https://kagan-sh.github.io/opensearch/reference/result-contract/">Result Contract</a> ·
  <a href="https://github.com/kagan-sh/opensearch/issues/new?template=feature-request.yml">Feature Requests</a>
</h3>

---

`@kagan-sh/opensearch` is an OpenCode plugin for broad investigation. It searches session history, the live web, and public code in parallel, then returns a structured evidence-backed response your agent can act on.

## Install

Add the plugin to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@kagan-sh/opensearch"]
}
```

OpenCode installs npm plugins automatically at startup.

Full docs: **[kagan-sh.github.io/opensearch](https://kagan-sh.github.io/opensearch/)**.

## Configuration

Control runtime behavior with environment variables:

- `OPENSEARCH_SYNTH=true|false`
- `OPENSEARCH_DEPTH=quick|thorough`
- `OPENSEARCH_SOURCE_SESSION=true|false`
- `OPENSEARCH_SOURCE_WEB=true|false`
- `OPENSEARCH_SOURCE_CODE=true|false`
- `OPENSEARCH_WEB_KEY=<exa_api_key>`
- `EXA_API_KEY=<exa_api_key>`

`OPENSEARCH_WEB_KEY` takes precedence over `EXA_API_KEY`. Web search is skipped when neither key is set.

## Tool

The plugin exposes a single tool: `opensearch`.

Arguments:

- `query: string`
- `sources?: ("session" | "web" | "code")[]`
- `depth?: "quick" | "thorough"`

The tool returns strict JSON with `status`, `answer`, `confidence`, `evidence[]`, `sources[]`, `followups[]`, and `meta`.

`meta` includes:

- `sources_requested`
- `sources_queried`
- `sources_yielded`
- `sources_unavailable[]`
- `source_errors[]`

Invalid plugin config is reported explicitly instead of being ignored.

## Contributing

For local source development, validation commands, and release workflow details, see `CONTRIBUTING.md`.

## Documentation

Published docs live at `https://kagan-sh.github.io/opensearch/`. MkDocs source lives in `docs/` with site config in `mkdocs.yml`.

## Skill

The repo includes `SKILL.md` for agent environments that support installable skills. It increases the chance that agents reach for `opensearch` on research-heavy prompts, but it does not force tool selection.

## License

MIT
