// Hono adapter for MCP security middleware
// Simplified for Tesla MCP - bearer token auth only

import { randomUUID } from 'node:crypto';
import type { HttpBindings } from '@hono/node-server';
import type { Context, MiddlewareHandler, Next } from 'hono';
import type { UnifiedConfig } from '../../shared/config/env.js';
import {
  buildUnauthorizedChallenge,
  validateOrigin,
  validateProtocolVersion,
} from '../../shared/mcp/security.js';
import { sharedLogger as logger } from '../../shared/utils/logger.js';

export function createMcpSecurityMiddleware(config: UnifiedConfig): MiddlewareHandler<{
  Bindings: HttpBindings;
}> {
  return async (c: Context, next: Next) => {
    try {
      validateOrigin(c.req.raw.headers, config.NODE_ENV === 'development');
      validateProtocolVersion(c.req.raw.headers, config.MCP_PROTOCOL_VERSION);

      if (config.AUTH_ENABLED) {
        const auth = c.req.header('Authorization') ?? undefined;

        // Challenge clients without Authorization and bind a session id
        if (!auth) {
          let sid = c.req.header('Mcp-Session-Id') ?? undefined;
          if (!sid) {
            sid = randomUUID();
            logger.debug('mcp_security', { message: 'Generated session ID', sid });
          }

          const origin = new URL(c.req.url).origin;
          const challenge = buildUnauthorizedChallenge({ origin, sid });

          c.header('Mcp-Session-Id', sid);
          c.header('WWW-Authenticate', challenge.headers['WWW-Authenticate']);

          return c.json(challenge.body, challenge.status);
        }

        // Validate bearer token against config
        if (config.AUTH_STRATEGY === 'bearer' && config.BEARER_TOKEN) {
          const match = auth.match(/^\s*Bearer\s+(.+)$/i);
          const providedToken = match?.[1];

          if (providedToken !== config.BEARER_TOKEN) {
            const sid = c.req.header('Mcp-Session-Id') ?? randomUUID();
            const origin = new URL(c.req.url).origin;
            const challenge = buildUnauthorizedChallenge({
              origin,
              sid,
              message: 'Invalid bearer token',
            });

            c.header('Mcp-Session-Id', sid);
            c.header('WWW-Authenticate', challenge.headers['WWW-Authenticate']);

            logger.debug('mcp_security', { message: 'Invalid bearer token' });
            return c.json(challenge.body, challenge.status);
          }

          // Token is valid - set auth context
          const authContext = {
            strategy: 'bearer' as const,
            authHeaders: { authorization: auth },
            resolvedHeaders: { authorization: auth },
          };
          (c as unknown as { authContext: typeof authContext }).authContext =
            authContext;
        }
      }

      return next();
    } catch (error) {
      logger.error('mcp_security', {
        message: 'Security check failed',
        error: (error as Error).message,
      });

      return c.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: (error as Error).message || 'Internal server error',
          },
          id: null,
        },
        500,
      );
    }
  };
}
