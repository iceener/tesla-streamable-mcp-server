/**
 * Tesla command schemas.
 * Defines available vehicle commands and their metadata.
 */

import { z } from 'zod';

/**
 * Available Tesla vehicle commands.
 */
export const TeslaCommandSchema = z
  .enum([
    'lock',
    'unlock',
    'start_climate',
    'stop_climate',
    'set_temperature',
    'start_defrost',
    'stop_defrost',
    'open_frunk',
    'open_trunk',
    'open_charge_port',
    'close_charge_port',
    'enable_sentry',
    'disable_sentry',
    'flash',
    'honk',
    'share',
  ])
  .describe('Tesla vehicle command to execute');

export type TeslaCommand = z.infer<typeof TeslaCommandSchema>;

/** All available command values */
export const TESLA_COMMANDS = TeslaCommandSchema.options;

/**
 * Parameter metadata for commands.
 */
export interface ParamMeta {
  /** Parameter description */
  description: string;
  /** Is this parameter required? */
  required: boolean;
  /** Value type */
  type: 'number' | 'string';
  /** Value constraints */
  constraints?: string;
}

/**
 * Available command parameters.
 */
export const PARAM_META: Record<string, ParamMeta> = {
  temperature: {
    description: 'Target cabin temperature',
    required: true,
    type: 'number',
    constraints: '15-28°C',
  },
  destination: {
    description: 'Address, place name, or coordinates to navigate to',
    required: true,
    type: 'string',
    constraints: 'e.g., "123 Main St", "SFO Airport", "37.7749,-122.4194"',
  },
  locale: {
    description: 'Locale for address interpretation',
    required: false,
    type: 'string',
    constraints: 'e.g., "en-US", "de-DE"',
  },
};

/**
 * Command metadata for documentation and messages.
 */
export interface CommandMeta {
  /** Tessie API endpoint path */
  endpoint: string;
  /** Human-readable success message */
  message: string;
  /** Command description for LLM */
  description: string;
  /** Parameter names (details in PARAM_META) */
  params?: (keyof typeof PARAM_META)[];
}

/**
 * Command metadata registry.
 * Maps commands to their API endpoints, messages, and descriptions.
 */
export const COMMAND_META: Record<TeslaCommand, CommandMeta> = {
  lock: {
    endpoint: 'command/lock',
    message: 'Vehicle locked',
    description: 'Lock all doors',
  },
  unlock: {
    endpoint: 'command/unlock',
    message: 'Vehicle unlocked',
    description: 'Unlock all doors',
  },
  start_climate: {
    endpoint: 'command/start_climate',
    message: 'Climate started',
    description: 'Start HVAC with current temperature setting',
  },
  stop_climate: {
    endpoint: 'command/stop_climate',
    message: 'Climate stopped',
    description: 'Stop HVAC',
  },
  set_temperature: {
    endpoint: 'command/set_temperatures',
    message: 'Temperature set',
    description: 'Set cabin target temperature (15-28°C)',
    params: ['temperature'],
  },
  start_defrost: {
    endpoint: 'command/start_max_defrost',
    message: 'Defrost started',
    description: 'Turn on max defrost mode (front + rear)',
  },
  stop_defrost: {
    endpoint: 'command/stop_max_defrost',
    message: 'Defrost stopped',
    description: 'Turn off defrost mode',
  },
  open_frunk: {
    endpoint: 'command/activate_front_trunk',
    message: 'Front trunk opened',
    description: 'Open front trunk (frunk). One-way, cannot close remotely.',
  },
  open_trunk: {
    endpoint: 'command/activate_rear_trunk',
    message: 'Rear trunk toggled',
    description:
      'Toggle rear trunk. Opens if closed, closes if open (powered trunk only).',
  },
  open_charge_port: {
    endpoint: 'command/open_charge_port',
    message: 'Charge port opened',
    description: 'Open charge port door',
  },
  close_charge_port: {
    endpoint: 'command/close_charge_port',
    message: 'Charge port closed',
    description: 'Close charge port door',
  },
  enable_sentry: {
    endpoint: 'command/enable_sentry',
    message: 'Sentry mode enabled',
    description: 'Enable sentry mode (cameras active, alerts on threats)',
  },
  disable_sentry: {
    endpoint: 'command/disable_sentry',
    message: 'Sentry mode disabled',
    description: 'Disable sentry mode',
  },
  flash: {
    endpoint: 'command/flash',
    message: 'Lights flashed',
    description: 'Flash headlights briefly',
  },
  honk: {
    endpoint: 'command/honk',
    message: 'Horn honked',
    description: 'Honk horn briefly',
  },
  share: {
    endpoint: 'command/share',
    message: 'Destination sent to vehicle',
    description: 'Send destination to vehicle navigation',
    params: ['destination', 'locale'],
  },
};

/**
 * Get command endpoint.
 */
export const getCommandEndpoint = (command: TeslaCommand): string =>
  COMMAND_META[command].endpoint;

/**
 * Get command success message.
 */
export const getCommandMessage = (command: TeslaCommand): string =>
  COMMAND_META[command].message;

/**
 * Get command description.
 */
export const getCommandDescription = (command: TeslaCommand): string =>
  COMMAND_META[command].description;

/**
 * Check if command requires a specific parameter.
 */
export const commandRequiresParam = (
  command: TeslaCommand,
  param: keyof typeof PARAM_META,
): boolean => {
  const params = COMMAND_META[command].params;
  if (!params) return false;
  const meta = PARAM_META[param];
  return params.includes(param) && meta.required;
};

/**
 * Get parameter metadata for a command.
 */
export const getCommandParams = (command: TeslaCommand): Record<string, ParamMeta> => {
  const params = COMMAND_META[command].params;
  if (!params) return {};
  return Object.fromEntries(params.map((p) => [p, PARAM_META[p]]));
};
