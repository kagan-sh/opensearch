import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { defaultConfig, parsePluginConfig, resolveSources } from "./config";
import {
  noResultsResult,
  noSourcesResult,
  rawResultsResult,
  runSourceSearches,
  synthesizedResult,
} from "./orchestrator";
import {
  DEPTHS,
  ResultSchema,
  SOURCE_IDS,
  type Config,
  type Result,
  type SourceId,
} from "./schema";
import { synthesize } from "./synth";

const BRAND = "OpenSearch";
const TAGLINE = "evidence-backed search";
const BRAND_ORIGIN = "@kagan-sh/opensearch";

type ToolPhase = "searching" | "synthesizing" | "completed";
type ToolMetadata = {
  brand: typeof BRAND;
  brand_tagline: typeof TAGLINE;
  brand_origin: typeof BRAND_ORIGIN;
  brand_surface: "plugin";
  phase: ToolPhase;
  query: string;
  depth: Config["depth"];
  sources: SourceId[];
  source_summary: string;
  source_badges: string[];
  status_note?: string;
  status?: Result["status"];
  answer?: Result["answer"];
  duration_ms?: number;
  sources_requested?: number;
  sources_queried?: number;
  sources_yielded?: number;
  source_errors?: number;
  sources_unavailable?: Result["meta"]["sources_unavailable"];
};

function sourceBadge(source: SourceId) {
  if (source === "session") return "SESSION";
  if (source === "web") return "WEB";
  return "CODE";
}

function sourceBadges(sources: SourceId[]) {
  if (sources.length === 0) return ["OFFLINE"];
  return sources.map(sourceBadge);
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
  if (sources.length === 0) return `${BRAND} // checking sources`;
  return `${BRAND} // scanning ${describeSources(sources)}`;
}

function doneTitle(result: Result) {
  if (result.status === "no_sources") return `${BRAND} // unavailable`;
  if (result.status === "no_results") return `${BRAND} // no matches`;
  if (result.status === "raw") {
    return `${BRAND} // ${result.meta.sources_yielded} raw result${result.meta.sources_yielded === 1 ? "" : "s"}`;
  }
  if (result.status === "raw_fallback") return `${BRAND} // evidence fallback`;
  return `${BRAND} // ${result.meta.sources_yielded} result${result.meta.sources_yielded === 1 ? "" : "s"}`;
}

function statusNote(phase: ToolPhase, sources: SourceId[]) {
  if (phase === "searching") {
    if (sources.length === 0) return "checking available sources";
    return `scanning ${describeSources(sources)}`;
  }
  if (phase === "synthesizing") return "assembling evidence";
  return undefined;
}

function toolMetadata(input: {
  phase: ToolPhase;
  query: string;
  depth: Config["depth"];
  sources: SourceId[];
  result?: Result;
}): ToolMetadata {
  const note = statusNote(input.phase, input.sources);

  return {
    brand: BRAND,
    brand_tagline: TAGLINE,
    brand_origin: BRAND_ORIGIN,
    brand_surface: "plugin",
    phase: input.phase,
    query: previewQuery(input.query),
    depth: input.depth,
    sources: input.sources,
    source_summary: describeSources(input.sources),
    source_badges: sourceBadges(input.sources),
    ...(note ? { status_note: note } : {}),
    ...(input.result
      ? {
          status: input.result.status,
          answer: input.result.answer,
          duration_ms: input.result.meta.duration,
          sources_requested: input.result.meta.sources_requested,
          sources_queried: input.result.meta.sources_queried,
          sources_yielded: input.result.meta.sources_yielded,
          source_errors: input.result.meta.source_errors.length,
          sources_unavailable: input.result.meta.sources_unavailable,
        }
      : {}),
  };
}

