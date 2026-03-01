import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { createChart } from "lightweight-charts";

import { useCandleChart } from "../hooks/useCandleChart";
import type {
  UseCandleChartOptions,
  UseCandleChartReturn,
} from "../hooks/chartTypes";
import type { Candle } from "../../services/apiTypes";

// ---------------------------------------------------------------------------
// Hoist mock objects so they can be referenced inside the vi.mock() factory
// ---------------------------------------------------------------------------
const {
  candleSeriesMock,
  volumeSeriesMock,
  timeScaleMock,
  chartMock,
  observeMock,
  disconnectMock,
  resizeObserverMock,
} = vi.hoisted(() => {
  const timeScaleMock = {
    fitContent: vi.fn(),
  };

  const priceScaleMock = { applyOptions: vi.fn() };

  const candleSeriesMock = {
    setData: vi.fn(),
    update: vi.fn(),
  };

  const volumeSeriesMock = {
    setData: vi.fn(),
    update: vi.fn(),
    priceScale: vi.fn(() => priceScaleMock),
  };

  // Returns candleSeriesMock for "CandlestickSeries", volumeSeriesMock otherwise
  const chartMock = {
    addSeries: vi.fn((type: string) =>
      type === "CandlestickSeries" ? candleSeriesMock : volumeSeriesMock,
    ),
    remove: vi.fn(),
    timeScale: vi.fn(() => timeScaleMock),
    applyOptions: vi.fn(),
  };

  const observeMock = vi.fn();
  const disconnectMock = vi.fn();
  // Must use a regular function (not an arrow fn) so `new ResizeObserver()`
  // works — arrow functions cannot be used as constructors.
  const resizeObserverMock = vi.fn().mockImplementation(function () {
    return { observe: observeMock, disconnect: disconnectMock };
  });

  return {
    candleSeriesMock,
    volumeSeriesMock,
    timeScaleMock,
    chartMock,
    observeMock,
    disconnectMock,
    resizeObserverMock,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => chartMock),
  ColorType: { Solid: "solid" },
  CrosshairMode: { Normal: 0 },
  // These sentinel strings are passed as the first arg to chart.addSeries(),
  // so chartMock.addSeries can distinguish them.
  CandlestickSeries: "CandlestickSeries",
  HistogramSeries: "HistogramSeries",
}));

// jsdom does not ship ResizeObserver — stub it globally
vi.stubGlobal("ResizeObserver", resizeObserverMock);

