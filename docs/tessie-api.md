Authentication
One simple token that works everywhere

​
Create a token
Visit developer settings and select Generate Access Token.
​
Use your token
​
In a header
The recommended and most secure method is to pass your token in a header:
Authorization: Bearer YOUR_TOKEN
​
In the URL
For easy debugging and specific applications, it can be helpful to pass your token as the access_token query parameter instead.
Do not pass your access token in the URL on insecure networks or behind VPNs where traffic logs could potentially be snooped.
​
Examples
You can use all APIs using a single Tessie access token:
​
Tesla Fleet API
https://api.tessie.com/api/1/vehicles?access_token=YOUR_TOKEN
​
Tesla Fleet Telemetry
wss://streaming.tessie.com/YOUR_VIN?access_token=YOUR_TOKEN
​
Tessie API
https://api.tessie.com/vehicles?access_token=YOUR_TOKEN


##################


token will be passed as Authorization Header from MCP Client. # Get Vehicle

> Returns the latest state of a vehicle.

## OpenAPI

````yaml get /{vin}/state
paths:
  path: /{vin}/state
  method: get
  servers:
    - url: https://api.tessie.com
  request:
    security:
      - title: bearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
          cookie: {}
    parameters:
      path:
        vin:
          schema:
            - type: string
              required: true
              description: The associated VIN.
              deprecated: false
      query:
        use_cache:
          schema:
            - type: boolean
              description: >-
                Set to false to retrieve vehicle state in real-time. Legacy
                Model S and Model X only.
              default: true
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              id:
                allOf:
                  - type: integer
              vin:
                allOf:
                  - type: string
              id_s:
                allOf:
                  - type: string
              color:
                allOf:
                  - type: string
              state:
                allOf:
                  - type: string
              user_id:
                allOf:
                  - type: integer
              in_service:
                allOf:
                  - type: boolean
              vehicle_id:
                allOf:
                  - type: integer
              access_type:
                allOf:
                  - type: string
              api_version:
                allOf:
                  - type: integer
              drive_state:
                allOf:
                  - type: object
                    properties:
                      power:
                        type: integer
                      speed:
                        type: string
                      heading:
                        type: integer
                      latitude:
                        type: number
                      gps_as_of:
                        type: integer
                      longitude:
                        type: number
                      timestamp:
                        type: integer
                      native_type:
                        type: string
                      shift_state:
                        type: string
                      native_latitude:
                        type: number
                      native_longitude:
                        type: number
                      native_location_supported:
                        type: integer
                      active_route_destination:
                        type: string
                      active_route_energy_at_arrival:
                        type: integer
                      active_route_latitude:
                        type: number
                      active_route_longitude:
                        type: number
                      active_route_miles_to_arrival:
                        type: number
                      active_route_minutes_to_arrival:
                        type: number
                      active_route_traffic_minutes_delay:
                        type: integer
              charge_state:
                allOf:
                  - type: object
                    properties:
                      timestamp:
                        type: integer
                      charge_amps:
                        type: integer
                      charge_rate:
                        type: integer
                      battery_level:
                        type: integer
                      battery_range:
                        type: number
                      charger_power:
                        type: integer
                      trip_charging:
                        type: boolean
                      charger_phases:
                        type: string
                      charging_state:
                        type: string
                      charger_voltage:
                        type: integer
                      charge_limit_soc:
                        type: integer
                      battery_heater_on:
                        type: boolean
                      charge_port_color:
                        type: string
                      charge_port_latch:
                        type: string
                      conn_charge_cable:
                        type: string
                      est_battery_range:
                        type: number
                      fast_charger_type:
                        type: string
                      fast_charger_brand:
                        type: string
                      charge_energy_added:
                        type: number
                      charge_to_max_range:
                        type: boolean
                      ideal_battery_range:
                        type: integer
                      time_to_full_charge:
                        type: integer
                      charge_limit_soc_max:
                        type: integer
                      charge_limit_soc_min:
                        type: integer
                      charge_limit_soc_std:
                        type: integer
                      fast_charger_present:
                        type: boolean
                      usable_battery_level:
                        type: integer
                      charge_enable_request:
                        type: boolean
                      charge_port_door_open:
                        type: boolean
                      charger_pilot_current:
                        type: integer
                      preconditioning_times:
                        type: string
                      charge_current_request:
                        type: integer
                      charger_actual_current:
                        type: integer
                      minutes_to_full_charge:
                        type: integer
                      managed_charging_active:
                        type: boolean
                      off_peak_charging_times:
                        type: string
                      off_peak_hours_end_time:
                        type: integer
                      preconditioning_enabled:
                        type: boolean
                      scheduled_charging_mode:
                        type: string
                      charge_miles_added_ideal:
                        type: integer
                      charge_miles_added_rated:
                        type: number
                      max_range_charge_counter:
                        type: integer
                      not_enough_power_to_heat:
                        type: boolean
                      scheduled_departure_time:
                        type: integer
                      off_peak_charging_enabled:
                        type: boolean
                      charge_current_request_max:
                        type: integer
                      scheduled_charging_pending:
                        type: boolean
                      user_charge_enable_request:
                        type: string
                      managed_charging_start_time:
                        type: string
                      charge_port_cold_weather_mode:
                        type: string
                      scheduled_charging_start_time:
                        type: string
                      managed_charging_user_canceled:
                        type: boolean
                      scheduled_departure_time_minutes:
                        type: integer
                      scheduled_charging_start_time_app:
                        type: integer
                      supercharger_session_trip_planner:
                        type: boolean
                      pack_current:
                        type: number
                      pack_voltage:
                        type: number
                      module_temp_min:
                        type: number
                      module_temp_max:
                        type: integer
                      energy_remaining:
                        type: number
                      lifetime_energy_used:
                        type: number
              display_name:
                allOf:
                  - type: string
              gui_settings:
                allOf:
                  - type: object
                    properties:
                      timestamp:
                        type: integer
                      gui_24_hour_time:
                        type: boolean
                      show_range_units:
                        type: boolean
                      gui_range_display:
                        type: string
                      gui_distance_units:
                        type: string
                      gui_charge_rate_units:
                        type: string
                      gui_temperature_units:
                        type: string
              option_codes:
                allOf:
                  - type: string
              climate_state:
                allOf:
                  - type: object
                    properties:
                      timestamp:
                        type: integer
                      fan_status:
                        type: integer
                      inside_temp:
                        type: number
                      defrost_mode:
                        type: integer
                      outside_temp:
                        type: number
                      is_climate_on:
                        type: boolean
                      battery_heater:
                        type: boolean
                      bioweapon_mode:
                        type: boolean
                      max_avail_temp:
                        type: integer
                      min_avail_temp:
                        type: integer
                      seat_heater_left:
                        type: integer
                      hvac_auto_request:
                        type: string
                      seat_heater_right:
                        type: integer
                      is_preconditioning:
                        type: boolean
                      wiper_blade_heater:
                        type: boolean
                      climate_keeper_mode:
                        type: string
                      driver_temp_setting:
                        type: number
                      left_temp_direction:
                        type: integer
                      side_mirror_heaters:
                        type: boolean
                      is_rear_defroster_on:
                        type: boolean
                      right_temp_direction:
                        type: integer
                      is_front_defroster_on:
                        type: boolean
                      seat_heater_rear_left:
                        type: integer
                      steering_wheel_heater:
                        type: boolean
                      passenger_temp_setting:
                        type: number
                      seat_heater_rear_right:
                        type: integer
                      battery_heater_no_power:
                        type: boolean
                      is_auto_conditioning_on:
                        type: boolean
                      seat_heater_rear_center:
                        type: integer
                      cabin_overheat_protection:
                        type: string
                      seat_heater_third_row_left:
                        type: integer
                      seat_heater_third_row_right:
                        type: integer
                      remote_heater_control_enabled:
                        type: boolean
                      allow_cabin_overheat_protection:
                        type: boolean
                      supports_fan_only_cabin_overheat_protection:
                        type: boolean
              vehicle_state:
                allOf:
                  - type: object
                    properties:
                      df:
                        type: integer
                      dr:
                        type: integer
                      ft:
                        type: integer
                      pf:
                        type: integer
                      pr:
                        type: integer
                      rt:
                        type: integer
                      locked:
                        type: boolean
                      odometer:
                        type: number
                      fd_window:
                        type: integer
                      fp_window:
                        type: integer
                      rd_window:
                        type: integer
                      rp_window:
                        type: integer
                      timestamp:
                        type: integer
                      santa_mode:
                        type: integer
                      valet_mode:
                        type: boolean
                      api_version:
                        type: integer
                      car_version:
                        type: string
                      media_state:
                        type: object
                        properties:
                          remote_control_enabled:
                            type: boolean
                      sentry_mode:
                        type: boolean
                      remote_start:
                        type: boolean
                      vehicle_name:
                        type: string
                      dashcam_state:
                        type: string
                      autopark_style:
                        type: string
                      homelink_nearby:
                        type: boolean
                      is_user_present:
                        type: boolean
                      software_update:
                        type: object
                        properties:
                          status:
                            type: string
                          version:
                            type: string
                          install_perc:
                            type: integer
                          download_perc:
                            type: integer
                          expected_duration_sec:
                            type: integer
                      speed_limit_mode:
                        type: object
                        properties:
                          active:
                            type: boolean
                          pin_code_set:
                            type: boolean
                          max_limit_mph:
                            type: integer
                          min_limit_mph:
                            type: integer
                          current_limit_mph:
                            type: integer
                      tpms_pressure_fl:
                        type: string
                      tpms_pressure_fr:
                        type: string
                      tpms_pressure_rl:
                        type: string
                      tpms_pressure_rr:
                        type: string
                      autopark_state_v2:
                        type: string
                      calendar_supported:
                        type: boolean
                      last_autopark_error:
                        type: string
                      center_display_state:
                        type: integer
                      remote_start_enabled:
                        type: boolean
                      homelink_device_count:
                        type: integer
                      sentry_mode_available:
                        type: boolean
                      remote_start_supported:
                        type: boolean
                      smart_summon_available:
                        type: boolean
                      notifications_supported:
                        type: boolean
                      parsed_calendar_supported:
                        type: boolean
                      dashcam_clip_save_available:
                        type: boolean
                      summon_standby_mode_enabled:
                        type: boolean
              backseat_token:
                allOf:
                  - type: string
              vehicle_config:
                allOf:
                  - type: object
                    properties:
                      plg:
                        type: boolean
                      pws:
                        type: boolean
                      rhd:
                        type: boolean
                      car_type:
                        type: string
                      seat_type:
                        type: integer
                      timestamp:
                        type: integer
                      eu_vehicle:
                        type: boolean
                      roof_color:
                        type: string
                      utc_offset:
                        type: integer
                      wheel_type:
                        type: string
                      spoiler_type:
                        type: string
                      trim_badging:
                        type: string
                      driver_assist:
                        type: string
                      headlamp_type:
                        type: string
                      exterior_color:
                        type: string
                      rear_seat_type:
                        type: integer
                      rear_drive_unit:
                        type: string
                      third_row_seats:
                        type: string
                      car_special_type:
                        type: string
                      charge_port_type:
                        type: string
                      ece_restrictions:
                        type: boolean
                      front_drive_unit:
                        type: string
                      has_seat_cooling:
                        type: boolean
                      rear_seat_heaters:
                        type: integer
                      use_range_badging:
                        type: boolean
                      can_actuate_trunks:
                        type: boolean
                      efficiency_package:
                        type: string
                      has_air_suspension:
                        type: boolean
                      has_ludicrous_mode:
                        type: boolean
                      interior_trim_type:
                        type: string
                      sun_roof_installed:
                        type: integer
                      default_charge_to_max:
                        type: boolean
                      motorized_charge_port:
                        type: boolean
                      dashcam_clip_save_supported:
                        type: boolean
                      can_accept_navigation_requests:
                        type: boolean
              calendar_enabled:
                allOf:
                  - type: boolean
              backseat_token_updated_at:
                allOf:
                  - type: string
            refIdentifier: '#/components/schemas/CurrentState'
        examples:
          Example 1:
            value:
              id: 1492931520123456
              vin: 5YJXCAE43LF123456
              id_s: '1492931520123456'
              color: string
              state: online
              user_id: 1311857
              in_service: true
              vehicle_id: 1349238573
              access_type: OWNER
              api_version: 34
              drive_state:
                power: 0
                speed: string
                heading: 194
                latitude: 40.7484
                gps_as_of: 1643590638
                longitude: 73.9857
                timestamp: 1643590652755
                native_type: wgs
                shift_state: P
                native_latitude: 40.7484
                native_longitude: 73.9857
                native_location_supported: 1
                active_route_destination: Empire State Building
                active_route_energy_at_arrival: 81
                active_route_latitude: -1.123456
                active_route_longitude: 1.123456
                active_route_miles_to_arrival: 4.12
                active_route_minutes_to_arrival: 5.43
                active_route_traffic_minutes_delay: 0
              charge_state:
                timestamp: 1643590652755
                charge_amps: 12
                charge_rate: 0
                battery_level: 89
                battery_range: 269.01
                charger_power: 0
                trip_charging: true
                charger_phases: string
                charging_state: Complete
                charger_voltage: 0
                charge_limit_soc: 90
                battery_heater_on: true
                charge_port_color: 'Off'
                charge_port_latch: Engaged
                conn_charge_cable: SAE
                est_battery_range: 223.25
                fast_charger_type: MCSingleWireCAN
                fast_charger_brand: <invalid>
                charge_energy_added: 4.64
                charge_to_max_range: true
                ideal_battery_range: 999
                time_to_full_charge: 0
                charge_limit_soc_max: 100
                charge_limit_soc_min: 50
                charge_limit_soc_std: 90
                fast_charger_present: true
                usable_battery_level: 89
                charge_enable_request: true
                charge_port_door_open: true
                charger_pilot_current: 12
                preconditioning_times: weekdays
                charge_current_request: 12
                charger_actual_current: 0
                minutes_to_full_charge: 0
                managed_charging_active: true
                off_peak_charging_times: all_week
                off_peak_hours_end_time: 375
                preconditioning_enabled: true
                scheduled_charging_mode: 'Off'
                charge_miles_added_ideal: 4641
                charge_miles_added_rated: 14.5
                max_range_charge_counter: 0
                not_enough_power_to_heat: true
                scheduled_departure_time: 1643578200
                off_peak_charging_enabled: true
                charge_current_request_max: 12
                scheduled_charging_pending: true
                user_charge_enable_request: string
                managed_charging_start_time: string
                charge_port_cold_weather_mode: string
                scheduled_charging_start_time: string
                managed_charging_user_canceled: true
                scheduled_departure_time_minutes: 810
                scheduled_charging_start_time_app: 817
                supercharger_session_trip_planner: true
                pack_current: -0.7
                pack_voltage: 419.79
                module_temp_min: 25.5
                module_temp_max: 26
                energy_remaining: 51.26
                lifetime_energy_used: 5224.713
              display_name: Seneca
              gui_settings:
                timestamp: 1643590652755
                gui_24_hour_time: true
                show_range_units: true
                gui_range_display: Rated
                gui_distance_units: mi/hr
                gui_charge_rate_units: kW
                gui_temperature_units: F
              option_codes: >-
                AD15MDL3PBSBRENABT37ID3WRF3GS3PBDRLHDV2WW39BAPF0COUSBC3BCH07PC30FC3PFG31GLFRHL31HM31IL31LTPBMR31FM3BRS3HSA3PSTCPSC04SU3CT3CATW00TM00UT3PWR00AU3PAPH3AF00ZCSTMI00CDM0
              climate_state:
                timestamp: 1643590652755
                fan_status: 0
                inside_temp: 24.3
                defrost_mode: 0
                outside_temp: 17.5
                is_climate_on: true
                battery_heater: true
                bioweapon_mode: true
                max_avail_temp: 28
                min_avail_temp: 15
                seat_heater_left: 0
                hvac_auto_request: 'On'
                seat_heater_right: 0
                is_preconditioning: true
                wiper_blade_heater: true
                climate_keeper_mode: 'off'
                driver_temp_setting: 22.8
                left_temp_direction: 0
                side_mirror_heaters: true
                is_rear_defroster_on: true
                right_temp_direction: 0
                is_front_defroster_on: true
                seat_heater_rear_left: 0
                steering_wheel_heater: true
                passenger_temp_setting: 22.8
                seat_heater_rear_right: 0
                battery_heater_no_power: true
                is_auto_conditioning_on: true
                seat_heater_rear_center: 0
                cabin_overheat_protection: 'On'
                seat_heater_third_row_left: 0
                seat_heater_third_row_right: 0
                remote_heater_control_enabled: true
                allow_cabin_overheat_protection: true
                supports_fan_only_cabin_overheat_protection: true
              vehicle_state:
                df: 0
                dr: 0
                ft: 0
                pf: 0
                pr: 0
                rt: 0
                locked: true
                odometer: 14096.485641
                fd_window: 0
                fp_window: 0
                rd_window: 0
                rp_window: 0
                timestamp: 1643590652755
                santa_mode: 0
                valet_mode: true
                api_version: 34
                car_version: 2022.4 fae2af490933
                media_state:
                  remote_control_enabled: true
                sentry_mode: true
                remote_start: true
                vehicle_name: Seneca
                dashcam_state: Unavailable
                autopark_style: standard
                homelink_nearby: true
                is_user_present: true
                software_update:
                  status: available
                  version: '2022.4'
                  install_perc: 1
                  download_perc: 0
                  expected_duration_sec: 2700
                speed_limit_mode:
                  active: true
                  pin_code_set: true
                  max_limit_mph: 90
                  min_limit_mph: 50
                  current_limit_mph: 84
                tpms_pressure_fl: string
                tpms_pressure_fr: string
                tpms_pressure_rl: string
                tpms_pressure_rr: string
                autopark_state_v2: standby
                calendar_supported: true
                last_autopark_error: no_error
                center_display_state: 0
                remote_start_enabled: true
                homelink_device_count: 0
                sentry_mode_available: true
                remote_start_supported: true
                smart_summon_available: true
                notifications_supported: true
                parsed_calendar_supported: true
                dashcam_clip_save_available: true
                summon_standby_mode_enabled: true
              backseat_token: string
              vehicle_config:
                plg: true
                pws: true
                rhd: true
                car_type: modelx
                seat_type: 0
                timestamp: 1643590652755
                eu_vehicle: true
                roof_color: None
                utc_offset: -28800
                wheel_type: Turbine22Dark
                spoiler_type: Passive
                trim_badging: p100d
                driver_assist: TeslaAP3
                headlamp_type: Led
                exterior_color: Pearl
                rear_seat_type: 7
                rear_drive_unit: Large
                third_row_seats: FuturisFoldFlat
                car_special_type: base
                charge_port_type: US
                ece_restrictions: true
                front_drive_unit: PermanentMagnet
                has_seat_cooling: true
                rear_seat_heaters: 3
                use_range_badging: true
                can_actuate_trunks: true
                efficiency_package: Default
                has_air_suspension: true
                has_ludicrous_mode: true
                interior_trim_type: AllBlack
                sun_roof_installed: 0
                default_charge_to_max: true
                motorized_charge_port: true
                dashcam_clip_save_supported: true
                can_accept_navigation_requests: true
              calendar_enabled: true
              backseat_token_updated_at: string
        description: Success
  deprecated: false
  type: path
