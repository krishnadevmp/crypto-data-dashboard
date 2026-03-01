import { describe, it, expect } from "vitest";
import type { OrderBook } from "../../services/apiTypes";
import {
  getMidPrice,
  formatPrice,
  formatAmount,
  formatTotal,
} from "../orderbook/utils";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeBook = (
  asks: [number, number][],
  bids: [number, number][],
): OrderBook => ({
  pair: "BTC-USDT",
  asks,
  bids,
  timestamp: 1_680_000_000_000,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("orderbook utils", () => {
  // -------------------------------------------------------------------------
  // getMidPrice
  // -------------------------------------------------------------------------
  describe("getMidPrice", () => {
    it("returns the average of best ask and best bid", () => {
      const book = makeBook([[30100, 0.5]], [[29900, 1]]);
      expect(getMidPrice(book)).toBe((30100 + 29900) / 2); // 30000
    });

    it("returns 0 when both sides are empty", () => {
      const book = makeBook([], []);
      expect(getMidPrice(book)).toBe(0);
    });

    it("uses only the first entry (best ask / best bid)", () => {
      const book = makeBook(
        [
          [30100, 1],
          [30200, 2],
        ],
        [
          [29900, 1],
          [29800, 3],
        ],
      );
      expect(getMidPrice(book)).toBe((30100 + 29900) / 2);
    });

    it("returns half of best ask when bids are empty", () => {
      const book = makeBook([[30000, 1]], []);
      expect(getMidPrice(book)).toBe(30000 / 2); // bestBid defaults to 0
    });

    it("returns half of best bid when asks are empty", () => {
      const book = makeBook([], [[29900, 1]]);
      expect(getMidPrice(book)).toBe(29900 / 2); // bestAsk defaults to 0
    });
  });

  // -------------------------------------------------------------------------
  // formatPrice
  // -------------------------------------------------------------------------
  describe("formatPrice", () => {
    it("uses 2 decimal places for prices >= 100", () => {
      // toLocaleString output depends on locale — check suffix pattern
      const result = formatPrice(30000);
      // Should end with exactly 2 decimal digits
      expect(result).toMatch(/\.\d{2}$/);
    });

    it("uses 3 decimal places for prices in [1, 100)", () => {
      const result = formatPrice(50);
      expect(result).toMatch(/\.\d{3}$/);
    });

    it("uses 5 decimal places for prices < 1", () => {
      const result = formatPrice(0.5);
      expect(result).toMatch(/\.\d{5}$/);
    });

    it("returns a non-empty string for zero", () => {
      expect(formatPrice(0)).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // formatAmount
  // -------------------------------------------------------------------------
  describe("formatAmount", () => {
    it("returns at least 2 decimal places", () => {
      const result = formatAmount(1);
      expect(result).toMatch(/\.\d{2,4}$/);
    });

    it("returns no more than 4 decimal places", () => {
      // Strip any thousand-separators before the decimal check
      const result = formatAmount(1.23456789);
      const decimals = result.split(".")[1] ?? "";
      expect(decimals.length).toBeLessThanOrEqual(4);
    });

    it("formats zero correctly", () => {
      expect(formatAmount(0)).toMatch(/0\.00/);
    });
  });

  // -------------------------------------------------------------------------
  // formatTotal
  // -------------------------------------------------------------------------
  describe("formatTotal", () => {
    it("returns price × amount formatted to 2 decimal places", () => {
      const result = formatTotal(30000, 0.5);
      // 30000 * 0.5 = 15000 → should contain "15,000.00" or "15000.00"
      expect(result).toMatch(/\.\d{2}$/);
    });

    it("computes the correct numeric total", () => {
      // Remove locale separators to check the raw number
      const raw = formatTotal(100, 3).replace(/[^0-9.]/g, "");
      expect(parseFloat(raw)).toBeCloseTo(300, 1);
    });

    it("handles zero amount", () => {
      const raw = formatTotal(30000, 0).replace(/[^0-9.]/g, "");
      expect(parseFloat(raw)).toBe(0);
    });
  });
});
