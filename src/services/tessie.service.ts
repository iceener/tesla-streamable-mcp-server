/**
 * Tessie API Service
 *
 * Handles all communication with the Tessie API for Tesla vehicle control.
 * Base URL: https://api.tessie.com
 *
 * Credentials are read from environment secrets (wrangler secrets).
 */

import type { z } from 'zod';
import { COMMAND_META, type TeslaCommand } from '../schemas/commands.js';
import {
  CommandResultSchema,
  type TessieVehicleState,
  TessieVehicleStateSchema,
} from '../schemas/tessie.js';
import { logger } from '../utils/logger.js';
import { createHttpClient, type HttpClient } from './http-client.js';

const TESSIE_API_URL = 'https://api.tessie.com';

// Re-export for consumers
export type { TeslaCommand } from '../schemas/commands.js';
export type { TessieVehicleState } from '../schemas/tessie.js';

// ─────────────────────────────────────────────────────────────────────────────
// Output Types (normalized for MCP tools)
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleState {
  display_name: string;
  battery_level: number;
  battery_range_km: number;
  charging: {
    state: 'Disconnected' | 'Charging' | 'Complete' | 'Stopped' | string;
    minutes_remaining: number | null;
    charge_limit: number;
  };
  location: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number | null;
  };
  locked: boolean;
  sentry_mode: boolean;
  climate: {
    is_on: boolean;
    inside_temp: number;
    outside_temp: number;
    target_temp: number;
    is_defrosting: boolean;
  };
  doors: {
    front_left: boolean;
    front_right: boolean;
    rear_left: boolean;
    rear_right: boolean;
    frunk: boolean;
    trunk: boolean;
    charge_port: boolean;
  };
  state: 'online' | 'asleep' | 'offline';
  odometer_km: number;
  last_updated: string;
}

export interface TessieClientOptions {
  accessToken: string;
  vin: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL Building (functional, pure)
// ─────────────────────────────────────────────────────────────────────────────

type QueryParams = Record<string, string | number | boolean | undefined | null>;

/** Filter out undefined/null values and convert to string entries */
const toQueryEntries = (params: QueryParams): [string, string][] =>
  Object.entries(params)
    .filter(
      (entry): entry is [string, NonNullable<QueryParams[string]>] => entry[1] != null,
    )
    .map(([key, value]) => [key, String(value)]);

/** Build query string from params (empty string if no params) */
const toQueryString = (params: QueryParams): string => {
  const entries = toQueryEntries(params);
  return entries.length > 0 ? `?${new URLSearchParams(entries)}` : '';
};

/** Build full Tessie API URL */
const buildUrl = (vin: string, path: string, params: QueryParams = {}): string =>
  `${TESSIE_API_URL}/${vin}/${path}${toQueryString(params)}`;

// ─────────────────────────────────────────────────────────────────────────────
// API Response Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse and validate JSON response with Zod schema.
 * Throws descriptive error if validation fails.
 */
async function parseResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
  context: string,
): Promise<T> {
  const data: unknown = await response.json();
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    logger.error('tessie', {
      message: `Invalid ${context} response`,
      issues,
      data,
    });
    throw new Error(`Invalid ${context} response from Tessie API: ${issues}`);
  }

  return result.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tessie Client
// ─────────────────────────────────────────────────────────────────────────────

export class TessieClient {
  private http: HttpClient;
  private vin: string;

