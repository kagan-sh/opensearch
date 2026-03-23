<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/mark-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/mark-light.svg">
    <img alt="OpenSearch — evidence-backed search for OpenCode" src="https://raw.githubusercontent.com/kagan-sh/opensearch/main/.github/assets/mark-dark.svg" width="100%">
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
  <a href="https://kagan-sh.github.io/opensearch/reference/result-contract/">Reference</a> ·
  <a href="https://raw.githubusercontent.com/kagan-sh/opensearch/main/SKILL.md">LLM Quick Reference</a>
</h3>

---

`@kagan-sh/opensearch` is an evidence-backed search tool for AI coding agents. It searches the live web and public code in parallel, then returns structured JSON your agent can act on.

Works as an **OpenCode plugin** and as a **Claude Code MCP server**.

## Install

### Claude Code (MCP)

```bash
claude mcp add opensearch -- npx -y @kagan-sh/opensearch
```

To enable web search via SearXNG:

```bash
claude mcp add opensearch \
  -e OPENSEARCH_WEB_URL=http://localhost:8080 \
  -- npx -y @kagan-sh/opensearch
```

Or add it to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "npx",
      "args": ["-y", "@kagan-sh/opensearch"],
      "env": {
        "OPENSEARCH_WEB_URL": "http://localhost:8080"
      }
    }
  }
}
```

See the [Claude Code install guide](https://kagan-sh.github.io/opensearch/guides/claude-code/) for full details.

### OpenCode (plugin)

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
