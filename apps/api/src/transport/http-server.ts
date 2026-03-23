import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import {
  ApiErrorSchema,
  FollowUpRequestSchema,
  GetThreadResponseSchema,
  ListDatasourcesResponseSchema,
  ListThreadsResponseSchema,
  SearchRequestSchema,
  SearchResponseSchema,
  type SearchStreamEvent,
} from '@opensearch/contracts';
import { ThreadNotFoundError } from '../application/thread-service.js';
import type { ThreadServicePort } from '../application/ports.js';

const json = (response: ServerResponse, statusCode: number, body: unknown) => {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(body)}\n`);
};

const sse = (response: ServerResponse) => {
  response.writeHead(200, {
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'content-type': 'text/event-stream; charset=utf-8',
  });
};

const writeEvent = (response: ServerResponse, event: SearchStreamEvent) => {
  response.write(`event: ${event.type}\n`);
  response.write(`data: ${JSON.stringify(event)}\n\n`);
};

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function writeApiError(response: ServerResponse, statusCode: number, code: string, message: string) {
  json(response, statusCode, ApiErrorSchema.parse({ code, message }));
}

export const createApiServer = (service: ThreadServicePort): Server =>
  createServer(async (request, response) => {
    try {
      const method = request.method ?? 'GET';
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const threadMatch = url.pathname.match(/^\/threads\/([^/]+)$/);
      const followUpMatch = url.pathname.match(/^\/threads\/([^/]+)\/follow-ups$/);
      const wantsSse = request.headers.accept?.includes('text/event-stream');

      if (method === 'GET' && url.pathname === '/health') {
        json(response, 200, { ok: true });
        return;
      }

      if (method === 'GET' && url.pathname === '/datasources') {
        json(
          response,
          200,
          ListDatasourcesResponseSchema.parse({ datasources: await service.listDatasources() }),
        );
        return;
      }

      if (method === 'GET' && url.pathname === '/threads') {
        json(response, 200, ListThreadsResponseSchema.parse({ threads: await service.listThreads() }));
        return;
      }

      if (method === 'GET' && threadMatch) {
        const thread = await service.getThread(threadMatch[1] ?? '');
        if (!thread) {
          writeApiError(response, 404, 'thread_not_found', 'Thread not found.');
          return;
        }

        json(response, 200, GetThreadResponseSchema.parse({ thread }));
        return;
      }

      if (method === 'POST' && url.pathname === '/threads/search') {
        const body = SearchRequestSchema.parse(await readJsonBody(request));
        if (wantsSse) {
          sse(response);
          for await (const event of service.streamSearch(body)) {
            writeEvent(response, event);
          }
          response.end();
          return;
        }

        json(response, 200, SearchResponseSchema.parse(await service.search(body)));
        return;
      }

      if (method === 'POST' && followUpMatch) {
        const threadId = followUpMatch[1] ?? '';
        const body = FollowUpRequestSchema.parse(await readJsonBody(request));

        if (wantsSse) {
          sse(response);
          for await (const event of service.streamFollowUp(threadId, body)) {
            writeEvent(response, event);
          }
          response.end();
          return;
        }

        json(response, 200, SearchResponseSchema.parse(await service.followUp(threadId, body)));
        return;
      }

      writeApiError(response, 404, 'not_found', 'Route not found.');
    } catch (error) {
      if (error instanceof ThreadNotFoundError) {
        writeApiError(response, 404, 'thread_not_found', error.message);
        return;
      }

      if (error instanceof Error && error.name === 'ZodError') {
        writeApiError(response, 400, 'invalid_request', error.message);
        return;
      }

      writeApiError(
        response,
        500,
        'internal_error',
        error instanceof Error ? error.message : 'Internal server error.',
      );
    }
  });
