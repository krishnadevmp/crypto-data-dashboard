import type { OrderBook } from "../../services/apiTypes";

/**
 * Compute mid-price between best ask and best bid.
 */
export function getMidPrice(data: OrderBook): number {
  const bestAsk = data.asks[0]?.[0] ?? 0;
  const bestBid = data.bids[0]?.[0] ?? 0;
  return (bestAsk + bestBid) / 2;
}

/**
 * Format a price value with appropriate decimal places.
 */
export function formatPrice(price: number): string {
  const decimals = price >= 100 ? 2 : price >= 1 ? 3 : 5;
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatTotal(price: number, amount: number): string {
  const total = price * amount;
  return total.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
