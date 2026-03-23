import {
  SearchResponseSchema,
  SearchThreadSchema,
  type Datasource,
  type DatasourceId,
  type SearchAnswerBlock,
  type SearchCitation,
  type SearchRequest,
  type SearchResponse,
  type SearchSource,
  type SearchThread,
  type SearchTurn,
  type SearchTurnStatus,
} from "@opensearch/contracts";
import { buildSynthesisPrompt } from "@opensearch/prompts";
import type { DatasourceRegistry, DatasourceSearchResult } from "@opensearch/sources";

export type AnswerModelInput = {
  query: string;
  prompt: string;
  thread: SearchThread;
  turn: SearchTurn;
  sources: SearchSource[];
  errors: string[];
};

export type AnswerModelOutput = {
  status: Exclude<SearchTurnStatus, "pending" | "streaming">;
  answerText: string;
  answerBlocks: SearchAnswerBlock[];
  followUps: string[];
  errors: string[];
};

export type AnswerModel = {
  generate(input: AnswerModelInput): Promise<AnswerModelOutput>;
};

export type ExecuteTurnRequest = SearchRequest & {
  thread?: SearchThread;
  threadId?: string;
  turnId?: string;
  parentTurnId?: string;
  startedAt?: string;
};

export type SearchCore = {
  listDatasources(): Datasource[];
  search(request: ExecuteTurnRequest): Promise<SearchResponse>;
};

export function createHeuristicAnswerModel(): AnswerModel {
  return {
    async generate(input) {
      if (input.sources.length === 0) {
        const status = input.errors.length > 0 ? "error" : "empty";
        const answerText = input.errors.length > 0 ? input.errors.join(" ") : "No evidence found yet.";
        return {
          status,
          answerText,
          answerBlocks: toTextBlocks(answerText),
          followUps: [
            `Broaden the search scope for ${JSON.stringify(input.query)}.`,
            `Try a more specific query for ${JSON.stringify(input.query)}.`,
          ],
          errors: input.errors,
        };
      }
      const answerBlocks = buildStructuredAnswer(input.sources, input.errors);
      const answerText = flattenBlocks(answerBlocks) || `Found ${input.sources.length} relevant sources for ${input.query}.`;

      return {
        status: input.errors.length > 0 ? "partial" : "completed",
        answerText,
        answerBlocks,
        followUps: [
          `Verify primary evidence for ${input.query}.`,
          `Check whether newer sources change the answer to ${input.query}.`,
        ],
        errors: input.errors,
      };
    },
  };
}

export function createSearchCore(input: {
  registry: DatasourceRegistry;
  answerModel?: AnswerModel;
  now?: () => Date;
  makeId?: () => string;
}): SearchCore {
  const answerModel = input.answerModel ?? createHeuristicAnswerModel();
  const now = input.now ?? (() => new Date());
  const makeId = input.makeId ?? defaultId;

  return {
    listDatasources() {
      return input.registry.list();
    },

    async search(request) {
      const startedAt = request.startedAt ?? now().toISOString();
      const baseThread = request.thread ? SearchThreadSchema.parse(request.thread) : undefined;
      const threadId = baseThread?.id ?? request.threadId ?? makeId();
      const turnId = request.turnId ?? makeId();

      const datasourceResults = await input.registry.search({
        query: request.query,
        maxSources: request.maxSources,
        datasourceIds: request.datasourceIds,
        thread: baseThread,
      });
      const sources = rankAndDedupeSources(datasourceResults, request.maxSources);
      const citations = sources.slice(0, 3).map(toCitation);

      const draftTurn: SearchTurn = {
        id: turnId,
        parentTurnId: request.parentTurnId,
        query: request.query,
        status: "pending",
        answerText: "",
        answerBlocks: [],
        citations: [],
        sources: [],
        followUps: [],
        errors: [],
        createdAt: startedAt,
        updatedAt: startedAt,
      };

      const draftThread: SearchThread = baseThread
        ? {
            ...baseThread,
            updatedAt: startedAt,
            turns: [...baseThread.turns, draftTurn],
          }
        : {
            id: threadId,
            title: createTitle(request.query),
            createdAt: startedAt,
            updatedAt: startedAt,
            turns: [draftTurn],
          };

      const errors = datasourceResults.flatMap((result) => (result.error ? [result.error] : []));
      const prompt = buildSynthesisPrompt({ query: request.query, sources });
      const answer = await answerModel.generate({
        query: request.query,
        prompt,
        thread: draftThread,
        turn: draftTurn,
        sources,
        errors,
      });

      const completedAt = now().toISOString();
      const turn: SearchTurn = {
        ...draftTurn,
        status: answer.status,
        answerText: answer.answerText,
        answerBlocks: answer.answerBlocks,
        citations,
        sources,
        followUps: answer.followUps,
        errors: answer.errors,
        updatedAt: completedAt,
        completedAt,
      };
      const thread: SearchThread = {
        ...draftThread,
        updatedAt: completedAt,
        turns: [...draftThread.turns.slice(0, -1), turn],
      };

      return SearchResponseSchema.parse({ thread, turn });
    },
  };
}

