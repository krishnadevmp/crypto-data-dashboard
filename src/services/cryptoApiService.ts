/**
 * cryptoApiService.ts
 *
 * Handles all REST API calls to the mock crypto backend.
 * Candle responses are cached client-side so re-selecting a pair
 * does not trigger a redundant network request.
 */

import type { Candle, CryptoPair, OrderBook } from "./apiTypes";
import { createCache } from "./apiCache";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

/**
 * Candle data is relatively stable historical data, so we cache it for
 * the lifetime of the browser session (TTL = Infinity by default).
 * Swap in a numeric ms value if you want time-based expiry.
 */
const candleCache = createCache<Candle[]>();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetch wrapper that throws a descriptive error on non-2xx responses.
 */
async function apiFetch<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  } catch (networkError) {
    // fetch() itself threw — server is likely unreachable
    throw new Error(
      `Network error while reaching ${url}. Is the backend running? (${String(networkError)})`,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status} ${response.statusText} — ${url}${body ? `: ${body}` : ""}`,
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch historical candle (OHLCV) data for a trading pair.
 *
 * Results are cached client-side: calling this function again with the
 * same `pair` returns the cached data immediately without a network request.
 *
 * @param pair  e.g. "BTC-USDT"
 * @returns     Ordered array of candles (oldest → newest)
 */
export async function fetchCandles(pair: CryptoPair): Promise<Candle[]> {
  const cacheKey = `candles:${pair}`;

  const cached = candleCache.get(cacheKey);
  if (cached) {
    console.debug(`[candleCache] HIT for ${pair}`);
    return cached;
  }

  console.debug(`[candleCache] MISS for ${pair} — fetching from API`);
  const candles = await apiFetch<Candle[]>(`/api/candles/${pair}`);

  candleCache.set(cacheKey, candles);
  return candles;
}

/**
 * Fetch a snapshot of the order book for a trading pair.
 *
 * Order book data is NOT cached because it is highly volatile — the
 * WebSocket stream is responsible for keeping it up-to-date after the
 * initial load.
 *
 * @param pair  e.g. "BTC-USDT"
 * @returns     Order book snapshot with asks and bids
 */
export async function fetchOrderBook(pair: CryptoPair): Promise<OrderBook> {
  return apiFetch<OrderBook>(`/api/orderbook/${pair}`);
}

/**
 * Manually invalidate the candle cache for a specific pair.
 * Useful if you want to force a fresh fetch (e.g., after a long idle period).
 */
export function invalidateCandleCache(pair: CryptoPair): void {
  candleCache.delete(`candles:${pair}`);
}

/**
 * Clear the entire candle cache.
 */
export function clearCandleCache(): void {
  candleCache.clear();
}
