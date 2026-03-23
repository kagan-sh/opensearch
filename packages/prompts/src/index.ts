import type { SearchSource } from "@opensearch/contracts";

export const SEARCH_SYNTHESIS_SYSTEM_PROMPT = [
  "You synthesize evidence-backed search answers.",
  "Answer directly and stay laconic.",
  "Only use facts grounded in the supplied evidence.",
  "Prefer explicit uncertainty over speculation.",
  "Keep citations tied to source ids.",
].join("\n");

export function renderEvidenceDigest(sources: SearchSource[]) {
  return sources
    .map((source, index) => {
      const lines = [
        `${index + 1}. [${source.category}] ${source.title}`,
        `source_id: ${source.id}`,
        `score: ${source.score.toFixed(2)}`,
      ];
      if (source.url) lines.push(`url: ${source.url}`);
      if (source.snippet) lines.push(`snippet: ${source.snippet}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function buildSynthesisPrompt(input: {
  query: string;
  sources: SearchSource[];
  priorAnswer?: string;
}) {
  const parts = [SEARCH_SYNTHESIS_SYSTEM_PROMPT, `Query:\n${input.query}`];
  if (input.priorAnswer) parts.push(`Prior answer:\n${input.priorAnswer}`);
  parts.push(`Evidence:\n${renderEvidenceDigest(input.sources)}`);
  return parts.join("\n\n");
}
