// Auth Strategy Pattern
// Supports: Bearer Token, None

/**
 * Auth strategy types supported.
 *
 * - 'bearer': Simple static Bearer token (from env)
 * - 'none': No authentication required
 */
export type AuthStrategyType = 'bearer' | 'none';

/**
 * Resolved auth headers to inject into tool context.
 */
export interface ResolvedAuth {
  /** Auth strategy used */
  strategy: AuthStrategyType;
  /** Headers to pass to API calls */
  headers: Record<string, string>;
  /** Raw access token (if bearer) */
  accessToken?: string;
}

/**
 * Strategy configuration parsed from env.
 */
export interface AuthStrategyConfig {
  type: AuthStrategyType;
  /** For bearer: the token value */
  value?: string;
}

/**
 * Parse auth strategy from config.
 *
 * Reads from:
 * - AUTH_STRATEGY: 'bearer' | 'none'
 * - BEARER_TOKEN: Static bearer token (for bearer strategy)
 */
export function parseAuthStrategy(env: Record<string, unknown>): AuthStrategyConfig {
  const strategy = (env.AUTH_STRATEGY as string)?.toLowerCase();

  if (
    strategy === 'none' ||
    env.AUTH_ENABLED === 'false' ||
    env.AUTH_ENABLED === false
  ) {
    return { type: 'none' };
  }

  // Default to bearer if BEARER_TOKEN is set
  if (env.BEARER_TOKEN) {
    return {
      type: 'bearer',
      value: env.BEARER_TOKEN as string,
    };
  }

  return { type: 'none' };
}

/**
 * Build auth headers from strategy config.
 */
export function buildAuthHeaders(
  _strategyConfig: AuthStrategyConfig,
): Record<string, string> {
  // For bearer strategy, we validate incoming token, not add headers
  return {};
}

/**
 * Resolve auth for a request.
 */
export function resolveStaticAuth(strategyConfig: AuthStrategyConfig): ResolvedAuth {
  const headers = buildAuthHeaders(strategyConfig);

  return {
    strategy: strategyConfig.type,
    headers,
    accessToken: strategyConfig.type === 'bearer' ? strategyConfig.value : undefined,
  };
}

/**
 * Check if auth strategy requires any authentication.
 */
export function requiresAuth(config: AuthStrategyConfig): boolean {
  return config.type !== 'none';
}

/**
 * Validate that required config values are present for the strategy.
 */
export function validateAuthConfig(config: AuthStrategyConfig): string[] {
  const errors: string[] = [];

  if (config.type === 'bearer' && !config.value) {
    errors.push('BEARER_TOKEN is required when AUTH_STRATEGY=bearer');
  }

  return errors;
}
