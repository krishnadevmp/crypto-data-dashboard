/* eslint-disable react-hooks/immutability */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { createElement, useRef } from "react";
import type { CryptoPair } from "../../services/apiTypes";
import { useCryptoWebSocket } from "../hooks/useCryptoWebSocket";

// ---------------------------------------------------------------------------
// MockWebSocket — must be a class (not an arrow fn) for `new` to work
// ---------------------------------------------------------------------------
class MockWebSocket {
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static CONNECTING = 0;

  readyState = MockWebSocket.OPEN;
  url: string;

  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;

  send = vi.fn();
  close = vi.fn();

  // Expose the most-recently created instance for test assertions
  static lastInstance: MockWebSocket | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.lastInstance = this;
  }

  /** Helper: trigger onopen as if the server accepted the connection. */
  simulateOpen() {
    this.onopen?.({} as Event);
  }

  /** Helper: trigger onmessage with a JSON payload. */
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }

  /** Helper: trigger onmessage with raw (non-JSON) data. */
  simulateRawMessage(raw: string) {
    this.onmessage?.({ data: raw } as MessageEvent);
  }

  simulateClose() {
    this.onclose?.({} as CloseEvent);
  }
}

vi.stubGlobal("WebSocket", MockWebSocket);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface HookState {
  updatedCandle: ReturnType<typeof useCryptoWebSocket>["updatedCandle"];
  orderBook: ReturnType<typeof useCryptoWebSocket>["orderBook"];
}

function renderHookViaComponent(initialPair: CryptoPair = "BTC-USDT") {
  const stateRef: { current: HookState } = {
    current: { updatedCandle: null, orderBook: null },
  };
  const pairRef = { current: initialPair };

  function TestComponent() {
    // Allow the pair to be changed imperatively from tests via pairRef
    const pair = useRef(pairRef.current).current;
    const result = useCryptoWebSocket(pair as CryptoPair);
    stateRef.current = result;
    return null;
  }

  const renderResult = render(createElement(TestComponent));

  return { stateRef, renderResult };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCryptoWebSocket", () => {
  beforeEach(() => {
    MockWebSocket.lastInstance = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Mount behaviour
  // -------------------------------------------------------------------------
  describe("on mount", () => {
    it("creates a WebSocket connection", () => {
      renderHookViaComponent("BTC-USDT");
      expect(MockWebSocket.lastInstance).not.toBeNull();
    });

    it("sends a subscribe message for BTC-USDT on socket open", () => {
      renderHookViaComponent("BTC-USDT");
      const socket = MockWebSocket.lastInstance!;

      act(() => socket.simulateOpen());

      // React 18 may double-invoke effects — verify at least one send
      expect(socket.send).toHaveBeenCalled();
      const sentMessages = socket.send.mock.calls.map((c) =>
        JSON.parse(c[0] as string),
      );
      expect(sentMessages).toContainEqual({
        type: "subscribe",
        pair: "BTC-USDT",
        stream: "all",
      });
    });
  });

  // -------------------------------------------------------------------------
  // Message handling
  // -------------------------------------------------------------------------
  describe("message handling", () => {
    const sampleCandle = {
      time: 1_680_000_000_000,
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      volume: 1234,
    };

    const sampleOrderBook = {
      pair: "BTC-USDT" as CryptoPair,
      asks: [[30000, 0.5]] as [number, number][],
      bids: [[29900, 1.2]] as [number, number][],
      timestamp: 1_680_000_000_000,
    };

    it("updates updatedCandle on candle_update for the current pair", () => {
      const { stateRef } = renderHookViaComponent("BTC-USDT");
      const socket = MockWebSocket.lastInstance!;

      act(() => socket.simulateOpen());
      act(() =>
        socket.simulateMessage({
          type: "candle_update",
          pair: "BTC-USDT",
          candle: sampleCandle,
        }),
      );

      expect(stateRef.current.updatedCandle).toEqual(sampleCandle);
    });

    it("updates orderBook on orderbook_update for the current pair", () => {
      const { stateRef } = renderHookViaComponent("BTC-USDT");
      const socket = MockWebSocket.lastInstance!;

      act(() => socket.simulateOpen());
      act(() =>
        socket.simulateMessage({
          type: "orderbook_update",
          pair: "BTC-USDT",
          data: sampleOrderBook,
        }),
      );

      expect(stateRef.current.orderBook).toEqual(sampleOrderBook);
    });

    it("ignores messages for a different pair", () => {
      const { stateRef } = renderHookViaComponent("BTC-USDT");
      const socket = MockWebSocket.lastInstance!;

      act(() => socket.simulateOpen());
      act(() =>
        socket.simulateMessage({
          type: "candle_update",
          pair: "ETH-USDT", // different pair
          candle: sampleCandle,
        }),
      );

      expect(stateRef.current.updatedCandle).toBeNull();
    });

    it("silently ignores non-JSON messages (parse errors)", () => {
      const { stateRef } = renderHookViaComponent("BTC-USDT");
      const socket = MockWebSocket.lastInstance!;

      act(() => socket.simulateOpen());
      expect(() =>
        act(() => socket.simulateRawMessage("not-valid-json")),
      ).not.toThrow();

      expect(stateRef.current.updatedCandle).toBeNull();
    });

    it("logs a warning but does not throw on error messages", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderHookViaComponent("BTC-USDT");
      const socket = MockWebSocket.lastInstance!;

      act(() => socket.simulateOpen());
      act(() =>
        socket.simulateMessage({ type: "error", message: "unknown stream" }),
      );

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Unmount
  // -------------------------------------------------------------------------
  describe("on unmount", () => {
    it("closes the WebSocket when the component unmounts", () => {
      const { renderResult } = renderHookViaComponent("BTC-USDT");
      const socket = MockWebSocket.lastInstance!;

      renderResult.unmount();

      expect(socket.close).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------
  describe("return value", () => {
    it("initialises updatedCandle and orderBook to null", () => {
      const { stateRef } = renderHookViaComponent("BTC-USDT");
      expect(stateRef.current.updatedCandle).toBeNull();
      expect(stateRef.current.orderBook).toBeNull();
    });
  });
});
