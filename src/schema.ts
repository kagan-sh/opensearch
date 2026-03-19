import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SourceSchema = z
  .object({
    id: z.string(),
    type: z.enum(["session", "web", "code"]),
    url: z.string().optional(),
    title: z.string(),
    snippet: z.string(),
    relevance: z.number().min(0).max(1),
    timestamp: z.number().optional(),
  })
  .strict();

export const EvidenceSchema = z
  .object({
    claim: z.string(),
    sources: z.array(z.string()),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();

export const ResultSchema = z
  .object({
    answer: z.string(),
    confidence: z.enum(["high", "medium", "low", "none"]),
    evidence: z.array(EvidenceSchema),
    sources: z.array(SourceSchema),
    followups: z.array(z.string()),
    meta: z
      .object({
        query: z.string(),
        duration: z.number(),
        sources_queried: z.number(),
        sources_yielded: z.number(),
      })
      .strict(),
  })
  .strict();

export const RawResultSchema = z
  .object({
    id: z.string(),
    type: z.enum(["session", "web", "code"]),
    title: z.string(),
    snippet: z.string(),
    url: z.string().optional(),
    relevance: z.number(),
    timestamp: z.number().optional(),
  })
  .strict();

export const ConfigSchema = z
  .object({
    sources: z
      .object({
        session: z.boolean(),
        web: z
          .object({
            enabled: z.boolean(),
            key: z.string().optional(),
          })
          .strict(),
        code: z.boolean(),
      })
      .strict(),
    depth: z.enum(["quick", "thorough"]),
    synth: z.boolean(),
  })
  .strict();

export type Source = z.infer<typeof SourceSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type RawResult = z.infer<typeof RawResultSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export function resultJsonSchema() {
  return zodToJsonSchema(ResultSchema, "OpensearchResult");
}
