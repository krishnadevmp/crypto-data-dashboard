/* eslint-disable react-hooks/globals */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { CryptoPair, OrderBook } from "../../services/apiTypes";
import { useOrderbookController } from "../orderbook/useOrderbookController";

// ---------------------------------------------------------------------------
// Mock fetchOrderBook
// ---------------------------------------------------------------------------
vi.mock("../../services/cryptoApiService", () => ({
  fetchOrderBook: vi.fn(),
}));

import { fetchOrderBook } from "../../services/cryptoApiService";
const mockFetchOrderBook = vi.mocked(fetchOrderBook);

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------
const sampleOrderBook: OrderBook = {
  pair: "BTC-USDT",
  asks: [[30100, 0.5]],
  bids: [[29900, 1.2]],
  timestamp: 1_680_000_000_000,
};

const updatedOrderBook: OrderBook = {
  pair: "BTC-USDT",
  asks: [[30200, 0.3]],
  bids: [[30000, 0.8]],
  timestamp: 1_680_000_001_000,
};

// ---------------------------------------------------------------------------
// Helper: render hook via component
// ---------------------------------------------------------------------------
type HookResult = ReturnType<typeof useOrderbookController>;

function renderHookViaComponent(
  pair: CryptoPair = "BTC-USDT",
  updatedOrderBookProp: OrderBook | null = null,
) {
  let captured: HookResult | undefined;

  function TestComponent({ p, u }: { p: CryptoPair; u: OrderBook | null }) {
    const result = useOrderbookController({ pair: p, updatedOrderBook: u });
    captured = result;
    return null;
  }

  const renderResult = render(
    createElement(TestComponent, { p: pair, u: updatedOrderBookProp }),
  );

  const rerender = (newPair: CryptoPair, newUpdated: OrderBook | null = null) =>
    renderResult.rerender(
      createElement(TestComponent, { p: newPair, u: newUpdated }),
    );

  return { captured: () => captured as HookResult, rerender };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useOrderbookController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchOrderBook.mockResolvedValue(sampleOrderBook);
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe("loading state", () => {
    it("sets loading to true while fetching", () => {
      // Never resolve — keeps fetch in-flight
      mockFetchOrderBook.mockReturnValue(new Promise(() => {}));
      const { captured } = renderHookViaComponent();
      expect(captured().state.loading).toBe(true);
    });

    it("sets loading to false after a successful fetch", async () => {
      const { captured } = renderHookViaComponent();
      await waitFor(() => expect(captured().state.loading).toBe(false));
    });

    it("sets loading to false after a failed fetch", async () => {
      mockFetchOrderBook.mockRejectedValue(new Error("network error"));
      const { captured } = renderHookViaComponent();
      await waitFor(() => expect(captured().state.loading).toBe(false));
    });
  });

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------
  describe("success state", () => {
    it("clears error on success", async () => {
      const { captured } = renderHookViaComponent();
      await waitFor(() => expect(captured().state.error).toBeNull());
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  describe("error state", () => {
    it("sets an error message when fetching fails", async () => {
      mockFetchOrderBook.mockRejectedValue(new Error("timeout"));
      const { captured } = renderHookViaComponent();
      await waitFor(() =>
        expect(captured().state.error).toBe("Failed to fetch order book"),
      );
    });

    it("keeps displayedOrderBook null on error (no prior data)", async () => {
      mockFetchOrderBook.mockRejectedValue(new Error("timeout"));
      const { captured } = renderHookViaComponent();
      await waitFor(() => expect(captured().state.error).not.toBeNull());
    });
  });

  // -------------------------------------------------------------------------
  // updatedOrderBook prop
  // -------------------------------------------------------------------------
  describe("displayedOrderBook priority", () => {
    it("prefers updatedOrderBook over the fetched orderBook", async () => {
      const { captured } = renderHookViaComponent("BTC-USDT", updatedOrderBook);
      await waitFor(() => expect(captured().state.loading).toBe(false));
    });
  });

  // -------------------------------------------------------------------------
  // Pair changes
  // -------------------------------------------------------------------------
  describe("on pair change", () => {
    it("re-fetches when the pair prop changes", async () => {
      const ethBook: OrderBook = { ...sampleOrderBook, pair: "ETH-USDT" };
      mockFetchOrderBook
        .mockResolvedValueOnce(sampleOrderBook)
        .mockResolvedValueOnce(ethBook);

      const { rerender } = renderHookViaComponent("BTC-USDT");

      act(() => rerender("ETH-USDT"));

      expect(mockFetchOrderBook).toHaveBeenCalledTimes(2);
      expect(mockFetchOrderBook).toHaveBeenNthCalledWith(1, "BTC-USDT");
      expect(mockFetchOrderBook).toHaveBeenNthCalledWith(2, "ETH-USDT");
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe("return shape", () => {
    it("exposes displayedOrderBook, loading and error inside state", async () => {
      const { captured } = renderHookViaComponent();
      await waitFor(() => expect(captured().state.loading).toBe(false));
      expect(captured().state).toHaveProperty("loading");
      expect(captured().state).toHaveProperty("error");
    });
  });
});
