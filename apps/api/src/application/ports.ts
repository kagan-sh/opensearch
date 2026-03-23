import type {
  Datasource,
  FollowUpRequest,
  SearchRequest,
  SearchResponse,
  SearchStreamEvent,
  SearchThread,
} from "@opensearch/contracts";

export interface ThreadStore {
  list(): Promise<SearchThread[]>;
  get(threadId: string): Promise<SearchThread | null>;
  save(thread: SearchThread): Promise<void>;
}

export interface ThreadServicePort {
  listDatasources(): Promise<Datasource[]>;
  listThreads(): Promise<SearchThread[]>;
  getThread(threadId: string): Promise<SearchThread | null>;
  search(request: SearchRequest): Promise<SearchResponse>;
  followUp(threadId: string, request: FollowUpRequest): Promise<SearchResponse>;
  streamSearch(request: SearchRequest): AsyncIterable<SearchStreamEvent>;
  streamFollowUp(threadId: string, request: FollowUpRequest): AsyncIterable<SearchStreamEvent>;
}
