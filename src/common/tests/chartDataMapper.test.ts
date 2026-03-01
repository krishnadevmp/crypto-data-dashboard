import { describe, it, expect } from "vitest";
import {
  toChartTime,
  toCandlestickData,
  toVolumeData,
  mapCandlesToSeriesData,
} from "../utils/chartDataMapper";
import type { Candle } from "../../services/apiTypes";

describe("chartDataMapper utils", () => {
  it("toChartTime converts ms to seconds", () => {
    expect(toChartTime(1680000000000)).toBe(Math.floor(1680000000000 / 1000));
  });

  it("toCandlestickData maps Candle to CandlestickData", () => {
    const candle: Candle = {
      time: 1680000000000,
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      volume: 1234,
    };
    expect(toCandlestickData(candle)).toEqual({
      time: Math.floor(1680000000000 / 1000),
      open: 100,
      high: 110,
      low: 90,
      close: 105,
    });
  });

  it("toVolumeData maps Candle to HistogramData with correct color (bullish)", () => {
    const candle: Candle = {
      time: 1680000000000,
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      volume: 1234,
    };
    expect(toVolumeData(candle)).toEqual({
      time: Math.floor(1680000000000 / 1000),
      value: 1234,
      color: "rgba(38, 166, 154, 0.5)",
    });
  });

  it("toVolumeData maps Candle to HistogramData with correct color (bearish)", () => {
    const candle: Candle = {
      time: 1680000000000,
      open: 105,
      high: 110,
      low: 90,
      close: 100,
      volume: 4321,
    };
    expect(toVolumeData(candle)).toEqual({
      time: Math.floor(1680000000000 / 1000),
      value: 4321,
      color: "rgba(239, 83, 80, 0.5)",
    });
  });

  it("mapCandlesToSeriesData maps array of candles to both series", () => {
    const candles: Candle[] = [
      {
        time: 1680000000000,
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 1234,
      },
      {
        time: 1680000005000,
        open: 105,
        high: 115,
        low: 95,
        close: 100,
        volume: 4321,
      },
    ];
    const { candlestickData, volumeData } = mapCandlesToSeriesData(candles);
    expect(candlestickData).toEqual([
      {
        time: Math.floor(1680000000000 / 1000),
        open: 100,
        high: 110,
        low: 90,
        close: 105,
      },
      {
        time: Math.floor(1680000005000 / 1000),
        open: 105,
        high: 115,
        low: 95,
        close: 100,
      },
    ]);
    expect(volumeData).toEqual([
      {
        time: Math.floor(1680000000000 / 1000),
        value: 1234,
        color: "rgba(38, 166, 154, 0.5)",
      },
      {
        time: Math.floor(1680000005000 / 1000),
        value: 4321,
        color: "rgba(239, 83, 80, 0.5)",
      },
    ]);
  });
});