components:
  schemas: {}

````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://developer.tessie.com/llms.txtVehicle Data
Get Battery
Returns the state of a vehicle’s battery.

GET
/
{vin}
/
battery

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Response
200 - application/json
Success

​
timestamp
integer
​
battery_level
number
​
battery_range
number
​
ideal_battery_range
number
​
phantom_drain_percent
number
​
energy_remaining
number
​
lifetime_energy_used
number
​
pack_current
number
​
pack_voltage
number
​
module_temp_min
number
​
module_temp_max
integercurl --request GET \
  --url https://api.tessie.com/{vin}/battery \
  --header 'Authorization: Bearer <token>'

200

Copy
{
  "timestamp": 1710785350,
  "battery_level": 89.828,
  "battery_range": 273.47,
  "ideal_battery_range": 273.47,
  "phantom_drain_percent": 1,
  "energy_remaining": 85.5,
  "lifetime_energy_used": 3266.888,
  "pack_current": -0.6,
  "pack_voltage": 451.61,
  "module_temp_min": 20.5,
  "module_temp_max": 21
}Get Drives
Returns the drives for a vehicle.

GET
/
{vin}
/
drives

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
distance_format
enum<string>default:mi
Whether to return data in miles or kilometers.

Available options: mi, km 
​
temperature_format
enum<string>default:c
Whether to return data in Fahrenheit or Celsius.