  constructor(options: TessieClientOptions) {
    this.vin = options.vin;
    this.http = createHttpClient({
      baseHeaders: {
        Authorization: `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 90000, // 90s - Tessie waits for vehicle wake
      retries: 2,
    });
  }

  /**
   * Get full vehicle state
   */
  async getState(): Promise<VehicleState> {
    const url = buildUrl(this.vin, 'state');

    logger.debug('tessie', { message: 'Fetching vehicle state', vin: this.vin });

    const response = await this.http(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tessie API error: ${response.status} - ${error}`);
    }

    const raw = await parseResponse(
      response,
      TessieVehicleStateSchema,
      'vehicle state',
    );
    return this.normalizeState(raw);
  }

  /**
   * Execute a command on the vehicle
   */
  async executeCommand(
    command: TeslaCommand,
    options?: { temperature?: number; destination?: string; locale?: string },
  ): Promise<{ success: boolean; command: string; message: string }> {
    const meta = COMMAND_META[command];

    // Build query params based on command type
    const params: Record<string, string | number | undefined> =
      command === 'set_temperature'
        ? { temperature: options?.temperature }
        : command === 'share'
          ? { value: options?.destination, locale: options?.locale }
          : {};

    const url = buildUrl(this.vin, meta.endpoint, params);

    logger.debug('tessie', { message: 'Executing command', command, vin: this.vin });

    const response = await this.http(url, { method: 'POST' });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Command failed: ${response.status} - ${error}`);
    }

    const result = await parseResponse(response, CommandResultSchema, 'command');

    // Build response message
    const message =
      command === 'set_temperature' && options?.temperature !== undefined
        ? `Temperature set to ${options.temperature}°C`
        : command === 'share' && options?.destination
          ? `Navigation to "${options.destination}" sent to vehicle`
          : meta.message;

    return {
      success: result.result,
      command,
      message: result.result ? message : `${message} (may still be processing)`,
    };
  }

  /**
   * Normalize raw Tessie state to our schema
   */
  private normalizeState(raw: TessieVehicleState): VehicleState {
    // Convert miles to km
    const milesToKm = (miles: number) => Math.round(miles * 1.60934 * 10) / 10;

    return {
      display_name: raw.display_name,
      battery_level: raw.charge_state.battery_level,
      battery_range_km: milesToKm(raw.charge_state.battery_range),
      charging: {
        state: raw.charge_state.charging_state,
        minutes_remaining: raw.charge_state.minutes_to_full_charge || null,
        charge_limit: raw.charge_state.charge_limit_soc,
      },
      location: {
        latitude: raw.drive_state.latitude,
        longitude: raw.drive_state.longitude,
        heading: raw.drive_state.heading,
        speed: raw.drive_state.speed,
      },
      locked: raw.vehicle_state.locked,
      sentry_mode: raw.vehicle_state.sentry_mode,
      climate: {
        is_on: raw.climate_state.is_climate_on,
        inside_temp: raw.climate_state.inside_temp,
        outside_temp: raw.climate_state.outside_temp,
        target_temp: raw.climate_state.driver_temp_setting,
        is_defrosting:
          raw.climate_state.defrost_mode > 0 ||
          raw.climate_state.is_front_defroster_on ||
          raw.climate_state.is_rear_defroster_on,
      },
      doors: {
        front_left: raw.vehicle_state.df === 1,
        front_right: raw.vehicle_state.pf === 1,
        rear_left: raw.vehicle_state.dr === 1,
        rear_right: raw.vehicle_state.pr === 1,
        frunk: raw.vehicle_state.ft === 1,
        trunk: raw.vehicle_state.rt === 1,
        charge_port: raw.charge_state.charge_port_door_open,
      },
      state: raw.state,
      odometer_km: milesToKm(raw.vehicle_state.odometer),
      last_updated: new Date(raw.vehicle_state.timestamp).toISOString(),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get Tessie credentials from environment
 */
function getTessieCredentials(): { accessToken: string; vin: string } {
  const accessToken = process.env.TESSIE_ACCESS_TOKEN;
  const vin = process.env.TESSIE_VIN;

  if (!accessToken) {
    throw new Error(
      'TESSIE_ACCESS_TOKEN not configured. Run: wrangler secret put TESSIE_ACCESS_TOKEN',
    );
  }

  if (!vin) {
    throw new Error('TESSIE_VIN not configured. Run: wrangler secret put TESSIE_VIN');
  }

  return { accessToken, vin };
}

/**
 * Create a Tessie client using environment credentials
 */
export function createTessieClient(): TessieClient {
  const { accessToken, vin } = getTessieCredentials();
  return new TessieClient({ accessToken, vin });
}
