import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCache } from "../apiCache";

describe("createCache", () => {
  // -------------------------------------------------------------------------
  // Basic operations
  // -------------------------------------------------------------------------
  describe("basic operations", () => {
    it("stores and retrieves a value", () => {
      const cache = createCache<string>();
      cache.set("key", "value");
      expect(cache.get("key")).toBe("value");
    });

    it("returns undefined for a missing key", () => {
      const cache = createCache<string>();
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("has() returns true for a stored key", () => {
      const cache = createCache<number>();
      cache.set("x", 42);
      expect(cache.has("x")).toBe(true);
    });

    it("has() returns false for a missing key", () => {
      const cache = createCache<number>();
      expect(cache.has("missing")).toBe(false);
    });

    it("overwrites an existing key on second set()", () => {
      const cache = createCache<string>();
      cache.set("k", "first");
      cache.set("k", "second");
      expect(cache.get("k")).toBe("second");
    });

    it("stores complex objects by reference", () => {
      const cache = createCache<string[]>();
      const arr = ["a", "b", "c"];
      cache.set("arr", arr);
      expect(cache.get("arr")).toBe(arr); // same reference
    });
  });

  // -------------------------------------------------------------------------
  // delete()
  // -------------------------------------------------------------------------
  describe("delete()", () => {
    it("removes the key so get() returns undefined", () => {
      const cache = createCache<string>();
      cache.set("k", "v");
      cache.delete("k");
      expect(cache.get("k")).toBeUndefined();
    });

    it("has() returns false after delete()", () => {
      const cache = createCache<string>();
      cache.set("k", "v");
      cache.delete("k");
      expect(cache.has("k")).toBe(false);
    });

    it("deleting a non-existent key does not throw", () => {
      const cache = createCache<string>();
      expect(() => cache.delete("ghost")).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // clear()
  // -------------------------------------------------------------------------
  describe("clear()", () => {
    it("removes all entries", () => {
      const cache = createCache<string>();
      cache.set("a", "1");
      cache.set("b", "2");
      cache.clear();
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBeUndefined();
    });

    it("has() returns false for all keys after clear()", () => {
      const cache = createCache<number>();
      cache.set("x", 1);
      cache.set("y", 2);
      cache.clear();
      expect(cache.has("x")).toBe(false);
      expect(cache.has("y")).toBe(false);
    });

    it("cache is usable again after clear()", () => {
      const cache = createCache<string>();
      cache.set("k", "old");
      cache.clear();
      cache.set("k", "new");
      expect(cache.get("k")).toBe("new");
    });
  });

  // -------------------------------------------------------------------------
  // TTL expiry
  // -------------------------------------------------------------------------
  describe("TTL expiry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns the value before TTL expires", () => {
      const cache = createCache<string>(5_000); // 5 s TTL
      cache.set("k", "fresh");

      vi.advanceTimersByTime(4_999);

      expect(cache.get("k")).toBe("fresh");
    });

    it("returns undefined after TTL expires", () => {
      const cache = createCache<string>(5_000);
      cache.set("k", "stale");

      vi.advanceTimersByTime(5_001);

      expect(cache.get("k")).toBeUndefined();
    });

    it("has() returns false after TTL expires", () => {
      const cache = createCache<string>(1_000);
      cache.set("k", "v");

      vi.advanceTimersByTime(1_001);

      expect(cache.has("k")).toBe(false);
    });

    it("removes the expired entry from the store on get()", () => {
      // After expiry, a second get() should still return undefined
      const cache = createCache<string>(500);
      cache.set("k", "v");

      vi.advanceTimersByTime(501);
      cache.get("k"); // triggers delete
      cache.get("k"); // second call — should not throw

      expect(cache.get("k")).toBeUndefined();
    });

    it("a re-set after expiry is treated as fresh", () => {
      const cache = createCache<string>(1_000);
      cache.set("k", "old");

      vi.advanceTimersByTime(1_001);
      cache.set("k", "new");

      expect(cache.get("k")).toBe("new");
    });

    it("Infinity TTL (default) never expires", () => {
      const cache = createCache<string>(); // default TTL = Infinity
      cache.set("k", "v");

      vi.advanceTimersByTime(Number.MAX_SAFE_INTEGER);

      expect(cache.get("k")).toBe("v");
    });
  });
});