export function rankAndDedupeSources(results: DatasourceSearchResult[], maxSources: number) {
  const deduped = new Map<string, SearchSource>();

  for (const result of results) {
    for (const source of result.results) {
      const key = dedupeKey(source);
      const weighted = {
        ...source,
        score: clampScore(source.score * categoryWeight(source.category)),
      };
      const current = deduped.get(key);
      if (!current || current.score < weighted.score) {
        deduped.set(key, weighted);
      }
    }
  }

  return Array.from(deduped.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, maxSources);
}

function toCitation(source: SearchSource): SearchCitation {
  return {
    sourceId: source.id,
    title: source.title,
    url: source.url,
    snippet: source.snippet,
  };
}

function toTextBlocks(text: string): SearchAnswerBlock[] {
  if (!text) return [];
  return [{ type: "text", text }];
}

function buildStructuredAnswer(sources: SearchSource[], errors: string[]): SearchAnswerBlock[] {
  const topSources = sources.slice(0, 4);
  if (topSources.length === 0) {
    return [];
  }

  const blocks: SearchAnswerBlock[] = [];
  const overview = createOverview(topSources, sources.length);
  if (overview) {
    blocks.push({ type: "text", label: "Answer", text: overview });
  }

  const evidenceItems = topSources
    .map((source) => describeEvidence(source))
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 3);

  if (evidenceItems.length > 0) {
    blocks.push({ type: "list", label: "Evidence", items: evidenceItems });
  }

  if (errors.length > 0) {
    blocks.push({
      type: "text",
      label: "Limits",
      text: `Some datasources failed during retrieval: ${errors.join(" ")}`,
    });
  }

  return blocks;
}

function createOverview(sources: SearchSource[], totalSources: number) {
  const lead = sources[0];
  if (!lead) return "";

  const leadSnippet = normalizeForSentence(lead.snippet) || lead.title;
  const categories = Array.from(new Set(sources.map((source) => source.category)));
  const coverage =
    categories.length > 1
      ? ` Evidence spans ${joinLabels(categories.map(describeCategory))}.`
      : totalSources > 1
        ? ` Backed by ${totalSources} corroborating sources.`
        : "";

  if (lead.category === "code") {
    return `The strongest code evidence centers on ${lead.title}. ${leadSnippet}${coverage}`.trim();
  }

  if (lead.category === "session" || lead.category === "private") {
    return `Stored context points to ${stripTerminalPunctuation(leadSnippet)}.${coverage}`.trim();
  }

  return `${leadSnippet}${coverage}`.trim();
}

function describeEvidence(source: SearchSource) {
  const label = source.category === "code" ? source.title : simplifyTitle(source);
  const snippet = normalizeForSentence(source.snippet) || `Relevant ${describeCategory(source.category)} evidence.`;
  return `${label}: ${snippet}`;
}

function flattenBlocks(blocks: SearchAnswerBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "text") {
        return block.text.trim();
      }

      return block.items.map((item) => `- ${item}`).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function normalizeForSentence(value: string | undefined) {
  if (!value) return "";

  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";

  const clipped = compact.slice(0, 220).replace(/[,:;\-\s]+$/g, "");
  return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
}

function stripTerminalPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "");
}

function simplifyTitle(source: SearchSource) {
  if (!source.url) return source.title;

  try {
    const url = new URL(source.url);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return source.title;
  }
}

function describeCategory(category: SearchSource["category"]) {
  if (category === "session") return "session history";
  if (category === "private") return "private context";
  if (category === "web") return "web sources";
  if (category === "code") return "public code";
  return "other sources";
}

function joinLabels(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function dedupeKey(source: SearchSource) {
  return source.url?.toLowerCase() ?? `${source.datasourceId}:${source.title.toLowerCase()}:${source.snippet ?? ""}`;
}

function categoryWeight(category: SearchSource["category"]) {
  if (category === "session") return 1;
  if (category === "private") return 0.98;
  if (category === "web") return 0.95;
  if (category === "code") return 0.92;
  return 0.9;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

function createTitle(query: string) {
  return query.trim().slice(0, 80) || "Untitled thread";
}

function defaultId() {
  return Math.random().toString(36).slice(2, 10);
}
