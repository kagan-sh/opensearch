import type { Datasource, DatasourceId, SearchSource } from "@opensearch/contracts";
import {
  createDatasourceRegistry,
  type DatasourceRegistry,
  type DatasourceSearchResult,
} from "@opensearch/sources";

export function fixtureDatasource(input: Partial<Datasource> & { id: DatasourceId }): Datasource {
  return {
    id: input.id,
    label: input.label ?? input.id,
    description: input.description,
    category: input.category ?? "web",
    capabilities: input.capabilities ?? ["search"],
    credentialMode: input.credentialMode ?? "none",
    enabled: input.enabled ?? true,
  };
}

export function fixtureSource(
  input: Partial<SearchSource> & { id: string; datasourceId?: DatasourceId },
): SearchSource {
  return {
    id: input.id,
    datasourceId: input.datasourceId ?? "fixture-web",
    category: input.category ?? "web",
    title: input.title ?? `Source ${input.id}`,
    url: input.url,
    snippet: input.snippet ?? "Fixture snippet.",
    content: input.content,
    score: input.score ?? 0.75,
    metadata: input.metadata ?? {},
  };
}

export function createFakeRegistry(results: DatasourceSearchResult[]): DatasourceRegistry {
  const registry = createDatasourceRegistry();

  for (const result of results) {
    registry.register({
      descriptor: fixtureDatasource({ id: result.datasourceId, category: result.results[0]?.category ?? "web" }),
      async search() {
        return result;
      },
    });
  }

  return registry;
}
