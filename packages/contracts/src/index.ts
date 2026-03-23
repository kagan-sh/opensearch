import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SEARCH_SOURCE_CATEGORIES = ["session", "web", "code", "private", "other"] as const;
export const SEARCH_TURN_STATUSES = ["pending", "streaming", "completed", "partial", "empty", "error"] as const;
export const DATA_CREDENTIAL_MODES = ["none", "server"] as const;
export const STREAM_EVENT_TYPES = [
  "thread",
  "turn.started",
  "turn.answer.delta",
  "turn.source",
  "turn.completed",
  "error",
  "done",
] as const;

export const SearchSourceCategorySchema = z.enum(SEARCH_SOURCE_CATEGORIES);
export const SearchTurnStatusSchema = z.enum(SEARCH_TURN_STATUSES);
export const DataCredentialModeSchema = z.enum(DATA_CREDENTIAL_MODES);
export const StreamEventTypeSchema = z.enum(STREAM_EVENT_TYPES);

export const DatasourceIdSchema = z.string().trim().min(1);
export const CapabilitySchema = z.string().trim().min(1);

export const DatasourceSchema = z
  .object({
    id: DatasourceIdSchema,
    label: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    category: SearchSourceCategorySchema,
    capabilities: z.array(CapabilitySchema).default([]),
    credentialMode: DataCredentialModeSchema.default("none"),
    enabled: z.boolean().default(true),
  })
  .strict();

export const SearchSourceSchema = z
  .object({
    id: z.string().trim().min(1),
    datasourceId: DatasourceIdSchema,
    category: SearchSourceCategorySchema,
    title: z.string().trim().min(1),
    url: z.string().url().optional(),
    snippet: z.string().trim().min(1).optional(),
    content: z.string().trim().min(1).optional(),
    score: z.number().min(0).max(1).default(0.5),
    metadata: z.record(z.unknown()).default({}),
  })
  .strict();

export const SearchCitationSchema = z
  .object({
    sourceId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    url: z.string().url().optional(),
    snippet: z.string().trim().min(1).optional(),
  })
  .strict();

const SearchAnswerTextBlockSchema = z
  .object({
    type: z.literal("text"),
    label: z.string().trim().min(1).optional(),
    text: z.string(),
  })
  .strict();

const SearchAnswerListBlockSchema = z
  .object({
    type: z.literal("list"),
    label: z.string().trim().min(1).optional(),
    items: z.array(z.string().trim().min(1)).min(1),
  })
  .strict();

export const SearchAnswerBlockSchema = z.discriminatedUnion("type", [
  SearchAnswerTextBlockSchema,
  SearchAnswerListBlockSchema,
]);

export const SearchTurnSchema = z
  .object({
    id: z.string().trim().min(1),
    parentTurnId: z.string().trim().min(1).optional(),
    query: z.string().trim().min(1),
    status: SearchTurnStatusSchema,
    answerText: z.string(),
    answerBlocks: z.array(SearchAnswerBlockSchema).default([]),
    citations: z.array(SearchCitationSchema).default([]),
    sources: z.array(SearchSourceSchema).default([]),
    followUps: z.array(z.string().trim().min(1)).default([]),
    errors: z.array(z.string().trim().min(1)).default([]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
  })
  .strict();

export const SearchThreadSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    turns: z.array(SearchTurnSchema).default([]),
  })
  .strict();

export const SearchRequestSchema = z
  .object({
    query: z.string().trim().min(1),
    datasourceIds: z.array(DatasourceIdSchema).optional(),
    maxSources: z.number().int().min(1).max(20).default(8),
  })
  .strict();

export const FollowUpRequestSchema = SearchRequestSchema.extend({
  parentTurnId: z.string().trim().min(1).optional(),
}).strict();

export const SearchResponseSchema = z
  .object({
    thread: SearchThreadSchema,
    turn: SearchTurnSchema,
  })
  .strict();

export const ListThreadsResponseSchema = z
  .object({
    threads: z.array(SearchThreadSchema),
  })
  .strict();

export const GetThreadResponseSchema = z
  .object({
    thread: SearchThreadSchema,
  })
  .strict();

export const ListDatasourcesResponseSchema = z
  .object({
    datasources: z.array(DatasourceSchema),
  })
  .strict();

export const ApiErrorSchema = z
  .object({
    code: z.string().trim().min(1),
    message: z.string().trim().min(1),
  })
  .strict();

export const SearchStreamEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("thread"),
      thread: SearchThreadSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("turn.started"),
      turn: SearchTurnSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("turn.answer.delta"),
      turnId: z.string().trim().min(1),
      delta: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal("turn.source"),
      turnId: z.string().trim().min(1),
      source: SearchSourceSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("turn.completed"),
      thread: SearchThreadSchema,
      turn: SearchTurnSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("error"),
      error: ApiErrorSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("done"),
      thread: SearchThreadSchema,
      turn: SearchTurnSchema,
    })
    .strict(),
]);

export type SearchSourceCategory = z.infer<typeof SearchSourceCategorySchema>;
export type SearchTurnStatus = z.infer<typeof SearchTurnStatusSchema>;
export type DataCredentialMode = z.infer<typeof DataCredentialModeSchema>;
export type StreamEventType = z.infer<typeof StreamEventTypeSchema>;
export type DatasourceId = z.infer<typeof DatasourceIdSchema>;
export type Datasource = z.infer<typeof DatasourceSchema>;
export type SearchSource = z.infer<typeof SearchSourceSchema>;
export type SearchCitation = z.infer<typeof SearchCitationSchema>;
export type SearchAnswerBlock = z.infer<typeof SearchAnswerBlockSchema>;
export type SearchTurn = z.infer<typeof SearchTurnSchema>;
export type SearchThread = z.infer<typeof SearchThreadSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type FollowUpRequest = z.infer<typeof FollowUpRequestSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type ListThreadsResponse = z.infer<typeof ListThreadsResponseSchema>;
export type GetThreadResponse = z.infer<typeof GetThreadResponseSchema>;
export type ListDatasourcesResponse = z.infer<typeof ListDatasourcesResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type SearchStreamEvent = z.infer<typeof SearchStreamEventSchema>;

export function toJsonSchema(name: string, schema: z.ZodTypeAny) {
  return zodToJsonSchema(schema, name);
}

export const searchResponseJsonSchema = () =>
  toJsonSchema("OpenSearchSearchResponse", SearchResponseSchema);

export const streamEventJsonSchema = () =>
  toJsonSchema("OpenSearchSearchStreamEvent", SearchStreamEventSchema);
