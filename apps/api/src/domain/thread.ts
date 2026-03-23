import {
  SearchThreadSchema,
  SearchTurnSchema,
  type SearchThread,
  type SearchTurn,
} from "@opensearch/contracts";

export { type SearchThread, type SearchTurn };

export function parseThread(value: unknown) {
  return SearchThreadSchema.parse(value);
}

export function parseTurn(value: unknown) {
  return SearchTurnSchema.parse(value);
}

export function createThreadTitle(query: string) {
  return query.trim().slice(0, 80) || "Untitled thread";
}
