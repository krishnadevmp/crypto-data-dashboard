/**
 * Supported cryptocurrency trading pairs.
 */
export type CryptoPair = "BTC-USDT" | "ETH-USDT" | "XRP-USDT";

/**
 * Represents a single OHLCV candlestick data point.
 */
export interface Candle {
  /** Unix timestamp (ms) for the start of the candle period */
  time: number;
  /** Opening price */
  open: number;
  /** Highest price during the period */
  high: number;
  /** Lowest price during the period */
  low: number;
  /** Closing price */
  close: number;
  /** Trading volume during the period */
  volume: number;
}

/**
 * Represents a single entry in the order book (bid or ask).
 * [price, amount]
 */
export type OrderBookEntry = [number, number];

/**
 * Snapshot of the order book for a trading pair.
 */
export interface OrderBook {
  pair: CryptoPair;
  /** Sell orders — ascending by price */
  asks: OrderBookEntry[];
  /** Buy orders — descending by price */
  bids: OrderBookEntry[];
  /** Server timestamp (ms) of the snapshot */
  timestamp: number;
}

/**
 * Generic wrapper for all API responses.
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}
