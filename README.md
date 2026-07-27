# Tesla MCP Server

Streamable HTTP MCP server for Tesla vehicle control via the [Tessie API](https://developer.tessie.com).

> **Release status (2026-07-27):** this repository pins `@modelcontextprotocol/server` and the test-only `@modelcontextprotocol/client` to `2.0.0-beta.5`, with Zod 4 and the candidate `2026-07-28` protocol. The dated protocol and stable v2 SDK are not final at this commit; do not claim final conformance until the release gate is verified.

The Bun and Cloudflare Workers entry points share one fetch-native handler per deployment and create a fresh MCP server for every request. Modern HTTP is stateless; compatibility with 2025-era clients uses the SDK's stateless fallback and does not create MCP sessions.

Author: [overment](https://x.com/_overment)

> [!WARNING]
> You connect this server to your MCP client at your own responsibility. Language models can make mistakes, misinterpret instructions, or perform unintended actions. Always verify commands before execution, especially for actions like unlocking, opening trunks, or sending navigation destinations.
>
> The HTTP layer enforces bounded request bodies, exact Host and Origin allowlists, strict CORS, and static bearer authentication when enabled. A production deployment must still set its real HTTPS `MCP_PUBLIC_URL` and exact allowlists, protect secrets, and provide appropriate rate limiting and audit controls.

## Notice

This repo works in two ways:
- As a fetch-native **Bun server** for local workflows
- As a fetch-native **Cloudflare Worker** for remote interactions

## Features

- ✅ **State** — Battery, range, location, climate, doors, charging status
- ✅ **Commands** — Lock/unlock, climate, trunks, sentry, navigation
- ✅ **Location-aware** — GPS coordinates for context-aware interactions
- ✅ **Dual Runtime** — Node.js/Bun or Cloudflare Workers

### Design Principles

- **LLM-friendly**: Two unified tools, not 1:1 API mirrors
- **Watch-ready**: Designed for AI agents with location context
- **Secure**: Tessie API key stored as secret, clients use separate bearer token
- **Clear feedback**: Detailed command results and vehicle state

---

## Installation

Prerequisites: [Bun](https://bun.sh/), [Tessie Account](https://developer.tessie.com).

### Ways to Run (Pick One)

1. **Local Development** — Standard setup with bearer token auth
2. **Cloudflare Worker (wrangler dev)** — Local Worker testing
3. **Cloudflare Worker (deploy)** — Remote production

---

### 1. Local Development — Quick Start

1. Get Tessie credentials:
   - Visit [developer.tessie.com](https://developer.tessie.com)
   - Go to **Developer Settings** → **Generate Access Token**
   - Copy your access token
   - Note your vehicle's VIN

2. Configure environment:

```bash
cd tesla-mcp
bun install
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
AUTH_ENABLED=true
AUTH_STRATEGY=bearer

# Generate with: openssl rand -hex 32
BEARER_TOKEN=your-random-auth-token

# Tessie credentials
TESSIE_ACCESS_TOKEN=your-tessie-access-token
TESSIE_VIN=your-vehicle-vin
```

3. Run:

```bash
bun dev
# MCP: http://127.0.0.1:3000/mcp
```

**Claude Desktop / Cursor:**

```json
{
  "mcpServers": {
    "tesla": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/mcp", "--transport", "http-only"],
      "env": { "NO_PROXY": "127.0.0.1,localhost" }
    }
  }
}
```

---

### 2. Cloudflare Worker (Local Dev)

```bash
bun x wrangler dev --local | cat
```

Create `.dev.vars` for local secrets:

```env
BEARER_TOKEN=your_random_auth_token
TESSIE_ACCESS_TOKEN=your_tessie_token
TESSIE_VIN=your_vehicle_vin
```

Endpoint: `http://127.0.0.1:8787/mcp`

---

### 3. Cloudflare Worker (Deploy)

1. Update `wrangler.jsonc` for the production URL and exact Host/Origin allowlists. The checked-in values are local-safe defaults. The existing `TOKENS` binding is retained for deployment compatibility but is not used for MCP sessions.

2. Set secrets:

```bash
# Generate a random token for client authentication
openssl rand -hex 32
bun x wrangler secret put BEARER_TOKEN
# Paste the generated token when prompted

# Tessie API credentials
bun x wrangler secret put TESSIE_ACCESS_TOKEN
# Paste your Tessie token when prompted

bun x wrangler secret put TESSIE_VIN
# Paste your VIN when prompted
```

3. Validate generated types and deploy:

```bash
bun run types:worker
bun run types:worker:check
bun run build:worker
bun run deploy
```

Endpoint: `https://<worker-name>.<account>.workers.dev/mcp`

---

## Client Configuration

### Alice App

Add as MCP server with:
- URL: `https://your-worker.workers.dev/mcp`
- Type: `streamable-http`
- Header: `Authorization: Bearer <your-BEARER_TOKEN>`

### Claude Desktop / Cursor (Local Server)

```json
{
  "mcpServers": {
    "tesla": {
      "command": "npx",
      "args": ["mcp-remote", "http://127.0.0.1:3000/mcp", "--transport", "http-only"],
      "env": { "NO_PROXY": "127.0.0.1,localhost" }
    }
  }
}
```

### Claude Desktop / Cursor (Cloudflare Worker)

```json
{
  "mcpServers": {
    "tesla": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-worker.workers.dev/mcp", "--transport", "http-only"]
    }
  }
}
```

### MCP Inspector (Quick Test)

```bash
bunx @modelcontextprotocol/inspector
# Connect to: http://localhost:3000/mcp (local) or https://your-worker.workers.dev/mcp (remote)
```

---

## Tools

### `tesla_state`

Get the current state of your Tesla vehicle.

```ts
// Input
{}

// Output
{
  display_name: string;           // Vehicle name
  battery_level: number;          // 0-100%
  battery_range_km: number;       // Estimated range in km
  charging: {
    state: string;                // "Disconnected", "Charging", "Complete", "Stopped"
    minutes_remaining: number | null;
    charge_limit: number;         // Charge limit %
  };
  location: {
    latitude: number;
    longitude: number;
    heading: number;              // 0-359°
    speed: number | null;         // km/h or null if parked
  };
  locked: boolean;
  sentry_mode: boolean;
  climate: {
    is_on: boolean;
    inside_temp: number;          // °C
    outside_temp: number;         // °C
    target_temp: number;          // °C
    is_defrosting: boolean;
  };
  doors: {
    front_left: boolean;          // true = open
    front_right: boolean;
    rear_left: boolean;
    rear_right: boolean;
    frunk: boolean;
    trunk: boolean;
    charge_port: boolean;
  };
  state: "online" | "asleep" | "offline";
  odometer_km: number;
  last_updated: string;           // ISO 8601
}
```

### `tesla_command`

Execute commands on your Tesla vehicle.

```ts
// Input
{
  command: "lock" | "unlock" | "start_climate" | "stop_climate" |
           "set_temperature" | "start_defrost" | "stop_defrost" |
           "open_frunk" | "open_trunk" | "open_charge_port" |
           "close_charge_port" | "enable_sentry" | "disable_sentry" |
           "flash" | "honk" | "share";
  temperature?: number;           // Required for set_temperature (15-28°C)
  destination?: string;           // Required for share
  locale?: string;                // Optional for share (e.g., "en-US")
}

// Output
{
  success: boolean;
  command: string;
  message: string;
}
```

**Commands Reference:**

| Command | Description | Parameters |
|---------|-------------|------------|
| `lock` | Lock the vehicle | — |
| `unlock` | Unlock the vehicle | — |
| `start_climate` | Start climate control | — |
| `stop_climate` | Stop climate control | — |
| `set_temperature` | Set cabin temperature | `temperature` (15-28°C) |
| `start_defrost` | Turn on max defrost | — |
| `stop_defrost` | Turn off defrost | — |
| `open_frunk` | Open front trunk | — |
| `open_trunk` | Toggle rear trunk | — |
| `open_charge_port` | Open charge port door | — |
| `close_charge_port` | Close charge port door | — |
| `enable_sentry` | Enable sentry mode | — |
| `disable_sentry` | Disable sentry mode | — |
| `flash` | Flash the lights | — |
| `honk` | Honk the horn | — |
| `share` | Send destination to navigation | `destination`, `locale?` |

---

## Examples

### 1. Get vehicle state

```json
{
  "name": "tesla_state",
  "arguments": {}
}
```

### 2. Lock the car

```json
{
  "name": "tesla_command",
  "arguments": {
    "command": "lock"
  }
}
```

### 3. Set temperature to 22°C

```json
{
  "name": "tesla_command",
  "arguments": {
    "command": "set_temperature",
    "temperature": 22
  }
}
```

### 4. Start climate before leaving

```json
{
  "name": "tesla_command",
  "arguments": {
    "command": "start_climate"
  }
}
```

### 5. Navigate to a destination

```json
{
  "name": "tesla_command",
  "arguments": {
    "command": "share",
    "destination": "Golden Gate Bridge, San Francisco"
  }
}
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (Alice App, Claude Desktop)                             │
│      │                                                          │
│      │ Authorization: Bearer <BEARER_TOKEN>                     │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Cloudflare Worker / Node.js Server                      │   │
│  │                                                          │   │
│  │  1. Validate BEARER_TOKEN (client auth)                  │   │
│  │  2. Use TESSIE_ACCESS_TOKEN (internal API key)           │   │
│  │                                                          │   │
│  │  env.TESSIE_ACCESS_TOKEN ──┐                             │   │
│  │  env.TESSIE_VIN ───────────┼──► TessieClient             │   │
│  │                            │         │                   │   │
│  │                            │         ▼                   │   │
│  │                            │   api.tessie.com            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key points:**
- `BEARER_TOKEN`: Random token you generate — authenticates clients to your MCP server
- `TESSIE_ACCESS_TOKEN`: Your Tessie API key — used internally by the server
- Clients never see your Tessie credentials

---

## HTTP Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mcp` | POST | MCP JSON-RPC 2.0 |
| `/health` | GET | Health check |

---

## Development

```bash
bun dev           # Start with hot reload
bun run typecheck # TypeScript check
bun run lint      # Lint code
bun run build     # Bun production build
bun run build:worker
bun run types:worker:check
bun test           # Modern, legacy, cancellation, security, and provider tests
bun start          # Run Bun production entry point
```

---

## Architecture

```
src/
├── shared/
│   └── tools/
│       ├── tesla-state.ts      # Get vehicle state
│       └── tesla-command.ts    # Execute commands
├── services/
│   └── tessie.service.ts       # Tessie API client
├── schemas/
│   ├── commands.ts             # Command definitions
│   ├── outputs.ts              # Tool output schemas
│   └── tessie.ts               # Tessie API response schemas
├── config/
│   └── metadata.ts             # Server & tool descriptions
├── core/
│   ├── mcp.ts                  # Fresh server factory
│   └── runtime.ts              # Deployment-scoped v2 handler
├── http/                       # Auth, body bounds, Host/Origin/CORS
├── index.ts                    # Bun entry
└── worker.ts                   # Workers isolate entry
```

---

## Environment Variables

### Node.js (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `TESSIE_ACCESS_TOKEN` | ✓ | Tessie API access token |
| `TESSIE_VIN` | ✓ | Tesla Vehicle VIN |
| `BEARER_TOKEN` | ✓ | Auth token for MCP clients |
| `PORT` | | Server port (default: 3000) |
| `HOST` | | Server host (default: 127.0.0.1) |
| `AUTH_ENABLED` | | Enable auth (default: true) |
| `AUTH_STRATEGY` | | `bearer` (default) |

### Cloudflare Workers (`wrangler.jsonc` + secrets)

Relevant `wrangler.jsonc` vars:
```jsonc
"vars": {
  "AUTH_ENABLED": "true",
  "AUTH_STRATEGY": "bearer"
}
```

**Secrets (set via `wrangler secret put`):**
- `BEARER_TOKEN` — Random auth token for clients
- `TESSIE_ACCESS_TOKEN` — Tessie API access token
- `TESSIE_VIN` — Your vehicle's VIN

The existing `TOKENS` binding remains in `wrangler.jsonc`, but the SDK-owned stateless HTTP fallback does not read it or create sessions.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `BEARER_TOKEN` is set and client sends `Authorization: Bearer <token>` |
| "TESSIE_ACCESS_TOKEN not configured" | Set secret: `wrangler secret put TESSIE_ACCESS_TOKEN` |
| "TESSIE_VIN not configured" | Set secret: `wrangler secret put TESSIE_VIN` |
| "Tessie API error" | Verify `TESSIE_ACCESS_TOKEN` is valid at developer.tessie.com |
| Vehicle not found | Check `TESSIE_VIN` is correct (17 characters) |
| Vehicle offline | Vehicle may be in deep sleep. Commands will wake it (takes ~30s) |
| Command timeout | Tessie waits up to 90s for vehicle wake. Try again. |
| "ReadableStream is not defined" | Node.js version too old (needs 18+). Use full path to newer node. |
| "spawn bunx ENOENT" | Claude Desktop can't find `bunx`. Use `npx` instead. |

### Debugging

Test with MCP Inspector:

```bash
bunx @modelcontextprotocol/inspector
# Connect to your endpoint and test tools
```

Check Worker logs:

```bash
wrangler tail
```

---

## License

MIT
