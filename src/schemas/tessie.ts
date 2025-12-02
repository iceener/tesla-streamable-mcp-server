/**
 * Tessie API response schemas.
 * Runtime validation for external API responses.
 *
 * Note: We use .passthrough() instead of .strict() because
 * Tessie API returns many fields we don't use. We only validate
 * the fields we need.
 */

import { z } from 'zod';

/** Raw vehicle state from Tessie API */
export const TessieVehicleStateSchema = z
  .object({
    id: z.number().describe('Internal Tessie vehicle ID'),
    vin: z.string().describe('Vehicle Identification Number'),
    display_name: z.string().describe('User-configured vehicle name'),
    state: z
      .enum(['online', 'asleep', 'offline'])
      .describe('Vehicle connectivity state'),
    drive_state: z
      .object({
        latitude: z.number().describe('GPS latitude in degrees'),
        longitude: z.number().describe('GPS longitude in degrees'),
        heading: z.number().describe('Compass heading in degrees (0-360)'),
        speed: z.number().nullable().describe('Speed in mph, null if stationary'),
        power: z.number().describe('Power consumption in kW'),
        shift_state: z.string().nullable().describe('Gear state: D, R, P, N, or null'),
        timestamp: z.number().describe('Unix timestamp ms of last update'),
      })
      .passthrough(), // Allow extra fields from API
    charge_state: z
      .object({
        battery_level: z.number().describe('Battery percentage (0-100)'),
        battery_range: z.number().describe('Estimated range in miles'),
        charging_state: z
          .string()
          .describe('Charging status: Disconnected, Charging, Complete, Stopped'),
        minutes_to_full_charge: z.number().describe('Minutes until 100% charge'),
        charge_limit_soc: z.number().describe('Charge limit percentage'),
        charge_port_door_open: z.boolean().describe('Is charge port door open'),
        charger_power: z.number().describe('Charger power in kW'),
        charger_voltage: z.number().describe('Charger voltage'),
        charge_rate: z.number().describe('Charge rate in miles/hour'),
      })
      .passthrough(), // Allow extra fields from API
    climate_state: z
      .object({
        inside_temp: z.number().describe('Interior temperature in Celsius'),
        outside_temp: z.number().describe('Exterior temperature in Celsius'),
        driver_temp_setting: z.number().describe('Target temperature in Celsius'),
        is_climate_on: z.boolean().describe('Is HVAC running'),
        defrost_mode: z.number().describe('Defrost mode (0=off, >0=on)'),
        is_front_defroster_on: z.boolean().describe('Front windshield defrost'),
        is_rear_defroster_on: z.boolean().describe('Rear window defrost'),
      })
      .passthrough(), // Allow extra fields from API
    vehicle_state: z
      .object({
        locked: z.boolean().describe('Are doors locked'),
        odometer: z.number().describe('Odometer reading in miles'),
        sentry_mode: z.boolean().describe('Is sentry mode active'),
        df: z.number().describe('Driver front door: 0=closed, 1=open'),
        dr: z.number().describe('Driver rear door: 0=closed, 1=open'),
        pf: z.number().describe('Passenger front door: 0=closed, 1=open'),
        pr: z.number().describe('Passenger rear door: 0=closed, 1=open'),
        ft: z.number().describe('Front trunk (frunk): 0=closed, 1=open'),
        rt: z.number().describe('Rear trunk: 0=closed, 1=open'),
        timestamp: z.number().describe('Unix timestamp ms of last update'),
      })
      .passthrough(), // Allow extra fields from API
  })
  .passthrough(); // Allow extra fields at root level

export type TessieVehicleState = z.infer<typeof TessieVehicleStateSchema>;

/** Command result from Tessie API */
export const CommandResultSchema = z
  .object({
    result: z.boolean().describe('True if command was accepted by vehicle'),
  })
  .passthrough(); // Allow extra fields from API

export type CommandResult = z.infer<typeof CommandResultSchema>;
