/**
 * Unified base64/base64url utilities for Node.js and Cloudflare Workers.
 *
 * Uses native APIs where available:
 * - Node.js 18+: Buffer.toString('base64url')
 * - Workers/Browser: Web APIs (btoa/atob)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Base64 Standard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode a UTF-8 string to base64.
 * Works in both Node.js and Workers.
 */
export function base64Encode(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8').toString('base64');
  }
  return btoa(input);
}

/**
 * Decode a base64 string to UTF-8.
 */
export function base64Decode(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64').toString('utf8');
  }
  return atob(input);
}

// ─────────────────────────────────────────────────────────────────────────────
// Base64URL (RFC 4648 §5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode bytes to base64url (URL-safe, no padding).
 */
export function base64UrlEncode(bytes: Uint8Array | Buffer): string {
  if (typeof Buffer !== 'undefined') {
    const buf = bytes instanceof Buffer ? bytes : Buffer.from(bytes);
    return buf.toString('base64url');
  }

  // Web API fallback
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Decode base64url string to bytes.
 */
export function base64UrlDecode(str: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64url'));
  }

  // Web API fallback: convert base64url → base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padLength);

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode a UTF-8 string to base64url.
 */
export function base64UrlEncodeString(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8').toString('base64url');
  }
  return base64UrlEncode(new TextEncoder().encode(input));
}

/**
 * Decode a base64url string to UTF-8.
 */
export function base64UrlDecodeString(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64url').toString('utf8');
  }
  return new TextDecoder().decode(base64UrlDecode(input));
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode an object to base64url JSON.
 */
export function base64UrlEncodeJson(obj: unknown): string {
  try {
    return base64UrlEncodeString(JSON.stringify(obj));
  } catch {
    return '';
  }
}

/**
 * Decode a base64url JSON string to an object.
 */
export function base64UrlDecodeJson<T = unknown>(value: string): T | null {
  try {
    return JSON.parse(base64UrlDecodeString(value)) as T;
  } catch {
    return null;
  }
}
