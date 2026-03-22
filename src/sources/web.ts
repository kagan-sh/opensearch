import type { Depth, RawResult } from "../schema";
import { failure, messageFromError, type SourceSearchOutcome } from "./shared";

type Exa = {
  id?: string;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  publishedDate?: string;
};

export async function searchWeb(
  query: string,
  key: string | undefined,
  depth: Depth,
): Promise<SourceSearchOutcome> {
  const source = "web" as const;
  if (!key) {
    return failure(
      source,
      "unavailable",
      "Web source requires OPENSEARCH_WEB_KEY or EXA_API_KEY.",
    );
  }

  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        numResults: depth === "quick" ? 5 : 10,
        type: "auto",
        contents: {
          text: {
            maxCharacters: 1000,
          },
        },
      }),
    });

    if (!res.ok) {
      return failure(
        source,
        "request_failed",
        `Exa search failed with status ${res.status}.`,
      );
    }
    const body = (await res.json()) as { results?: Exa[] };
    if (!Array.isArray(body.results)) {
      return failure(
        source,
        "invalid_response",
        "Exa search returned an invalid payload.",
      );
    }

    const list = body.results;

    return {
      source,
      results: list.map((item, i) => ({
        id: item.id ?? `web-${i}`,
        type: source,
        title: item.title ?? item.url ?? "Untitled",
        snippet: (item.text ?? "").slice(0, 700),
        url: item.url,
        relevance:
          typeof item.score === "number"
            ? Math.min(1, Math.max(0, item.score))
            : 0.5,
        timestamp: item.publishedDate
          ? Date.parse(item.publishedDate) || undefined
          : undefined,
      } satisfies RawResult)),
    };
  } catch (error) {
    return failure(
      source,
      "request_failed",
      `Exa search failed: ${messageFromError(error)}`,
    );
  }
}