Available options: c, f 
​
from
number
The start of the timeframe. Unix timestamp in seconds.

​
to
number
The end of the timeframe. Unix timestamp in seconds.

​
timezone
stringdefault:UTC
The IANA timezone name.

​
origin_latitude
number
The latitude of the starting point.

Example:
37.4925

​
origin_longitude
number
The longitude of the starting point.

Example:
121.9447

​
origin_radius
number
The radius from the starting point, in meters.

Example:
80

​
exclude_origin
booleandefault:false
Whether to exclude the starting point.

​
destination_latitude
number
The latitude of the ending point.

Example:
37.4925

​
destination_longitude
number
The longitude of the ending point.

Example:
121.9447

​
destination_radius
number
The included radius from the ending point, in meters.

Example:
80

​
exclude_destination
booleandefault:false
Whether to exclude the ending point.

​
tag
string
The tag associated with the drive.

Example:
"Work"

​
exclude_tag
booleandefault:false
Whether to exclude the tag.

​
driver_profile
string
The driver profile associated with the drive.

Example:
"John"

​
exclude_driver_profile
booleandefault:false
Whether to exclude the driver profile.

​
format
enum<string>default:json
Whether to output the results in JSON or CSV.

Available options: json, csv 
​
minimum_distance
number
The minimum distance driven, in miles.

