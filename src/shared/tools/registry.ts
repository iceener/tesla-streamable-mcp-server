import { teslaCommandTool } from './tesla-command.js';
import { teslaStateTool } from './tesla-state.js';

export type {
  SharedToolDefinition,
  TessieToolService,
  ToolContext,
  ToolResult,
} from './types.js';
export { defineTool } from './types.js';

/** Existing Tesla tool order is part of the public tools/list contract. */
export const sharedTools = [teslaStateTool, teslaCommandTool] as const;
export function getSharedToolNames(): string[] {
  return sharedTools.map((tool) => tool.name);
}
