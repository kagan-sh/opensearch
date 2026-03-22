import type { createOpencodeClient } from "@opencode-ai/sdk";
import type { Depth, RawResult } from "../schema";
import { failure, messageFromError, sourceError, type SourceSearchOutcome } from "./shared";

function words(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function count(text: string, key: string) {
  return text.toLowerCase().split(key.toLowerCase()).length - 1;
}

function text(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === "text" || part.type === "reasoning")
    .map((part) => part.text ?? "")
    .join("\n");
}

export async function searchSessions(
  client: ReturnType<typeof createOpencodeClient>,
  directory: string,
  query: string,
  depth: Depth,
): Promise<SourceSearchOutcome> {
  const source = "session" as const;
  const key = words(query);
  if (key.length === 0) {
    return {
      source,
      results: [],
    };
  }

  let listRes:
    | {
        data?: Array<{ id: string; title: string; time: { updated: number } }>;
      }
    | undefined;

  try {
    listRes = await client.session.list({ query: { directory } });
  } catch (error) {
    return failure(
      source,
      "request_failed",
      `Session search failed: ${messageFromError(error)}`,
    );
  }

  if (!Array.isArray(listRes?.data)) {
    return failure(
      source,
      "invalid_response",
      "Session search returned an invalid session list.",
    );
  }

  const list = listRes.data;

  const top = list
    .filter((item) =>
      key.some((word) => item.title.toLowerCase().includes(word)),
    )
    .slice(0, depth === "quick" ? 5 : 15);

  const settled = await Promise.allSettled(
    top.map(async (item) => {
      const msgRes = await client.session.messages({
        path: { id: item.id },
        query: { directory, limit: depth === "quick" ? 50 : 200 },
      });
      if (!Array.isArray(msgRes.data)) {
        throw new Error("invalid session transcript payload");
      }

      const body = msgRes.data.map((row) => text(row.parts)).join("\n");
      const hit = key.reduce((sum, word) => sum + count(body, word), 0);
      const rel = Math.min(1, hit / Math.max(1, key.length * 4));
      if (hit === 0) return null;

      return {
        id: item.id,
        type: source,
        title: item.title,
        snippet: body.slice(0, 700) || item.title,
        url: item.id,
        relevance: rel,
        timestamp: item.time.updated,
      } satisfies RawResult;
    }),
  );

  const results = settled.flatMap((item) => {
    if (item.status !== "fulfilled" || item.value === null) return [];
    return [item.value];
  });
  const failed = settled.filter((item) => item.status === "rejected").length;

  return {
    source,
    results,
    ...(failed > 0
      ? {
          error: sourceError(
            source,
            "request_failed",
            `Failed to read ${failed} session ${failed === 1 ? "transcript" : "transcripts"}.`,
          ),
        }
      : {}),
  };
}