function parseResultOutput(output: string) {
  try {
    const parsed = ResultSchema.safeParse(JSON.parse(output));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function parseRequestedSources(value: unknown): SourceId[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(
    (source: unknown): source is SourceId =>
      typeof source === "string" && SOURCE_IDS.includes(source as SourceId),
  );
}

export const OpensearchPlugin: Plugin = async (ctx) => {
  let cfg = defaultConfig();

  return {
    async config(input) {
      const next = parsePluginConfig(input);
      if (next) cfg = next;
    },
    "tool.definition": async (input, output) => {
      if (input.toolID !== "opensearch") return;
      output.description =
        "OpenSearch // evidence-backed search across session history, SearXNG web search, and public code. Use it for broad investigation, comparison, docs gathering, and cross-source research.";
    },
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "opensearch") return;
      const result = parseResultOutput(output.output);
      if (!result) return;
      const requested = parseRequestedSources(input.args?.sources);

      const resolved = resolveSources(cfg, requested);

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
          sources: requested ?? resolved.sources,
          result,
        }),
      };
    },
    tool: {
      opensearch: tool({
        description:
          "OpenSearch // evidence-backed search. Queries session history, SearXNG web search, and public code in parallel, then returns a structured answer with explicit status and source metadata.",
        args: {
          query: tool.schema.string().describe("What to search for"),
          sources: tool.schema
            .array(tool.schema.enum(SOURCE_IDS))
            .optional()
            .describe("Sources to query. Defaults to all enabled."),
          depth: tool.schema
            .enum(DEPTHS)
            .optional()
            .describe("Search depth. Default: quick"),
        },
        async execute(args, context) {
          const start = Date.now();
          const searchDepth = args.depth ?? cfg.depth;
          const resolved = resolveSources(cfg, args.sources);

          context.metadata({
            title: runningTitle(resolved.sources),
            metadata: toolMetadata({
              phase: "searching",
              query: args.query,
              depth: searchDepth,
              sources: resolved.sources,
            }),
          });

          if (resolved.sources.length === 0) {
            const result = noSourcesResult({
              query: args.query,
              start,
              requested: resolved.requested,
              unavailable: resolved.unavailable,
            });
            context.metadata({
              title: doneTitle(result),
              metadata: toolMetadata({
                phase: "completed",
                query: args.query,
                depth: searchDepth,
                sources: resolved.sources,
                result,
              }),
            });
            return serialize(result);
          }

          const search = await runSourceSearches({
            client: ctx.client,
            directory: context.directory,
            config: cfg,
            query: args.query,
            depth: searchDepth,
            sources: resolved.sources,
          });

          if (search.raw.length === 0) {
            const result = noResultsResult({
              query: args.query,
              start,
              requested: resolved.requested,
              queried: resolved.sources,
              unavailable: resolved.unavailable,
              sourceErrors: search.sourceErrors,
            });
            context.metadata({
              title: doneTitle(result),
              metadata: toolMetadata({
                phase: "completed",
                query: args.query,
                depth: searchDepth,
                sources: resolved.sources,
                result,
              }),
            });
            return serialize(result);
          }

          if (cfg.synth) {
            context.metadata({
              title: `${BRAND} // assembling evidence`,
              metadata: {
                ...toolMetadata({
                  phase: "synthesizing",
                  query: args.query,
                  depth: searchDepth,
                  sources: resolved.sources,
                }),
                raw_results: search.raw.length,
              },
            });

            try {
              const synthesis = await synthesize(
                ctx.client,
                context.directory,
                search.raw,
                args.query,
              );
              const result = synthesizedResult({
                query: args.query,
                start,
                requested: resolved.requested,
                queried: resolved.sources,
                unavailable: resolved.unavailable,
                sourceErrors: search.sourceErrors,
                raw: search.raw,
                synthesis,
              });
              context.metadata({
                title: doneTitle(result),
                metadata: toolMetadata({
                  phase: "completed",
                  query: args.query,
                  depth: searchDepth,
                  sources: resolved.sources,
                  result,
                }),
              });
              return serialize(result);
            } catch {
              const result = rawResultsResult({
                query: args.query,
                start,
                requested: resolved.requested,
                queried: resolved.sources,
                unavailable: resolved.unavailable,
                sourceErrors: search.sourceErrors,
                raw: search.raw,
                status: "raw_fallback",
              });
              context.metadata({
                title: doneTitle(result),
                metadata: {
                  ...toolMetadata({
                    phase: "completed",
                    query: args.query,
                    depth: searchDepth,
                    sources: resolved.sources,
                    result,
                  }),
                  fallback: "synthesis_error",
                },
              });
              return serialize(result);
            }
          }

          const result = rawResultsResult({
            query: args.query,
            start,
            requested: resolved.requested,
            queried: resolved.sources,
            unavailable: resolved.unavailable,
            sourceErrors: search.sourceErrors,
            raw: search.raw,
            status: "raw",
          });
          context.metadata({
            title: doneTitle(result),
            metadata: toolMetadata({
              phase: "completed",
              query: args.query,
              depth: searchDepth,
              sources: resolved.sources,
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
