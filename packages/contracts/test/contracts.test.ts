import { describe, expect, it } from "vitest";
import {
  SearchRequestSchema,
  SearchResponseSchema,
  SearchStreamEventSchema,
  searchResponseJsonSchema,
} from "../src/index";

describe("contracts", () => {
  it("defaults search request values", () => {
    const parsed = SearchRequestSchema.parse({ query: "privacy search" });
    expect(parsed.maxSources).toBe(8);
  });

  it("validates the shared thread and turn wire model", () => {
    const result = SearchResponseSchema.safeParse({
      thread: {
        id: "thread_1",
        title: "privacy search",
        createdAt: "2026-03-23T00:00:00.000Z",
        updatedAt: "2026-03-23T00:00:00.000Z",
        turns: [
          {
            id: "turn_1",
            query: "privacy search",
            status: "completed",
            answerText: "Use server-side datasources.",
             answerBlocks: [
               { type: "text", label: "Answer", text: "Use server-side datasources." },
               { type: "list", label: "Evidence", items: ["Docs: Use server-side datasources."] },
             ],
            citations: [{ sourceId: "source_1", title: "Docs" }],
            sources: [
              {
                id: "source_1",
                datasourceId: "session-history",
                category: "session",
                title: "Docs",
                score: 0.7,
                metadata: {},
              },
            ],
            followUps: [],
            errors: [],
            createdAt: "2026-03-23T00:00:00.000Z",
            updatedAt: "2026-03-23T00:00:00.000Z",
            completedAt: "2026-03-23T00:00:00.000Z",
          },
        ],
      },
      turn: {
        id: "turn_1",
        query: "privacy search",
        status: "completed",
        answerText: "Use server-side datasources.",
        answerBlocks: [
          { type: "text", label: "Answer", text: "Use server-side datasources." },
          { type: "list", label: "Evidence", items: ["Docs: Use server-side datasources."] },
        ],
        citations: [{ sourceId: "source_1", title: "Docs" }],
        sources: [
          {
            id: "source_1",
            datasourceId: "session-history",
            category: "session",
            title: "Docs",
            score: 0.7,
            metadata: {},
          },
        ],
        followUps: [],
        errors: [],
        createdAt: "2026-03-23T00:00:00.000Z",
        updatedAt: "2026-03-23T00:00:00.000Z",
        completedAt: "2026-03-23T00:00:00.000Z",
      },
    });

    expect(result.success).toBe(true);
  });

  it("validates stream events", () => {
    const result = SearchStreamEventSchema.safeParse({
      type: "turn.answer.delta",
      turnId: "turn_1",
      delta: "hello",
    });
    expect(result.success).toBe(true);
  });

  it("exports a json schema", () => {
    expect(JSON.stringify(searchResponseJsonSchema())).toContain("OpenSearchSearchResponse");
  });
});
