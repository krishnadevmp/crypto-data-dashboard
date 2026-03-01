import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CryptoCandleChart } from "../cryptoCandleChart/CryptoCandleChart";
import { createElement, createRef } from "react";

// ---------------------------------------------------------------------------
// Mock the controller — CryptoCandleChart delegates all logic to it
// ---------------------------------------------------------------------------
vi.mock("../cryptoCandleChart/useCryptoCandleChartController", () => ({
  default: vi.fn(),
}));

import useCryptoCandleChartController from "../cryptoCandleChart/useCryptoCandleChartController";
const mockController = vi.mocked(useCryptoCandleChartController);

// ---------------------------------------------------------------------------
// Helper: build a default controller return value
// ---------------------------------------------------------------------------
function makeControllerState(overrides: {
  isLoading?: boolean;
  errorMessage?: string | null;
}) {
  const containerRef = createRef<HTMLDivElement>();
  return {
    state: {
      containerRef,
      isLoading: overrides.isLoading ?? false,
      errorMessage: overrides.errorMessage ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("CryptoCandleChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders the chart container div with correct aria-label", () => {
      mockController.mockReturnValue(makeControllerState({}));

      render(
        createElement(CryptoCandleChart, {
          pair: "BTC-USDT",
          updatedCandle: null,
        }),
      );

      expect(
        screen.getByRole("img", { name: /Candlestick chart for BTC-USDT/i }),
      ).toBeInTheDocument();
    });

    it("includes the pair name in the aria-label", () => {
      mockController.mockReturnValue(makeControllerState({}));

      render(
        createElement(CryptoCandleChart, {
          pair: "ETH-USDT",
          updatedCandle: null,
        }),
      );

      expect(
        screen.getByRole("img", { name: /ETH-USDT/i }),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe("loading overlay", () => {
    it("shows the loading overlay when isLoading is true", () => {
      mockController.mockReturnValue(makeControllerState({ isLoading: true }));

      const { container } = render(
        createElement(CryptoCandleChart, {
          pair: "BTC-USDT",
          updatedCandle: null,
        }),
      );

      // The LoadingOverlay renders an animate-pulse div
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("does not show the loading overlay when isLoading is false", () => {
      mockController.mockReturnValue(makeControllerState({ isLoading: false }));

      const { container } = render(
        createElement(CryptoCandleChart, {
          pair: "BTC-USDT",
          updatedCandle: null,
        }),
      );

      expect(container.querySelector(".animate-pulse")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  describe("error message", () => {
    it("displays the error message when errorMessage is set", () => {
      mockController.mockReturnValue(
        makeControllerState({ errorMessage: "Failed to fetch candles" }),
      );

      render(
        createElement(CryptoCandleChart, {
          pair: "BTC-USDT",
          updatedCandle: null,
        }),
      );

      expect(screen.getByText("Failed to fetch candles")).toBeInTheDocument();
    });

    it("does not display an error message when errorMessage is null", () => {
      mockController.mockReturnValue(
        makeControllerState({ errorMessage: null }),
      );

      render(
        createElement(CryptoCandleChart, {
          pair: "BTC-USDT",
          updatedCandle: null,
        }),
      );

      expect(screen.queryByText(/failed/i)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Controller integration
  // -------------------------------------------------------------------------
  describe("controller integration", () => {
    it("passes pair and updatedCandle to the controller", () => {
      const candle = {
        time: 1_680_000_000_000,
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 500,
      };
      mockController.mockReturnValue(makeControllerState({}));

      render(
        createElement(CryptoCandleChart, {
          pair: "XRP-USDT",
          updatedCandle: candle,
        }),
      );

      expect(mockController).toHaveBeenCalledWith(
        expect.objectContaining({ pair: "XRP-USDT", updatedCandle: candle }),
      );
    });
  });
});
