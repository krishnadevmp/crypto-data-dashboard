import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type DeepPartial,
  type ChartOptions,
} from "lightweight-charts";

import type { Candle } from "../services/apiTypes";
import type { UseCandleChartOptions, UseCandleChartReturn } from "./chartTypes";
import {
  mapCandlesToSeriesData,
  toCandlestickData,
  toVolumeData,
} from "./chartDataMapper";

// ---------------------------------------------------------------------------
// Default chart appearance — dark theme matching a typical crypto exchange UI
// ---------------------------------------------------------------------------

const DEFAULT_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "#0f172a" },
    textColor: "#94a3b8",
  },
  grid: {
    vertLines: { color: "#1e293b" },
    horzLines: { color: "#1e293b" },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
  },
  rightPriceScale: {
    borderColor: "#1e293b",
  },
  timeScale: {
    borderColor: "#1e293b",
    timeVisible: true,
    secondsVisible: false,
  },
};

/**
 * useCandleChart
 *
 * A pure chart-control hook. It owns ONLY the lightweight-charts instance
 * lifecycle — initialisation, resize, and cleanup. It has no knowledge of
 * where data comes from.
 *
 * The consuming component is responsible for:
 *  - Fetching historical candles (REST) and calling `setCandles`
 *  - Receiving real-time updates (WebSocket) and calling `updateCandle`
 *  - Waiting for `isReady === true` before pushing any data
 *
 */
export function useCandleChart({
  chartOptions = {},
  candlestickOptions = {},
  volumeOptions = {},
  showVolume = true,
  autoResize = true,
}: UseCandleChartOptions = {}): UseCandleChartReturn {
  const containerRef = useRef<HTMLDivElement>(null);

  // Chart and series instances are held in refs — mutating them must never
  // trigger a re-render; they are only accessed imperatively via the returned API.
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Exposed so the consuming component can gate data calls on chart readiness.
  const [isReady, setIsReady] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. Chart initialization — runs once on mount, cleans up on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mergedOptions: DeepPartial<ChartOptions> = {
      ...DEFAULT_CHART_OPTIONS,
      ...chartOptions,
      // Shallow-merge nested objects so callers can partially override them
      layout: { ...DEFAULT_CHART_OPTIONS.layout, ...chartOptions.layout },
      grid: { ...DEFAULT_CHART_OPTIONS.grid, ...chartOptions.grid },
      width: container.clientWidth,
      height: container.clientHeight || 400,
    };

    const chart = createChart(container, mergedOptions);
    chartRef.current = chart;

    // Candlestick series — v5 API: addSeries(SeriesType, options)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      ...candlestickOptions,
    });
    candleSeriesRef.current = candleSeries;

    // Optional volume histogram pinned to the bottom 20% of the pane
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        ...volumeOptions,
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Signal to the consumer that the chart is ready to accept data
    setIsReady(true);

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setIsReady(false);
    };
    // Intentionally runs once — appearance options are applied at init time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Auto-resize — observes the container and keeps the chart in sync
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!autoResize || !containerRef.current || !chartRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;
      const { width, height } = entry.contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoResize, isReady]);

  // ---------------------------------------------------------------------------
  // 3. Public chart-control API
  //    All functions are stable (useCallback with no deps) so they are safe
  //    to include in dependency arrays in the consuming component.
  // ---------------------------------------------------------------------------

  /**
   * Replace the full candle dataset.
   *
   * Intended for the consuming component to call after it fetches historical
   * candles from the REST API (e.g. on initial load or pair switch).
   */
  const setCandles = useCallback((candles: Candle[]) => {
    if (!candleSeriesRef.current) return;

    const { candlestickData, volumeData } = mapCandlesToSeriesData(candles);
    candleSeriesRef.current.setData(candlestickData);
    volumeSeriesRef.current?.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, []);

  /**
   * Apply a single real-time candle tick.
   *
   * Intended for the consuming component to call whenever the WebSocket
   * delivers a `candle_update` message.
   *
   * lightweight-charts handles both cases transparently:
   *   - Matching timestamp → updates the current bar in place.
   *   - New timestamp     → appends a new bar.
   */
  const updateCandle = useCallback((candle: Candle) => {
    if (!candleSeriesRef.current) return;
    candleSeriesRef.current.update(toCandlestickData(candle));
    volumeSeriesRef.current?.update(toVolumeData(candle));
  }, []);

  /** Zoom the time scale so all loaded candles are visible. */
  const fitContent = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  return { containerRef, setCandles, updateCandle, fitContent, isReady };
}
