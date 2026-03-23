import {
  ApiErrorSchema,
  FollowUpRequestSchema,
  GetThreadResponseSchema,
  ListDatasourcesResponseSchema,
  ListThreadsResponseSchema,
  SearchRequestSchema,
  SearchResponseSchema,
  SearchStreamEventSchema,
  type FollowUpRequest,
  type GetThreadResponse,
  type ListDatasourcesResponse,
  type ListThreadsResponse,
  type SearchRequest,
  type SearchResponse,
  type SearchStreamEvent,
} from "@opensearch/contracts";
import { createParser, type EventSourceMessage } from "eventsource-parser";

type FetchLike = typeof fetch;

export type OpenSearchClientOptions = {
  baseUrl: string;
  fetch?: FetchLike;
  headers?: HeadersInit;
};

export function createOpenSearchClient(options: OpenSearchClientOptions) {
  const runFetch = options.fetch ?? fetch;

  return {
    listDatasources(init: RequestInit = {}) {
      return requestJson<ListDatasourcesResponse>(runFetch, options, "/datasources", {
        ...init,
        method: "GET",
      }, ListDatasourcesResponseSchema);
    },

    listThreads(init: RequestInit = {}) {
      return requestJson<ListThreadsResponse>(runFetch, options, "/threads", {
        ...init,
        method: "GET",
      }, ListThreadsResponseSchema);
    },

    getThread(threadId: string, init: RequestInit = {}) {
      return requestJson<GetThreadResponse>(runFetch, options, `/threads/${encodeURIComponent(threadId)}`, {
        ...init,
        method: "GET",
      }, GetThreadResponseSchema);
    },

    search(request: SearchRequest, init: RequestInit = {}) {
      const payload = SearchRequestSchema.parse(request);
      return requestJson<SearchResponse>(runFetch, options, "/threads/search", {
        ...init,
        method: "POST",
        headers: mergeHeaders(options.headers, init.headers, { "content-type": "application/json" }),
        body: JSON.stringify(payload),
      }, SearchResponseSchema);
    },

    followUp(threadId: string, request: FollowUpRequest, init: RequestInit = {}) {
      const payload = FollowUpRequestSchema.parse(request);
      return requestJson<SearchResponse>(
        runFetch,
        options,
        `/threads/${encodeURIComponent(threadId)}/follow-ups`,
        {
          ...init,
          method: "POST",
          headers: mergeHeaders(options.headers, init.headers, { "content-type": "application/json" }),
          body: JSON.stringify(payload),
        },
        SearchResponseSchema,
      );
    },

    streamSearch(request: SearchRequest, init: RequestInit = {}) {
      const payload = SearchRequestSchema.parse(request);
      return streamRequest(runFetch, options, "/threads/search", payload, init);
    },

    streamFollowUp(threadId: string, request: FollowUpRequest, init: RequestInit = {}) {
      const payload = FollowUpRequestSchema.parse(request);
      return streamRequest(
        runFetch,
        options,
        `/threads/${encodeURIComponent(threadId)}/follow-ups`,
        payload,
        init,
      );
    },
  };
}

async function requestJson<T>(
  runFetch: FetchLike,
  options: OpenSearchClientOptions,
  path: string,
  init: RequestInit,
  schema: { parse(value: unknown): T },
) {
  const response = await runFetch(new URL(path, options.baseUrl), init);
  if (!response.ok) throw await responseError(response);
  return schema.parse(await response.json());
}

async function* streamRequest(
  runFetch: FetchLike,
  options: OpenSearchClientOptions,
  path: string,
  payload: SearchRequest | FollowUpRequest,
  init: RequestInit,
): AsyncGenerator<SearchStreamEvent> {
  const response = await runFetch(new URL(path, options.baseUrl), {
    ...init,
    method: "POST",
    headers: mergeHeaders(options.headers, init.headers, {
      "content-type": "application/json",
      accept: "text/event-stream",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw await responseError(response);
  }

  const decoder = new TextDecoder();
  const queue: SearchStreamEvent[] = [];
  const parser = createParser({
    onEvent(event: EventSourceMessage) {
      if (!event.data) return;
      queue.push(SearchStreamEventSchema.parse(JSON.parse(event.data)));
    },
  });

  const reader = response.body.getReader();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      parser.reset();
      break;
    }

    parser.feed(decoder.decode(chunk.value, { stream: true }));
    while (queue.length > 0) {
      yield queue.shift()!;
    }
  }

  while (queue.length > 0) {
    yield queue.shift()!;
  }
}

async function responseError(response: Response) {
  try {
    const parsed = ApiErrorSchema.parse(await response.json());
    return new Error(`${parsed.code}: ${parsed.message}`);
  } catch {
    return new Error(`Request failed with ${response.status}`);
  }
}

function mergeHeaders(...sets: Array<HeadersInit | undefined>) {
  const headers = new Headers();
  for (const set of sets) {
    if (!set) continue;
    new Headers(set).forEach((value, key) => headers.set(key, value));
  }
  return headers;
}
