import { createStore } from 'jotai';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SearchClient } from '@/lib/atoms/search';
import { SearchComposer } from '@/components/search-composer';
import {
  composerModeAtom,
  datasourcesAtom,
  searchClientAtom,
  selectedDatasourceIdsAtom,
  sourceCitationsAtom,
} from '@/lib/atoms/search';
import { renderWithProviders } from '@/test/render';
import { buildThread, buildTurn, datasourceFixtures, streamEvents } from '@/test/fixtures/search';

describe('SearchComposer', () => {
  it('submits a new scoped search and clears the textarea', async () => {
    const user = userEvent.setup();
    const startedTurn = buildTurn({
      id: 'turn-new',
      query: 'Why now?',
      status: 'streaming',
      answerText: '',
      answerBlocks: [],
      citations: [],
      sources: [],
      followUps: [],
      completedAt: undefined,
    });
    const completedTurn = buildTurn({
      ...startedTurn,
      status: 'completed',
      answerText: 'Because the real SDK now streams the answer.',
      answerBlocks: [{ type: 'text', text: 'Because the real SDK now streams the answer.' }],
      citations: [
        {
          sourceId: 'source-1',
          title: 'Assistant memory',
          url: 'https://example.com/memory',
          snippet: 'Stored context for the assistant.',
        },
      ],
      sources: [buildTurn().sources[0]!],
      followUps: ['What ships next?'],
    });
    const completedThread = buildThread({
      id: 'thread-new',
      title: 'Why now',
      turns: [completedTurn],
    });
    const client = createClient({
      streamSearch: vi.fn().mockReturnValue(streamEvents([
        { type: 'thread', thread: buildThread({ id: 'thread-new', title: 'Why now', turns: [startedTurn] }) },
        { type: 'turn.started', turn: startedTurn },
        { type: 'turn.answer.delta', turnId: startedTurn.id, delta: 'Because the real SDK now streams the answer.' },
        { type: 'done', thread: completedThread, turn: completedTurn },
      ])),
    });
    const store = createStore();
    store.set(searchClientAtom, client);
    store.set(datasourcesAtom, datasourceFixtures);
    store.set(selectedDatasourceIdsAtom, ['session-history', 'grep-app-code']);
    store.set(composerModeAtom, 'search');
    renderWithProviders(<SearchComposer />, { store });

    await user.click(screen.getByRole('button', { name: /app code/i }));

    const textarea = screen.getByLabelText('Search prompt');
    await user.type(textarea, 'Why now?');
    await user.click(screen.getByLabelText('Submit search'));

    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('');
      expect(store.get(sourceCitationsAtom)).toHaveLength(1);
    });

    expect(client.streamSearch).toHaveBeenCalledWith({
      query: 'Why now?',
      datasourceIds: ['session-history'],
      maxSources: 8,
    });
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