Example:
0.1

​
limit
number
The maximum number of results.

Response
200 - application/json
Success

​
results
Drive · object[]
Hide child attributes

​
id
numberrequired
​
started_at
numberrequired
​
ended_at
numberrequired
​
starting_location
stringrequired
​
starting_latitude
numberrequired
​
starting_longitude
numberrequired
​
ending_location
stringrequired
​
ending_latitude
numberrequired
​
ending_longitude
numberrequired
​
starting_battery
numberrequired
​
ending_battery
numberrequired
​
rated_range_used
numberrequired
​
odometer_distance
numberrequired
​
energy_used
numberrequired
​
tag
string | nullrequired
​
average_inside_temperature
number
​
average_outside_temperature
number
​
average_speed
number
​
max_speed
number
​
autopilot_distance
number | nullGet Driving Path
Returns the driving path of a vehicle during a given timeframe.

If no timeframe is specified, returns the driving path for the last 30 days.

GET
/
{vin}
/
path

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
from
number
The start of the timeframe. Unix timestamp in seconds.

​
to
number
The end of the timeframe. Unix timestamp in seconds.

​
separate
booleandefault:false
Whether the path should be separated by individual drives.

​
simplify
booleandefault:true
Whether the path should be simplified to reduce the number of points.

​
details
booleandefault:false
Whether the path should include details like timestamps, speeds and headings.

