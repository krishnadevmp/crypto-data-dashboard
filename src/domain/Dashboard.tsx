import { useState, useEffect } from "react";
import { Select } from "../common/Select";
import { CandleChart } from "./CandleChart";
import { OrderBook } from "./Orderbook";
import { sampleBtcUsdtOrderbook } from "../common/sampleBtcUsdt";
import type {
  CryptoPair,
  OrderBook as OrderBookData,
} from "../services/apiTypes";
import {
  PAIR_OPTIONS,
  STREAM_OPTIONS,
  type StreamMode,
} from "./DashboardTypes";

/**
 * Dashboard
 *
 * Breakpoints:
 *  < sm  (< 640px)   header: logo + selects stack vertically (flex-col)
 *                    panels: chart on top, order book below (flex-col)
 *
 *  sm–lg (640–1024px) header: logo left, selects right (flex-row)
 *                    panels: still stacked (flex-col)
 *
 *  ≥ lg  (≥ 1024px)  panels when both visible: side by side (flex-row)
 *                      chart grows  → flex-1
 *                      order book   → fixed w-[300px]
 */
export function Dashboard() {
  const [pair, setPair] = useState<CryptoPair>("BTC-USDT");
  const [streamMode, setStreamMode] = useState<StreamMode>("all");

  const [orderBook] = useState<OrderBookData | null>(sampleBtcUsdtOrderbook);
  const [orderBookLoading] = useState(false);
  const [orderBookError] = useState<string | null>(null);

  useEffect(() => {
    // let cancelled = false;
    // setOrderBookLoading(true);
    // setOrderBook(null);
    // setOrderBookError(null);
    // fetchOrderBook(pair)
    //   .then((data) => {
    //     if (!cancelled) {
    //       setOrderBook(data);
    //       setOrderBookLoading(false);
    //     }
    //   })
    //   .catch((err: Error) => {
    //     if (!cancelled) {
    //       setOrderBookError(err.message);
    //       setOrderBookLoading(false);
    //     }
    //   });
    // return () => {
    //   cancelled = true;
    // };
  }, [pair]);

  const showCandles = streamMode === "all" || streamMode === "candles";
  const showOrderBook = streamMode === "all" || streamMode === "orderbook";
  const showBoth = showCandles && showOrderBook;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Header ───────────────────────────────────────────────────────────
          flex-col  on mobile  → logo on top, selects below
          flex-row  from sm up → logo left, selects right on same line
      ────────────────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20 p-2">
        <div
          className="
          max-w-screen-2xl mx-auto px-4 sm:px-6
          py-3 sm:py-0 sm:h-14
          flex flex-col sm:flex-row sm:items-center sm:justify-between
          gap-3 sm:gap-4
        "
        >
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-sm font-semibold tracking-wide text-white">
              Crypto<span className="text-teal-400">Dashboard</span>
            </span>
          </div>

          {/* Selects container
              flex-row always — the two selects sit side by side on every screen.
              Each select gets flex-1 so they share whatever width is available
              without overflowing. On larger screens they naturally fit alongside
              the logo in the same header row.
          */}
          <div className="flex flex-row items-end gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none sm:w-44">
              <Select
                label="Pair"
                value={pair}
                options={PAIR_OPTIONS}
                onChange={setPair}
              />
            </div>
            <div className="flex-1 sm:flex-none sm:w-56">
              <Select
                label="Stream"
                value={streamMode}
                options={STREAM_OPTIONS}
                onChange={setStreamMode}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────*/}
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
            <div className={`w-full lg:w-[70%] ${showBoth ? "lg:flex-1" : ""}`}>
              <CandleChart pair={pair} />
            </div>
          )}
          {showOrderBook && (
            <div
              className={`
              flex flex-col gap-2
              w-full lg:w-[30%]
               ${showBoth ? "xl:w-[280px] xl:shrink-0" : ""}
            `}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-widest uppercase text-slate-500">
                  Order Book
                </span>
                <span className="text-xs text-slate-600">{pair}</span>
              </div>

              {orderBookError ? (
                <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-6 min-h-[200px]">
                  <p className="text-xs text-red-400 text-center">
                    {orderBookError}
                  </p>
                </div>
              ) : (
                <OrderBook data={orderBook} loading={orderBookLoading} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 py-3 px-6 mt-auto">
        <p className="text-center text-xs text-slate-700">
          Mock Crypto Dashboard
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
