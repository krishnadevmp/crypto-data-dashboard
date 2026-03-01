import { useEffect } from "react";
import { useCandleChart } from "../common/useCandleChart";
// import { fetchCandles } from "../services/cryptoApiService";
import type { CryptoPair } from "../services/apiTypes";
import { fetchCandles } from "../services/cryptoApiService";

/**
 * Props for the CandleChart component.
 *
 * The component owns data fetching.
 * The parent only needs to tell it which pair to show
 */
export interface CandleChartProps {
  /** The trading pair to display, e.g. "BTC-USDT". */
  pair: CryptoPair;
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
 *
 * @example
 * ```tsx
 * <CandleChart
 *   pair={selectedPair}
 * />
 * ```
 */
export function CandleChart({ pair }: CandleChartProps) {
  const { containerRef, setCandles, isReady } = useCandleChart();

  // 1. Fetch historical candles whenever `pair` changes or chart becomes ready
  useEffect(() => {
    // Gate: don't fetch until the chart canvas exists
    if (!isReady) return;

    // Cancellation flag prevents setState calls after the effect re-runs or
    // the component unmounts while an async fetch is still in flight.
    let cancelled = false;

    async function load() {
      try {
        const candles = await fetchCandles(pair);
        if (cancelled) return;

        setCandles(candles);
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        console.log(error);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pair, isReady, setCandles]);

  return (
    <div
      className="h-[320px] sm:h-[420px] lg:h-full lg:min-h-[520px]"
      ref={containerRef}
      role="img"
      aria-label={`Candlestick chart for ${pair}`}
    />
  );
}

export default CandleChart;
