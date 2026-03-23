<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/hero-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/hero-light.svg">
    <img alt="OpenSearch — evidence-backed search for OpenCode" src="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/hero-dark.svg" width="100%">
  </picture>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@kagan-sh/opensearch"><img src="https://img.shields.io/npm/v/%40kagan-sh%2Fopensearch?style=for-the-badge" alt="npm"></a>
  <a href="https://github.com/kagan-sh/opensearch/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/kagan-sh/opensearch/ci.yml?style=for-the-badge&label=CI" alt="CI"></a>
  <a href="https://kagan-sh.github.io/opensearch/"><img src="https://img.shields.io/badge/docs-github%20pages-181717?style=for-the-badge&logo=github" alt="Docs"></a>
  <a href="https://opensource.org/license/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
  <a href="https://github.com/kagan-sh/opensearch/stargazers"><img src="https://img.shields.io/github/stars/kagan-sh/opensearch?style=for-the-badge" alt="Stars"></a>
</p>
<h3 align="center">
  <a href="https://kagan-sh.github.io/opensearch/">Docs</a> ·
  <a href="https://kagan-sh.github.io/opensearch/quickstart/">Quickstart</a> ·
  <a href="https://kagan-sh.github.io/opensearch/guides/searxng/">SearXNG Setup</a> ·
  <a href="https://kagan-sh.github.io/opensearch/reference/result-contract/">Reference</a>
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

Full docs: **[kagan-sh.github.io/opensearch](https://kagan-sh.github.io/opensearch/)**. Web search uses a self-hosted `SearXNG` instance; setup lives in the docs.

## License

[MIT](LICENSE)

---

<p align="center">
  <a href="https://www.star-history.com/#kagan-sh/opensearch&type=date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=kagan-sh/opensearch&type=date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=kagan-sh/opensearch&type=date" />
      <img alt="Star History" src="https://api.star-history.com/svg?repos=kagan-sh/opensearch&type=date" width="600" />
    </picture>
  </a>
</p>
