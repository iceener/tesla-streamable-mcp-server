/**
 * Tesla Command Tool
 *
 * Execute commands on the Tesla vehicle.
 * Supports: lock, unlock, climate, trunk, charge port, sentry, flash, honk
 */

import { z } from 'zod';
import { type TeslaCommand, TeslaCommandSchema } from '../../schemas/commands.js';
import { TeslaCommandOutput } from '../../schemas/outputs.js';
import { createTessieClient } from '../../services/tessie.service.js';
import { defineTool, type ToolContext, type ToolResult } from './types.js';

const inputSchema = z.object({
  command: TeslaCommandSchema.describe(`Command to execute:
- lock/unlock: Lock or unlock the vehicle
- start_climate/stop_climate: Turn climate on/off
- set_temperature: Set cabin temperature (requires temperature param)
- start_defrost/stop_defrost: Turn max defrost on/off
- open_frunk: Open front trunk
- open_trunk: Open/close rear trunk (toggles if powered)
- open_charge_port/close_charge_port: Control charge port
- enable_sentry/disable_sentry: Control sentry mode
- flash: Flash the lights
- honk: Honk the horn
- share: Send destination to vehicle navigation (requires destination param)`),
  temperature: z
    .number()
    .min(15)
    .max(28)
    .optional()
    .describe(
      'Temperature in Celsius (15-28). Only used with set_temperature command.',
    ),
  destination: z
    .string()
    .optional()
    .describe(
      'Address, place name, or coordinates to navigate to. Only used with share command. Examples: "123 Main St, NYC", "Empire State Building", "40.7484,-73.9857"',
    ),
  locale: z
    .string()
    .optional()
    .describe(
      'Locale for address interpretation (e.g., "en-US", "de-DE"). Only used with share command.',
    ),
});

export const teslaCommandTool = defineTool({
  name: 'tesla_command',
  title: 'Tesla Command',
  description: `Execute a command on your Tesla vehicle.

**Available Commands:**

| Command | Description |
|---------|-------------|
| lock | Lock the vehicle |
| unlock | Unlock the vehicle |
| start_climate | Start climate control |
| stop_climate | Stop climate control |
| set_temperature | Set cabin temperature (provide temperature param) |
| start_defrost | Turn on max defrost |
| stop_defrost | Turn off defrost |
| open_frunk | Open front trunk |
| open_trunk | Open/close rear trunk |
| open_charge_port | Open charge port door |
| close_charge_port | Close charge port door |
| enable_sentry | Enable sentry mode |
| disable_sentry | Disable sentry mode |
| flash | Flash the lights |
| honk | Honk the horn |
| share | Send destination to navigation |

**Examples:**
- "Lock my car" → { command: "lock" }
- "Turn on the AC" → { command: "start_climate" }
- "Set temperature to 22" → { command: "set_temperature", temperature: 22 }
- "Open the trunk" → { command: "open_trunk" }
- "Navigate to the airport" → { command: "share", destination: "SFO Airport" }
- "Take me to 123 Main St" → { command: "share", destination: "123 Main St, San Francisco" }`,
  inputSchema,
  outputSchema: TeslaCommandOutput.shape,
  annotations: {
    title: 'Tesla Command',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (
    args: z.infer<typeof inputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult> => {
    const { command, temperature, destination, locale } = args;

    // Validate temperature is provided for set_temperature command
    if (command === 'set_temperature' && temperature === undefined) {
      return {
        content: [
          {
            type: 'text',
            text: 'Temperature is required for set_temperature command. Provide a value between 15-28°C.',
          },
        ],
        isError: true,
      };
    }

    // Validate destination is provided for share command
    if (command === 'share' && !destination) {
      return {
        content: [
          {
            type: 'text',
            text: 'Destination is required for share command. Provide an address, place name, or coordinates.',
          },
        ],
        isError: true,
      };
    }

    try {
      const client = createTessieClient();
      const result = await client.executeCommand(command as TeslaCommand, {
        temperature,
        destination,
        locale,
      });

      const icon = result.success ? '✓' : '⚠️';
      const text = `${icon} ${result.message}`;

      return {
        content: [{ type: 'text', text }],
        structuredContent: result,
      };
    } catch (error) {
      return {
        content: [
          { type: 'text', text: `Command failed: ${(error as Error).message}` },
        ],
        isError: true,
      };
    }
  },
});
