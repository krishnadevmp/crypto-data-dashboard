import { useEffect, useState } from "react";
import { useCandleChart } from "../../common/useCandleChart";
import { fetchCandles } from "../../services/cryptoApiService";
import type { Candle, CryptoPair } from "../../services/apiTypes";

/**
 * Props for the CandleChart component.
 *
 * The component owns data fetching.
 * The parent only needs to tell it which pair to show
 */
export interface CryptoCandleChartProps {
  /** The trading pair to display, e.g. "BTC-USDT". */
  pair: CryptoPair;
  updatedCandle: Candle | null;
}

const useCryptoCandleChartController = ({
  pair,
  updatedCandle,
}: CryptoCandleChartProps) => {
  const { containerRef, setCandles, isReady, updateCandle } = useCandleChart();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch historical candles whenever `pair` changes or chart becomes ready
  useEffect(() => {
    // Gate: don't fetch until the chart canvas exists
    if (!isReady) return;

    // Cancellation flag prevents setState calls after the effect re-runs or
    // the component unmounts while an async fetch is still in flight.
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const candles = await fetchCandles(pair);
        if (cancelled) return;

        setCandles(candles);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setErrorMessage("Failed to fetch candles");
        setIsLoading(false);
        console.log(error);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pair, isReady, setCandles]);

  useEffect(() => {
    if (updatedCandle) {
      updateCandle(updatedCandle);
    }
  }, [updatedCandle]);

  return {
    state: {
      containerRef,
      isLoading,
      errorMessage,
    },
  };
};

export default useCryptoCandleChartController;