Response
200 - application/json
Success

​
results
any[]Set Drive Tag
Sets the tag for a list of drives.

POST
/
{vin}
/
drives
/
set_tag

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Body
application/json
​
drives
stringrequired
A list of drive IDs.

Example:
"10000,10001,10002"

​
tag
string
The tag to apply to the drives.

Response
200 - application/json
Success

​
result
booleanrequiredGet Status
Returns the status of a vehicle.

The status may be asleep, waiting_for_sleep or awake.

GET
/
{vin}
/
status

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Response
200 - application/json
Success

​
status
enum<string>
Available options: asleep, waiting_for_sleep, awake 
Example:
"asleep"Wake
Wakes the vehicle from sleep.

Returns true after the vehicle is awake, or false after a 90 second timeout.

POST
/
{vin}
/
wake

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Response
200 - application/json
Success

​
result
booleanLock
Locks the vehicle.

POST
/
{vin}
/
command
/
lock

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.

Wake
Vehicle Commands
Unlock
Unlocks the vehicle.

POST
/
{vin}
/
command
/
unlock

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Front Trunk
Opens the front trunk.

POST
/
{vin}
/
command
/
activate_front_trunk

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Rear Trunk
Opens the rear trunk, or closes it if the trunk is open and the vehicle has a powered trunk.

