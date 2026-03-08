import { useCryptoWebSocket } from "../../common/hooks/useCryptoWebSocket";
import CryptoCandleChart from "../cryptoCandleChart/CryptoCandleChart";
import { OrderBook } from "../orderbook/Orderbook";
import { PAIR_OPTIONS } from "./dashboardTypes";
import type { useDashboardController } from "./useDashboardController";

interface DashboardPanelsProps {
  pair: ReturnType<typeof useDashboardController>["state"]["pair"];
  showCandles: boolean;
  showOrderBook: boolean;
  showBoth: boolean;
}

export function DashboardPanels({
  pair,
  showCandles,
  showOrderBook,
  showBoth,
}: DashboardPanelsProps) {
  const { updatedCandle, orderBook } = useCryptoWebSocket(pair);

  return (
    <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
      {/* Pair label */}
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
          {pair}
        </h1>
        <span className="text-sm text-slate-500 hidden sm:inline">
          {PAIR_OPTIONS.find((p) => p.value === pair)?.label}
        </span>
      </div>
      <div
        className={`
          flex flex-col gap-4
          ${showBoth ? "lg:flex-row lg:items-stretch" : ""}
        `}
      >
        {showCandles && (
          <div className={`w-full ${showBoth ? "lg:w-[70%]" : ""}`}>
            <CryptoCandleChart pair={pair} updatedCandle={updatedCandle} />
          </div>
        )}
        {showOrderBook && (
          <div
            className={`
              flex flex-col gap-2
               ${showBoth ? "w-full lg:w-[30%]" : ""}
            `}
          >
            <OrderBook pair={pair} updatedOrderBook={orderBook} />
          </div>
        )}
      </div>
    </main>
  );
}
