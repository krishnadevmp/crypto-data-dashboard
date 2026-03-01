import useCryptoCandleChartController, {
  type CryptoCandleChartProps,
} from "./useCryptoCandleChartController";

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 rounded-lg bg-slate-800 animate-pulse z-10" />
  );
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
 *  3. Listens for real-time updates via the `updatedCandle` prop and applies them
 */
export function CryptoCandleChart({
  pair,
  updatedCandle,
}: CryptoCandleChartProps) {
  const {
    state: { containerRef, isLoading, errorMessage },
  } = useCryptoCandleChartController({ pair, updatedCandle });

  return (
    <div className="flex-col relative">
      <div
        className="h-[320px] sm:h-[420px] lg:h-full lg:min-h-[520px]"
        ref={containerRef}
        role="img"
        aria-label={`Candlestick chart for ${pair}`}
      />
      {isLoading && <LoadingOverlay />}
      {errorMessage && (
        <div className="mt-2 text-xs text-red-400 text-center">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

export default CryptoCandleChart;
