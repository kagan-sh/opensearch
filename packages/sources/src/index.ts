import type {
  Datasource,
  DatasourceId,
  SearchSource,
  SearchThread,
} from "@opensearch/contracts";

export type DatasourceSearchRequest = {
  query: string;
  maxSources: number;
  signal?: AbortSignal;
  thread?: SearchThread;
};

export type DatasourceSearchResult = {
  datasourceId: DatasourceId;
  results: SearchSource[];
  error?: string;
};

export type DatasourceAdapter = {
  descriptor: Datasource;
  search(request: DatasourceSearchRequest): Promise<DatasourceSearchResult>;
};

export type DatasourceRegistry = {
  register(adapter: DatasourceAdapter): void;
  list(): Datasource[];
  get(id: DatasourceId): DatasourceAdapter | undefined;
  search(request: DatasourceSearchRequest & { datasourceIds?: DatasourceId[] }): Promise<DatasourceSearchResult[]>;
};

type FetchLike = typeof fetch;

export function createDatasourceRegistry(adapters: DatasourceAdapter[] = []): DatasourceRegistry {
  const registry = new Map<DatasourceId, DatasourceAdapter>(
    adapters.map((adapter) => [adapter.descriptor.id, adapter]),
  );

  return {
    register(adapter) {
      registry.set(adapter.descriptor.id, adapter);
    },
    list() {
      return Array.from(registry.values()).map((adapter) => adapter.descriptor);
    },
    get(id) {
      return registry.get(id);
    },
    async search(request) {
      const active = request.datasourceIds?.length
        ? request.datasourceIds.flatMap((id) => {
            const adapter = registry.get(id);
            return adapter ? [adapter] : [];
          })
        : Array.from(registry.values());

      return Promise.all(active.map((adapter) => adapter.search(request)));
    },
  };
}

export function createThreadHistoryDatasource(): DatasourceAdapter {
  const descriptor: Datasource = {
    id: "session-history",
    label: "Session History",
    description: "Search prior thread turns already stored by the API.",
    category: "session",
    capabilities: ["search", "private-context"],
    credentialMode: "none",
    enabled: true,
  };

  return {
    descriptor,
    async search(request) {
      const thread = request.thread;
      if (!thread) {
        return { datasourceId: descriptor.id, results: [] };
      }

      const tokens = tokenize(request.query);
      const results = thread.turns
        .flatMap((turn, index) => {
          const text = [turn.query, turn.answerText, ...turn.followUps].filter(Boolean).join(" ");
          const score = overlapScore(tokens, tokenize(text));
          if (score === 0) return [];
          return [
            {
              id: `${thread.id}:${turn.id}`,
              datasourceId: descriptor.id,
              category: descriptor.category,
              title: turn.query,
              snippet: turn.answerText || turn.query,
              score: clampScore(score + Math.max(0, 0.15 - index * 0.01), 0.25),
              metadata: {
                threadId: thread.id,
                turnId: turn.id,
                parentTurnId: turn.parentTurnId,
              },
            } satisfies SearchSource,
          ];
        })
        .sort((left, right) => right.score - left.score)
        .slice(0, request.maxSources);

      return { datasourceId: descriptor.id, results };
    },
  };
}

export function createSearxngDatasource(input: {
  baseUrl: string;
  fetch?: FetchLike;
  queryExpansions?: ((query: string) => string[]) | undefined;
}): DatasourceAdapter {
  const runFetch = input.fetch ?? fetch;
  const expand = input.queryExpansions ?? defaultWebQueries;
  const descriptor: Datasource = {
    id: "searxng-web",
    label: "Web Search",
    description: "Privacy-oriented metasearch via a server-side SearXNG instance.",
    category: "web",
    capabilities: ["search", "web"],
    credentialMode: "server",
    enabled: true,
  };

  return {
    descriptor,
    async search(request) {
      try {
        const collected: Array<Record<string, unknown>> = [];

        for (const candidate of expand(request.query)) {
          const url = new URL("search", input.baseUrl.endsWith("/") ? input.baseUrl : `${input.baseUrl}/`);
          url.searchParams.set("q", candidate);
          url.searchParams.set("format", "json");

          const response = await runFetch(url, {
            headers: { Accept: "application/json" },
            signal: request.signal,
          });

          if (!response.ok) {
            return {
              datasourceId: descriptor.id,
              results: [],
              error: `SearXNG request failed with ${response.status}.`,
            };
          }

          const body = (await response.json()) as { results?: Array<Record<string, unknown>> };
          if (!Array.isArray(body.results)) {
            return {
              datasourceId: descriptor.id,
              results: [],
              error: "SearXNG returned an invalid payload.",
            };
          }

          collected.push(...body.results);
          if (collected.length > 0) break;
        }

        const deduped = new Map<string, SearchSource>();
        for (const [index, item] of collected.entries()) {
          const url = typeof item.url === "string" ? item.url : undefined;
          const title = typeof item.title === "string" ? item.title : url ?? "Untitled";
          const snippet = trimSnippet(typeof item.content === "string" ? item.content : undefined);
          const key = url ?? `${title}:${snippet ?? ""}`;

          if (deduped.has(key)) continue;

          deduped.set(key, {
            id: `${descriptor.id}:${index}`,
            datasourceId: descriptor.id,
            category: descriptor.category,
            title,
            url,
            snippet,
            score: clampScore(1 - index / Math.max(1, request.maxSources), 0.5),
            metadata: {},
          });
        }

        return {
          datasourceId: descriptor.id,
          results: Array.from(deduped.values()).slice(0, request.maxSources),
        };
      } catch (error) {
        return {
          datasourceId: descriptor.id,
          results: [],
          error: `SearXNG request failed: ${message(error)}`,
        };
      }
    },
  };
}

