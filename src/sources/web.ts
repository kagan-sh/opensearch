import type { Depth, RawResult } from "../schema";
import { failure, messageFromError, type SourceSearchOutcome } from "./shared";

type SearxResult = {
  title?: string;
  url?: string;
  content?: string;
  publishedDate?: string;
};

export async function searchWeb(
  query: string,
  baseUrl: string | undefined,
  depth: Depth,
): Promise<SourceSearchOutcome> {
  const source = "web" as const;
  if (!baseUrl) {
    return failure(
      source,
      "unavailable",
      "Web source requires OPENSEARCH_WEB_URL.",
    );
  }

  try {
    const url = new URL("search", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return failure(
        source,
        "request_failed",
        res.status === 403
          ? "SearXNG search failed with status 403. Enable JSON output on the instance."
          : `SearXNG search failed with status ${res.status}.`,
      );
    }
    const body = (await res.json()) as { results?: SearxResult[] };
    if (!Array.isArray(body.results)) {
      return failure(
        source,
        "invalid_response",
        "SearXNG search returned an invalid payload.",
      );
    }

    const limit = depth === "quick" ? 5 : 10;
    const list = body.results.slice(0, limit);

    return {
      source,
      results: list.map((item, i) => ({
        id: `web-${i}`,
        type: source,
        title: item.title ?? item.url ?? "Untitled",
        snippet: (item.content ?? item.url ?? "").slice(0, 700),
        url: item.url,
        relevance: Math.max(0.1, 1 - i / Math.max(1, list.length)),
        timestamp: item.publishedDate
          ? Date.parse(item.publishedDate) || undefined
          : undefined,
      } satisfies RawResult)),
    };
  } catch (error) {
    return failure(
      source,
      "request_failed",
      `SearXNG search failed: ${messageFromError(error)}`,
    );
  }
}
