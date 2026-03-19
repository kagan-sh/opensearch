# @opencode-ai/opensearch

`@opencode-ai/opensearch` is an OpenCode plugin that searches session history, the web, and public code in parallel, then returns a structured evidence-backed response.

## Install

Add the plugin to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@opencode-ai/opensearch"]
}
```

OpenCode installs npm plugins automatically at startup.

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

The tool returns strict JSON with `answer`, `confidence`, `evidence[]`, `sources[]`, `followups[]`, and `meta`.

## Contributing

For local source development, validation commands, and release workflow details, see `CONTRIBUTING.md`.

## Skill

The repo includes `SKILL.md` for agent environments that support installable skills. It increases the chance that agents reach for `opensearch` on research-heavy prompts, but it does not force tool selection.

## License

MIT
