import { Select } from "../../common/components/Select";
import { DashboardPanels } from "./DashboardPanel";
import { PAIR_OPTIONS, STREAM_OPTIONS } from "./dashboardTypes";
import { useDashboardController } from "./useDashboardController";

export function Dashboard() {
  const {
    state: { pair, streamMode, showCandles, showOrderBook, showBoth },
    handler: { handlePairChange, handleStreamModeChange },
  } = useDashboardController();

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
                onChange={handlePairChange}
              />
            </div>
            <div className="flex-1 sm:flex-none sm:w-56">
              <Select
                label="Stream"
                value={streamMode}
                options={STREAM_OPTIONS}
                onChange={handleStreamModeChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────*/}
      <DashboardPanels
        pair={pair}
        showCandles={showCandles}
        showOrderBook={showOrderBook}
        showBoth={showBoth}
      />

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
