import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { contextRegistry } from '../core/context.js';
import { sharedTools, type ToolContext } from '../shared/tools/registry.js';
import { logger } from '../utils/logger.js';

/**
 * Register all tools with the MCP server.
 * Tesla MCP uses shared tools only (work in both Node and Workers).
 */
export function registerTools(server: McpServer): void {
  const registeredNames: string[] = [];

  for (const tool of sharedTools) {
    try {
      const wrappedHandler = createWrappedHandler(tool.handler);

      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema.shape,
          ...(tool.outputSchema && { outputSchema: tool.outputSchema }),
          ...(tool.annotations && { annotations: tool.annotations }),
        },
        wrappedHandler as Parameters<typeof server.registerTool>[2],
      );

      registeredNames.push(tool.name);
      logger.debug('tools', { message: 'Registered tool', toolName: tool.name });
    } catch (error) {
      logger.error('tools', {
        message: 'Failed to register tool',
        toolName: tool.name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  logger.info('tools', {
    message: `Registered ${registeredNames.length} tools`,
    toolNames: registeredNames,
  });
}

/**
 * Create a wrapped handler that adapts SDK's RequestHandlerExtra to ToolContext.
 *
 * Extracts auth headers from the context registry (stored by MCP routes).
 */
function createWrappedHandler(
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>,
) {
  return async (
    args: Record<string, unknown>,
    extra?: {
      requestId?: string | number;
      _meta?: { progressToken?: string | number };
      signal?: AbortSignal;
    },
  ) => {
    const requestId = extra?.requestId;
    const existingContext = requestId ? contextRegistry.get(requestId) : undefined;

    const context: ToolContext = {
      sessionId: String(requestId || crypto.randomUUID()),
      signal: extra?.signal,
      meta: {
        progressToken: extra?._meta?.progressToken,
        requestId: requestId ? String(requestId) : undefined,
      },
      authStrategy: existingContext?.authStrategy,
      providerToken: existingContext?.providerToken,
      provider: existingContext?.provider
        ? {
            accessToken: existingContext.provider.access_token,
            refreshToken: existingContext.provider.refresh_token,
            expiresAt: existingContext.provider.expires_at,
            scopes: existingContext.provider.scopes,
          }
        : undefined,
      resolvedHeaders: existingContext?.resolvedHeaders,
      authHeaders: existingContext?.authHeaders as Record<string, string> | undefined,
    };

    try {
      return await handler(args, context);
    } finally {
      if (requestId) {
        contextRegistry.delete(requestId);
      }
    }
  };
}
