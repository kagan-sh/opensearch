import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import {
  ConfigSchema,
  type Config,
  type RawResult,
  type Result,
  ResultSchema,
  type Source,
} from "./schema";
import { searchCode } from "./sources/code";
import { searchSessions } from "./sources/session";
import { searchWeb } from "./sources/web";
import { synthesize } from "./synth";

const SOURCE_IDS = ["session", "web", "code"] as const;
const BRAND = "OpenSearch";

type SourceId = (typeof SOURCE_IDS)[number];

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return fallback;
}

function parseDepth(value: string | undefined): Config["depth"] {
  if (value === "thorough") return "thorough";
  return "quick";
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function parseConfig(input: unknown): Config | undefined {
  if (!input || typeof input !== "object" || !("opensearch" in input)) {
    return undefined;
  }

  const parsed = ConfigSchema.safeParse(input.opensearch);
  return parsed.success ? parsed.data : undefined;
}

function isSourceAvailable(config: Config, source: SourceId) {
  if (source === "session") return config.sources.session;
  if (source === "web") {
    return config.sources.web.enabled && Boolean(config.sources.web.key);
  }
  return config.sources.code;
}

function resolveSources(config: Config, requested?: SourceId[]) {
  const selected = requested ?? SOURCE_IDS.filter((source) => isSourceAvailable(config, source));
  return Array.from(new Set(selected)).filter((source) => isSourceAvailable(config, source));
}

function resultMeta(
  query: string,
  start: number,
  sourcesQueried: number,
  sourcesYielded: number,
) {
  return {
    query,
    duration: Date.now() - start,
    sources_queried: sourcesQueried,
    sources_yielded: sourcesYielded,
  };
}

function noResults(query: string, start: number, sourcesQueried: number): Result {
  const noSourcesAvailable = sourcesQueried === 0;
  return {
    answer: noSourcesAvailable ? "No sources available" : "No results found",
    confidence: "none",
    evidence: [],
    sources: [],
    followups: noSourcesAvailable
      ? [
          "Enable at least one search source in opensearch config",
          "Set OPENSEARCH_WEB_KEY or EXA_API_KEY to enable web search",
        ]
      : [
          `Use broader terms for: ${query}`,
          `Search only web for: ${query}`,
        ],
    meta: resultMeta(query, start, sourcesQueried, 0),
  };
}

function rawOnlyResults(
  query: string,
  start: number,
  sourcesQueried: number,
  raw: RawResult[],
): Result {
  return {
    answer: "Raw results (synthesis disabled)",
    confidence: "none",
    evidence: [],
    sources: raw.map(normalize),
    followups: [
      `Enable synthesis for: ${query}`,
      `Filter to one source for: ${query}`,
    ],
    meta: resultMeta(query, start, sourcesQueried, raw.length),
  };
}

function serialize(result: Result) {
  return JSON.stringify(result, null, 2);
}

function previewQuery(query: string, max = 64) {
  if (query.length <= max) return query;
  return `${query.slice(0, max - 1)}...`;
}

function describeSources(sources: SourceId[]) {
  if (sources.length === 0) return "no sources";
  if (sources.length === 1) return `${sources[0]} only`;
  if (sources.length === 2) return `${sources[0]} + ${sources[1]}`;
  return "session + web + code";
}

function runningTitle(sources: SourceId[]) {
  return `${BRAND} · searching ${describeSources(sources)}`;
}

function doneTitle(result: Result) {
  if (result.answer === "No sources available") return `${BRAND} · unavailable`;
  if (result.answer === "No results found") return `${BRAND} · no matches`;
  if (result.answer === "Raw results (synthesis disabled)") {
    return `${BRAND} · ${result.meta.sources_yielded} raw result${result.meta.sources_yielded === 1 ? "" : "s"}`;
  }
  if (result.answer === "Unable to synthesize structured answer. Returning raw evidence.") {
    return `${BRAND} · evidence fallback`;
  }
  return `${BRAND} · ${result.meta.sources_yielded} result${result.meta.sources_yielded === 1 ? "" : "s"}`;
}

function toolMetadata(input: {
  phase: "searching" | "synthesizing" | "completed";
  query: string;
  depth: Config["depth"];
  sources: SourceId[];
  result?: Result;
}) {
  return {
    brand: BRAND,
    phase: input.phase,
    query: previewQuery(input.query),
    depth: input.depth,
    sources: input.sources,
    source_summary: describeSources(input.sources),
    ...(input.result
      ? {
          answer: input.result.answer,
          duration_ms: input.result.meta.duration,
          sources_queried: input.result.meta.sources_queried,
          sources_yielded: input.result.meta.sources_yielded,
        }
      : {}),
  };
}

function parseResultOutput(output: string) {
  const parsed = ResultSchema.safeParse(JSON.parse(output));
  return parsed.success ? parsed.data : undefined;
}

function defaultConfig(): Config {
  return {
    sources: {
      session: parseBoolean(process.env.OPENSEARCH_SOURCE_SESSION, true),
      web: {
        enabled: parseBoolean(process.env.OPENSEARCH_SOURCE_WEB, true),
        key: process.env.OPENSEARCH_WEB_KEY ?? process.env.EXA_API_KEY,
      },
      code: parseBoolean(process.env.OPENSEARCH_SOURCE_CODE, true),
    },
    depth: parseDepth(process.env.OPENSEARCH_DEPTH),
    synth: parseBoolean(process.env.OPENSEARCH_SYNTH, true),
  };
}

function normalize(raw: RawResult): Source {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    snippet: raw.snippet,
    url: raw.url,
    relevance: clampUnit(raw.relevance),
    timestamp: raw.timestamp,
  };
}

