import { createMcpHandler, type McpHttpHandler } from '@modelcontextprotocol/server';
import type { AppConfig } from '../config/env.js';
import type { TessieToolService } from '../shared/tools/registry.js';
import { logger } from '../utils/logger.js';
import { createMcpServer } from './mcp.js';

export type McpRuntime = McpHttpHandler;
export function createMcpRuntime(
  config: AppConfig,
  service?: TessieToolService,
): McpRuntime {
  return createMcpHandler((context) => createMcpServer(config, context, service), {
    legacy: config.MCP_LEGACY_MODE,
    responseMode: 'auto',
    onerror(error) {
      logger.error('mcp', { message: 'MCP request failed', error: error.message });
    },
  });
}
