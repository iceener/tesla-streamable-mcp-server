// Workers adapter for MCP security
// Bearer token authentication for Tesla MCP

import type { UnifiedConfig } from '../../shared/config/env.js';
import { withCors } from '../../shared/http/cors.js';
import {
  buildUnauthorizedChallenge,
  validateOrigin,
  validateProtocolVersion,
} from '../../shared/mcp/security.js';

/**
 * Check if request needs authentication and challenge if missing.
 * Returns null if authorized, otherwise returns 401 challenge response.
 */
export async function checkAuthAndChallenge(
  request: Request,
  config: UnifiedConfig,
  sid: string,
): Promise<Response | null> {
  try {
    validateOrigin(request.headers, config.NODE_ENV === 'development');
    validateProtocolVersion(request.headers, config.MCP_PROTOCOL_VERSION);
  } catch (error) {
    // Validation errors should be 400 Bad Request, not 401
    const resp = new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: (error as Error).message,
        },
        id: null,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': sid,
        },
      },
    );
    return withCors(resp);
  }

  if (!config.AUTH_ENABLED) {
    return null;
  }

  const authHeader = request.headers.get('Authorization');

  // Challenge if no auth header present
  if (!authHeader) {
    const origin = new URL(request.url).origin;
    const challenge = buildUnauthorizedChallenge({ origin, sid });

    const resp = new Response(JSON.stringify(challenge.body), {
      status: challenge.status,
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sid,
        'WWW-Authenticate': challenge.headers['WWW-Authenticate'],
      },
    });
    return withCors(resp);
  }

  // Bearer token strategy: validate against BEARER_TOKEN secret
  if (config.AUTH_STRATEGY === 'bearer' && config.BEARER_TOKEN) {
    const match = authHeader.match(/^\s*Bearer\s+(.+)$/i);
    const providedToken = match?.[1];

    if (providedToken !== config.BEARER_TOKEN) {
      const origin = new URL(request.url).origin;
      const challenge = buildUnauthorizedChallenge({
        origin,
        sid,
        message: 'Invalid bearer token',
      });

      const resp = new Response(JSON.stringify(challenge.body), {
        status: challenge.status,
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': sid,
          'WWW-Authenticate': challenge.headers['WWW-Authenticate'],
        },
      });
      return withCors(resp);
    }

    // Token is valid
    return null;
  }

  return null;
}
