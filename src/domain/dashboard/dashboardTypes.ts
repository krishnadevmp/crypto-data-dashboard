import type { CryptoPair } from "../../services/apiTypes";

/** The three stream modes exposed in the UI dropdown. */
export type StreamMode = "all" | "candles" | "orderbook";

export interface StreamOption {
  value: StreamMode;
  label: string;
}

export interface PairOption {
  value: CryptoPair;
  label: string;
}

export const PAIR_OPTIONS: PairOption[] = [
  { value: "BTC-USDT", label: "BTC / USDT" },
  { value: "ETH-USDT", label: "ETH / USDT" },
  { value: "XRP-USDT", label: "XRP / USDT" },
];

export const STREAM_OPTIONS: StreamOption[] = [
  { value: "all", label: "All — Candles & Order Book" },
  { value: "candles", label: "Candles Only" },
  { value: "orderbook", label: "Order Book Only" },
];
