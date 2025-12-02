import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SetLevelRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config/env.js';
import { registerTools } from '../tools/index.js';
import { logger } from '../utils/logger.js';
import { buildCapabilities } from './capabilities.js';

export interface ServerOptions {
  name: string;
  version: string;
  instructions?: string;
  /**
   * Called when initialization is complete (after client sends notifications/initialized).
   */
  oninitialized?: () => void;
}

export function buildServer(options: ServerOptions): McpServer {
  const { name, version, instructions, oninitialized } = options;

  const server = new McpServer(
    { name, version },
    {
      capabilities: buildCapabilities(),
      instructions: instructions ?? config.MCP_INSTRUCTIONS,
    },
  );

  // Set up logging
  logger.setServer(server);

  // Register oninitialized callback
  const lowLevel = (server as any).server;
  if (lowLevel && oninitialized) {
    lowLevel.oninitialized = () => {
      logger.info('mcp', {
        message: 'Client initialization complete (notifications/initialized received)',
        clientVersion: lowLevel.getClientVersion?.(),
      });
      oninitialized();
    };
  }

  // Register tools (no prompts/resources for Tesla MCP)
  registerTools(server);

  // Register logging/setLevel handler (required when logging capability is advertised)
  server.server.setRequestHandler(SetLevelRequestSchema, async (request) => {
    const level = request.params.level;
    logger.info('mcp', { message: 'Log level changed', level });
    return {};
  });

  return server;
}
