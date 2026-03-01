import { useState } from "react";
import type { CryptoPair } from "../../services/apiTypes";
import type { StreamMode } from "./dashboardTypes";

export function useDashboardController() {
  const [pair, setPair] = useState<CryptoPair>("BTC-USDT");
  const [streamMode, setStreamMode] = useState<StreamMode>("all");

  const showCandles = streamMode === "all" || streamMode === "candles";
  const showOrderBook = streamMode === "all" || streamMode === "orderbook";
  const showBoth = showCandles && showOrderBook;
  const handlePairChange = (pair: CryptoPair) => {
    setPair(pair);
  };
  const handleStreamModeChange = (mode: StreamMode) => {
    setStreamMode(mode);
  };

  return {
    state: {
      pair,
      streamMode,
      showCandles,
      showOrderBook,
      showBoth,
    },
    handler: {
      handlePairChange,
      handleStreamModeChange,
    },
  };
}
