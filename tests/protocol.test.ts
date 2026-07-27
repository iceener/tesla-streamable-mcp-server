import { afterEach, describe, expect, test } from 'bun:test';
import {
  Client,
  type FetchLike,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { type AppConfig, parseConfig } from '../src/config/env.js';
import { buildHttpApp, type HttpRuntime } from '../src/http/app.js';
import type { TessieToolService } from '../src/shared/tools/registry.js';

const state = {
  display_name: 'Test Car',
  battery_level: 80,
  battery_range_km: 320.5,
  charging: { state: 'Disconnected', minutes_remaining: null, charge_limit: 80 },
  location: { latitude: 37.7, longitude: -122.4, heading: 90, speed: null },
  locked: true,
  sentry_mode: false,
  climate: {
    is_on: false,
    inside_temp: 21,
    outside_temp: 18,
    target_temp: 22,
    is_defrosting: false,
  },
  doors: {
    front_left: false,
    front_right: false,
    rear_left: false,
    rear_right: false,
    frunk: false,
    trunk: false,
    charge_port: false,
  },
  state: 'online' as const,
  odometer_km: 12_345.6,
  last_updated: '2026-07-27T12:00:00.000Z',
};
const service: TessieToolService = {
  async getState() {
    return state;
  },
  async executeCommand(command) {
    return { success: true, command, message: 'Vehicle locked' };
  },
};
const runtimes = new Set<HttpRuntime>();
const clients = new Set<Client>();
afterEach(async () => {
  await Promise.all([...clients].map((client) => client.close()));
  await Promise.all([...runtimes].map((runtime) => runtime.close()));
  clients.clear();
  runtimes.clear();
});
function testConfig(overrides: Record<string, unknown> = {}): AppConfig {
  return parseConfig({
    NODE_ENV: 'test',
    MCP_PUBLIC_URL: 'http://localhost:3000/mcp',
    MCP_ALLOWED_HOSTS: 'localhost',
    MCP_ALLOWED_ORIGIN_HOSTNAMES: 'localhost',
    AUTH_ENABLED: 'false',
    AUTH_STRATEGY: 'none',
    TESSIE_ACCESS_TOKEN: 'provider-secret',
    TESSIE_VIN: 'TESTVIN1234567890',
    ...overrides,
  });
}
function createRuntime(config = testConfig(), provider = service): HttpRuntime {
  const runtime = buildHttpApp(config, { runtimeName: 'test', service: provider });
  runtimes.add(runtime);
  return runtime;
}
function runtimeFetch(runtime: HttpRuntime, token?: string): FetchLike {
  return async (url, init) => {
    const headers = new Headers(init?.headers);
    headers.set('Host', 'localhost:3000');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return runtime.fetch(new Request(url, { ...init, headers }));
  };
}
async function connect(
  runtime: HttpRuntime,
  mode: 'modern' | 'legacy',
  token?: string,
): Promise<Client> {
  const client = new Client(
    { name: `tesla-${mode}-test`, version: '1.0.0' },
    mode === 'modern'
      ? { versionNegotiation: { mode: { pin: '2026-07-28' } } }
      : undefined,
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp'), {
      fetch: runtimeFetch(runtime, token),
      ...(token ? { authProvider: { token: async () => token } } : {}),
    }),
  );
  clients.add(client);
  return client;
}

