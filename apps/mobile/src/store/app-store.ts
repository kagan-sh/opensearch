import { atom } from "jotai";

import type { SearchSource } from "@opensearch/contracts";

import {
  createMobileSearchClient,
  type Datasource,
  type SearchClient,
  type SearchThread,
  type SearchTurn,
} from "../lib/opensearch-client";

export type SearchPreferences = {
  selectedDatasourceIds: string[];
  hapticsEnabled: boolean;
  compactSources: boolean;
};

type AsyncStatus = {
  state: "idle" | "loading" | "ready" | "error";
  message?: string;
};

type SourceSheetState = {
  visible: boolean;
  title: string;
  sources: SearchSource[];
};

const defaultPreferences: SearchPreferences = {
  selectedDatasourceIds: [],
  hapticsEnabled: true,
  compactSources: false,
};

const MAX_SOURCES = 8;

const defaultSearchClient = createMobileSearchClient();

export const searchClientAtom = atom(defaultSearchClient as SearchClient);
export const queryDraftAtom = atom("");
export const preferencesAtom = atom(defaultPreferences as SearchPreferences);
export const datasourcesAtom = atom([] as Datasource[]);
export const activeThreadIdAtom = atom(null as string | null);
export const threadsAtom = atom([] as SearchThread[]);
export const bootstrapStatusAtom = atom({ state: "idle" } as AsyncStatus);
export const searchStatusAtom = atom({ state: "idle" } as AsyncStatus);
export const threadStatusAtom = atom({ state: "idle" } as AsyncStatus);
export const sourceSheetAtom = atom({ visible: false, title: "Sources", sources: [] } as SourceSheetState);

export const enabledDatasourcesAtom = atom((get: any) =>
  (get(datasourcesAtom) as Datasource[]).filter((datasource) => datasource.enabled),
);

export const orderedThreadsAtom = atom((get: any) => get(threadsAtom) as SearchThread[]);

export const activeThreadAtom = atom((get: any) => {
  const activeThreadId = get(activeThreadIdAtom);
  if (!activeThreadId) {
    return null;
  }

  return (get(threadsAtom) as SearchThread[]).find((thread) => thread.id === activeThreadId) ?? null;
});

export const activeTurnAtom = atom((get: any) => {
  const thread = get(activeThreadAtom);
  return thread?.turns.at(-1) ?? null;
});

export const upsertThreadAtom = atom(null, (get: any, set: any, thread: SearchThread) => {
  const threads = get(threadsAtom) as SearchThread[];
  set(threadsAtom, sortThreads([thread, ...threads.filter((entry) => entry.id !== thread.id)]));
  set(activeThreadIdAtom, thread.id);
});

export const updatePreferenceAtom = atom(
  null,
  (get: any, set: any, update: { key: keyof SearchPreferences; value: SearchPreferences[keyof SearchPreferences] }) => {
    set(preferencesAtom, {
      ...get(preferencesAtom),
      [update.key]: update.value,
    });
  },
);

export const openSourcesAtom = atom(
  null,
  (_get: any, set: any, payload: { title: string; sources: SearchSource[] }) => {
    set(sourceSheetAtom, { visible: true, title: payload.title, sources: payload.sources });
  },
);

export const closeSourcesAtom = atom(null, (_get: any, set: any) => {
  set(sourceSheetAtom, { visible: false, title: "Sources", sources: [] });
});

export const bootstrapAppAtom = atom(null, async (get: any, set: any) => {
  set(bootstrapStatusAtom, { state: "loading" });
  try {
    const client = get(searchClientAtom) as SearchClient;
    const [{ datasources }, { threads }] = await Promise.all([client.listDatasources(), client.listThreads()]);
    const enabledIds = datasources.filter((datasource) => datasource.enabled).map((datasource) => datasource.id);
    const selectedIds = (get(preferencesAtom) as SearchPreferences).selectedDatasourceIds.filter((id) => enabledIds.includes(id));

    set(datasourcesAtom, datasources);
    set(threadsAtom, sortThreads(threads));
    set(preferencesAtom, {
      ...(get(preferencesAtom) as SearchPreferences),
      selectedDatasourceIds: selectedIds.length > 0 ? selectedIds : enabledIds,
    });
    set(bootstrapStatusAtom, { state: "ready" });
  } catch (error) {
    set(bootstrapStatusAtom, { state: "error", message: toErrorMessage(error, "Unable to load search workspace.") });
  }
});

