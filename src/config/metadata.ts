/**
 * Centralized tool metadata for the Tesla MCP server.
 * Descriptions are optimized for LLM consumption.
 */

export interface ToolMetadata {
  name: string;
  title: string;
  description: string;
}

export const serverMetadata = {
  title: 'Tesla',
  instructions: `Control your Tesla vehicle via the Tessie API.

Quick start
- Call 'tesla_state' first to get current vehicle status (battery, location, climate, doors, charging).
- Use 'tesla_command' to execute actions (lock, unlock, climate, trunk, sentry, navigation).

Vehicle state fields
- battery_level (0-100%), battery_range_km, charging.state ('Disconnected'|'Charging'|'Complete'|'Stopped')
- location: { latitude, longitude, heading, speed }
- locked (boolean), sentry_mode (boolean)
- climate: { is_on, inside_temp, outside_temp, target_temp, is_defrosting }
- doors: { front_left, front_right, rear_left, rear_right, frunk, trunk, charge_port } — true = open
- state: 'online' | 'asleep' | 'offline'

Common patterns
- Before any command, check 'tesla_state' to confirm vehicle is 'online'. If 'asleep', commands will wake it (takes 10-30s).
- To navigate somewhere: use 'tesla_command' with command='share' and destination='<address or place name>'.
- To set temperature: use 'tesla_command' with command='set_temperature' and temperature=<15-28>.
- Climate commands (start_climate, stop_climate, set_temperature, start_defrost, stop_defrost) affect HVAC.
- Security commands: lock, unlock, enable_sentry, disable_sentry.
- Trunk/frunk: open_frunk (front), open_trunk (rear toggles), open_charge_port, close_charge_port.
- Alerts: flash (lights), honk (horn).

Response times
- 'tesla_state': ~2-5s if online, up to 30s if waking from sleep.
- 'tesla_command': ~5-15s (vehicle must be awake to execute).

Error handling
- If vehicle is offline, inform user and suggest trying later.
- If command fails with "may still be processing", it was sent but confirmation is pending.
`,
} as const;

export const toolsMetadata = {
  tesla_state: {
    name: 'tesla_state',
    title: 'Get Vehicle State',
    description: `Fetch current Tesla vehicle status. Inputs: none.
Returns: { display_name, battery_level (%), battery_range_km, charging: { state, minutes_remaining, charge_limit }, location: { latitude, longitude, heading, speed }, locked, sentry_mode, climate: { is_on, inside_temp, outside_temp, target_temp, is_defrosting }, doors: { front_left, front_right, rear_left, rear_right, frunk, trunk, charge_port }, state ('online'|'asleep'|'offline'), odometer_km, last_updated }.
Next: Use this before commands to verify vehicle is online. Use location for context (e.g., "car is at home"). Use battery_level to answer range questions.`,
  },

  tesla_command: {
    name: 'tesla_command',
    title: 'Execute Vehicle Command',
    description: `Execute a command on the Tesla vehicle. Inputs: { command: string, temperature?: number (15-28), destination?: string, locale?: string }.

Commands:
- lock, unlock — door locks
- start_climate, stop_climate — HVAC
- set_temperature — requires temperature param (15-28°C)
- start_defrost, stop_defrost — max defrost mode
- open_frunk — front trunk (one-way open)
- open_trunk — rear trunk (toggles if powered)
- open_charge_port, close_charge_port — charge port door
- enable_sentry, disable_sentry — sentry mode
- flash — flash headlights
- honk — honk horn
- share — send destination to nav (requires destination param, e.g., "123 Main St" or "SFO Airport")

Returns: { success: boolean, command: string, message: string }.
Next: Call 'tesla_state' to verify the command took effect (e.g., locked=true after 'lock').`,
  },
} as const satisfies Record<string, ToolMetadata>;

/**
 * Type-safe helper to get metadata for a tool.
 */
export function getToolMetadata(toolName: keyof typeof toolsMetadata): ToolMetadata {
  return toolsMetadata[toolName];
}

/**
 * Get all registered tool names.
 */
export function getToolNames(): string[] {
  return Object.keys(toolsMetadata);
}
