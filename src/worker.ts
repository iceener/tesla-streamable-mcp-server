import { preloadSchemas } from '@modelcontextprotocol/server';
import { parseConfig } from './config/env.js';
import { buildHttpApp, type HttpRuntime } from './http/app.js';

preloadSchemas();
export function createWorkerRuntime(env: Env): HttpRuntime {
  return buildHttpApp(parseConfig({ ...env }), { runtimeName: 'cloudflare-workers' });
}
let runtime: HttpRuntime | undefined;
export default {
  fetch(request, env) {
    runtime ??= createWorkerRuntime(env);
    return runtime.fetch(request);
  },
} satisfies ExportedHandler<Env>;
