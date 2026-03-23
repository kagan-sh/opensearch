import { createOpenSearchClient } from "@opensearch/sdk";
import type {
  Datasource,
  SearchSource,
  SearchThread,
  SearchTurn,
} from "@opensearch/contracts";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:3001";

type ProcessEnv = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function resolveApiBaseUrl() {
  const configured = (globalThis as ProcessEnv).process?.env?.EXPO_PUBLIC_OPENSEARCH_API_URL?.trim();
  if (configured && configured.length > 0) {
    return normalizeBaseUrl(configured);
  }

  return DEFAULT_API_BASE_URL;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export type SearchClient = ReturnType<typeof createOpenSearchClient>;
export type { Datasource, SearchSource, SearchThread, SearchTurn };
export const resolvedApiBaseUrl = resolveApiBaseUrl();

export function createMobileSearchClient() {
  return createOpenSearchClient({ baseUrl: resolvedApiBaseUrl });
}
