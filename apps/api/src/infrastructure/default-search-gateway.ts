import { createSearchCore } from '@opensearch/core';
import {
  createDatasourceRegistry,
  createGrepAppDatasource,
  createSearxngDatasource,
  createThreadHistoryDatasource,
} from '@opensearch/sources';

export function createDefaultSearchCore() {
  const registry = createDatasourceRegistry([createThreadHistoryDatasource(), createGrepAppDatasource()]);

  if (process.env.SEARXNG_BASE_URL) {
    registry.register(createSearxngDatasource({ baseUrl: process.env.SEARXNG_BASE_URL }));
  }

  return createSearchCore({ registry });
}
