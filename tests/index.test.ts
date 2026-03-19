import { describe, expect, it } from "vitest";
import { OpensearchPlugin } from "../src/index";

function createToolContext(directory: string) {
  const calls: Array<{ title?: string; metadata?: Record<string, unknown> }> = [];

  return {
    calls,
    context: {
      sessionID: "s",
      messageID: "m",
      agent: "build",
      directory,
      worktree: directory,
      abort: new AbortController().signal,
      metadata(input: { title?: string; metadata?: Record<string, unknown> }) {
        calls.push(input);
      },
      ask: async () => {},
    },
  };
}

describe("opensearch tool", () => {
  it("skips unavailable default sources", async () => {
    const hooks = await OpensearchPlugin({
      client: {} as never,
      directory: "/tmp/opensearch",
      worktree: "/tmp/opensearch",
      project: {} as never,
      serverUrl: new URL("http://127.0.0.1:4096"),
      $: {} as never,
    });

    await hooks.config?.({
      opensearch: {
        sources: {
          session: false,
          web: { enabled: true },
          code: false,
        },
        depth: "quick",
        synth: false,
      },
    } as never);

    const tool = hooks.tool?.opensearch;
    if (!tool) throw new Error("opensearch tool missing");
    const runtime = createToolContext("/tmp/opensearch");

    const output = await tool.execute(
      { query: "no-key-configured" },
      runtime.context,
    );
    const body = JSON.parse(output) as {
      answer: string;
      sources: unknown[];
      followups: string[];
      meta: {
        sources_queried: number;
        sources_yielded: number;
      };
    };

    expect(body.answer).toBe("No sources available");
    expect(body.sources).toHaveLength(0);
    expect(body.followups[0]).toContain("Enable at least one search source");
    expect(body.meta.sources_queried).toBe(0);
    expect(body.meta.sources_yielded).toBe(0);
    expect(runtime.calls[runtime.calls.length - 1]?.title).toBe("OpenSearch · unavailable");
  });

  it("skips explicitly requested web search without an API key", async () => {
    const hooks = await OpensearchPlugin({
      client: {} as never,
      directory: "/tmp/opensearch",
      worktree: "/tmp/opensearch",
      project: {} as never,
      serverUrl: new URL("http://127.0.0.1:4096"),
      $: {} as never,
    });

    await hooks.config?.({
      opensearch: {
        sources: {
          session: true,
          web: { enabled: true },
          code: true,
        },
        depth: "quick",
        synth: false,
      },
    } as never);

    const tool = hooks.tool?.opensearch;
    if (!tool) throw new Error("opensearch tool missing");
    const runtime = createToolContext("/tmp/opensearch");

    const output = await tool.execute(
      { query: "web-only-request", sources: ["web"] },
      runtime.context,
    );
    const body = JSON.parse(output) as {
      answer: string;
      meta: {
        sources_queried: number;
        sources_yielded: number;
      };
    };

    expect(body.answer).toBe("No sources available");
    expect(body.meta.sources_queried).toBe(0);
    expect(body.meta.sources_yielded).toBe(0);
    expect(runtime.calls[0]?.metadata?.phase).toBe("searching");
    expect(runtime.calls[runtime.calls.length - 1]?.metadata?.source_summary).toBe("no sources");
  });

  it("brands tool definitions and completion metadata", async () => {
    const hooks = await OpensearchPlugin({
      client: {} as never,
      directory: "/tmp/opensearch",
      worktree: "/tmp/opensearch",
      project: {} as never,
      serverUrl: new URL("http://127.0.0.1:4096"),
      $: {} as never,
    });

    const toolDefinition = {
      description: "placeholder",
      parameters: {},
    };
    await hooks["tool.definition"]?.({ toolID: "opensearch" }, toolDefinition);

    expect(toolDefinition.description).toContain("OpenSearch");
    expect(toolDefinition.description).toContain("search");

    const completed = {
      title: "",
      output: JSON.stringify(
        {
          answer: "Raw results (synthesis disabled)",
          confidence: "none",
          evidence: [],
          sources: [],
          followups: [],
          meta: {
            query: "docs",
            duration: 42,
            sources_queried: 2,
            sources_yielded: 3,
          },
        },
        null,
        2,
      ),
      metadata: {},
    };

    await hooks["tool.execute.after"]?.(
      {
        tool: "opensearch",
        sessionID: "s",
        callID: "c",
        args: {
          query: "docs",
          depth: "thorough",
          sources: ["web", "code"],
        },
      },
      completed,
    );

    expect(completed.title).toBe("OpenSearch · 3 raw results");
    expect(completed.metadata).toMatchObject({
      brand: "OpenSearch",
      phase: "completed",
      depth: "thorough",
      source_summary: "web + code",
      duration_ms: 42,
      sources_yielded: 3,
    });
  });
});
