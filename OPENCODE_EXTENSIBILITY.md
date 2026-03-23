# OpenCode extensibility

- Brand only supported tool surfaces: description, running title, completed title, metadata.
- Do not depend on custom popups, spinners, widgets, or bespoke TUI chrome.
- `context.metadata(...)` and `tool.execute.after` are the safe branding path.
- `/experimental/tool` currently exposes generic string schemas; treat that as OpenCode behavior.
- New OpenSearch datasources are still core work, not third-party plugins.
