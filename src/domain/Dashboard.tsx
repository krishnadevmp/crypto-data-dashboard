import { useState, useEffect } from "react";
import type {
  CryptoPair,
  OrderBook as OrderBookData,
} from "../services/apiTypes";
import {
  PAIR_OPTIONS,
  STREAM_OPTIONS,
  type StreamMode,
} from "./DashboardTypes";
import { Select } from "../common/Select";
import { CandleChart } from "./CandleChart";
import { OrderBook } from "./Orderbook";
import { sampleBtcUsdtOrderbook } from "../common/sampleBtcUsdt";

/**
 * Dashboard page.
 *
 * Owns the selected pair and stream mode state.
 * Fetches the order book snapshot via REST whenever the pair changes.
 * Passes data down to CandleChart and OrderBook — no WebSocket wiring yet.
 */
export function Dashboard() {
  const [pair, setPair] = useState<CryptoPair>("BTC-USDT");
  const [streamMode, setStreamMode] = useState<StreamMode>("all");

  const [orderBook] = useState<OrderBookData | null>(sampleBtcUsdtOrderbook);
  const [orderBookLoading] = useState(false);
  const [orderBookError] = useState<string | null>(null);

  useEffect(() => {
    // Todo: Call the real API once it's ready.
    // let cancelled = false;
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-sm font-semibold tracking-wide text-white">
              Crypto<span className="text-teal-400">Dashboard</span>
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-40 sm:w-48">
              <Select
                label="Pair"
                value={pair}
                options={PAIR_OPTIONS}
                onChange={setPair}
              />
            </div>
            <div className="w-48 sm:w-64">
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

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        {/* Pair label row */}
        <div className="flex items-baseline gap-3 mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {pair}
          </h1>
          <span className="text-sm text-slate-500">
            {PAIR_OPTIONS.find((p) => p.value === pair)?.label}
          </span>
        </div>

        {/* Panel grid — single column or chart + order book side by side */}
        <div
          className={`grid gap-4 ${
            showCandles && showOrderBook
              ? "grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px]"
              : "grid-cols-1"
          }`}
        >
          {showCandles && <CandleChart pair={pair} />}

          {showOrderBook && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-widest uppercase text-slate-500">
                  Order Book
                </span>
                <span className="text-xs text-slate-600">{pair}</span>
              </div>

              {orderBookError ? (
                <div className="flex-1 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-6">
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
