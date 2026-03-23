import type {
  FollowUpRequest,
  SearchRequest,
  SearchResponse,
  SearchSource,
  SearchStreamEvent,
  SearchThread,
  SearchTurn,
} from "@opensearch/contracts";
import type { SearchCore } from "@opensearch/core";
import type { ThreadServicePort, ThreadStore } from "./ports.js";
import { createThreadTitle } from "../domain/thread.js";

export class ThreadNotFoundError extends Error {
  constructor(threadId: string) {
    super(`Thread ${threadId} was not found.`);
    this.name = "ThreadNotFoundError";
  }
}

export class ThreadService implements ThreadServicePort {
  constructor(
    private readonly store: ThreadStore,
    private readonly core: SearchCore,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly makeId: (prefix: string) => string = defaultId,
  ) {}

  async listDatasources() {
    return this.core.listDatasources();
  }

  async listThreads() {
    const threads = await this.store.list();
    return [...threads].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  getThread(threadId: string) {
    return this.store.get(threadId);
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await this.core.search(request);
    await this.store.save(response.thread);
    return response;
  }

  async followUp(threadId: string, request: FollowUpRequest): Promise<SearchResponse> {
    const thread = await this.requireThread(threadId);
    const response = await this.core.search({ ...request, thread, threadId });
    await this.store.save(response.thread);
    return response;
  }

  async *streamSearch(request: SearchRequest): AsyncIterable<SearchStreamEvent> {
    const startedAt = this.now();
    const threadId = this.makeId("thread");
    const turnId = this.makeId("turn");
    const draftThread = createDraftThread({
      request,
      threadId,
      turnId,
      startedAt,
    });

    await this.store.save(draftThread);

    yield { type: "thread", thread: draftThread };
    yield { type: "turn.started", turn: draftThread.turns[draftThread.turns.length - 1]! };

    const response = await this.core.search({ ...request, threadId, turnId, startedAt });
    await this.store.save(response.thread);

    yield* streamCompletedTurn(response.thread, response.turn);
  }

  async *streamFollowUp(threadId: string, request: FollowUpRequest): AsyncIterable<SearchStreamEvent> {
    const thread = await this.requireThread(threadId);
    const startedAt = this.now();
    const turnId = this.makeId("turn");
    const draftThread = createDraftThread({
      request,
      thread,
      threadId,
      turnId,
      startedAt,
    });

    await this.store.save(draftThread);

    yield { type: "thread", thread: draftThread };
    yield { type: "turn.started", turn: draftThread.turns[draftThread.turns.length - 1]! };

    const response = await this.core.search({
      ...request,
      thread,
      threadId,
      turnId,
      startedAt,
    });
    await this.store.save(response.thread);

    yield* streamCompletedTurn(response.thread, response.turn);
  }

  private async requireThread(threadId: string) {
    const thread = await this.store.get(threadId);
    if (!thread) throw new ThreadNotFoundError(threadId);
    return thread;
  }
}

function createDraftThread(input: {
  request: SearchRequest | FollowUpRequest;
  threadId: string;
  turnId: string;
  startedAt: string;
  thread?: SearchThread;
}) {
  const turn: SearchTurn = {
    id: input.turnId,
    parentTurnId: "parentTurnId" in input.request ? input.request.parentTurnId : undefined,
    query: input.request.query,
    status: "streaming",
    answerText: "",
    answerBlocks: [],
    citations: [],
    sources: [],
    followUps: [],
    errors: [],
    createdAt: input.startedAt,
    updatedAt: input.startedAt,
  };

  if (input.thread) {
    return {
      ...input.thread,
      updatedAt: input.startedAt,
      turns: [...input.thread.turns, turn],
    } satisfies SearchThread;
  }

  return {
    id: input.threadId,
    title: createThreadTitle(input.request.query),
    createdAt: input.startedAt,
    updatedAt: input.startedAt,
    turns: [turn],
  } satisfies SearchThread;
}

async function* streamCompletedTurn(thread: SearchThread, turn: SearchTurn): AsyncIterable<SearchStreamEvent> {
  for (const source of turn.sources) {
    yield { type: "turn.source", turnId: turn.id, source };
  }

  for (const delta of splitAnswer(turn.answerText)) {
    yield { type: "turn.answer.delta", turnId: turn.id, delta };
  }

  yield { type: "turn.completed", thread, turn };
  yield { type: "done", thread, turn };
}

function splitAnswer(value: string) {
  const chunks = value.match(/.{1,64}(\s|$)/g) ?? [value];
  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}

function defaultId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
