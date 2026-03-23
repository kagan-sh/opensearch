import { afterEach, describe, expect, it, vi } from "vitest";
import { OpensearchPlugin } from "../src/index";

const originalFetch = globalThis.fetch;

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

function createHooks(client: unknown = {} as never) {
  return OpensearchPlugin({
    client: client as never,
    directory: "/tmp/opensearch",
    worktree: "/tmp/opensearch",
    project: {} as never,
    serverUrl: new URL("http://127.0.0.1:4096"),
    $: {} as never,
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("opensearch tool", () => {
  it("reports when no sources are available by default", async () => {
    const hooks = await createHooks();

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
      status: string;
      answer: string;
      sources: unknown[];
      followups: string[];
      meta: {
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: string[];
      };
    };

    expect(body.status).toBe("no_sources");
    expect(body.answer).toBe("No sources available");
    expect(body.sources).toHaveLength(0);
    expect(body.followups[0]).toContain("Enable at least one search source");
    expect(body.meta.sources_requested).toBe(3);
    expect(body.meta.sources_queried).toBe(0);
    expect(body.meta.sources_yielded).toBe(0);
    expect(body.meta.sources_unavailable).toEqual(["session", "web", "code"]);
    expect(runtime.calls[runtime.calls.length - 1]?.title).toBe(
      "OpenSearch // unavailable",
    );
  });

  it("reports explicitly requested unavailable sources", async () => {
    const hooks = await createHooks();

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
      status: string;
      answer: string;
      meta: {
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        sources_unavailable: string[];
      };
    };

    expect(body.status).toBe("no_sources");
    expect(body.answer).toBe("No sources available");
    expect(body.meta.sources_requested).toBe(1);
    expect(body.meta.sources_queried).toBe(0);
    expect(body.meta.sources_yielded).toBe(0);
    expect(body.meta.sources_unavailable).toEqual(["web"]);
    expect(runtime.calls[0]?.metadata?.phase).toBe("searching");
    expect(runtime.calls[runtime.calls.length - 1]?.metadata?.source_summary).toBe(
      "no sources",
    );
  });

  it("brands tool definitions and completion metadata", async () => {
    const hooks = await createHooks();

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
          status: "raw",
          answer: "Raw results (synthesis disabled)",
          confidence: "none",
          evidence: [],
          sources: [],
          followups: [],
          meta: {
            query: "docs",
            duration: 42,
            sources_requested: 2,
            sources_queried: 2,
            sources_yielded: 3,
            sources_unavailable: [],
            source_errors: [],
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

    expect(completed.title).toBe("OpenSearch // 3 raw results");
    expect(completed.metadata).toMatchObject({
      brand: "OpenSearch",
      brand_tagline: "evidence-backed search",
      brand_origin: "@kagan-sh/opensearch",
      phase: "completed",
      depth: "thorough",
      source_summary: "web + code",
      source_badges: ["WEB", "CODE"],
      status: "raw",
      duration_ms: 42,
      sources_requested: 2,
      sources_yielded: 3,
      source_errors: 0,
    });
  });

  it("rejects invalid plugin config explicitly", async () => {
    const hooks = await createHooks();

    await expect(
      hooks.config?.({
        opensearch: {
          sources: {
            session: "sometimes",
            web: { enabled: true },
            code: true,
          },
          depth: "quick",
          synth: false,
        },
      } as never),
    ).rejects.toThrow("Invalid opensearch config");
  });

  it("reports source errors explicitly when a source request fails", async () => {
    globalThis.fetch = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("network down"));

    const hooks = await createHooks();
    await hooks.config?.({
      opensearch: {
        sources: {
          session: false,
          web: { enabled: false },
          code: true,
        },
        depth: "quick",
        synth: false,
      },
    } as never);

    const tool = hooks.tool?.opensearch;
    if (!tool) throw new Error("opensearch tool missing");

    const output = await tool.execute(
      { query: "broken-code-search", sources: ["code"] },
      createToolContext("/tmp/opensearch").context,
    );
    const body = JSON.parse(output) as {
      status: string;
      answer: string;
      followups: string[];
      meta: {
        sources_requested: number;
        sources_queried: number;
        sources_yielded: number;
        source_errors: Array<{
          source: string;
          code: string;
          message: string;
        }>;
      };
    };

    expect(body.status).toBe("no_results");
    expect(body.answer).toBe("No results found");
    expect(body.followups[0]).toBe(
      "Inspect meta.source_errors for failed search sources",
    );
    expect(body.meta.sources_requested).toBe(1);
    expect(body.meta.sources_queried).toBe(1);
    expect(body.meta.sources_yielded).toBe(0);
    expect(body.meta.source_errors).toHaveLength(1);
    expect(body.meta.source_errors[0]).toMatchObject({
      source: "code",
      code: "request_failed",
    });
    expect(body.meta.source_errors[0]?.message).toContain("network down");
  });

  it("falls back to raw results when synthesis fails", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        hits: {
          hits: [
            {
              repo: { raw: "example/repo" },
              path: { raw: "src/example.ts" },
              content: { snippet: "const example = true;" },
              score: 42,
            },
          ],
        },
      }),
    } as Response);

    const hooks = await createHooks({
      session: {
        create: async () => ({ data: { id: "synth" } }),
        prompt: async () => {
          throw new Error("synthesis boom");
        },
        delete: async () => undefined,
      },
    });
    await hooks.config?.({
      opensearch: {
        sources: {
          session: false,
          web: { enabled: false },
          code: true,
        },
        depth: "quick",
        synth: true,
      },
    } as never);

    const tool = hooks.tool?.opensearch;
    if (!tool) throw new Error("opensearch tool missing");

    const output = await tool.execute(
      { query: "example", sources: ["code"] },
      createToolContext("/tmp/opensearch").context,
    );
    const body = JSON.parse(output) as {
      status: string;
      answer: string;
      sources: unknown[];
      meta: {
        sources_yielded: number;
      };
    };

    expect(body.status).toBe("raw_fallback");
    expect(body.answer).toBe(
      "Unable to synthesize structured answer. Returning raw evidence.",
    );
    expect(body.sources).toHaveLength(1);
    expect(body.meta.sources_yielded).toBe(1);
  });

  it("returns raw SearXNG web results when configured", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "SearXNG result",
            url: "https://example.com/result",
            content: "OpenSearch can use a self-hosted SearXNG instance.",
            publishedDate: "2026-03-23T00:00:00Z",
          },
        ],
      }),
    } as Response);

    const hooks = await createHooks();
    await hooks.config?.({
      opensearch: {
        sources: {
          session: false,
          web: { enabled: true, url: "https://search.example/" },
          code: false,
        },
        depth: "quick",
        synth: false,
      },
    } as never);

    const tool = hooks.tool?.opensearch;
    if (!tool) throw new Error("opensearch tool missing");

    const output = await tool.execute(
      { query: "oss search", sources: ["web"] },
      createToolContext("/tmp/opensearch").context,
    );
    const body = JSON.parse(output) as {
      status: string;
      sources: Array<{
        title: string;
        url?: string;
        snippet: string;
      }>;
      meta: {
        sources_queried: number;
        sources_yielded: number;
      };
    };

    expect(body.status).toBe("raw");
    expect(body.meta.sources_queried).toBe(1);
    expect(body.meta.sources_yielded).toBe(1);
    expect(body.sources[0]).toMatchObject({
      title: "SearXNG result",
      url: "https://example.com/result",
    });
    expect(body.sources[0]?.snippet).toContain("self-hosted SearXNG");
  });
});
