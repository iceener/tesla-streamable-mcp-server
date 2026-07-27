export type RuntimeEnvironment = 'development' | 'production' | 'test';
export type LegacyMode = 'stateless' | 'reject';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error';
export type AuthStrategy = 'bearer' | 'none';

export interface AppConfig {
  HOST: string;
  PORT: number;
  NODE_ENV: RuntimeEnvironment;
  LOG_LEVEL: LogLevel;
  MCP_NAME: string;
  MCP_TITLE: string;
  MCP_VERSION: string;
  MCP_INSTRUCTIONS: string;
  MCP_PUBLIC_URL: URL;
  MCP_ALLOWED_HOSTS: string[];
  MCP_ALLOWED_ORIGIN_HOSTNAMES: string[];
  MCP_LEGACY_MODE: LegacyMode;
  MCP_MAX_REQUEST_BYTES: number;
  MCP_ACCEPT_HEADERS: string[];
  AUTH_STRATEGY: AuthStrategy;
  AUTH_ENABLED: boolean;
  BEARER_TOKEN?: string;
  MCP_AUTH_HEADER: 'bearer';
  TESSIE_ACCESS_TOKEN?: string;
  TESSIE_VIN?: string;
  RS_TOKENS_FILE?: string;
  RS_TOKENS_ENC_KEY?: string;
  RPS_LIMIT: number;
  CONCURRENCY_LIMIT: number;
}

function stringValue(env: Record<string, unknown>, key: string, fallback = ''): string {
  const value = env[key];
  return value === undefined || value === null || value === ''
    ? fallback
    : String(value).trim();
}
function booleanValue(
  env: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = stringValue(env, key);
  if (!value) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true;
  if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false;
  throw new Error(`${key} must be true or false`);
}
function integerValue(
  env: Record<string, unknown>,
  key: string,
  fallback: number,
  maximum = 65_535,
): number {
  const value = Number(stringValue(env, key, String(fallback)));
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${key} must be an integer between 1 and ${maximum}`);
  }
  return value;
}
function listValue(
  env: Record<string, unknown>,
  key: string,
  fallback: string[],
): string[] {
  const value = stringValue(env, key);
  if (!value) return [...fallback];
  return [
    ...new Set(
      value
        .split(/[ ,]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}
function enumValue<T extends string>(
  env: Record<string, unknown>,
  key: string,
  values: readonly T[],
  fallback: T,
): T {
  const value = stringValue(env, key, fallback) as T;
  if (!values.includes(value))
    throw new Error(`${key} must be one of: ${values.join(', ')}`);
  return value;
}
function publicUrlValue(
  env: Record<string, unknown>,
  port: number,
  environment: RuntimeEnvironment,
): URL {
  const configured = stringValue(env, 'MCP_PUBLIC_URL');
  if (environment === 'production' && !configured)
    throw new Error('MCP_PUBLIC_URL is required in production');
  let url: URL;
  try {
    url = new URL(configured || `http://localhost:${port}/mcp`);
  } catch {
    throw new Error('MCP_PUBLIC_URL must be an absolute URL');
  }
  if (url.search || url.hash)
    throw new Error('MCP_PUBLIC_URL must not include a query string or fragment');
  if (
    environment === 'production' &&
    url.protocol !== 'https:' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  ) {
    throw new Error('MCP_PUBLIC_URL must use HTTPS in production');
  }
  return url;
}

export function parseConfig(env: Record<string, unknown>): AppConfig {
  const port = integerValue(env, 'PORT', 3000);
  const environment = enumValue(
    env,
    'NODE_ENV',
    ['development', 'production', 'test'] as const,
    'development',
  );
  const publicUrl = publicUrlValue(env, port, environment);
  const defaultHosts = [publicUrl.hostname];
  if (environment !== 'production')
    defaultHosts.push('localhost', '127.0.0.1', '[::1]');
  const title = stringValue(env, 'MCP_TITLE', 'Tesla MCP Server');
  const explicitlyDisabled = stringValue(env, 'AUTH_STRATEGY').toLowerCase() === 'none';
  const authEnabled =
    !explicitlyDisabled &&
    booleanValue(env, 'AUTH_ENABLED', Boolean(stringValue(env, 'BEARER_TOKEN')));

  return {
    HOST: stringValue(env, 'HOST', '127.0.0.1'),
    PORT: port,
    NODE_ENV: environment,
    LOG_LEVEL: enumValue(
      env,
      'LOG_LEVEL',
      ['debug', 'info', 'warning', 'error'] as const,
      'info',
    ),
    MCP_NAME: stringValue(env, 'MCP_NAME', title),
    MCP_TITLE: title,
    MCP_VERSION: stringValue(env, 'MCP_VERSION', '1.0.0'),
    MCP_INSTRUCTIONS: stringValue(
      env,
      'MCP_INSTRUCTIONS',
      'Use these tools to control your Tesla vehicle. Be careful with commands that affect vehicle state.',
    ),
    MCP_PUBLIC_URL: publicUrl,
    MCP_ALLOWED_HOSTS: listValue(env, 'MCP_ALLOWED_HOSTS', defaultHosts),
    MCP_ALLOWED_ORIGIN_HOSTNAMES: listValue(
      env,
      'MCP_ALLOWED_ORIGIN_HOSTNAMES',
      defaultHosts,
    ),
    MCP_LEGACY_MODE: enumValue(
      env,
      'MCP_LEGACY_MODE',
      ['stateless', 'reject'] as const,
      'stateless',
    ),
    MCP_MAX_REQUEST_BYTES: integerValue(
      env,
      'MCP_MAX_REQUEST_BYTES',
      1_048_576,
      10_485_760,
    ),
    MCP_ACCEPT_HEADERS: listValue(env, 'MCP_ACCEPT_HEADERS', []),
    AUTH_STRATEGY: authEnabled ? 'bearer' : 'none',
    AUTH_ENABLED: authEnabled,
    BEARER_TOKEN: stringValue(env, 'BEARER_TOKEN') || undefined,
    MCP_AUTH_HEADER: 'bearer',
    TESSIE_ACCESS_TOKEN: stringValue(env, 'TESSIE_ACCESS_TOKEN') || undefined,
    TESSIE_VIN: stringValue(env, 'TESSIE_VIN') || undefined,
    RS_TOKENS_FILE: stringValue(env, 'RS_TOKENS_FILE') || undefined,
    RS_TOKENS_ENC_KEY: stringValue(env, 'RS_TOKENS_ENC_KEY') || undefined,
    RPS_LIMIT: integerValue(env, 'RPS_LIMIT', 10),
    CONCURRENCY_LIMIT: integerValue(env, 'CONCURRENCY_LIMIT', 5),
  };
}
