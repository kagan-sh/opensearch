import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createSearchCore } from '@opensearch/core';
import { createFakeRegistry, fixtureSource } from '@opensearch/testkit';
import { ThreadService } from '../src/application/thread-service.js';
import { JsonThreadStore } from '../src/infrastructure/json-thread-store.js';
import { createApiServer } from '../src/transport/http-server.js';

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

const boot = async () => {
  const directory = await mkdtemp(join(tmpdir(), 'opensearch-api-'));
  cleanupPaths.push(directory);

  const core = createSearchCore({
    registry: createFakeRegistry([
      {
        datasourceId: 'session-history',
        results: [
          fixtureSource({
            id: 'session-1',
            datasourceId: 'session-history',
            category: 'session',
            title: 'Existing context',
            snippet: 'Prior turn context lives on the server.',
            score: 0.8,
          }),
        ],
      },
      {
        datasourceId: 'grep-app-code',
        results: [
          fixtureSource({
            id: 'code-1',
            datasourceId: 'grep-app-code',
            category: 'code',
            title: 'apps/api/src/transport/http-server.ts',
            snippet: 'API serves typed JSON and SSE responses.',
            score: 0.76,
          }),
        ],
      },
    ]),
    now: () => new Date('2026-03-23T00:00:00.000Z'),
    makeId: (() => {
      let index = 0;
      return () => `fixed_${++index}`;
    })(),
  });

  const service = new ThreadService(new JsonThreadStore(join(directory, 'threads.json')), core);
  const server = createApiServer(service);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Missing address');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    directory,
  };
};

describe('@opensearch/api', () => {
  it('lists health and server-side datasources', async () => {
    const app = await boot();

    try {
      const health = await fetch(`${app.baseUrl}/health`);
      expect(health.status).toBe(200);
      expect(await health.json()).toEqual({ ok: true });

      const datasources = await fetch(`${app.baseUrl}/datasources`);
      const body = (await datasources.json()) as { datasources: Array<{ id: string; credentialMode: string }> };
      expect(body.datasources.map((entry) => entry.id)).toEqual(['session-history', 'grep-app-code']);
      expect(body.datasources[0]?.credentialMode).toBe('none');
    } finally {
      await app.close();
    }
  });

  it('creates, persists, lists, and fetches shared threads over JSON', async () => {
    const app = await boot();

    try {
      const createResponse = await fetch(`${app.baseUrl}/threads/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: 'How does the API expose typed search?',
          datasourceIds: ['session-history', 'grep-app-code'],
        }),
      });

      expect(createResponse.status).toBe(200);
      const created = (await createResponse.json()) as {
        thread: { id: string; turns: Array<{ query: string; status: string }> };
        turn: { status: string; sources: Array<{ datasourceId: string }> };
      };
      expect(created.thread.id).toBe('fixed_1');
      expect(created.thread.turns[0]?.query).toBe('How does the API expose typed search?');
      expect(created.turn.status).toBe('completed');
      expect(created.turn.sources.map((source) => source.datasourceId)).toEqual(['session-history', 'grep-app-code']);

      const listResponse = await fetch(`${app.baseUrl}/threads`);
      const list = (await listResponse.json()) as { threads: Array<{ id: string; turns: unknown[] }> };
      expect(list.threads).toHaveLength(1);
      expect(list.threads[0]?.id).toBe('fixed_1');
      expect(list.threads[0]?.turns).toHaveLength(1);

      const getResponse = await fetch(`${app.baseUrl}/threads/fixed_1`);
      const fetched = (await getResponse.json()) as { thread: { turns: Array<{ answerText: string }> } };
      expect(fetched.thread.turns[0]?.answerText).toContain('Prior turn context lives on the server.');
    } finally {
      await app.close();
    }

    const restarted = await bootFromDirectory(app.directory);

    try {
      const persistedResponse = await fetch(`${restarted.baseUrl}/threads/fixed_1`);
      const persisted = (await persistedResponse.json()) as { thread: { id: string } };
      expect(persisted.thread.id).toBe('fixed_1');
    } finally {
      await restarted.close();
    }
  });

  it('supports follow-ups and SSE with the same wire model', async () => {
    const app = await boot();

    try {
      await fetch(`${app.baseUrl}/threads/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'Seed thread', datasourceIds: ['grep-app-code'] }),
      });

      const response = await fetch(`${app.baseUrl}/threads/fixed_1/follow-ups`, {
        method: 'POST',
        headers: {
          accept: 'text/event-stream',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: 'What is the streaming shape?',
          parentTurnId: 'fixed_2',
          datasourceIds: ['session-history'],
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      const body = await readStream(response);
      expect(body).toContain('event: thread');
      expect(body).toContain('event: turn.started');
      expect(body).toContain('event: turn.source');
      expect(body).toContain('event: turn.answer.delta');
      expect(body).toContain('event: turn.completed');
      expect(body).toContain('event: done');
      expect(body).toContain('parentTurnId');
    } finally {
      await app.close();
    }
  });
});

const bootFromDirectory = async (directory: string) => {
  const core = createSearchCore({
    registry: createFakeRegistry([
      {
        datasourceId: 'session-history',
        results: [fixtureSource({ id: 'session-1', datasourceId: 'session-history', category: 'session' })],
      },
    ]),
    now: () => new Date('2026-03-23T00:00:00.000Z'),
    makeId: (() => {
      let index = 100;
      return () => `fixed_${++index}`;
    })(),
  });

  const service = new ThreadService(new JsonThreadStore(join(directory, 'threads.json')), core);
  const server = createApiServer(service);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Missing address');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
};

const readStream = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Missing response body');
  }

  let result = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += new TextDecoder().decode(value);
  }

  return result;
};
