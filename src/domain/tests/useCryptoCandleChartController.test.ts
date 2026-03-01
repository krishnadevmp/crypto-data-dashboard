/* eslint-disable react-hooks/globals */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { createElement, createRef } from "react";
import type { Candle } from "../../services/apiTypes";

// ---------------------------------------------------------------------------
// Mocks — declared before any imports that trigger module evaluation
// ---------------------------------------------------------------------------

// 1. fetchCandles
vi.mock("../../services/cryptoApiService", () => ({
  fetchCandles: vi.fn(),
}));

// 2. useCandleChart — return a stable fake API surface
const setCandles = vi.fn();
const updateCandle = vi.fn();
const fitContent = vi.fn();
const containerRef = createRef<HTMLDivElement>();
let mockIsReady = true;

vi.mock("../../common/hooks/useCandleChart", () => ({
  useCandleChart: vi.fn(() => ({
    containerRef,
    setCandles,
    updateCandle,
    fitContent,
    isReady: mockIsReady,
  })),
}));

import { fetchCandles } from "../../services/cryptoApiService";
import useCryptoCandleChartController from "../cryptoCandleChart/useCryptoCandleChartController";

const mockFetchCandles = vi.mocked(fetchCandles);

// ---------------------------------------------------------------------------
// Sample data
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
  {
    time: 1_680_000_060_000,
    open: 105,
    high: 115,
    low: 95,
    close: 100,
    volume: 2000,
  },
];

const singleCandle: Candle = {
  time: 1_680_000_120_000,
  open: 100,
  high: 120,
  low: 95,
  close: 115,
  volume: 500,
};

// ---------------------------------------------------------------------------
// Helper: render hook via a wrapper component so useEffect runs normally
// ---------------------------------------------------------------------------
type ControllerResult = ReturnType<typeof useCryptoCandleChartController>;

function renderController(
  pair: "BTC-USDT" | "ETH-USDT" | "XRP-USDT" = "BTC-USDT",
  updatedCandle: Candle | null = null,
) {
  let captured: ControllerResult | undefined;

  function TestComponent({ p, u }: { p: typeof pair; u: Candle | null }) {
    const result = useCryptoCandleChartController({
      pair: p,
      updatedCandle: u,
    });
    captured = result;
    return null;
  }

  const renderResult = render(
    createElement(TestComponent, { p: pair, u: updatedCandle }),
  );

  const rerender = (newPair: typeof pair, newCandle: Candle | null = null) =>
    renderResult.rerender(
      createElement(TestComponent, { p: newPair, u: newCandle }),
    );

  return { captured: () => captured as ControllerResult, rerender };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useCryptoCandleChartController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsReady = true;
    mockFetchCandles.mockResolvedValue(sampleCandles);
  });

  // -------------------------------------------------------------------------
  // Initial render / data fetching
  // -------------------------------------------------------------------------
  describe("data fetching", () => {
    it("calls fetchCandles with the given pair when chart is ready", async () => {
      renderController("BTC-USDT");
      await waitFor(() =>
        expect(mockFetchCandles).toHaveBeenCalledWith("BTC-USDT"),
      );
    });

    it("calls setCandles with the fetched data", async () => {
      renderController("BTC-USDT");
      await waitFor(() =>
        expect(setCandles).toHaveBeenCalledWith(sampleCandles),
      );
    });

    it("does NOT fetch when isReady is false", () => {
      mockIsReady = false;
      renderController("BTC-USDT");
      expect(mockFetchCandles).not.toHaveBeenCalled();
    });

    it("sets isLoading to false after a successful fetch", async () => {
      const { captured } = renderController("BTC-USDT");
      await waitFor(() => expect(captured().state.isLoading).toBe(false));
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------
  describe("error handling", () => {
    it("sets errorMessage when fetchCandles rejects", async () => {
      mockFetchCandles.mockRejectedValue(new Error("network error"));
      const { captured } = renderController("BTC-USDT");
      await waitFor(() =>
        expect(captured().state.errorMessage).toBe("Failed to fetch candles"),
      );
    });

    it("sets isLoading to false after a failed fetch", async () => {
      mockFetchCandles.mockRejectedValue(new Error("timeout"));
      const { captured } = renderController("BTC-USDT");
      await waitFor(() => expect(captured().state.isLoading).toBe(false));
    });
  });

  // -------------------------------------------------------------------------
  // Pair change
  // -------------------------------------------------------------------------
  describe("on pair change", () => {
    it("re-fetches candles when pair prop changes", async () => {
      const { rerender } = renderController("BTC-USDT");
      await waitFor(() =>
        expect(mockFetchCandles).toHaveBeenCalledWith("BTC-USDT"),
      );

      act(() => rerender("ETH-USDT"));

      await waitFor(() =>
        expect(mockFetchCandles).toHaveBeenCalledWith("ETH-USDT"),
      );
      expect(mockFetchCandles).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // Real-time candle updates
  // -------------------------------------------------------------------------
  describe("real-time updates", () => {
    it("calls updateCandle when updatedCandle prop is provided", async () => {
      const { rerender } = renderController("BTC-USDT", null);
      await waitFor(() => expect(mockFetchCandles).toHaveBeenCalled());

      act(() => rerender("BTC-USDT", singleCandle));

      expect(updateCandle).toHaveBeenCalledWith(singleCandle);
    });

    it("does not call updateCandle when updatedCandle is null", async () => {
      renderController("BTC-USDT", null);
      await waitFor(() => expect(mockFetchCandles).toHaveBeenCalled());
      expect(updateCandle).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe("return shape", () => {
    it("exposes containerRef, isLoading and errorMessage inside state", async () => {
      const { captured } = renderController("BTC-USDT");
      await waitFor(() => expect(captured().state.isLoading).toBe(false));

      expect(captured().state).toHaveProperty("containerRef");
      expect(captured().state).toHaveProperty("isLoading");
      expect(captured().state).toHaveProperty("errorMessage");
    });
  });
});
