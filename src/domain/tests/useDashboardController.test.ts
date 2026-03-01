/* eslint-disable react-hooks/globals */
import { describe, it, expect } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { useDashboardController } from "../dashboard/useDashboardController";

// ---------------------------------------------------------------------------
// Helper: render hook via a wrapper component
// ---------------------------------------------------------------------------
type HookResult = ReturnType<typeof useDashboardController>;

function renderHookViaComponent() {
  let captured: HookResult | undefined;

  function TestComponent() {
    const result = useDashboardController();
    captured = result;
    return createElement(
      "div",
      null,
      // Expose handlers as buttons for fireEvent
      createElement("button", {
        "data-testid": "set-eth",
        onClick: () => result.handler.handlePairChange("ETH-USDT"),
      }),
      createElement("button", {
        "data-testid": "set-xrp",
        onClick: () => result.handler.handlePairChange("XRP-USDT"),
      }),
      createElement("button", {
        "data-testid": "set-candles",
        onClick: () => result.handler.handleStreamModeChange("candles"),
      }),
      createElement("button", {
        "data-testid": "set-orderbook",
        onClick: () => result.handler.handleStreamModeChange("orderbook"),
      }),
      createElement("button", {
        "data-testid": "set-all",
        onClick: () => result.handler.handleStreamModeChange("all"),
      }),
    );
  }

  const renderResult = render(createElement(TestComponent));

  const click = (testId: string) =>
    act(() => {
      fireEvent.click(renderResult.getByTestId(testId));
    });

  return { captured: () => captured as HookResult, click };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDashboardController", () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("defaults pair to BTC-USDT", () => {
      const { captured } = renderHookViaComponent();
      expect(captured().state.pair).toBe("BTC-USDT");
    });

    it("defaults streamMode to 'all'", () => {
      const { captured } = renderHookViaComponent();
      expect(captured().state.streamMode).toBe("all");
    });

    it("showCandles is true by default", () => {
      const { captured } = renderHookViaComponent();
      expect(captured().state.showCandles).toBe(true);
    });

    it("showOrderBook is true by default", () => {
      const { captured } = renderHookViaComponent();
      expect(captured().state.showOrderBook).toBe(true);
    });

    it("showBoth is true by default", () => {
      const { captured } = renderHookViaComponent();
      expect(captured().state.showBoth).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Pair changes
  // -------------------------------------------------------------------------
  describe("handlePairChange", () => {
    it("updates pair to ETH-USDT", () => {
      const { captured, click } = renderHookViaComponent();
      click("set-eth");
      expect(captured().state.pair).toBe("ETH-USDT");
    });

    it("updates pair to XRP-USDT", () => {
      const { captured, click } = renderHookViaComponent();
      click("set-xrp");
      expect(captured().state.pair).toBe("XRP-USDT");
    });

    it("does not change streamMode when pair changes", () => {
      const { captured, click } = renderHookViaComponent();
      click("set-eth");
      expect(captured().state.streamMode).toBe("all");
    });
  });

  // -------------------------------------------------------------------------
  // Stream mode changes
  // -------------------------------------------------------------------------
  describe("handleStreamModeChange", () => {
    it("sets streamMode to 'candles'", () => {
      const { captured, click } = renderHookViaComponent();
      click("set-candles");
      expect(captured().state.streamMode).toBe("candles");
    });

    it("sets streamMode to 'orderbook'", () => {
      const { captured, click } = renderHookViaComponent();
      click("set-orderbook");
      expect(captured().state.streamMode).toBe("orderbook");
    });

    it("sets streamMode back to 'all'", () => {
      const { captured, click } = renderHookViaComponent();
      click("set-candles");
      click("set-all");
      expect(captured().state.streamMode).toBe("all");
    });
  });

  // -------------------------------------------------------------------------
  // Derived visibility flags
  // -------------------------------------------------------------------------
  describe("derived visibility flags", () => {
    describe("streamMode = 'candles'", () => {
      it("showCandles is true", () => {
        const { captured, click } = renderHookViaComponent();
        click("set-candles");
        expect(captured().state.showCandles).toBe(true);
      });
      it("showOrderBook is false", () => {
        const { captured, click } = renderHookViaComponent();
        click("set-candles");
        expect(captured().state.showOrderBook).toBe(false);
      });
      it("showBoth is false", () => {
        const { captured, click } = renderHookViaComponent();
        click("set-candles");
        expect(captured().state.showBoth).toBe(false);
      });
    });

    describe("streamMode = 'orderbook'", () => {
      it("showCandles is false", () => {
        const { captured, click } = renderHookViaComponent();
        click("set-orderbook");
        expect(captured().state.showCandles).toBe(false);
      });
      it("showOrderBook is true", () => {
        const { captured, click } = renderHookViaComponent();
        click("set-orderbook");
        expect(captured().state.showOrderBook).toBe(true);
      });
      it("showBoth is false", () => {
        const { captured, click } = renderHookViaComponent();
        click("set-orderbook");
        expect(captured().state.showBoth).toBe(false);
      });
    });

    describe("streamMode = 'all'", () => {
      it("showCandles is true", () => {
        const { captured } = renderHookViaComponent();
        expect(captured().state.showCandles).toBe(true);
      });
      it("showOrderBook is true", () => {
        const { captured } = renderHookViaComponent();
        expect(captured().state.showOrderBook).toBe(true);
      });
      it("showBoth is true", () => {
        const { captured } = renderHookViaComponent();
        expect(captured().state.showBoth).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe("return shape", () => {
    it("exposes state and handler objects", () => {
      const { captured } = renderHookViaComponent();
      const result = captured();
      expect(result).toHaveProperty("state");
      expect(result).toHaveProperty("handler");
      expect(typeof result.handler.handlePairChange).toBe("function");
      expect(typeof result.handler.handleStreamModeChange).toBe("function");
    });
  });
});
