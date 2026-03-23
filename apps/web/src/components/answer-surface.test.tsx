import { createStore } from 'jotai';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerSurface } from '@/components/answer-surface';
import { activeThreadIdAtom, threadsAtom } from '@/lib/atoms/search';
import { renderWithProviders } from '@/test/render';
import { buildThread, buildTurn } from '@/test/fixtures/search';

describe('AnswerSurface', () => {
  it('renders structured answer blocks and evidence chips', () => {
    const store = createStore();
    const turn = buildTurn({
      answerBlocks: [
        { type: 'text', label: 'Answer', text: 'The API already returns typed search threads.' },
        {
          type: 'list',
          label: 'Evidence',
          items: [
            'apps/api/src/transport/http-server.ts: Serves typed JSON and SSE responses.',
            'example.com: Confirms the public contract is shared.',
          ],
        },
      ],
    });
    const thread = buildThread({ turns: [turn] });

    store.set(threadsAtom, [thread]);
    store.set(activeThreadIdAtom, thread.id);

    renderWithProviders(<AnswerSurface />, { store });

    expect(screen.getByText('Answer')).toBeTruthy();
    expect(screen.getByText('Evidence')).toBeTruthy();
    expect(screen.getByText('The API already returns typed search threads.')).toBeTruthy();
    expect(screen.getByText(/Serves typed JSON and SSE responses/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /assistant memory/i })).toBeTruthy();
  });
});
