import type {
  OrderBook as OrderBookData,
  OrderBookEntry,
} from "../services/apiTypes";

interface OrderBookProps {
  data: OrderBookData | null;
  loading?: boolean;
}

/**
 * Compute mid-price between best ask and best bid.
 */
function getMidPrice(data: OrderBookData): number {
  const bestAsk = data.asks[0]?.[0] ?? 0;
  const bestBid = data.bids[0]?.[0] ?? 0;
  return (bestAsk + bestBid) / 2;
}

/**
 * Format a price value with appropriate decimal places.
 */
function formatPrice(price: number): string {
  const decimals = price >= 100 ? 2 : price >= 1 ? 3 : 5;
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatTotal(price: number, amount: number): string {
  const total = price * amount;
  return total.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * A single row in the order book with a depth-bar background.
 * The bar width is proportional to this row's total relative to the
 * largest total in the visible window — gives a quick visual depth cue.
 */
function OrderRow({
  entry,
  side,
  maxTotal,
}: {
  entry: OrderBookEntry;
  side: "ask" | "bid";
  maxTotal: number;
}) {
  const [price, amount] = entry;
  const total = price * amount;
  const barWidth = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const barColor = side === "ask" ? "bg-red-500/10" : "bg-teal-500/10";
  const priceColor = side === "ask" ? "text-red-400" : "text-teal-400";

  return (
    <div className="relative grid grid-cols-3 text-xs font-mono py-0.5 px-3 hover:bg-slate-800/60 transition-colors duration-75">
      {/* Depth bar — sits behind the text */}
      <span
        className={`absolute inset-y-0 right-0 ${barColor} transition-all duration-300`}
        style={{ width: `${barWidth}%` }}
      />
      <span className={`relative z-10 ${priceColor}`}>
        {formatPrice(price)}
      </span>
      <span className="relative z-10 text-slate-300 text-right">
        {formatAmount(amount)}
      </span>
      <span className="relative z-10 text-slate-500 text-right">
        {formatTotal(price, amount)}
      </span>
    </div>
  );
}

function SkeletonRows({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid grid-cols-3 px-3 py-0.5 gap-2">
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              className="h-3 rounded bg-slate-800 animate-pulse"
              style={{ opacity: 1 - i * 0.06 }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

/**
 * OrderBook component.
 *
 * Renders asks (red, sells) above a mid-price marker and bids (green, buys) below.
 * Each row has a proportional depth bar to visualize order concentration.
 * Expects real-time `data` pushed down from the parent dashboard.
 */
export function OrderBook({ data, loading = false }: OrderBookProps) {
  const VISIBLE_LEVELS = 12;
  const asks = data ? [...data.asks].slice(0, VISIBLE_LEVELS).reverse() : [];
  const bids = data ? data.bids.slice(0, VISIBLE_LEVELS) : [];

  // Compute max total across both sides for proportional depth bars
  const allTotals = [...asks, ...bids].map(([p, a]) => p * a);
  const maxTotal = allTotals.length > 0 ? Math.max(...allTotals) : 1;

  const midPrice = data ? getMidPrice(data) : null;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-3 px-3 py-2 border-b border-slate-800 shrink-0">
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500">
          Price
        </span>
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500 text-right">
          Amount
        </span>
        <span className="text-xs font-medium tracking-widest uppercase text-slate-500 text-right">
          Total
        </span>
      </div>

      {/* Asks — reversed so lowest ask is closest to mid */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col justify-end flex-1 overflow-hidden py-1">
          {loading ? (
            <SkeletonRows count={VISIBLE_LEVELS} />
          ) : (
            asks.map((entry, i) => (
              <OrderRow
                key={`ask-${i}`}
                entry={entry}
                side="ask"
                maxTotal={maxTotal}
              />
            ))
          )}
        </div>

        {/* Mid-price separator */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-y border-slate-800 bg-slate-800/40 shrink-0">
          {midPrice !== null ? (
            <>
              <span className="text-base font-mono font-semibold text-white">
                {formatPrice(midPrice)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Mid Price
              </span>
            </>
          ) : (
            <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
          )}
        </div>

        {/* Bids */}
        <div className="flex flex-col flex-1 overflow-hidden py-1">
          {loading ? (
            <SkeletonRows count={VISIBLE_LEVELS} />
          ) : (
            bids.map((entry, i) => (
              <OrderRow
                key={`bid-${i}`}
                entry={entry}
                side="bid"
                maxTotal={maxTotal}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
