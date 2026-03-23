import { atom, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { createOpenSearchClient } from '@opensearch/sdk';
import type {
  Datasource,
  SearchCitation,
  SearchSource,
  SearchThread,
  SearchTurn,
} from '@opensearch/contracts';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3001';
const DEFAULT_MAX_SOURCES = 8;

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_OPENSEARCH_API_URL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
}

export type SearchClient = ReturnType<typeof createOpenSearchClient>;

export const searchClientAtom = atom<SearchClient>(
  createOpenSearchClient({ baseUrl: resolveApiBaseUrl() }),
);
export const datasourcesAtom = atom<Datasource[]>([]);
export const selectedDatasourceIdsAtom = atom<string[]>([]);
export const threadsAtom = atom<SearchThread[]>([]);
export const activeThreadIdAtom = atom<string | null>(null);
export const composerDraftAtom = atom('');
export const composerModeAtom = atom<'search' | 'follow-up'>('search');
export const isStreamingAtom = atom(false);
export const isBootstrappingAtom = atom(false);
export const lastErrorAtom = atom<string | null>(null);
export const highlightedSourceIdAtom = atom<string | null>(null);
export const leftRailOpenAtom = atom(false);
export const sourceRailOpenAtom = atom(false);

export const enabledDatasourcesAtom = atom((get) => get(datasourcesAtom).filter((datasource) => datasource.enabled));

export const activeThreadAtom = atom<SearchThread | null>((get) => {
  const activeId = get(activeThreadIdAtom);
  return get(threadsAtom).find((thread) => thread.id === activeId) ?? null;
});

export const activeTurnAtom = atom<SearchTurn | null>((get) => {
  const thread = get(activeThreadAtom);
  return thread?.turns.at(-1) ?? null;
});

export const followUpsAtom = atom<string[]>((get) => get(activeTurnAtom)?.followUps ?? []);

export const sourceCitationsAtom = atom<SearchSource[]>((get) => {
  const activeTurn = get(activeTurnAtom);
  const selectedIds = new Set(get(selectedDatasourceIdsAtom));

  if (!activeTurn) {
    return [];
  }

  if (selectedIds.size === 0) {
    return activeTurn.sources;
  }

  return activeTurn.sources.filter((source) => selectedIds.has(source.datasourceId));
});

export const visibleCitationsAtom = atom<SearchCitation[]>((get) => {
  const activeTurn = get(activeTurnAtom);
  const visibleSources = new Set(get(sourceCitationsAtom).map((source) => source.id));
  return activeTurn?.citations.filter((citation) => visibleSources.has(citation.sourceId)) ?? [];
});

export const bootstrapSearchAtom = atom(null, async (get, set) => {
  const client = get(searchClientAtom);

  set(isBootstrappingAtom, true);
  set(lastErrorAtom, null);

  try {
    const [{ datasources }, { threads }] = await Promise.all([client.listDatasources(), client.listThreads()]);
    const enabledIds = datasources.filter((datasource) => datasource.enabled).map((datasource) => datasource.id);
    const currentSelection = get(selectedDatasourceIdsAtom);
    const nextSelection = currentSelection.filter((id) => enabledIds.includes(id));

    set(datasourcesAtom, datasources);
    set(selectedDatasourceIdsAtom, nextSelection.length > 0 ? nextSelection : enabledIds);
    set(threadsAtom, sortThreads(threads));

    const activeId = get(activeThreadIdAtom);
    const resolvedActiveId = activeId && threads.some((thread) => thread.id === activeId)
      ? activeId
      : threads[0]?.id ?? null;

    set(activeThreadIdAtom, resolvedActiveId);
    set(composerModeAtom, resolvedActiveId ? 'follow-up' : 'search');
  } catch (error) {
    set(lastErrorAtom, toErrorMessage(error));
  } finally {
    set(isBootstrappingAtom, false);
  }
});

export const selectThreadAtom = atom(null, async (get, set, threadId: string) => {
  const client = get(searchClientAtom);

  set(activeThreadIdAtom, threadId);
  set(leftRailOpenAtom, false);
  set(highlightedSourceIdAtom, null);
  set(lastErrorAtom, null);

  try {
    const { thread } = await client.getThread(threadId);
    set(threadsAtom, upsertThread(get(threadsAtom), thread));
    set(composerModeAtom, thread.turns.length > 0 ? 'follow-up' : 'search');
  } catch (error) {
    set(lastErrorAtom, toErrorMessage(error));
  }
});

export const createBlankThreadAtom = atom(null, (_get, set) => {
  set(activeThreadIdAtom, null);
  set(composerDraftAtom, '');
  set(composerModeAtom, 'search');
  set(highlightedSourceIdAtom, null);
  set(lastErrorAtom, null);
  set(leftRailOpenAtom, false);
});

export const stageFollowUpAtom = atom(null, (_get, set, prompt: string) => {
  set(composerDraftAtom, prompt);
  set(composerModeAtom, 'follow-up');
});

export const toggleDatasourceAtom = atom(null, (get, set, datasourceId: string) => {
  const enabledIds = get(enabledDatasourcesAtom).map((datasource) => datasource.id);
  if (!enabledIds.includes(datasourceId)) {
    return;
  }

  const selected = get(selectedDatasourceIdsAtom);
  const isSelected = selected.includes(datasourceId);

  if (isSelected && selected.length === 1) {
    return;
  }

  set(
    selectedDatasourceIdsAtom,
    isSelected ? selected.filter((id) => id !== datasourceId) : [...selected, datasourceId],
  );
});

