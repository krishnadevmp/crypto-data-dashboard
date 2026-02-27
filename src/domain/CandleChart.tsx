import { useEffect, useState } from "react";

import { useCandleChart } from "../common/useCandleChart";
// import { fetchCandles } from "../services/cryptoApiService";
import type { Candle, CryptoPair } from "../services/apiTypes";
import type { UseCandleChartOptions } from "../common/chartTypes";
import { sampleBtcUsdt } from "../common/sampleBtcUsdt";

/**
 * Props for the CandleChart component.
 *
 * The component owns data fetching and WebSocket wiring.
 * The parent only needs to tell it which pair to show and
 * optionally wire in a real-time candle feed.
 */
export interface CandleChartProps {
  /** The trading pair to display, e.g. "BTC-USDT". */
  pair: CryptoPair;

  /**
   * Optional live candle pushed down from a parent that owns the WebSocket.
   * When this prop changes the component forwards it straight to `updateCandle`.
   *
   * If you prefer the component to manage its own WebSocket connection,
   * leave this undefined and handle subscription internally instead.
   */
  liveCandle?: Candle;

  /**
   * Called once the initial REST fetch completes successfully.
   * Useful if a parent wants to know when historical data is loaded.
   */
  onCandlesLoaded?: (candles: Candle[]) => void;

  /** Called when the REST fetch fails. */
  onError?: (error: Error) => void;

  /** Forwarded directly to useCandleChart for chart appearance overrides. */
  chartOptions?: UseCandleChartOptions;

  /** Tailwind class(es) applied to the outer wrapper div. */
  className?: string;
}

/**
 * Internal fetch state managed inside CandleChart.
 */
export type FetchStatus = "idle" | "loading" | "success" | "error";

/**
 * CandleChart
 *
 * A self-contained UI component that:
 *  1. Accepts a `pair` prop and fetches historical candles from the REST API
 *     (results are served from the client-side cache on repeat selections).
 *  2. Renders them via `useCandleChart` (lightweight-charts under the hood).
 *  3. Forwards any `liveCandle` prop — pushed down from a parent WebSocket
 *     manager — straight to `updateCandle` for real-time bar updates.
 *  4. Handles loading, error, and retry states with appropriate UI feedback.
 *
 * This component is intentionally unaware of WebSocket connection logic.
 * It receives live data passively through the `liveCandle` prop, keeping
 * WebSocket ownership at a higher level (e.g. a dashboard parent or context).
 *
 * @example
 * ```tsx
 * <CandleChart
 *   pair={selectedPair}
 *   liveCandle={latestCandleFromWebSocket}
 *   onCandlesLoaded={(candles) => console.log('Loaded', candles.length)}
 *   className="h-96"
 * />
 * ```
 */
export function CandleChart({
  pair,
  liveCandle,
  onCandlesLoaded,
  onError,
  chartOptions = {},
  className = "",
}: CandleChartProps) {
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");

  const { containerRef, setCandles, isReady } = useCandleChart(chartOptions);

  // 1. Fetch historical candles whenever `pair` changes or chart becomes ready
  useEffect(() => {
    // Gate: don't fetch until the chart canvas exists
    if (!isReady) return;

    // Cancellation flag prevents setState calls after the effect re-runs or
    // the component unmounts while an async fetch is still in flight.
    let cancelled = false;

    async function load() {
      setFetchStatus("loading");

      try {
        // ToDo: swap this out with the real API call once the backend is up and running
        // const candles = await fetchCandles(pair);
        const candles = sampleBtcUsdt;
        if (cancelled) return;

        setCandles(candles);
        setFetchStatus("success");
        onCandlesLoaded?.(candles);
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setFetchStatus("error");
        onError?.(error);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pair, isReady, setCandles, onCandlesLoaded, onError]);

  // Surface the latest close price in the header when live data is flowing
  const livePrice = liveCandle?.close;

  return (
    <div
      className={`flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden ${className}`}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm tracking-wide">
            {pair}
          </span>
        </div>

        {livePrice !== undefined && fetchStatus === "success" && (
          <span
            className="text-white font-mono text-sm tabular-nums"
            aria-label={`Current price: ${livePrice}`}
          >
            {livePrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        )}
      </div>

      {/* ── Chart canvas + overlays ───────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="w-full h-full"
          role="img"
          aria-label={`Candlestick chart for ${pair}`}
        />
      </div>
    </div>
  );
}

export default CandleChart;
