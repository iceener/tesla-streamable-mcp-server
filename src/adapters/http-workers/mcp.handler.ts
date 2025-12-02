/**
 * MCP endpoint handler for Cloudflare Workers.
 * Uses the shared dispatcher for JSON-RPC processing.
 */

import type { UnifiedConfig } from '../../shared/config/env.js';
import { withCors } from '../../shared/http/cors.js';
import { jsonResponse } from '../../shared/http/response.js';
import {
  type CancellationRegistry,
  dispatchMcpMethod,
  handleMcpNotification,
  type McpDispatchContext,
  type McpSessionState,
} from '../../shared/mcp/dispatcher.js';
import type { SessionStore } from '../../shared/storage/interface.js';
import type { AuthStrategy, ToolContext } from '../../shared/tools/types.js';
import { checkAuthAndChallenge } from './security.js';

// ─────────────────────────────────────────────────────────────────────────────
// Session State (in-memory, persists within worker instance)
// Note: These are ephemeral in Workers - each request may hit a different isolate
// ─────────────────────────────────────────────────────────────────────────────

const sessionStateMap = new Map<string, McpSessionState>();

// Cancellation registry for tracking in-flight requests per session
// This enables notifications/cancelled to abort running tool calls
const cancellationRegistryMap = new Map<string, CancellationRegistry>();

/**
 * Get or create cancellation registry for a session.
 */
function getCancellationRegistry(sessionId: string): CancellationRegistry {
  let registry = cancellationRegistryMap.get(sessionId);
  if (!registry) {
    registry = new Map();
    cancellationRegistryMap.set(sessionId, registry);
  }
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve auth context from request and config.
 */
function resolveAuthContext(request: Request, config: UnifiedConfig): ToolContext {
  // Extract raw headers
  const rawHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    rawHeaders[key.toLowerCase()] = value;
  });

  const strategy = config.AUTH_STRATEGY as AuthStrategy;

  return {
    sessionId: '', // Will be set by caller
    authStrategy: strategy,
    resolvedHeaders: rawHeaders,
    authHeaders: rawHeaders,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Handler
// ─────────────────────────────────────────────────────────────────────────────

export interface McpHandlerDeps {
  sessionStore: SessionStore;
  config: UnifiedConfig;
}

/**
 * Handle MCP POST request.
 */
export async function handleMcpRequest(
  request: Request,
  deps: McpHandlerDeps,
): Promise<Response> {
  const { sessionStore, config } = deps;

  // Get or create session ID
  const incomingSessionId = request.headers.get('Mcp-Session-Id');
  const sessionId = incomingSessionId?.trim() || crypto.randomUUID();

  // Ensure session exists
  try {
    await sessionStore.ensure(sessionId);
  } catch {
    // Ignore session creation errors
  }

  // Check auth and get challenge response if needed
  const challengeResponse = await checkAuthAndChallenge(request, config, sessionId);
  if (challengeResponse) {
    return challengeResponse;
  }

  // Resolve auth context
  const authContext = resolveAuthContext(request, config);
  authContext.sessionId = sessionId;

  // Parse JSON-RPC body
  const body = (await request.json().catch(() => ({}))) as {
    jsonrpc?: string;
    method?: string;
    params?: Record<string, unknown>;
    id?: string | number | null;
  };

  const { method, params, id } = body;

  // Get cancellation registry for this session
  const cancellationRegistry = getCancellationRegistry(sessionId);

  // Build dispatch context
  const dispatchContext: McpDispatchContext = {
    sessionId,
    auth: authContext,
    config: {
      title: config.MCP_TITLE,
      version: config.MCP_VERSION,
      instructions: config.MCP_INSTRUCTIONS,
    },
    getSessionState: () => sessionStateMap.get(sessionId),
    setSessionState: (state) => sessionStateMap.set(sessionId, state),
    cancellationRegistry,
  };

  // Handle notifications (no id) - return 202 Accepted
  if (!('id' in body) || id === null || id === undefined) {
    if (method) {
      handleMcpNotification(method, params, dispatchContext);
    }
    return withCors(new Response(null, { status: 202 }));
  }

  // Dispatch JSON-RPC request with requestId for cancellation tracking
  const result = await dispatchMcpMethod(method, params, dispatchContext, id);

  // Build response
  const response = jsonResponse({
    jsonrpc: '2.0',
    ...(result.error ? { error: result.error } : { result: result.result }),
    id,
  });

  response.headers.set('Mcp-Session-Id', sessionId);
  return withCors(response);
}

/**
 * Handle MCP GET request (returns 405 per spec).
 */
export function handleMcpGet(): Response {
  return withCors(new Response('Method Not Allowed', { status: 405 }));
}
