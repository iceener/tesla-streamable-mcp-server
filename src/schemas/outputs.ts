/**
 * Tool output schemas.
 * Define the shape of data returned by MCP tools.
 */

import { z } from 'zod';

/**
 * Tesla vehicle state output schema.
 * Normalized from Tessie API response.
 */
export const TeslaStateOutput = z
  .object({
    display_name: z.string().describe('User-configured vehicle name'),
    battery_level: z.number().describe('Battery percentage (0-100)'),
    battery_range_km: z.number().describe('Estimated range in kilometers'),
    charging: z
      .object({
        state: z
          .string()
          .describe('Charging status: Disconnected, Charging, Complete, Stopped'),
        minutes_remaining: z
          .number()
          .nullable()
          .describe('Minutes until charge complete, null if not charging'),
        charge_limit: z.number().describe('Target charge percentage'),
      })
      .strict(),
    location: z
      .object({
        latitude: z.number().describe('GPS latitude in degrees'),
        longitude: z.number().describe('GPS longitude in degrees'),
        heading: z.number().describe('Compass heading (0-360°)'),
        speed: z.number().nullable().describe('Speed in km/h, null if stationary'),
      })
      .strict(),
    locked: z.boolean().describe('True if doors are locked'),
    sentry_mode: z.boolean().describe('True if sentry mode is active'),
    climate: z
      .object({
        is_on: z.boolean().describe('True if HVAC is running'),
        inside_temp: z.number().describe('Interior temperature in °C'),
        outside_temp: z.number().describe('Exterior temperature in °C'),
        target_temp: z.number().describe('Target cabin temperature in °C'),
        is_defrosting: z.boolean().describe('True if any defrost mode is active'),
      })
      .strict(),
    doors: z
      .object({
        front_left: z.boolean().describe('True if open'),
        front_right: z.boolean().describe('True if open'),
        rear_left: z.boolean().describe('True if open'),
        rear_right: z.boolean().describe('True if open'),
        frunk: z.boolean().describe('True if front trunk is open'),
        trunk: z.boolean().describe('True if rear trunk is open'),
        charge_port: z.boolean().describe('True if charge port door is open'),
      })
      .strict(),
    state: z
      .enum(['online', 'asleep', 'offline'])
      .describe(
        'Vehicle connectivity: online, asleep (can wake), offline (unreachable)',
      ),
    odometer_km: z.number().describe('Total distance driven in kilometers'),
    last_updated: z.string().describe('ISO 8601 timestamp of last data update'),
  })
  .strict();

export type TeslaStateOutput = z.infer<typeof TeslaStateOutput>;

/**
 * Tesla command output schema.
 * Result of executing a vehicle command.
 */
export const TeslaCommandOutput = z
  .object({
    success: z.boolean().describe('True if command was accepted by vehicle'),
    command: z.string().describe('Command that was executed'),
    message: z.string().describe('Human-readable result message'),
  })
  .strict();

export type TeslaCommandOutput = z.infer<typeof TeslaCommandOutput>;
