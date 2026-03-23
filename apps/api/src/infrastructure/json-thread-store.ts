import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ThreadStore } from '../application/ports.js';
import type { SearchThread } from '@opensearch/contracts';
import { parseThread } from '../domain/thread.js';

interface PersistedThreads {
  threads: SearchThread[];
}

export class JsonThreadStore implements ThreadStore {
  constructor(private readonly filePath: string) {}

  async list(): Promise<SearchThread[]> {
    const data = await this.read();
    return [...data.threads].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async get(threadId: string): Promise<SearchThread | null> {
    const data = await this.read();
    return data.threads.find((thread) => thread.id === threadId) ?? null;
  }

  async save(thread: SearchThread): Promise<void> {
    const data = await this.read();
    const nextThreads = data.threads.filter((entry) => entry.id !== thread.id);
    nextThreads.push(thread);
    await this.write({ threads: nextThreads });
  }

  private async read(): Promise<PersistedThreads> {
    try {
      const payload = await readFile(this.filePath, 'utf8');
      const data = JSON.parse(payload) as PersistedThreads;
      return { threads: (data.threads ?? []).map((thread) => parseThread(thread)) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { threads: [] };
      }

      throw error;
    }
  }

  private async write(data: PersistedThreads): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}
