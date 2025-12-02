/**
 * Shared tool registry - single source of truth for all tools.
 * Tools defined here work in both Node.js and Cloudflare Workers.
 */

import type { ZodObject, ZodRawShape } from 'zod';
import { teslaCommandTool } from './tesla-command.js';
import { teslaStateTool } from './tesla-state.js';
import type { ToolContext, ToolResult } from './types.js';

// Re-export types for convenience
export type { SharedToolDefinition, ToolContext, ToolResult } from './types.js';
export { defineTool } from './types.js';

/**
 * Simplified tool interface for the registry (type-erased for storage).
 */
export interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: ZodObject<ZodRawShape>;
  outputSchema?: ZodRawShape;
  annotations?: Record<string, unknown>;
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

/**
 * All shared tools available in both runtimes.
 * Tesla MCP exposes only two tools:
 * - tesla_state: Get vehicle state
 * - tesla_command: Execute vehicle commands
 */
export const sharedTools: RegisteredTool[] = [
  teslaStateTool as unknown as RegisteredTool,
  teslaCommandTool as unknown as RegisteredTool,
];

/**
 * Get a tool by name.
 */
export function getSharedTool(name: string): RegisteredTool | undefined {
  return sharedTools.find((t) => t.name === name);
}

/**
 * Get all tool names.
 */
export function getSharedToolNames(): string[] {
  return sharedTools.map((t) => t.name);
}

/**
 * Execute a shared tool by name.
 * Handles input validation, output validation, and error wrapping.
 *
 * Per MCP spec: When outputSchema is defined, structuredContent is required
 * (unless isError is true). The SDK validates this automatically for Node,
 * and we replicate that behavior here for Workers.
 */
export async function executeSharedTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const tool = getSharedTool(name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    // Check for cancellation before starting
    if (context.signal?.aborted) {
      return {
        content: [{ type: 'text', text: 'Operation was cancelled' }],
        isError: true,
      };
    }

    // Validate input using Zod schema
    const parseResult = tool.inputSchema.safeParse(args);
    if (!parseResult.success) {
      const errors = parseResult.error.errors
        .map(
          (e: { path: (string | number)[]; message: string }) =>
            `${e.path.join('.')}: ${e.message}`,
        )
        .join(', ');
      return {
        content: [{ type: 'text', text: `Invalid input: ${errors}` }],
        isError: true,
      };
    }

    const result = await tool.handler(
      parseResult.data as Record<string, unknown>,
      context,
    );

    // Validate outputSchema compliance (per MCP spec)
    // When outputSchema is defined, structuredContent is required unless isError is true
    if (tool.outputSchema && !result.isError) {
      if (!result.structuredContent) {
        return {
          content: [
            {
              type: 'text',
              text: 'Tool with outputSchema must return structuredContent (unless isError is true)',
            },
          ],
          isError: true,
        };
      }
    }

    return result;
  } catch (error) {
    // Check if this was an abort
    if (context.signal?.aborted) {
      return {
        content: [{ type: 'text', text: 'Operation was cancelled' }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: `Tool error: ${(error as Error).message}` }],
      isError: true,
    };
  }
}
