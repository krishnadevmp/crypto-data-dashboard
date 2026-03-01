import type {
  DeepPartial,
  ChartOptions,
  CandlestickSeriesOptions,
  HistogramSeriesOptions,
} from "lightweight-charts";
import type { Candle } from "../../services/apiTypes";

/**
 * Options accepted by the useCandleChart hook.
 *
 * The hook is intentionally data-agnostic — it only controls chart
 * initialization and appearance. All data loading (REST + WebSocket)
 * is the responsibility of the consuming component, which drives the
 * chart via the `setCandles` and `updateCandle` methods on the return value.
 */
export interface UseCandleChartOptions {
  /** Override any lightweight-charts top-level chart options. */
  chartOptions?: DeepPartial<ChartOptions>;

  /** Override candlestick series appearance. */
  candlestickOptions?: DeepPartial<CandlestickSeriesOptions>;

  /** Override volume histogram series appearance. */
  volumeOptions?: DeepPartial<HistogramSeriesOptions>;

  /**
   * Whether to render the volume histogram below the candles.
   * @default true
   */
  showVolume?: boolean;

  /**
   * Whether the chart should auto-resize when the container changes size.
   * Uses ResizeObserver when true.
   * @default true
   */
  autoResize?: boolean;
}

/**
 * Chart control API returned by useCandleChart.
 *
 * The consuming component owns all data fetching and state; it drives
 * the chart exclusively through these methods.
 */
export interface UseCandleChartReturn {
  /**
   * Attach this ref to the div that should contain the chart.
   * e.g. <div ref={containerRef} />
   */
  containerRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Replace the entire candle dataset.
   * Call this after fetching historical candles for a new pair.
   */
  setCandles: (candles: Candle[]) => void;

  /**
   * Push a single real-time candle from the WebSocket stream.
   * - Same timestamp as the last bar → updates that bar in place.
   * - New timestamp → appends a new bar.
   */
  updateCandle: (candle: Candle) => void;

  /** Fit all loaded candles into the visible viewport. */
  fitContent: () => void;

  /**
   * True once the chart instance has been created and is ready to receive data.
   * The consuming component should wait for this before calling setCandles.
   */
  isReady: boolean;
}