describe('Tesla MCP v2 protocol', () => {
  test('negotiates modern protocol and validates structured vehicle state', async () => {
    const client = await connect(createRuntime(), 'modern');
    expect(client.getProtocolEra()).toBe('modern');
    expect(client.getNegotiatedProtocolVersion()).toBe('2026-07-28');
    expect(client.getServerCapabilities()).toEqual({ tools: { listChanged: true } });
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual([
      'tesla_state',
      'tesla_command',
    ]);
    expect(listed.tools[0]?.inputSchema).toMatchObject({ type: 'object' });
    expect(listed.tools[0]?.outputSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['display_name', 'battery_level', 'state']),
      additionalProperties: false,
    });
    expect(listed.tools[1]?.inputSchema).toMatchObject({
      type: 'object',
      required: ['command'],
    });
    const result = await client.callTool({ name: 'tesla_state', arguments: {} });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual(state);
  });

  test('serves SDK-owned stateless legacy list and call behavior', async () => {
    const client = await connect(createRuntime(), 'legacy');
    expect(client.getProtocolEra()).toBe('legacy');
    expect(client.getNegotiatedProtocolVersion()).toBe('2025-11-25');
    expect(client.getServerCapabilities()?.tools?.listChanged).toBe(false);
    expect((await client.listTools()).tools.map((tool) => tool.name)).toEqual([
      'tesla_state',
      'tesla_command',
    ]);
    const result = await client.callTool({
      name: 'tesla_command',
      arguments: { command: 'lock' },
    });
    expect(result.structuredContent).toEqual({
      success: true,
      command: 'lock',
      message: 'Vehicle locked',
    });
  });

  test('preserves provider failure mapping as a tool error', async () => {
    const failingService: TessieToolService = {
      getState: async () => {
        throw new Error('mock Tessie failure');
      },
      executeCommand: service.executeCommand,
    };
    const client = await connect(createRuntime(testConfig(), failingService), 'modern');
    const result = await client.callTool({ name: 'tesla_state', arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({
      type: 'text',
      text: expect.stringContaining('mock Tessie failure'),
    });
  });

  test('propagates client cancellation through the v2 request signal', async () => {
    const cancellingService: TessieToolService = {
      getState: (signal) =>
        new Promise((_, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
      executeCommand: service.executeCommand,
    };
    const client = await connect(
      createRuntime(testConfig(), cancellingService),
      'modern',
    );
    const controller = new AbortController();
    const pending = client.callTool(
      { name: 'tesla_state', arguments: {} },
      { signal: controller.signal },
    );
    setTimeout(() => controller.abort(), 10);
    await expect(pending).rejects.toThrow();
  });

  test('forwards only the Tessie credential to the provider', async () => {
    const originalFetch = globalThis.fetch;
    let providerAuthorization = '';
    globalThis.fetch = Object.assign(
      async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        providerAuthorization = new Headers(init?.headers).get('Authorization') ?? '';
        return Response.json({ result: true });
      },
      { preconnect: originalFetch.preconnect },
    );
    try {
      const config = testConfig({
        AUTH_ENABLED: 'true',
        AUTH_STRATEGY: 'bearer',
        BEARER_TOKEN: 'mcp-access-secret',
      });
      const runtime = buildHttpApp(config, { runtimeName: 'test' });
      runtimes.add(runtime);
      const client = await connect(runtime, 'modern', 'mcp-access-secret');
      const result = await client.callTool({
        name: 'tesla_command',
        arguments: { command: 'lock' },
      });
      expect(result.isError).not.toBe(true);
      expect(providerAuthorization).toBe('Bearer provider-secret');
      expect(providerAuthorization).not.toContain('mcp-access-secret');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('enforces Host, Origin, CORS, size limits, and method posture', async () => {
    const runtime = createRuntime(testConfig({ MCP_MAX_REQUEST_BYTES: '1024' }));
    for (const method of ['GET', 'DELETE']) {
      const response = await runtime.fetch(
        new Request('http://localhost:3000/mcp', {
          method,
          headers: { Host: 'localhost:3000' },
        }),
      );
      expect(response.status).toBe(405);
      expect(response.headers.has('Mcp-Session-Id')).toBe(false);
    }
    const unsupportedBody = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'server/discover',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2099-01-01',
          'io.modelcontextprotocol/clientCapabilities': {},
          'io.modelcontextprotocol/clientInfo': { name: 'raw-test', version: '1.0.0' },
        },
      },
    });
    const unsupported = await runtime.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: {
          Host: 'localhost:3000',
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': '2099-01-01',
          'Mcp-Method': 'server/discover',
        },
        body: unsupportedBody,
      }),
    );
    expect(unsupported.status).toBe(400);
    expect(await unsupported.json()).toMatchObject({ error: { code: -32022 } });
    expect(
      (
        await runtime.fetch(
          new Request('http://localhost:3000/health', {
            headers: { Host: 'evil.example' },
          }),
        )
      ).status,
    ).toBe(403);
    const origin = await runtime.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: { Host: 'localhost:3000', Origin: 'https://evil.example' },
        body: '{}',
      }),
    );
    expect(origin.status).toBe(403);
    expect(origin.headers.has('Access-Control-Allow-Origin')).toBe(false);
    const preflight = await runtime.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'OPTIONS',
        headers: {
          Host: 'localhost:3000',
          Origin: 'http://localhost:8080',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type, mcp-method',
        },
      }),
    );
    expect(preflight.status).toBe(204);
    const oversized = await runtime.fetch(
      new Request('http://localhost:3000/mcp', {
        method: 'POST',
        headers: { Host: 'localhost:3000', 'Content-Type': 'application/json' },
        body: 'x'.repeat(1_025),
      }),
    );
    expect(oversized.status).toBe(413);
  });
});