POST
/
{vin}
/
command
/
activate_rear_trunk

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Start Climate
Starts the climate system and preconditions the battery.

POST
/
{vin}
/
command
/
start_climate

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Start Climate
Starts the climate system and preconditions the battery.

POST
/
{vin}
/
command
/
start_climate

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Stop Climate
Stops the climate system.

POST
/
{vin}
/
command
/
stop_climate

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Set Temperature
Sets the cabin temperature.

POST
/
{vin}
/
command
/
set_temperatures

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

​
temperature
numberrequired
The temperature in Celsius.

Required range: 15 <= x <= 28
Example:
23

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Set Seat Heating
Sets the seat heating level.

POST
/
{vin}
/
command
/
set_seat_heat

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

​
seat
enum<string>required
The name of the seat, or "all".

Available options: front_left, front_right, rear_lefta, rear_center, rear_right, third_row_left, third_row_right 
Example:
"front_left"

​
level
numberdefault:3
The heating level. Set to 0 to turn off.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Set Seat Cooling
Sets the seat cooling level.

POST
/
{vin}
/
command
/
set_seat_cool

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

​
seat
enum<string>required
The name of the seat, or "all".

Available options: front_left, front_right, rear_lefta, rear_center, rear_right, third_row_left, third_row_right 
Example:
"front_left"

