import type { RawResult } from "../schema";

type Hit = {
  repo?: { raw?: string };
  path?: { raw?: string };
  content?: { snippet?: string };
  score?: number;
};

type Body = {
  hits?: {
    hits?: Hit[];
  };
};

export async function searchCode(
  query: string,
  depth: "quick" | "thorough",
): Promise<RawResult[]> {
  try {
    const url = `https://grep.app/api/search?q=${encodeURIComponent(query)}&limit=${depth === "quick" ? 5 : 10}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const body = (await res.json()) as Body;
    const list = body.hits?.hits ?? [];

    return list.map((hit, i) => {
      const repo = hit.repo?.raw ?? "unknown";
      const path = hit.path?.raw ?? "";
      return {
        id: `code-${repo}-${path}-${i}`,
        type: "code",
        title: path ? `${repo}/${path}` : repo,
        snippet: (hit.content?.snippet ?? "").slice(0, 700),
        url: `https://grep.app/search?q=${encodeURIComponent(query)}`,
        relevance:
          typeof hit.score === "number"
            ? Math.min(1, Math.max(0, hit.score / 100))
            : 0.5,
      } satisfies RawResult;
    });
  } catch {
    return [];
  }
}
