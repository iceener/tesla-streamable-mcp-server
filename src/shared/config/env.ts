// Unified config reader for both Node.js and Cloudflare Workers
// Simplified for Tesla MCP - bearer token auth only

import type { AuthStrategyType } from '../auth/strategy.js';

export type UnifiedConfig = {
  // Server
  HOST: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // MCP
  MCP_TITLE: string;
  MCP_INSTRUCTIONS: string;
  MCP_VERSION: string;
  MCP_PROTOCOL_VERSION: string;
  MCP_ACCEPT_HEADERS: string[];

  // Auth Strategy
  AUTH_STRATEGY: AuthStrategyType;
  AUTH_ENABLED: boolean;

  // Bearer token auth (AUTH_STRATEGY=bearer)
  BEARER_TOKEN?: string;

  // Tessie API
  TESSIE_ACCESS_TOKEN?: string;
  TESSIE_VIN?: string;

  // Storage
  RS_TOKENS_FILE?: string;
  /** Base64url-encoded 32-byte key for encrypting tokens at rest */
  RS_TOKENS_ENC_KEY?: string;

  // Rate limiting
  RPS_LIMIT: number;
  CONCURRENCY_LIMIT: number;

  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warning' | 'error';
};

function parseBoolean(value: unknown): boolean {
  return String(value || 'false').toLowerCase() === 'true';
}

function parseNumber(value: unknown, defaultValue: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}

function parseStringArray(value: unknown): string[] {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Determine auth strategy from env.
 */
function parseAuthStrategy(env: Record<string, unknown>): AuthStrategyType {
  const explicit = (env.AUTH_STRATEGY as string)?.toLowerCase();
  if (explicit === 'bearer' || explicit === 'none') {
    return explicit;
  }

  // Default to bearer if BEARER_TOKEN is set
  if (env.BEARER_TOKEN) {
    return 'bearer';
  }

  // If AUTH_ENABLED is true, default to bearer
  if (parseBoolean(env.AUTH_ENABLED)) {
    return 'bearer';
  }

  return 'none';
}

/**
 * Parse environment variables into a unified config object
 * Works for both process.env (Node.js) and Workers env bindings
 */
export function parseConfig(env: Record<string, unknown>): UnifiedConfig {
  const authStrategy = parseAuthStrategy(env);

  return {
    HOST: String(env.HOST || '127.0.0.1'),
    PORT: parseNumber(env.PORT, 3000),
    NODE_ENV: (env.NODE_ENV as UnifiedConfig['NODE_ENV']) || 'development',

    MCP_TITLE: String(env.MCP_TITLE || 'Tesla MCP Server'),
    MCP_INSTRUCTIONS: String(
      env.MCP_INSTRUCTIONS ||
        'Use these tools to control your Tesla vehicle. Be careful with commands that affect vehicle state.',
    ),
    MCP_VERSION: String(env.MCP_VERSION || '1.0.0'),
    MCP_PROTOCOL_VERSION: String(env.MCP_PROTOCOL_VERSION || '2025-06-18'),
    MCP_ACCEPT_HEADERS: parseStringArray(env.MCP_ACCEPT_HEADERS),

    // Auth Strategy
    AUTH_STRATEGY: authStrategy,
    AUTH_ENABLED: authStrategy === 'bearer' || parseBoolean(env.AUTH_ENABLED),

    // Bearer token auth
    BEARER_TOKEN: env.BEARER_TOKEN as string | undefined,

    // Tessie API
    TESSIE_ACCESS_TOKEN: env.TESSIE_ACCESS_TOKEN as string | undefined,
    TESSIE_VIN: env.TESSIE_VIN as string | undefined,

    RS_TOKENS_FILE: env.RS_TOKENS_FILE as string | undefined,
    RS_TOKENS_ENC_KEY: env.RS_TOKENS_ENC_KEY as string | undefined,

    RPS_LIMIT: parseNumber(env.RPS_LIMIT, 10),
    CONCURRENCY_LIMIT: parseNumber(env.CONCURRENCY_LIMIT, 5),

    LOG_LEVEL: (env.LOG_LEVEL as UnifiedConfig['LOG_LEVEL']) || 'info',
  };
}

export function resolveConfig(): UnifiedConfig {
  return parseConfig(process.env as Record<string, unknown>);
}
