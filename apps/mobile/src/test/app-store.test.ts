import { createStore } from "jotai";
import { describe, expect, it, vi } from "vitest";

import type { Datasource, SearchThread, SearchTurn } from "@opensearch/contracts";
import type { SearchClient } from "../lib/opensearch-client";
import {
  bootstrapAppAtom,
  closeSourcesAtom,
  datasourcesAtom,
  openSourcesAtom,
  preferencesAtom,
  queryDraftAtom,
  runSearchAtom,
  searchClientAtom,
  sourceSheetAtom,
  stageFollowUpAtom,
  threadsAtom,
} from "../store/app-store";

describe("app store", () => {
  it("bootstraps datasources and thread history from the shared client", async () => {
    const store = createStore();
    const client = createClient({
      listDatasources: vi.fn().mockResolvedValue({ datasources: datasourceFixtures }),
      listThreads: vi.fn().mockResolvedValue({ threads: [buildThread()] }),
    });

    store.set(searchClientAtom, client);
    await store.set(bootstrapAppAtom);

    expect(client.listDatasources).toHaveBeenCalledOnce();
    expect(client.listThreads).toHaveBeenCalledOnce();
    expect(store.get(datasourcesAtom)).toHaveLength(2);
    expect(store.get(preferencesAtom).selectedDatasourceIds).toEqual(["session-history", "grep-app-code"]);
    expect(store.get(threadsAtom)[0]?.title).toBe("Shared stack rollout");
  });

  it("stores a search turn in the real thread model", async () => {
    const store = createStore();
    const completedTurn = buildTurn({
      answerText: "OpenSearch keeps search scoped to approved sources.",
      answerBlocks: [{ type: "text", text: "OpenSearch keeps search scoped to approved sources." }],
      followUps: ["Which datasource answered that?"],
    });
    const completedThread = buildThread({ turns: [completedTurn] });
    const client = createClient({
      search: vi.fn().mockResolvedValue({ thread: completedThread, turn: completedTurn }),
    });

    store.set(searchClientAtom, client);
    store.set(datasourcesAtom, datasourceFixtures);
    store.set(preferencesAtom, {
      selectedDatasourceIds: ["session-history"],
      hapticsEnabled: true,
      compactSources: false,
    });

    const threadId = await store.set(runSearchAtom, "How is privacy handled?");

    expect(client.search).toHaveBeenCalledWith({
      query: "How is privacy handled?",
      datasourceIds: ["session-history"],
      maxSources: 8,
    });
    expect(threadId).toBe("thread-1");
    expect(store.get(threadsAtom)[0]?.turns[0]?.answerText).toBe("OpenSearch keeps search scoped to approved sources.");
  });

  it("opens and clears the source sheet and stages follow-up prompts", () => {
    const store = createStore();

    store.set(openSourcesAtom, {
      title: "Answer sources",
      sources: [buildTurn().sources[0]!],
    });
    store.set(stageFollowUpAtom, "Compare session memory with code search");

    expect(store.get(sourceSheetAtom)).toMatchObject({
      visible: true,
      title: "Answer sources",
    });
    expect(store.get(sourceSheetAtom).sources).toHaveLength(1);
    expect(store.get(queryDraftAtom)).toBe("Compare session memory with code search");

    store.set(closeSourcesAtom);

    expect(store.get(sourceSheetAtom)).toMatchObject({
      visible: false,
      sources: [],
    });
  });
});

const datasourceFixtures: Datasource[] = [
  {
    id: "session-history",
    label: "Session history",
    description: "Private assistant memory",
    category: "session",
    capabilities: ["search"],
    credentialMode: "none",
    enabled: true,
  },
  {
    id: "grep-app-code",
    label: "App code",
    description: "Repository source search",
    category: "code",
    capabilities: ["search"],
    credentialMode: "server",
    enabled: true,
  },
];

function buildTurn(overrides: Partial<SearchTurn> = {}): SearchTurn {
  return {
    id: "turn-1",
    query: "How is privacy handled?",
    status: "completed",
    answerText: "Use approved datasources only.",
    answerBlocks: [{ type: "text", text: "Use approved datasources only." }],
    citations: [
      {
        sourceId: "source-1",
        title: "Assistant memory",
        url: "https://example.com/memory",
        snippet: "Stored context for the assistant.",
      },
    ],
    sources: [
      {
        id: "source-1",
        datasourceId: "session-history",
        category: "session",
        title: "Assistant memory",
        url: "https://example.com/memory",
        snippet: "Stored context for the assistant.",
        score: 0.9,
        metadata: {},
      },
    ],
    followUps: ["Which datasource answered that?"],
    errors: [],
    createdAt: "2026-03-23T00:00:00.000Z",
    updatedAt: "2026-03-23T00:00:01.000Z",
    completedAt: "2026-03-23T00:00:02.000Z",
    ...overrides,
  };
}

function buildThread(overrides: Partial<SearchThread> = {}): SearchThread {
  return {
    id: "thread-1",
    title: "Shared stack rollout",
    createdAt: "2026-03-23T00:00:00.000Z",
    updatedAt: "2026-03-23T00:00:02.000Z",
    turns: [buildTurn()],
    ...overrides,
  };
}

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
