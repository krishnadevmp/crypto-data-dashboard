import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Candle, OrderBook } from "../apiTypes";
import {
  fetchCandles,
  fetchOrderBook,
  invalidateCandleCache,
  clearCandleCache,
} from "../cryptoApiService";

// ---------------------------------------------------------------------------
// Mock the global fetch
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sampleCandles: Candle[] = [
  {
    time: 1_680_000_000_000,
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
  },
];

const sampleOrderBook: OrderBook = {
  pair: "BTC-USDT",
  asks: [[30100, 0.5]],
  bids: [[29900, 1.2]],
  timestamp: 1_680_000_000_000,
};

function mockFetchSuccess(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(""),
  });
}

function mockFetchFailure(status = 500, body = "Internal Server Error") {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    statusText: body,
    text: () => Promise.resolve(body),
  });
}

function mockFetchNetworkError() {
  mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("cryptoApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the module-level candle cache before every test
    clearCandleCache();
  });

  // -------------------------------------------------------------------------
  // fetchCandles
  // -------------------------------------------------------------------------
  describe("fetchCandles", () => {
    it("calls the candles endpoint with the correct pair", async () => {
      mockFetchSuccess(sampleCandles);
      await fetchCandles("BTC-USDT");
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/api\/candles\/BTC-USDT$/);
    });

    it("returns the candles from the API response", async () => {
      mockFetchSuccess(sampleCandles);
      const result = await fetchCandles("BTC-USDT");
      expect(result).toEqual(sampleCandles);
    });

    it("caches the result — second call does not hit the network", async () => {
      mockFetchSuccess(sampleCandles);
      await fetchCandles("BTC-USDT");
      await fetchCandles("BTC-USDT");
      expect(mockFetch).toHaveBeenCalledOnce(); // only 1 real fetch
    });

    it("returns cached data on the second call", async () => {
      mockFetchSuccess(sampleCandles);
      const first = await fetchCandles("BTC-USDT");
      const second = await fetchCandles("BTC-USDT");
      expect(second).toBe(first); // same reference from cache
    });

    it("fetches independently for different pairs", async () => {
      mockFetchSuccess(sampleCandles);
      await fetchCandles("BTC-USDT");
      await fetchCandles("ETH-USDT");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws on a non-2xx HTTP response", async () => {
      mockFetchFailure(404, "Not Found");
      await expect(fetchCandles("BTC-USDT")).rejects.toThrow(/HTTP 404/);
    });

    it("throws on a network error", async () => {
      mockFetchNetworkError();
      await expect(fetchCandles("BTC-USDT")).rejects.toThrow(/Network error/);
    });

    it("sends GET with Content-Type application/json", async () => {
      mockFetchSuccess(sampleCandles);
      await fetchCandles("BTC-USDT");
      const [, options] = mockFetch.mock.calls[0];
      expect(options?.method).toBe("GET");
      expect(options?.headers?.["Content-Type"]).toBe("application/json");
    });
  });

  // -------------------------------------------------------------------------
  // fetchOrderBook
  // -------------------------------------------------------------------------
  describe("fetchOrderBook", () => {
    it("calls the orderbook endpoint with the correct pair", async () => {
      mockFetchSuccess(sampleOrderBook);
      await fetchOrderBook("ETH-USDT");
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/api\/orderbook\/ETH-USDT$/);
    });

    it("returns the order book from the API response", async () => {
      mockFetchSuccess(sampleOrderBook);
      const result = await fetchOrderBook("BTC-USDT");
      expect(result).toEqual(sampleOrderBook);
    });

    it("does NOT cache — a second call hits the network again", async () => {
      mockFetchSuccess(sampleOrderBook);
      await fetchOrderBook("BTC-USDT");
      await fetchOrderBook("BTC-USDT");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws on a non-2xx HTTP response", async () => {
      mockFetchFailure(503, "Service Unavailable");
      await expect(fetchOrderBook("BTC-USDT")).rejects.toThrow(/HTTP 503/);
    });

    it("throws on a network error", async () => {
      mockFetchNetworkError();
      await expect(fetchOrderBook("BTC-USDT")).rejects.toThrow(/Network error/);
    });
  });

  // -------------------------------------------------------------------------
  // Cache management
  // -------------------------------------------------------------------------
  describe("invalidateCandleCache", () => {
    it("forces a fresh fetch after invalidation", async () => {
      mockFetchSuccess(sampleCandles);
      await fetchCandles("BTC-USDT"); // populates cache

      invalidateCandleCache("BTC-USDT");

      await fetchCandles("BTC-USDT"); // should hit network again
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("only invalidates the specified pair", async () => {
      mockFetchSuccess(sampleCandles);
      await fetchCandles("BTC-USDT");
      await fetchCandles("ETH-USDT");

      invalidateCandleCache("BTC-USDT");

      await fetchCandles("ETH-USDT"); // still cached — no extra fetch
      expect(mockFetch).toHaveBeenCalledTimes(2); // BTC fetch + ETH fetch
    });
  });

  describe("clearCandleCache", () => {
    it("forces a fresh fetch for all pairs after clearing", async () => {
      mockFetchSuccess(sampleCandles);
      await fetchCandles("BTC-USDT");
      await fetchCandles("ETH-USDT");

      clearCandleCache();

      await fetchCandles("BTC-USDT");
      await fetchCandles("ETH-USDT");

      // 2 initial fetches + 2 after clear = 4
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});
