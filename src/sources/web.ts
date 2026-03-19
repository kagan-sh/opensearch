import type { RawResult } from "../schema";

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
  depth: "quick" | "thorough",
): Promise<RawResult[]> {
  if (!key) return [];

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

    if (!res.ok) return [];
    const body = (await res.json()) as { results?: Exa[] };
    const list = body.results ?? [];

    return list.map((item, i) => ({
      id: item.id ?? `web-${i}`,
      type: "web",
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
    }));
  } catch {
    return [];
  }
}
