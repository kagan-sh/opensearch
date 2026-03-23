import { describe, expect, it } from "vitest";
import { createSearchCore, rankAndDedupeSources } from "../src/index";
import { createFakeRegistry, fixtureSource } from "../../testkit/src/index";

describe("core search", () => {
  it("dedupes by url and keeps the strongest source", () => {
    const ranked = rankAndDedupeSources(
      [
        {
          datasourceId: "searxng-web",
          results: [fixtureSource({ id: "a", datasourceId: "searxng-web", category: "web", url: "https://example.com/a", score: 0.4 })],
        },
        {
          datasourceId: "grep-app-code",
          results: [fixtureSource({ id: "b", datasourceId: "grep-app-code", category: "code", url: "https://example.com/a", score: 0.9 })],
        },
      ],
      5,
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.id).toBe("b");
  });

  it("builds a shared thread and turn model", async () => {
    const core = createSearchCore({
      registry: createFakeRegistry([
        {
          datasourceId: "searxng-web",
          results: [
            fixtureSource({
              id: "web-1",
              datasourceId: "searxng-web",
              category: "web",
              title: "Official docs",
              snippet: "Official docs recommend server-side datasource registries.",
              score: 0.92,
            }),
          ],
        },
      ]),
      now: () => new Date("2026-03-23T00:00:00.000Z"),
      makeId: () => "fixed-id",
    });

    const response = await core.search({ query: "server-side datasource registry", maxSources: 8 });

    expect(response.thread.id).toBe("fixed-id");
    expect(response.thread.turns).toHaveLength(1);
    expect(response.turn.status).toBe("completed");
    expect(response.turn.citations[0]?.sourceId).toBe("web-1");
    expect(response.turn.sources[0]?.datasourceId).toBe("searxng-web");
    expect(response.turn.answerBlocks).toEqual([
      {
        type: "text",
        label: "Answer",
        text: "Official docs recommend server-side datasource registries."
      },
      {
        type: "list",
        label: "Evidence",
        items: ["Official docs: Official docs recommend server-side datasource registries."],
      },
    ]);
  });

  it("surfaces partial answers when one datasource fails", async () => {
    const core = createSearchCore({
      registry: createFakeRegistry([
        {
          datasourceId: "searxng-web",
          results: [fixtureSource({ id: "web-1", datasourceId: "searxng-web", score: 0.8 })],
        },
        {
          datasourceId: "grep-app-code",
          results: [],
          error: "grep timeout",
        },
      ]),
      now: () => new Date("2026-03-23T00:00:00.000Z"),
      makeId: () => "fixed-id",
    });

    const response = await core.search({ query: "timeouts", maxSources: 8 });
    expect(response.turn.status).toBe("partial");
    expect(response.turn.errors).toContain("grep timeout");
    expect(response.turn.answerBlocks.at(-1)).toEqual({
      type: "text",
      label: "Limits",
      text: "Some datasources failed during retrieval: grep timeout",
    });
  });
});
