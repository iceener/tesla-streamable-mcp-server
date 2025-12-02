# Tesla MCP Server

Streamable HTTP MCP server for Tesla vehicle control via the [Tessie API](https://developer.tessie.com).

Author: [overment](https://x.com/_overment)

> [!WARNING]
> You connect this server to your MCP client at your own responsibility. Language models can make mistakes, misinterpret instructions, or perform unintended actions. Always verify commands before execution, especially for actions like unlocking, opening trunks, or sending navigation destinations.
>
> The HTTP layer is designed for convenience during development, not production-grade security. If deploying remotely, harden it: proper token validation, secure storage, TLS termination, strict CORS/origin checks, rate limiting, and audit logging.

## Notice

This repo works in two ways:
- As a **Node/Hono server** for local workflows
- As a **Cloudflare Worker** for remote interactions

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

1. Create KV namespace for session storage:

```bash
bun x wrangler kv:namespace create TOKENS
```

Output will show:
```
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "TOKENS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

2. Update `wrangler.toml` with your KV namespace ID:

```toml
[[kv_namespaces]]
binding = "TOKENS"
id = "your-kv-namespace-id-from-step-1"
```

3. Set secrets:

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

4. Deploy:

```bash
bun x wrangler deploy
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
bun run build     # Production build
bun start         # Run production
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
├── index.ts                    # Node.js entry
└── worker.ts                   # Workers entry
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

### Cloudflare Workers (wrangler.toml + secrets)

**wrangler.toml vars:**
```toml
AUTH_ENABLED = "true"
AUTH_STRATEGY = "bearer"
```

**Secrets (set via `wrangler secret put`):**
- `BEARER_TOKEN` — Random auth token for clients
- `TESSIE_ACCESS_TOKEN` — Tessie API access token
- `TESSIE_VIN` — Your vehicle's VIN

**KV Namespace:**
```toml
[[kv_namespaces]]
binding = "TOKENS"
id = "your-kv-namespace-id"
```

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
| KV namespace error | Run `wrangler kv:namespace create TOKENS` and update wrangler.toml |
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