export const OpensearchPlugin: Plugin = async (ctx) => {
  let cfg = defaultConfig();

  return {
    async config(input) {
      const next = parseConfig(input);
      if (next) cfg = next;
    },
    "tool.definition": async (input, output) => {
      if (input.toolID !== "opensearch") return;
      output.description =
        "OpenSearch: use for broad investigation when the user asks to search, compare evidence, gather official docs, or combine session, web, and code results.";
    },
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "opensearch") return;
      const result = parseResultOutput(output.output);
      if (!result) return;
      output.title = doneTitle(result);
      output.metadata = {
        ...(output.metadata ?? {}),
        ...toolMetadata({
          phase: "completed",
          query: result.meta.query,
          depth:
            input.args && typeof input.args.depth === "string"
              ? input.args.depth
              : cfg.depth,
          sources:
            input.args && Array.isArray(input.args.sources)
              ? input.args.sources.filter(
                  (source: unknown): source is SourceId =>
                    typeof source === "string" && SOURCE_IDS.includes(source as SourceId),
                )
              : SOURCE_IDS.filter((source) => isSourceAvailable(cfg, source)),
          result,
        }),
      };
    },
    tool: {
      opensearch: tool({
        description:
          "Universal intelligent search. Queries session history, web, and code in parallel. Returns structured evidence-backed answer.",
        args: {
          query: tool.schema.string().describe("What to search for"),
          sources: tool.schema
            .array(tool.schema.enum(["session", "web", "code"]))
            .optional()
            .describe("Sources to query. Defaults to all enabled."),
          depth: tool.schema
            .enum(["quick", "thorough"])
            .optional()
            .describe("Search depth. Default: quick"),
        },
        async execute(args, context) {
          const start = Date.now();
          const searchDepth = args.depth ?? cfg.depth;
          const sources = resolveSources(cfg, args.sources);
          context.metadata({
            title: runningTitle(sources),
            metadata: toolMetadata({
              phase: "searching",
              query: args.query,
              depth: searchDepth,
              sources,
            }),
          });
          const searches = sources.map((source) => {
            if (source === "session") {
              return searchSessions(
                ctx.client,
                context.directory,
                args.query,
                searchDepth,
              );
            }
            if (source === "web") {
              return searchWeb(args.query, cfg.sources.web.key, searchDepth);
            }
            return searchCode(args.query, searchDepth);
          });

          const settled = await Promise.allSettled(searches);
          const raw = settled
            .filter((item) => item.status === "fulfilled")
            .flatMap((item) => (item.status === "fulfilled" ? item.value : []));

          if (raw.length === 0) {
            const result = noResults(args.query, start, sources.length);
            context.metadata({
              title: doneTitle(result),
              metadata: toolMetadata({
                phase: "completed",
                query: args.query,
                depth: searchDepth,
                sources,
                result,
              }),
            });
            return serialize(result);
          }

          if (cfg.synth) {
            context.metadata({
              title: `${BRAND} · synthesizing evidence`,
              metadata: {
                ...toolMetadata({
                  phase: "synthesizing",
                  query: args.query,
                  depth: searchDepth,
                  sources,
                }),
                raw_results: raw.length,
              },
            });
            try {
              const result = await synthesize(
                ctx.client,
                context.directory,
                raw,
                args.query,
              );
              result.meta = resultMeta(args.query, start, sources.length, raw.length);
              context.metadata({
                title: doneTitle(result),
                metadata: toolMetadata({
                  phase: "completed",
                  query: args.query,
                  depth: searchDepth,
                  sources,
                  result,
                }),
              });
              return serialize(result);
            } catch {
              const result = rawOnlyResults(args.query, start, sources.length, raw);
              context.metadata({
                title: doneTitle(result),
                metadata: {
                  ...toolMetadata({
                    phase: "completed",
                    query: args.query,
                    depth: searchDepth,
                    sources,
                    result,
                  }),
                  fallback: "raw_results",
                },
              });
              return serialize(result);
            }
          }

          const result = rawOnlyResults(args.query, start, sources.length, raw);
          context.metadata({
            title: doneTitle(result),
            metadata: toolMetadata({
              phase: "completed",
              query: args.query,
              depth: searchDepth,
              sources,
              result,
            }),
          });
          return serialize(result);
        },
      }),
    },
  };
};

export default OpensearchPlugin;
