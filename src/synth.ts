import type { createOpencodeClient } from "@opencode-ai/sdk";
import {
  ResultSchema,
  type RawResult,
  type Result,
  resultJsonSchema,
} from "./schema";

const PROMPT = `You are a synthesis engine for opensearch.

Goal:
- Produce a laconic direct answer to the user query.
- Every factual claim must map to source IDs from the provided sources.
- Set confidence by source agreement and evidence quality.
- Suggest 2-3 concise followup queries.

Output rules:
- Return valid JSON only.
- Use source IDs exactly as provided.
- Do not invent sources.
- Keep answer compact and concrete.`;

function text(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === "text" || part.type === "reasoning")
    .map((part) => part.text ?? "")
    .join("\n");
}

function parse(input: string) {
  const body = input.trim();
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    return JSON.parse(body.slice(start, end + 1));
  }
}

function fallback(query: string, raw: RawResult[]): Result {
  return {
    answer: "Unable to synthesize structured answer. Returning raw evidence.",
    confidence: "none",
    evidence: [],
    sources: raw.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      snippet: item.snippet,
      url: item.url,
      relevance: Math.max(0, Math.min(1, item.relevance)),
      timestamp: item.timestamp,
    })),
    followups: [`Refine: ${query}`, `Find contradictory sources for: ${query}`],
    meta: {
      query,
      duration: 0,
      sources_queried: 0,
      sources_yielded: raw.length,
    },
  };
}

export async function synthesize(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  raw: RawResult[],
  query: string,
): Promise<Result> {
  const made = await client.session.create({
    query: { directory },
    body: { title: "opensearch-synth" },
  });
  const id = made.data?.id;
  if (!id) return fallback(query, raw);

  const input = `${PROMPT}\n\nUser query:\n${query}\n\nSources:\n${raw
    .map(
      (item, i) =>
        `${i + 1}. id=${item.id} type=${item.type} title=${item.title}\nurl=${item.url ?? ""}\nrelevance=${item.relevance}\nsnippet=${item.snippet}`,
    )
    .join("\n\n")}`;

  try {
    const req = {
      path: { id },
      query: { directory },
      body: {
        agent: undefined,
        noReply: false,
        parts: [{ type: "text" as const, text: input }],
        format: {
          type: "json_schema",
          schema: resultJsonSchema(),
          retryCount: 2,
        },
      },
    };

    const msg = await client.session.prompt(req);
    const body = parse(text(msg.data?.parts ?? []));
    if (!body) return fallback(query, raw);

    const parsed = ResultSchema.safeParse(body);
    if (!parsed.success) return fallback(query, raw);
    return parsed.data;
  } finally {
    await client.session
      .delete({ path: { id }, query: { directory } })
      .catch(() => true);
  }
}
