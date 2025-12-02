/**
 * Tesla State Tool
 *
 * Returns the current state of the Tesla vehicle including:
 * - Battery level and range
 * - Charging status
 * - Location
 * - Lock status
 * - Climate status
 * - Door/trunk status
 * - Sentry mode
 */

import { z } from 'zod';
import { TeslaStateOutput } from '../../schemas/outputs.js';
import { createTessieClient } from '../../services/tessie.service.js';
import { defineTool, type ToolContext, type ToolResult } from './types.js';

const inputSchema = z.object({});

export const teslaStateTool = defineTool({
  name: 'tesla_state',
  title: 'Get Tesla State',
  description: `Get the current state of your Tesla vehicle.

Returns comprehensive information including:
- **Battery**: Level (%), range (km), charging status
- **Location**: GPS coordinates, heading, speed
- **Security**: Locked status, sentry mode
- **Climate**: On/off, inside/outside temp, target temp, defrost status
- **Doors**: Status of all doors, frunk, trunk, charge port

Use this tool to answer questions like:
- "Is my car locked?"
- "How much battery do I have?"
- "Where is my car?"
- "Is the climate on?"
- "Is my car charging?"`,
  inputSchema: z.object({}),
  outputSchema: TeslaStateOutput.shape,
  annotations: {
    title: 'Get Tesla State',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (
    _args: z.infer<typeof inputSchema>,
    _context: ToolContext,
  ): Promise<ToolResult> => {
    try {
      const client = createTessieClient();
      const state = await client.getState();

      // Format human-readable summary
      const summary = formatStateSummary(state);

      return {
        content: [{ type: 'text', text: summary }],
        structuredContent: state as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get vehicle state: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
});

function formatStateSummary(state: z.infer<typeof TeslaStateOutput>): string {
  const lines: string[] = [
    `## ${state.display_name}`,
    '',
    `**Status**: ${state.state}`,
    `**Locked**: ${state.locked ? 'Yes ✓' : 'No ✗'}`,
    `**Sentry Mode**: ${state.sentry_mode ? 'On' : 'Off'}`,
    '',
    '### Battery',
    `- Level: ${state.battery_level}%`,
    `- Range: ${state.battery_range_km} km`,
    `- Charging: ${state.charging.state}`,
  ];

  if (state.charging.state === 'Charging' && state.charging.minutes_remaining) {
    lines.push(`- Time to full: ${state.charging.minutes_remaining} min`);
  }

  lines.push(
    '',
    '### Climate',
    `- Status: ${state.climate.is_on ? 'On' : 'Off'}`,
    `- Inside: ${state.climate.inside_temp}°C`,
    `- Outside: ${state.climate.outside_temp}°C`,
    `- Target: ${state.climate.target_temp}°C`,
  );

  if (state.climate.is_defrosting) {
    lines.push('- Defrost: Active');
  }

  // Check for open doors
  const openDoors: string[] = [];
  if (state.doors.front_left) openDoors.push('Front Left');
  if (state.doors.front_right) openDoors.push('Front Right');
  if (state.doors.rear_left) openDoors.push('Rear Left');
  if (state.doors.rear_right) openDoors.push('Rear Right');
  if (state.doors.frunk) openDoors.push('Frunk');
  if (state.doors.trunk) openDoors.push('Trunk');
  if (state.doors.charge_port) openDoors.push('Charge Port');

  if (openDoors.length > 0) {
    lines.push('', '### ⚠️ Open', openDoors.map((d) => `- ${d}`).join('\n'));
  }

  lines.push(
    '',
    '### Location',
    `- Coordinates: ${state.location.latitude.toFixed(5)}, ${state.location.longitude.toFixed(5)}`,
    `- Heading: ${state.location.heading}°`,
  );

  if (state.location.speed !== null && state.location.speed > 0) {
    lines.push(`- Speed: ${state.location.speed} km/h`);
  }

  lines.push(
    '',
    `_Odometer: ${state.odometer_km.toLocaleString()} km_`,
    `_Updated: ${state.last_updated}_`,
  );

  return lines.join('\n');
}