export function createGrepAppDatasource(input: { fetch?: FetchLike } = {}): DatasourceAdapter {
  const runFetch = input.fetch ?? fetch;
  const descriptor: Datasource = {
    id: "grep-app-code",
    label: "Public Code Search",
    description: "Search public repositories through grep.app from the server.",
    category: "code",
    capabilities: ["search", "code"],
    credentialMode: "none",
    enabled: true,
  };

  return {
    descriptor,
    async search(request) {
      try {
        const url = new URL("https://grep.app/api/search");
        url.searchParams.set("q", request.query);
        url.searchParams.set("limit", String(request.maxSources));

        const response = await runFetch(url, { signal: request.signal });
        if (!response.ok) {
          return {
            datasourceId: descriptor.id,
            results: [],
            error: `grep.app request failed with ${response.status}.`,
          };
        }

        const body = (await response.json()) as {
          hits?: { hits?: Array<Record<string, unknown>> };
        };
        const hits = body.hits?.hits;

        if (hits && !Array.isArray(hits)) {
          return {
            datasourceId: descriptor.id,
            results: [],
            error: "grep.app returned an invalid payload.",
          };
        }

        const results = (hits ?? []).slice(0, request.maxSources).map((item, index) => {
          const repo = readNestedString(item, ["repo", "raw"]) ?? "unknown";
          const path = readNestedString(item, ["path", "raw"]);

          return {
            id: `${descriptor.id}:${index}`,
            datasourceId: descriptor.id,
            category: descriptor.category,
            title: path ? `${repo}/${path}` : repo,
            url: `https://grep.app/search?q=${encodeURIComponent(request.query)}`,
            snippet: trimSnippet(readNestedString(item, ["content", "snippet"]), "code"),
            score: clampScore(readNestedNumber(item, ["score"]) / 100, 0.45),
            metadata: { repo, path },
          } satisfies SearchSource;
        });

        return { datasourceId: descriptor.id, results };
      } catch (error) {
        return {
          datasourceId: descriptor.id,
          results: [],
          error: `grep.app request failed: ${message(error)}`,
        };
      }
    },
  };
}

export function defaultWebQueries(query: string) {
  const value = query.trim();
  if (!value) return [];
  if (value.includes("site:")) return [value];

  const repoLike = value.match(/\b([a-z0-9_.-]+\/[a-z0-9_.-]+)\b/i)?.[1];
  return [
    value,
    ...(repoLike ? [`site:github.com ${repoLike}`] : [`site:github.com ${value}`]),
    `site:stackoverflow.com ${value}`,
    `${value} official docs`,
  ];
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function overlapScore(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  const hits = left.filter((token) => rightSet.has(token)).length;
  return hits / left.length;
}

function clampScore(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function trimSnippet(value: string | undefined, flavor: "prose" | "code" = "prose") {
  if (!value) return undefined;

  const decoded = decodeHtmlEntities(
    value
      .replace(/<(?:br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|tr|li|section|article|pre|code)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
  const lines = decoded
    .split(/\n+/)
    .map((line) => cleanupSnippetLine(line, flavor))
    .filter(Boolean);

  const text = (flavor === "code" ? lines.join("\n") : lines.join(" "))
    .replace(flavor === "code" ? /\n{3,}/g : /\s+/g, flavor === "code" ? "\n\n" : " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([A-Za-z0-9_$])\s+\(/g, "$1(")
    .trim()
    .slice(0, flavor === "code" ? 320 : 400);

  return text || undefined;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

function cleanupSnippetLine(value: string, flavor: "prose" | "code") {
  const stripped = value
    .replace(/\b(?:copy|raw|preview)\b/gi, " ")
    .replace(/^\s*(?:line\s*)?\d{1,6}(?:\s*[|:)\]-]\s*|\s{2,})/i, "")
    .replace(/\s+[|]\s+/g, " ")
    .replace(/^\s*[|:.-]+\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped) return "";
  if (/^\d+$/.test(stripped)) return "";
  if (flavor === "prose") {
    return stripped;
  }

  return stripped;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function readNestedString(value: Record<string, unknown>, path: string[]) {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

function readNestedNumber(value: Record<string, unknown>, path: string[]) {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return 0;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "number" ? current : 0;
}
