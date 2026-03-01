import type { CandlestickData, HistogramData, Time } from "lightweight-charts";
import type { Candle } from "../../services/apiTypes";

/**
 * lightweight-charts expects time as seconds (Unix timestamp in seconds).
 * Our Candle type stores time in milliseconds, so we divide by 1000.
 */
export function toChartTime(ms: number): Time {
  return Math.floor(ms / 1000) as Time;
}

/**
 * Map our internal Candle to a lightweight-charts CandlestickData point.
 */
export function toCandlestickData(candle: Candle): CandlestickData {
  return {
    time: toChartTime(candle.time),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

/**
 * Map our internal Candle to a lightweight-charts HistogramData point
 * used for the volume series.
 *
 * Colours the bar green for bullish candles (close >= open), red for bearish.
 */
export function toVolumeData(candle: Candle): HistogramData {
  return {
    time: toChartTime(candle.time),
    value: candle.volume,
    color:
      candle.close >= candle.open
        ? "rgba(38, 166, 154, 0.5)"
        : "rgba(239, 83, 80, 0.5)",
  };
}

/**
 * Convert an array of Candles to both series data arrays in one pass.
 */
export function mapCandlesToSeriesData(candles: Candle[]): {
  candlestickData: CandlestickData[];
  volumeData: HistogramData[];
} {
  const candlestickData: CandlestickData[] = [];
  const volumeData: HistogramData[] = [];

  for (const candle of candles) {
    candlestickData.push(toCandlestickData(candle));
    volumeData.push(toVolumeData(candle));
  }

  return { candlestickData, volumeData };
}
