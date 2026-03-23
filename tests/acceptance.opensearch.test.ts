import { createOpencodeClient } from "@opencode-ai/sdk";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { OpensearchPlugin } from "../src/index";

type State = {
  dir: string;
  base: string;
  proc: ReturnType<typeof spawn>;
};

type ProviderPayload = {
  providers: Array<{
    id: string;
    models: Record<string, unknown>;
  }>;
  default?: Record<string, string>;
};

type MetadataCall = {
  title?: string;
  metadata?: Record<string, unknown>;
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function port() {
  return await new Promise<number>((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        srv.close();
        reject(new Error("port resolve failed"));
        return;
      }
      srv.close(() => resolve(addr.port));
    });
  });
}

async function wait(base: string) {
  for (const _ of Array.from({ length: 100 })) {
    const ok = await fetch(`${base}/experimental/tool/ids`)
      .then(async (res) => {
        if (!res.ok) return false;
        const ids = (await res.json()) as string[];
        return ids.includes("opensearch");
      })
      .catch(() => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("opencode server did not become ready");
}

async function stop(proc: State["proc"]) {
  proc.kill();

  for (const _ of Array.from({ length: 20 })) {
    if (proc.exitCode !== null || proc.signalCode !== null) return;
    await sleep(100);
  }

  proc.kill("SIGKILL");

  for (const _ of Array.from({ length: 10 })) {
    if (proc.exitCode !== null || proc.signalCode !== null) return;
    await sleep(100);
  }
}

async function providerModel(base: string) {
  const res = await fetch(`${base}/config/providers`);
  const payload = (await res.json()) as ProviderPayload;
  const provider = payload.providers.find(
    (item) => Object.keys(item.models).length > 0,
  );

  if (!provider) throw new Error("no provider/model available");

  return {
    provider: provider.id,
    model: payload.default?.[provider.id] ?? Object.keys(provider.models)[0],
  };
}

async function boot(dir: string) {
  const n = await port();
  const base = `http://127.0.0.1:${n}`;
  const data = join(dir, "xdg-data");
  const cfgDir = join(dir, "xdg-config");
  const cache = join(dir, "xdg-cache");
  await mkdir(data, { recursive: true });
  await mkdir(cfgDir, { recursive: true });
  await mkdir(cache, { recursive: true });
  const file = fileURLToPath(new URL("../src/index.ts", import.meta.url));
  const cfg = JSON.stringify({ plugin: [pathToFileURL(file).href] });
  const proc = spawn(
    "opencode",
    ["serve", "--port", `${n}`, "--hostname", "127.0.0.1"],
    {
      env: {
        ...process.env,
        OPENCODE_CONFIG_CONTENT: cfg,
        XDG_DATA_HOME: data,
        XDG_CONFIG_HOME: cfgDir,
        XDG_CACHE_HOME: cache,
      },
      shell: false,
      stdio: "ignore",
    },
  );
  await wait(base);
  return { dir, base, proc } satisfies State;
}

function runtime(dir: string) {
  const calls: MetadataCall[] = [];

  return {
    calls,
    context: {
      sessionID: "s",
      messageID: "m",
      agent: "build",
      directory: dir,
      worktree: dir,
      abort: new AbortController().signal,
      metadata(input: MetadataCall) {
        calls.push(input);
      },
      ask: async () => {},
    },
  };
}

let state: State | undefined;

afterEach(async () => {
  if (!state) return;
  await stop(state.proc);

  await rm(state.dir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  });
  state = undefined;
});

describe("opensearch acceptance", () => {
  it("registers opensearch tool", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opensearch-test-"));
    state = await boot(dir);
    const res = await fetch(`${state.base}/experimental/tool/ids`);
    const ids = (await res.json()) as string[];
    expect(ids.includes("opensearch")).toBe(true);
  });

  it("lists opensearch cleanly in OpenCode tool definitions", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opensearch-test-"));
    state = await boot(dir);

    const choice = await providerModel(state.base);
    const res = await fetch(
      `${state.base}/experimental/tool?provider=${encodeURIComponent(choice.provider)}&model=${encodeURIComponent(choice.model)}`,
    );
    const tools = (await res.json()) as Array<{
      id: string;
      description: string;
    }>;
    const opensearch = tools.find((tool) => tool.id === "opensearch");

    expect(opensearch).toBeDefined();
    expect(opensearch?.description).toContain("OpenSearch");
    expect(opensearch?.description).toContain("evidence-backed search");
  });

  it("returns no results for unmatched query", async () => {
    const dir = await mkdtemp(join(tmpdir(), "opensearch-test-"));
    state = await boot(dir);
    const client = createOpencodeClient({
      baseUrl: state.base,
      directory: dir,
    });

    const hooks = await OpensearchPlugin({
      client,
      directory: dir,
      worktree: dir,
      project: {} as never,
      serverUrl: new URL(state.base),
      $: {} as never,
    });
    await hooks.config?.({
      opensearch: {
        sources: { session: true, web: { enabled: false }, code: false },
        depth: "quick",
        synth: false,
      },
    } as never);

    const tool = hooks.tool?.opensearch;
    if (!tool) throw new Error("opensearch tool missing");
    const execution = runtime(dir);
    const out = await tool.execute(
      { query: `missing-${Date.now()}`, sources: ["session"], depth: "quick" },
      execution.context,
    );
    const body = JSON.parse(out) as {
      status: string;
      answer: string;
      sources: unknown[];
    };

    expect(body.status).toBe("no_results");
    expect(body.answer).toBe("No results found");
    expect(body.sources).toHaveLength(0);
    expect(execution.calls[0]).toMatchObject({
      title: "OpenSearch // scanning session only",
      metadata: {
        brand: "OpenSearch",
        phase: "searching",
        source_summary: "session only",
        status_note: "scanning session only",
      },
    });
    expect(execution.calls[execution.calls.length - 1]).toMatchObject({
      title: "OpenSearch // no matches",
      metadata: {
        brand: "OpenSearch",
        phase: "completed",
        status: "no_results",
        source_summary: "session only",
      },
    });
  });
});