export const toggleDatasourceAtom = atom(null, (get: any, set: any, datasourceId: string) => {
  const enabledIds = (get(enabledDatasourcesAtom) as Datasource[]).map((datasource) => datasource.id);
  if (!enabledIds.includes(datasourceId)) {
    return;
  }

  const selectedIds = (get(preferencesAtom) as SearchPreferences).selectedDatasourceIds;
  const isSelected = selectedIds.includes(datasourceId);

  if (isSelected && selectedIds.length === 1) {
    return;
  }

  set(updatePreferenceAtom, {
    key: "selectedDatasourceIds",
    value: isSelected ? selectedIds.filter((id) => id !== datasourceId) : [...selectedIds, datasourceId],
  });
});

export const stageFollowUpAtom = atom(null, (_get: any, set: any, query: string) => {
  set(queryDraftAtom, query);
});

export const runSearchAtom = atom(null, async (get: any, set: any, nextQuery?: string) => {
  const query = (nextQuery ?? get(queryDraftAtom)).trim();
  if (!query || get(searchStatusAtom).state === "loading") {
    return null;
  }

  set(searchStatusAtom, { state: "loading" });
  try {
    const client = get(searchClientAtom) as SearchClient;
    const datasourceIds = resolveDatasourceIds(get);
    const { thread } = await client.search({ query, datasourceIds, maxSources: MAX_SOURCES });

    set(searchStatusAtom, { state: "ready" });
    set(queryDraftAtom, "");
    set(upsertThreadAtom, thread);
    return thread.id;
  } catch (error) {
    set(searchStatusAtom, { state: "error", message: toErrorMessage(error, "Search failed.") });
    return null;
  }
});

export const hydrateThreadAtom = atom(null, async (get: any, set: any, threadId: string) => {
  const existingThread = (get(threadsAtom) as SearchThread[]).find((thread) => thread.id === threadId);
  if (existingThread?.turns.length) {
    set(activeThreadIdAtom, threadId);
    return;
  }

  set(threadStatusAtom, { state: "loading" });
  try {
    const client = get(searchClientAtom) as SearchClient;
    const { thread } = await client.getThread(threadId);
    set(upsertThreadAtom, thread);
    set(threadStatusAtom, { state: "ready" });
  } catch (error) {
    set(threadStatusAtom, { state: "error", message: toErrorMessage(error, "Unable to load thread.") });
  }
});

export const runFollowUpAtom = atom(null, async (get: any, set: any, payload: { threadId: string; query?: string }) => {
  const query = (payload.query ?? get(queryDraftAtom)).trim();
  if (!query || get(threadStatusAtom).state === "loading") {
    return;
  }

  set(threadStatusAtom, { state: "loading" });
  try {
    const client = get(searchClientAtom) as SearchClient;
    const activeTurn = get(activeTurnAtom) as SearchTurn | null;
    const datasourceIds = resolveDatasourceIds(get);

    const { thread } = await client.followUp(payload.threadId, {
      query,
      datasourceIds,
      maxSources: MAX_SOURCES,
      parentTurnId: activeTurn?.id,
    });

    set(threadStatusAtom, { state: "ready" });
    set(queryDraftAtom, "");
    set(upsertThreadAtom, thread);
  } catch (error) {
    set(threadStatusAtom, { state: "error", message: toErrorMessage(error, "Follow-up failed.") });
  }
});

function resolveDatasourceIds(get: any) {
  const enabledIds = (get(enabledDatasourcesAtom) as Datasource[]).map((datasource) => datasource.id);
  const selectedIds = (get(preferencesAtom) as SearchPreferences).selectedDatasourceIds.filter((id) => enabledIds.includes(id));
  return selectedIds.length > 0 ? selectedIds : enabledIds;
}

function sortThreads(threads: SearchThread[]) {
  return [...threads].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
