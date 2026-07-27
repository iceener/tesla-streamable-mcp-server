import type { McpServer } from '@modelcontextprotocol/server';
import type { AppConfig } from '../config/env.js';
import { createTessieClient } from '../services/tessie.service.js';
import { teslaCommandTool } from '../shared/tools/tesla-command.js';
import { teslaStateTool } from '../shared/tools/tesla-state.js';
import type { TessieToolService } from '../shared/tools/types.js';

export function createDefaultTessieService(config: AppConfig): TessieToolService {
  return {
    getState(signal) {
      return createTessieClient(config, signal).getState();
    },
    executeCommand(command, options, signal) {
      return createTessieClient(config, signal).executeCommand(command, options);
    },
  };
}

/** Register full Zod v4 schemas without v1 shape projection. */
export function registerTools(
  server: McpServer,
  config: AppConfig,
  service: TessieToolService = createDefaultTessieService(config),
): void {
  server.registerTool(
    teslaStateTool.name,
    {
      description: teslaStateTool.description,
      inputSchema: teslaStateTool.inputSchema,
      outputSchema: teslaStateTool.outputSchema,
      annotations: teslaStateTool.annotations,
    },
    (args, context) =>
      teslaStateTool.handler(args, {
        signal: context.mcpReq.signal,
        tessie: service,
      }),
  );
  server.registerTool(
    teslaCommandTool.name,
    {
      description: teslaCommandTool.description,
      inputSchema: teslaCommandTool.inputSchema,
      outputSchema: teslaCommandTool.outputSchema,
      annotations: teslaCommandTool.annotations,
    },
    (args, context) =>
      teslaCommandTool.handler(args, {
        signal: context.mcpReq.signal,
        tessie: service,
      }),
  );
}
