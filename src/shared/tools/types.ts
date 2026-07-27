import type { CallToolResult } from '@modelcontextprotocol/server';
import type * as z from 'zod/v4';
import type { TeslaCommand } from '../../schemas/commands.js';
import type { VehicleState } from '../../services/tessie.service.js';

export interface TessieToolService {
  getState(signal: AbortSignal): Promise<VehicleState>;
  executeCommand(
    command: TeslaCommand,
    options: { temperature?: number; destination?: string; locale?: string },
    signal: AbortSignal,
  ): Promise<{ success: boolean; command: string; message: string }>;
}
export interface ToolContext {
  signal: AbortSignal;
  tessie: TessieToolService;
}
export type ToolResult = CallToolResult;
export interface SharedToolDefinition<
  TInput extends z.ZodObject = z.ZodObject,
  TOutput extends z.ZodType | undefined = z.ZodType | undefined,
> {
  name: string;
  title?: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: TOutput;
  handler(args: z.infer<TInput>, context: ToolContext): Promise<ToolResult>;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}
export function defineTool<
  TInput extends z.ZodObject,
  TOutput extends z.ZodType | undefined = undefined,
>(
  definition: SharedToolDefinition<TInput, TOutput>,
): SharedToolDefinition<TInput, TOutput> {
  return definition;
}