export const setHighlightedSourceAtom = atom(null, (_get, set, sourceId: string | null) => {
  set(highlightedSourceIdAtom, sourceId);
});

export const submitSearchAtom = atom(null, async (get, set, rawQuery?: string) => {
  const query = (rawQuery ?? get(composerDraftAtom)).trim();
  if (!query || get(isStreamingAtom)) {
    return;
  }

  const client = get(searchClientAtom);
  const activeThread = get(activeThreadAtom);
  const activeTurn = get(activeTurnAtom);
  const enabledIds = get(enabledDatasourcesAtom).map((datasource) => datasource.id);
  const datasourceIds = get(selectedDatasourceIdsAtom).filter((id) => enabledIds.includes(id));
  const scopedDatasourceIds = datasourceIds.length > 0 ? datasourceIds : enabledIds;
  const isFollowUp = Boolean(activeThread?.id && activeThread.turns.length > 0 && get(composerModeAtom) === 'follow-up');

  set(isStreamingAtom, true);
  set(composerDraftAtom, '');
  set(composerModeAtom, 'follow-up');
  set(highlightedSourceIdAtom, null);
  set(lastErrorAtom, null);

  try {
    const stream = isFollowUp
      ? client.streamFollowUp(activeThread!.id, {
          query,
          datasourceIds: scopedDatasourceIds,
          maxSources: DEFAULT_MAX_SOURCES,
          parentTurnId: activeTurn?.id,
        })
      : client.streamSearch({
          query,
          datasourceIds: scopedDatasourceIds,
          maxSources: DEFAULT_MAX_SOURCES,
        });

    for await (const event of stream) {
      if (event.type === 'thread') {
        set(threadsAtom, upsertThread(get(threadsAtom), event.thread));
        set(activeThreadIdAtom, event.thread.id);
        continue;
      }

      if (event.type === 'turn.started') {
        set(threadsAtom, (threads) => threads.map((thread) => appendTurnIfMissing(thread, event.turn)));
        continue;
      }

      if (event.type === 'turn.source') {
        set(threadsAtom, (threads) => threads.map((thread) => appendSourceToTurn(thread, event.turnId, event.source)));
        continue;
      }

      if (event.type === 'turn.answer.delta') {
        set(threadsAtom, (threads) => threads.map((thread) => appendDeltaToTurn(thread, event.turnId, event.delta)));
        continue;
      }

      if (event.type === 'turn.completed' || event.type === 'done') {
        set(threadsAtom, upsertThread(get(threadsAtom), event.thread));
        set(activeThreadIdAtom, event.thread.id);
        continue;
      }

      if (event.type === 'error') {
        set(lastErrorAtom, `${event.error.code}: ${event.error.message}`);
      }
    }
  } catch (error) {
    set(lastErrorAtom, toErrorMessage(error));
  } finally {
    set(isStreamingAtom, false);
  }
});

export function useSearchBootstrap() {
  const bootstrap = useSetAtom(bootstrapSearchAtom);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
}

export function useSearchActions() {
  const setLeftRailOpen = useSetAtom(leftRailOpenAtom);
  const setSourceRailOpen = useSetAtom(sourceRailOpenAtom);
  const createBlankThread = useSetAtom(createBlankThreadAtom);
  const submitSearch = useSetAtom(submitSearchAtom);

  return useMemo(() => ({
    setLeftRailOpen,
    setSourceRailOpen,
    createBlankThread,
    submitSearch,
  }), [createBlankThread, setLeftRailOpen, setSourceRailOpen, submitSearch]);
}

function appendTurnIfMissing(thread: SearchThread, turn: SearchTurn) {
  if (!thread.turns.some((entry) => entry.id === turn.id)) {
    return {
      ...thread,
      updatedAt: turn.updatedAt,
      turns: [...thread.turns, turn],
    };
  }

  return thread;
}

function appendSourceToTurn(thread: SearchThread, turnId: string, source: SearchSource) {
  const turns = thread.turns.map((turn) => {
    if (turn.id !== turnId || turn.sources.some((entry) => entry.id === source.id)) {
      return turn;
    }

    return {
      ...turn,
      sources: [...turn.sources, source],
      updatedAt: thread.updatedAt,
    };
  });

  return turns === thread.turns ? thread : { ...thread, turns };
}

function appendDeltaToTurn(thread: SearchThread, turnId: string, delta: string) {
  const turns = thread.turns.map((turn) => {
    if (turn.id !== turnId) {
      return turn;
    }

    const answerText = joinDelta(turn.answerText, delta);

    return {
      ...turn,
      answerText,
      answerBlocks: answerText ? [{ type: 'text' as const, text: answerText }] : [],
      updatedAt: new Date().toISOString(),
    };
  });

  return turns === thread.turns ? thread : { ...thread, turns };
}

function joinDelta(answerText: string, delta: string) {
  return answerText ? `${answerText} ${delta}`.trim() : delta;
}

function sortThreads(threads: SearchThread[]) {
  return [...threads].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function upsertThread(threads: SearchThread[], thread: SearchThread) {
  return sortThreads([thread, ...threads.filter((entry) => entry.id !== thread.id)]);
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Search request failed.';
}
