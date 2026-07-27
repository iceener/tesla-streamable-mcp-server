import { Hono } from 'hono';
import type { AppConfig } from '../config/env.js';
import { createMcpRuntime } from '../core/runtime.js';
import type { TessieToolService } from '../shared/tools/registry.js';
import { logger } from '../utils/logger.js';
import { mcpAuthResponse } from './auth.js';
import { boundedMcpRequest } from './body.js';
import {
  corsPreflightResponse,
  requestSecurityResponse,
  withCors,
} from './security.js';

export interface HttpRuntimeOptions {
  runtimeName: string;
  service?: TessieToolService;
}
export interface HttpRuntime {
  fetch(request: Request): Promise<Response>;
  close(): Promise<void>;
}
export function buildHttpApp(
  config: AppConfig,
  options: HttpRuntimeOptions,
): HttpRuntime {
  logger.setLevel(config.LOG_LEVEL);
  const mcp = createMcpRuntime(config, options.service);
  const mcpPath = config.MCP_PUBLIC_URL.pathname;
  const app = new Hono();
  app.use('*', async (context, next) => {
    const rejected = requestSecurityResponse(context.req.raw, config);
    if (rejected) return rejected;
    await next();
  });
  app.get('/health', (context) =>
    context.json({
      status: 'ok',
      runtime: options.runtimeName,
      protocol: '2026-07-28',
      legacyMode: config.MCP_LEGACY_MODE,
      authEnabled: config.AUTH_ENABLED,
      timestamp: new Date().toISOString(),
    }),
  );
  app.options(mcpPath, (context) => corsPreflightResponse(context.req.raw));
  app.all(mcpPath, async (context) => {
    const request = context.req.raw;
    const authRejection = await mcpAuthResponse(request, config);
    if (authRejection) return withCors(request, authRejection);
    const bounded = await boundedMcpRequest(request, config.MCP_MAX_REQUEST_BYTES);
    if (bounded.rejection) return withCors(request, bounded.rejection);
    return withCors(request, await mcp.fetch(bounded.request));
  });
  app.notFound((context) => context.text('Not Found', 404));
  return { fetch: async (request) => app.fetch(request), close: mcp.close };
}
