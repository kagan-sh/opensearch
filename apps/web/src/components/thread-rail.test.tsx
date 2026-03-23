import { createStore } from 'jotai';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SearchClient } from '@/lib/atoms/search';
import { ThreadRail } from '@/components/thread-rail';
import { activeThreadAtom, searchClientAtom, threadsAtom } from '@/lib/atoms/search';
import { renderWithProviders } from '@/test/render';
import { buildThread } from '@/test/fixtures/search';

describe('ThreadRail', () => {
  it('hydrates the selected thread from the shared API client', async () => {
    const user = userEvent.setup();
    const thread = buildThread({ id: 'thread-browser', title: 'Browser AI runtimes' });
    const refreshedThread = buildThread({
      ...thread,
      title: 'Browser AI runtimes',
      turns: [
        {
          ...thread.turns[0]!,
          answerText: 'Hydrated from getThread.',
          answerBlocks: [{ type: 'text', text: 'Hydrated from getThread.' }],
        },
      ],
    });
    const client = createClient({
      getThread: vi.fn().mockResolvedValue({ thread: refreshedThread }),
    });
    const store = createStore();
    store.set(searchClientAtom, client);
    store.set(threadsAtom, [thread]);
    renderWithProviders(<ThreadRail />, { store });

    await user.click(screen.getByRole('button', { name: /browser ai runtimes/i }));

    await waitFor(() => {
      expect(client.getThread).toHaveBeenCalledWith('thread-browser');
      expect(store.get(activeThreadAtom)?.turns[0]?.answerText).toBe('Hydrated from getThread.');
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
