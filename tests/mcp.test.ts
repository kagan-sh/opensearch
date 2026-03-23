import { afterEach, describe, expect, it, vi } from "vitest";
import { mcpDefaultConfig, resolveSources } from "../src/config";
import {
  noResultsResult,
  noSourcesResult,
  rawResultsResult,
  runSourceSearches,
} from "../src/orchestrator";
import type { SourceId } from "../src/schema";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("mcp opensearch tool", () => {
  it("reports no_sources when web and code are both disabled", () => {
    process.env.OPENSEARCH_SOURCE_WEB = "false";
    process.env.OPENSEARCH_SOURCE_CODE = "false";

    const config = mcpDefaultConfig();
    const resolved = resolveSources(config);

    expect(resolved.sources).toHaveLength(0);

    const result = noSourcesResult({
      query: "anything",
      start: Date.now(),
      requested: resolved.requested,
      unavailable: resolved.unavailable,
    });

    expect(result.status).toBe("no_sources");
    expect(result.answer).toBe("No sources available");
  });

  it("session source is always unavailable in mcp mode", () => {
    const config = mcpDefaultConfig();

    expect(config.sources.session).toBe(false);

    const resolved = resolveSources(config, ["session"]);

    expect(resolved.sources).toHaveLength(0);
    expect(resolved.unavailable).toEqual(["session"]);
  });

  it("synthesis is always disabled in mcp mode", () => {
    const config = mcpDefaultConfig();
    expect(config.synth).toBe(false);
  });

  it("returns raw web results from SearXNG", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "MCP protocol docs",
            url: "https://modelcontextprotocol.io",
            content: "The Model Context Protocol is an open standard.",
          },
        ],
      }),
    } as Response);

    process.env.OPENSEARCH_WEB_URL = "https://search.test/";

    const config = mcpDefaultConfig();
    const start = Date.now();
    const resolved = resolveSources(config, ["web"]);

    const search = await runSourceSearches({
      directory: "/tmp",
      config,
      query: "mcp protocol",
      depth: "quick",
      sources: resolved.sources,
    });

    expect(search.raw).toHaveLength(1);
    expect(search.raw[0]?.title).toBe("MCP protocol docs");

    const result = rawResultsResult({
      query: "mcp protocol",
      start,
      requested: resolved.requested,
      queried: resolved.sources,
      unavailable: resolved.unavailable,
      sourceErrors: search.sourceErrors,
      raw: search.raw,
      status: "raw",
    });

    expect(result.status).toBe("raw");
    expect(result.sources).toHaveLength(1);
    expect(result.meta.sources_queried).toBe(1);
  });

  it("returns raw code results from grep.app", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        hits: {
          hits: [
            {
              repo: { raw: "anthropics/sdk" },
              path: { raw: "src/mcp.ts" },
              content: { snippet: "export class McpServer {" },
              score: 85,
            },
          ],
        },
      }),
    } as Response);

    const config = mcpDefaultConfig();
    const start = Date.now();
    const resolved = resolveSources(config, ["code"]);

    const search = await runSourceSearches({
      directory: "/tmp",
      config,
      query: "McpServer",
      depth: "quick",
      sources: resolved.sources,
    });

    expect(search.raw).toHaveLength(1);
    expect(search.raw[0]?.title).toBe("anthropics/sdk/src/mcp.ts");

    const result = rawResultsResult({
      query: "McpServer",
      start,
      requested: resolved.requested,
      queried: resolved.sources,
      unavailable: resolved.unavailable,
      sourceErrors: search.sourceErrors,
      raw: search.raw,
      status: "raw",
    });

    expect(result.status).toBe("raw");
    expect(result.meta.sources_yielded).toBe(1);
  });

  it("handles source errors explicitly", async () => {
    globalThis.fetch = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("connection refused"));

    const config = mcpDefaultConfig();
    const start = Date.now();
    const resolved = resolveSources(config, ["code"]);

    const search = await runSourceSearches({
      directory: "/tmp",
      config,
      query: "broken search",
      depth: "quick",
      sources: resolved.sources,
    });

    expect(search.raw).toHaveLength(0);
    expect(search.sourceErrors).toHaveLength(1);
    expect(search.sourceErrors[0]).toMatchObject({
      source: "code",
      code: "request_failed",
    });
    expect(search.sourceErrors[0]?.message).toContain("connection refused");

    const result = noResultsResult({
      query: "broken search",
      start,
      requested: resolved.requested,
      queried: resolved.sources,
      unavailable: resolved.unavailable,
      sourceErrors: search.sourceErrors,
    });

    expect(result.status).toBe("no_results");
    expect(result.meta.source_errors).toHaveLength(1);
  });

  it("gracefully handles session source without client", async () => {
    const config = mcpDefaultConfig();
    config.sources.session = true;

    const resolved = resolveSources(config, ["session"]);

    const search = await runSourceSearches({
      directory: "/tmp",
      config,
      query: "test",
      depth: "quick",
      sources: resolved.sources,
    });

    expect(search.raw).toHaveLength(0);
    expect(search.sourceErrors).toHaveLength(1);
    expect(search.sourceErrors[0]).toMatchObject({
      source: "session",
      code: "unavailable",
    });
  });
});
