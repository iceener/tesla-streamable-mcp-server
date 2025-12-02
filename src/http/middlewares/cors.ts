// CORS middleware for Hono - uses built-in cors() helper

import { cors } from 'hono/cors';

/**
 * CORS middleware configured for MCP endpoints.
 * Uses Hono's built-in cors() middleware.
 *
 * Note: Preflight returns 204 (Hono default) vs original 200.
 * Both are valid per CORS spec - browsers accept either.
 */
export const corsMiddleware = () =>
  cors({
    origin: (origin) => origin || 'http://localhost',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Mcp-Session-Id',
      'MCP-Protocol-Version',
      'Mcp-Protocol-Version',
      'X-Api-Key',
      'X-Auth-Token',
    ],
    exposeHeaders: ['Mcp-Session-Id', 'WWW-Authenticate'],
  });
