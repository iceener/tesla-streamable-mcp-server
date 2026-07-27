import { makeConcurrencyGate, makeTokenBucket } from '../utils/limits.js';
import { logger } from '../utils/logger.js';

export type HttpClientInput = string | URL | Request;
export type HttpClient = (
  input: HttpClientInput,
  init?: RequestInit,
) => Promise<Response>;
export interface HttpClientOptions {
  baseHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  rateLimit?: { rps: number; burst: number };
  concurrency?: number;
  signal?: AbortSignal;
}
function combinedSignal(
  timeout: AbortSignal,
  request?: AbortSignal | null,
): AbortSignal {
  return request ? AbortSignal.any([timeout, request]) : timeout;
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const {
    baseHeaders = {},
    timeout = 30_000,
    retries = 3,
    retryDelay = 1_000,
    rateLimit = { rps: 10, burst: 20 },
    concurrency = 5,
    signal,
  } = options;
  const rateLimiter = makeTokenBucket(rateLimit.burst, rateLimit.rps);
  const concurrencyGate = makeConcurrencyGate(concurrency);

  return (input, init) =>
    concurrencyGate(async () => {
      if (!rateLimiter.take()) throw new Error('Rate limit exceeded');
      const url = input instanceof Request ? input.url : input.toString();
      for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
          const timeoutSignal = AbortSignal.timeout(timeout);
          const response = await fetch(url, {
            ...init,
            headers: {
              ...baseHeaders,
              ...Object.fromEntries(new Headers(init?.headers)),
            },
            signal: combinedSignal(timeoutSignal, init?.signal ?? signal),
          });
          if (response.ok || attempt === retries) return response;
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * 2 ** (attempt - 1)),
          );
        } catch (error) {
          if (signal?.aborted || init?.signal?.aborted || attempt === retries)
            throw error;
          logger.warning('http_client', {
            message: 'HTTP request failed, retrying',
            url,
            attempt,
          });
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * 2 ** (attempt - 1)),
          );
        }
      }
      throw new Error('Unexpected end of retry loop');
    });
}
