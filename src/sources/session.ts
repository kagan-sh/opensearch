import type { createOpencodeClient } from "@opencode-ai/sdk";
import type { RawResult } from "../schema";

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
  depth: "quick" | "thorough",
): Promise<RawResult[]> {
  const key = words(query);
  if (key.length === 0) return [];

  const listRes = await client.session.list({ query: { directory } }).catch(
    () =>
      ({
        data: [] as Array<{
          id: string;
          title: string;
          time: { updated: number };
        }>,
      }) as {
        data: Array<{ id: string; title: string; time: { updated: number } }>;
      },
  );

  const list = listRes.data ?? [];

  const top = list
    .filter((item) =>
      key.some((word) => item.title.toLowerCase().includes(word)),
    )
    .slice(0, depth === "quick" ? 5 : 15);

  const out = await Promise.all(
    top.map(async (item) => {
      const msgRes = await client.session
        .messages({
          path: { id: item.id },
          query: { directory, limit: depth === "quick" ? 50 : 200 },
        })
        .catch(
          () =>
            ({
              data: [] as Array<{
                parts: Array<{ type: string; text?: string }>;
              }>,
            }) as {
              data: Array<{ parts: Array<{ type: string; text?: string }> }>;
            },
        );

      const body = (msgRes.data ?? []).map((row) => text(row.parts)).join("\n");
      const hit = key.reduce((sum, word) => sum + count(body, word), 0);
      const rel = Math.min(1, hit / Math.max(1, key.length * 4));
      if (hit === 0) return null;

      return {
        id: item.id,
        type: "session",
        title: item.title,
        snippet: body.slice(0, 700) || item.title,
        url: item.id,
        relevance: rel,
        timestamp: item.time.updated,
      } satisfies RawResult;
    }),
  );

  return out.filter((item): item is NonNullable<typeof item> => item !== null);
}