​
level
numberdefault:3
The cooling level. Set to 0 to turn off.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.

Set Seat Heating
Start Defrost
Starts defrosting.

POST
/
{vin}
/
command
/
start_max_defrost

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Stop Defrost
Stops defrosting.

POST
/
{vin}
/
command
/
stop_max_defrost

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Vehicle Commands
Start Steering Wheel Heater
Starts the steering wheel heater.

POST
/
{vin}
/
command
/
start_steering_wheel_heater

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Stop Steering Wheel Heater
Stops the steering wheel heater.

POST
/
{vin}
/
command
/
stop_steering_wheel_heater

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Set Bio Defense Mode
Sets Bioweapon Defense Mode.

POST
/
{vin}
/
command
/
set_bioweapon_mode

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

​
on
booleanrequired
Whether to enable Bioweapon Defense Mode.

Example:
true

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Open Charge Port
Opens the charge port if it’s closed, or unlocks it if it’s open.

POST
/
{vin}
/
command
/
open_charge_port

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Close Charge Port
Closes the charge port.

POST
/
{vin}
/
command
/
close_charge_port

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Flash Lights
Flashes the lights.

POST
/
{vin}
/
command
/
flash

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Honk
Honks the horn.

POST
/
{vin}
/
command
/
honk

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Enable Sentry Mode
Enables Sentry Mode.

POST
/
{vin}
/
command
/
enable_sentry

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.Disable Sentry Mode
Disables Sentry Mode.

POST
/
{vin}
/
command
/
disable_sentry

Try it
Authorizations
​
Authorization
stringheaderrequired
Bearer authentication header of the form Bearer <token>, where <token> is your auth token.

Path Parameters
​
vin
stringrequired
The associated VIN.

Query Parameters
​
wait_for_completion
booleandefault:true
Whether to wait for the command to complete before returning a response.

Response
200 - application/json
Success

​
result
boolean
Whether the command was successful.

Enable Sentry Mode
