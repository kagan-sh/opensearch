import type { Datasource, SearchStreamEvent, SearchThread, SearchTurn } from '@opensearch/contracts';

export const datasourceFixtures: Datasource[] = [
  {
    id: 'session-history',
    label: 'Session history',
    description: 'Private assistant memory',
    category: 'session',
    capabilities: ['search'],
    credentialMode: 'none',
    enabled: true,
  },
  {
    id: 'grep-app-code',
    label: 'App code',
    description: 'Repository source search',
    category: 'code',
    capabilities: ['search'],
    credentialMode: 'server',
    enabled: true,
  },
];

export function buildTurn(overrides: Partial<SearchTurn> = {}): SearchTurn {
  return {
    id: 'turn-1',
    query: 'What changed?',
    status: 'completed',
    answerText: 'Use the real shared stack.',
    answerBlocks: [{ type: 'text', text: 'Use the real shared stack.' }],
    citations: [
      {
        sourceId: 'source-1',
        title: 'Assistant memory',
        url: 'https://example.com/memory',
        snippet: 'Stored context for the assistant.',
      },
    ],
    sources: [
      {
        id: 'source-1',
        datasourceId: 'session-history',
        category: 'session',
        title: 'Assistant memory',
        url: 'https://example.com/memory',
        snippet: 'Stored context for the assistant.',
        score: 0.9,
        metadata: {},
      },
    ],
    followUps: ['What should we verify next?'],
    errors: [],
    createdAt: '2026-03-23T00:00:00.000Z',
    updatedAt: '2026-03-23T00:00:00.000Z',
    completedAt: '2026-03-23T00:00:01.000Z',
    ...overrides,
  };
}

export function buildThread(overrides: Partial<SearchThread> = {}): SearchThread {
  return {
    id: 'thread-1',
    title: 'Shared stack rollout',
    createdAt: '2026-03-23T00:00:00.000Z',
    updatedAt: '2026-03-23T00:00:01.000Z',
    turns: [buildTurn()],
    ...overrides,
  };
}

export async function* streamEvents(events: SearchStreamEvent[]) {
  for (const event of events) {
    yield event;
  }
}