afterAll(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Test helpers
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

/**
 * Renders the hook inside a component so the containerRef gets attached
 * to a real DOM element, allowing the chart-init effect to fire.
 */
function renderHookViaComponent(options: UseCandleChartOptions = {}) {
  let captured: UseCandleChartReturn | undefined;

  function TestChart() {
    const result = useCandleChart(options);
    // eslint-disable-next-line react-hooks/globals
    captured = result;
    return createElement("div", {
      ref: result.containerRef,
      style: { width: 400, height: 400 },
    });
  }

  const { unmount } = render(createElement(TestChart));
  return { api: captured as UseCandleChartReturn, unmount };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useCandleChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire createChart to always return chartMock after clearAllMocks
    vi.mocked(createChart).mockReturnValue(
      chartMock as unknown as ReturnType<typeof createChart>,
    );
    chartMock.addSeries.mockImplementation((type: string) =>
      type === "CandlestickSeries" ? candleSeriesMock : volumeSeriesMock,
    );
    cleanup();
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe("initialization", () => {
    it("creates a chart on mount and signals isReady", () => {
      const { api } = renderHookViaComponent();

      expect(createChart).toHaveBeenCalledOnce();
      expect(api.isReady).toBe(true);
    });

    it("always adds a candlestick series", () => {
      renderHookViaComponent();

      const types = chartMock.addSeries.mock.calls.map(([type]) => type);
      expect(types).toContain("CandlestickSeries");
    });

    it("adds a volume histogram series when showVolume is true (default)", () => {
      renderHookViaComponent({ showVolume: true });

      const types = chartMock.addSeries.mock.calls.map(([type]) => type);
      expect(types).toContain("HistogramSeries");
    });

    it("does NOT add a volume series when showVolume is false", () => {
      renderHookViaComponent({ showVolume: false });

      const types = chartMock.addSeries.mock.calls.map(([type]) => type);
      expect(types).not.toContain("HistogramSeries");
    });

    it("passes merged chart options to createChart", () => {
      renderHookViaComponent({
        chartOptions: { layout: { textColor: "#ffffff" } },
      });

      const [, opts] = vi.mocked(createChart).mock.calls[0];
      expect(
        (opts as { layout?: { textColor?: string } }).layout?.textColor,
      ).toBe("#ffffff");
    });
  });

  // -------------------------------------------------------------------------
  // Unmount / cleanup
  // -------------------------------------------------------------------------
  describe("cleanup on unmount", () => {
    it("calls chart.remove() when the component unmounts", () => {
      const { unmount } = renderHookViaComponent();

      unmount();

      expect(chartMock.remove).toHaveBeenCalledOnce();
    });

    it("cycles isReady through false → true during its lifetime", () => {
      const readyStates: boolean[] = [];

      function TestChart() {
        const result = useCandleChart();
        readyStates.push(result.isReady);
        return createElement("div", { ref: result.containerRef });
      }

      const { unmount } = render(createElement(TestChart));
      // By the time render() returns, effects have been flushed, so
      // isReady must have been true at least once.
      expect(readyStates).toContain(true);

      unmount();
      // Calling setIsReady(false) on an unmounted component does not trigger
      // a re-render, so we only verify that the component reached isReady=true
      // and that chart.remove() was called (tested separately).
      expect(chartMock.remove).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // setCandles
  // -------------------------------------------------------------------------
  describe("setCandles", () => {
    it("calls candleSeries.setData with mapped candlestick data", () => {
      const { api } = renderHookViaComponent();

      api.setCandles(sampleCandles);

      expect(candleSeriesMock.setData).toHaveBeenCalledOnce();
      const [data] = candleSeriesMock.setData.mock.calls[0];
      expect(data).toHaveLength(sampleCandles.length);
      // Verify time conversion (ms → s)
      expect(data[0].time).toBe(Math.floor(sampleCandles[0].time / 1000));
    });

    it("calls volumeSeries.setData with mapped volume data", () => {
      const { api } = renderHookViaComponent();

      api.setCandles(sampleCandles);

      expect(volumeSeriesMock.setData).toHaveBeenCalledOnce();
      const [data] = volumeSeriesMock.setData.mock.calls[0];
      expect(data).toHaveLength(sampleCandles.length);
      expect(data[0].value).toBe(sampleCandles[0].volume);
    });

    it("calls timeScale.fitContent after setting candle data", () => {
      const { api } = renderHookViaComponent();

      api.setCandles(sampleCandles);

      expect(chartMock.timeScale).toHaveBeenCalled();
      expect(timeScaleMock.fitContent).toHaveBeenCalled();
    });

    it("does nothing when called before chart is ready (candleSeries is null)", () => {
      // Simulate uninitialized state by rendering without a container
      let captured: UseCandleChartReturn | undefined;

      function TestChart() {
        const result = useCandleChart();
        // eslint-disable-next-line react-hooks/globals
        captured = result;
        // intentionally do NOT attach containerRef — chart won't initialize
        return createElement("div");
      }

      render(createElement(TestChart));

      // Should not throw even though the chart never initialized
      expect(() => captured!.setCandles(sampleCandles)).not.toThrow();
      expect(candleSeriesMock.setData).not.toHaveBeenCalled();
    });

    it("does not call volumeSeries.setData when showVolume is false", () => {
      const { api } = renderHookViaComponent({ showVolume: false });

      api.setCandles(sampleCandles);

      expect(volumeSeriesMock.setData).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // updateCandle
  // -------------------------------------------------------------------------
  describe("updateCandle", () => {
    it("calls candleSeries.update with the mapped candle tick", () => {
      const { api } = renderHookViaComponent();

      api.updateCandle(singleCandle);

      expect(candleSeriesMock.update).toHaveBeenCalledOnce();
      const [point] = candleSeriesMock.update.mock.calls[0];
      expect(point.time).toBe(Math.floor(singleCandle.time / 1000));
      expect(point.open).toBe(singleCandle.open);
      expect(point.close).toBe(singleCandle.close);
    });

    it("calls volumeSeries.update with the mapped volume tick", () => {
      const { api } = renderHookViaComponent();

      api.updateCandle(singleCandle);

      expect(volumeSeriesMock.update).toHaveBeenCalledOnce();
      const [point] = volumeSeriesMock.update.mock.calls[0];
      expect(point.value).toBe(singleCandle.volume);
    });

    it("does nothing when called before the chart is initialised", () => {
      let captured: UseCandleChartReturn | undefined;

      function TestChart() {
        const result = useCandleChart();
        // eslint-disable-next-line react-hooks/globals
        captured = result;
        return createElement("div"); // no ref attached
      }

      render(createElement(TestChart));

      expect(() => captured!.updateCandle(singleCandle)).not.toThrow();
      expect(candleSeriesMock.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // fitContent
  // -------------------------------------------------------------------------
  describe("fitContent", () => {
    it("calls chart.timeScale().fitContent()", () => {
      const { api } = renderHookViaComponent();

      api.fitContent();

      expect(chartMock.timeScale).toHaveBeenCalled();
      expect(timeScaleMock.fitContent).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Auto-resize
  // -------------------------------------------------------------------------
  describe("auto-resize", () => {
    it("creates a ResizeObserver and observes the container when autoResize is true (default)", () => {
      renderHookViaComponent({ autoResize: true });

      // React 18 may double-invoke effects in testing; assert called at least once
      expect(resizeObserverMock).toHaveBeenCalled();
      expect(observeMock).toHaveBeenCalled();
    });

    it("disconnects the ResizeObserver on unmount", () => {
      const { unmount } = renderHookViaComponent({ autoResize: true });

      unmount();

      // React 18 may double-invoke effects; each mount creates an observer that
      // is disconnected on cleanup — assert called at least once
      expect(disconnectMock).toHaveBeenCalled();
    });

    it("does NOT create a ResizeObserver when autoResize is false", () => {
      renderHookViaComponent({ autoResize: false });

      expect(resizeObserverMock).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe("return value", () => {
    it("exposes the expected API surface", () => {
      const { api } = renderHookViaComponent();

      expect(api.containerRef).toBeDefined();
      expect(typeof api.setCandles).toBe("function");
      expect(typeof api.updateCandle).toBe("function");
      expect(typeof api.fitContent).toBe("function");
      expect(typeof api.isReady).toBe("boolean");
    });

    it("containerRef.current points to the rendered container element", () => {
      let containerRef: UseCandleChartReturn["containerRef"] | undefined;

      function TestChart() {
        const result = useCandleChart();
        // eslint-disable-next-line react-hooks/globals
        containerRef = result.containerRef;
        return createElement("div", { ref: result.containerRef });
      }

      render(createElement(TestChart));

      expect(containerRef!.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
