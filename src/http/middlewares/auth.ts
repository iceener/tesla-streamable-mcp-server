// Auth header middleware for Hono
// Simplified for Tesla MCP - bearer token auth only

import type { HttpBindings } from '@hono/node-server';
import type { Context, MiddlewareHandler, Next } from 'hono';
import { config } from '../../config/env.js';
import type { AuthStrategyType } from '../../shared/auth/strategy.js';

/**
 * Auth context attached to Hono context.
 */
export interface AuthContext {
  /** Auth strategy in use */
  strategy: AuthStrategyType;
  /** Raw authorization headers from request */
  authHeaders: Record<string, string>;
  /** Resolved headers for API calls */
  resolvedHeaders: Record<string, string>;
}

/**
 * Auth middleware for bearer token validation.
 */
export function createAuthHeaderMiddleware(): MiddlewareHandler<{
  Bindings: HttpBindings;
}> {
  const accept = new Set(
    (config.MCP_ACCEPT_HEADERS as string[]).map((h) => h.toLowerCase()),
  );
  // Always include standard auth headers
  for (const h of ['authorization', 'x-api-key', 'x-auth-token']) {
    accept.add(h);
  }

  const strategy = config.AUTH_STRATEGY as AuthStrategyType;

  return async (c: Context, next: Next) => {
    const incoming = c.req.raw.headers;
    const forwarded: Record<string, string> = {};

    for (const [k, v] of incoming as unknown as Iterable<[string, string]>) {
      const lower = k.toLowerCase();
      if (accept.has(lower)) {
        forwarded[lower] = v;
      }
    }

    // Initialize auth context
    const authContext: AuthContext = {
      strategy,
      authHeaders: forwarded,
      resolvedHeaders: { ...forwarded },
    };

    // Attach to context for downstream handlers
    (c as unknown as { authContext: AuthContext }).authContext = authContext;

    // Legacy: attach authHeaders for backward compatibility
    (c as unknown as { authHeaders?: Record<string, string> }).authHeaders =
      authContext.resolvedHeaders;

    await next();
  };
}
