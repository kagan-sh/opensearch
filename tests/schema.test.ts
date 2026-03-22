import { describe, expect, it } from "vitest";
import { ResultSchema, resultJsonSchema } from "../src/schema";

const sample = {
  status: "ok",
  answer: "Use session and web results together.",
  confidence: "high",
  evidence: [
    {
      claim: "Session confirms plugin loading order.",
      sources: ["s1"],
      confidence: "high",
    },
  ],
  sources: [
    {
      id: "s1",
      type: "session",
      title: "Plugin notes",
      snippet: "Plugin tools are loaded at startup.",
      relevance: 0.9,
    },
  ],
  followups: ["Check plugin order"],
  meta: {
    query: "plugin loading",
    duration: 12,
    sources_requested: 2,
    sources_queried: 2,
    sources_yielded: 1,
    sources_unavailable: [],
    source_errors: [],
  },
} as const;

describe("schema", () => {
  it("parses valid result", () => {
    const parsed = ResultSchema.parse(sample);
    expect(parsed.answer).toBe(sample.answer);
    expect(parsed.sources[0]?.id).toBe("s1");
  });

  it("rejects invalid relevance", () => {
    const bad = {
      ...sample,
      sources: [{ ...sample.sources[0], relevance: 1.5 }],
    };
    expect(ResultSchema.safeParse(bad).success).toBe(false);
  });

  it("exports json schema", () => {
    const json = resultJsonSchema();
    expect(typeof json).toBe("object");
    expect(JSON.stringify(json)).toContain("OpensearchResult");
  });
});
