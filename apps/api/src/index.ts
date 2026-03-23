import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ThreadService } from './application/thread-service.js';
import { JsonThreadStore } from './infrastructure/json-thread-store.js';
import { createDefaultSearchCore } from './infrastructure/default-search-gateway.js';
import { createApiServer } from './transport/http-server.js';

export { createApiServer } from './transport/http-server.js';
export { ThreadService, ThreadNotFoundError } from './application/thread-service.js';
export { JsonThreadStore } from './infrastructure/json-thread-store.js';
export { createDefaultSearchCore } from './infrastructure/default-search-gateway.js';

const appRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const defaultDataFile = resolve(appRoot, '.data/threads.json');

export const createDefaultApp = () => {
  const service = new ThreadService(new JsonThreadStore(defaultDataFile), createDefaultSearchCore());
  return createApiServer(service);
};

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3001);
  const server = createDefaultApp();
  server.listen(port, () => {
    process.stdout.write(`@opensearch/api listening on http://127.0.0.1:${port}\n`);
  });
}
