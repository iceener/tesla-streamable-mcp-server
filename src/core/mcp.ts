import {
  type McpRequestContext,
  McpServer,
  type ServerCapabilities,
} from '@modelcontextprotocol/server';
import type { AppConfig } from '../config/env.js';
import type { TessieToolService } from '../shared/tools/registry.js';
import { registerTools } from '../tools/index.js';

function capabilitiesFor(context: McpRequestContext): ServerCapabilities {
  return { tools: { listChanged: context.era === 'modern' } };
}
export function createMcpServer(
  config: AppConfig,
  context: McpRequestContext,
  service?: TessieToolService,
): McpServer {
  const server = new McpServer(
    { name: config.MCP_NAME, title: config.MCP_TITLE, version: config.MCP_VERSION },
    {
      instructions: config.MCP_INSTRUCTIONS,
      capabilities: capabilitiesFor(context),
      cacheHints: { 'tools/list': { ttlMs: 60_000, cacheScope: 'private' } },
    },
  );
  registerTools(server, config, service);
  return server;
}
