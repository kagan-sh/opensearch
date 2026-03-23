import { createStore } from 'jotai';
import { describe, expect, it, vi } from 'vitest';
import type { SearchClient } from '@/lib/atoms/search';
import {
  activeThreadIdAtom,
  activeThreadAtom,
  bootstrapSearchAtom,
  composerDraftAtom,
  composerModeAtom,
  createBlankThreadAtom,
  datasourcesAtom,
  followUpsAtom,
  searchClientAtom,
  selectedDatasourceIdsAtom,
  sourceCitationsAtom,
  stageFollowUpAtom,
  submitSearchAtom,
  threadsAtom,
} from '@/lib/atoms/search';
import { buildThread, buildTurn, datasourceFixtures, streamEvents } from '@/test/fixtures/search';

describe('search atoms', () => {
  it('bootstraps datasources and thread history from the shared client', async () => {
    const store = createStore();
    const client = createClient({
      listDatasources: vi.fn().mockResolvedValue({ datasources: datasourceFixtures }),
      listThreads: vi.fn().mockResolvedValue({ threads: [buildThread()] }),
    });

    store.set(searchClientAtom, client);
    await store.set(bootstrapSearchAtom);

    expect(client.listDatasources).toHaveBeenCalledOnce();
    expect(client.listThreads).toHaveBeenCalledOnce();
    expect(store.get(selectedDatasourceIdsAtom)).toEqual(['session-history', 'grep-app-code']);
    expect(store.get(activeThreadAtom)?.title).toBe('Shared stack rollout');
  });

  it('resets to a fresh search instead of keeping a local mock thread', () => {
    const store = createStore();

    store.set(threadsAtom, [buildThread()]);
    store.set(composerDraftAtom, 'stale');
    store.set(createBlankThreadAtom);

    expect(store.get(activeThreadAtom)).toBeNull();
    expect(store.get(composerDraftAtom)).toBe('');
    expect(store.get(composerModeAtom)).toBe('search');
  });

  it('streams a follow-up turn and applies the completed shared thread model', async () => {
    const store = createStore();
    const existingThread = buildThread();
    const startedTurn = buildTurn({
      id: 'turn-2',
      parentTurnId: 'turn-1',
      query: 'What should we verify next?',
      status: 'streaming',
      answerText: '',
      answerBlocks: [],
      citations: [],
      sources: [],
      followUps: [],
      completedAt: undefined,
      createdAt: '2026-03-23T00:01:00.000Z',
      updatedAt: '2026-03-23T00:01:00.000Z',
    });
    const completedTurn = buildTurn({
      ...startedTurn,
      status: 'completed',
      answerText: 'Verify SSE transport and datasource visibility.',
      answerBlocks: [{ type: 'text', text: 'Verify SSE transport and datasource visibility.' }],
      citations: [
        {
          sourceId: 'source-2',
          title: 'Source rail',
          url: 'https://example.com/source-rail',
          snippet: 'Datasource scope should be visible.',
        },
      ],
      sources: [
        {
          id: 'source-2',
          datasourceId: 'grep-app-code',
          category: 'code',
          title: 'Source rail',
          url: 'https://example.com/source-rail',
          snippet: 'Datasource scope should be visible.',
          score: 0.8,
          metadata: {},
        },
      ],
      followUps: ['Should we test thread hydration too?'],
      updatedAt: '2026-03-23T00:01:05.000Z',
      completedAt: '2026-03-23T00:01:05.000Z',
    });
    const completedThread = buildThread({
      turns: [existingThread.turns[0]!, completedTurn],
      updatedAt: '2026-03-23T00:01:05.000Z',
    });
    const client = createClient({
      streamFollowUp: vi.fn().mockReturnValue(streamEvents([
        { type: 'thread', thread: buildThread({ turns: [existingThread.turns[0]!, startedTurn], updatedAt: startedTurn.updatedAt }) },
        { type: 'turn.started', turn: startedTurn },
        { type: 'turn.source', turnId: startedTurn.id, source: completedTurn.sources[0]! },
        { type: 'turn.answer.delta', turnId: startedTurn.id, delta: 'Verify SSE transport' },
        { type: 'turn.answer.delta', turnId: startedTurn.id, delta: 'and datasource visibility.' },
        { type: 'done', thread: completedThread, turn: completedTurn },
      ])),
    });

    store.set(searchClientAtom, client);
    store.set(datasourcesAtom, datasourceFixtures);
    store.set(threadsAtom, [existingThread]);
    store.set(activeThreadIdAtom, existingThread.id);
    store.set(selectedDatasourceIdsAtom, ['grep-app-code']);
    store.set(composerModeAtom, 'follow-up');
    store.set(composerDraftAtom, 'What should we verify next?');
    await store.set(submitSearchAtom);

    expect(client.streamFollowUp).toHaveBeenCalledWith('thread-1', {
      query: 'What should we verify next?',
      datasourceIds: ['grep-app-code'],
      maxSources: 8,
      parentTurnId: 'turn-1',
    });
    expect(store.get(sourceCitationsAtom).map((source) => source.datasourceId)).toEqual(['grep-app-code']);
    expect(store.get(followUpsAtom)).toEqual(['Should we test thread hydration too?']);
    expect(store.get(activeThreadAtom)?.turns.at(-1)?.answerText).toContain('Verify SSE transport and datasource visibility.');
  });

  it('stages follow-up prompts without firing a request', () => {
    const store = createStore();

    store.set(stageFollowUpAtom, 'Compare the tradeoffs');

    expect(store.get(composerDraftAtom)).toBe('Compare the tradeoffs');
    expect(store.get(composerModeAtom)).toBe('follow-up');
  });
});

function createClient(overrides: Partial<SearchClient>): SearchClient {
  return {
    listDatasources: vi.fn().mockResolvedValue({ datasources: [] }),
    listThreads: vi.fn().mockResolvedValue({ threads: [] }),
    getThread: vi.fn(),
    search: vi.fn(),
    followUp: vi.fn(),
    streamSearch: vi.fn(),
    streamFollowUp: vi.fn(),
    ...overrides,
  } as SearchClient;
}
