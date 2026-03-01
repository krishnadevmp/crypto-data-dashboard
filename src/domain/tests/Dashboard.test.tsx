import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { Dashboard } from "../dashboard/Dashboard";

// ---------------------------------------------------------------------------
// Mock heavy dependencies
// ---------------------------------------------------------------------------
vi.mock("../../common/hooks/useCryptoWebSocket", () => ({
  useCryptoWebSocket: vi.fn(() => ({ updatedCandle: null, orderBook: null })),
}));

vi.mock("../cryptoCandleChart/CryptoCandleChart", () => ({
  CryptoCandleChart: vi.fn(({ pair }: { pair: string }) => (
    <div data-testid="candle-chart" data-pair={pair} />
  )),
  default: vi.fn(({ pair }: { pair: string }) => (
    <div data-testid="candle-chart" data-pair={pair} />
  )),
}));

vi.mock("../orderbook/Orderbook", () => ({
  OrderBook: vi.fn(({ pair }: { pair: string }) => (
    <div data-testid="order-book" data-pair={pair} />
  )),
}));

import { useCryptoWebSocket } from "../../common/hooks/useCryptoWebSocket";
const mockUseCryptoWebSocket = vi.mocked(useCryptoWebSocket);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCryptoWebSocket.mockReturnValue({
      updatedCandle: null,
      orderBook: null,
    });
  });

  // -------------------------------------------------------------------------
  // Header / branding
  // -------------------------------------------------------------------------
  describe("header", () => {
    it("renders the CryptoDashboard brand text", () => {
      render(<Dashboard />);
      // The brand is split across two sibling spans inside the <header>.
      // Scope the lookup to the banner so we don't collide with the footer.
      const header = screen.getByRole("banner");
      expect(within(header).getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders the Pair selector", () => {
      render(<Dashboard />);
      expect(screen.getByLabelText(/pair/i)).toBeInTheDocument();
    });

    it("renders the Stream selector", () => {
      render(<Dashboard />);
      expect(screen.getByLabelText(/stream/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Default rendering (streamMode = 'all')
  // -------------------------------------------------------------------------
  describe("default state (pair=BTC-USDT, stream=all)", () => {
    it("shows the candlestick chart", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("candle-chart")).toBeInTheDocument();
    });

    it("shows the order book", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("order-book")).toBeInTheDocument();
    });

    it("displays BTC-USDT as the heading", () => {
      render(<Dashboard />);
      expect(
        screen.getByRole("heading", { name: /BTC-USDT/i }),
      ).toBeInTheDocument();
    });

    it("passes BTC-USDT to useCryptoWebSocket", () => {
      render(<Dashboard />);
      expect(mockUseCryptoWebSocket).toHaveBeenCalledWith("BTC-USDT");
    });
  });

  // -------------------------------------------------------------------------
  // Stream mode switching
  // -------------------------------------------------------------------------
  describe("stream mode", () => {
    it("hides the chart and shows only the order book in 'orderbook' mode", () => {
      render(<Dashboard />);
      const streamSelect = screen.getByLabelText(/stream/i);

      act(() => {
        fireEvent.change(streamSelect, { target: { value: "orderbook" } });
      });

      expect(screen.queryByTestId("candle-chart")).toBeNull();
      expect(screen.getByTestId("order-book")).toBeInTheDocument();
    });

    it("hides the order book and shows only the chart in 'candles' mode", () => {
      render(<Dashboard />);
      const streamSelect = screen.getByLabelText(/stream/i);

      act(() => {
        fireEvent.change(streamSelect, { target: { value: "candles" } });
      });

      expect(screen.getByTestId("candle-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("order-book")).toBeNull();
    });

    it("shows both panels when switching back to 'all'", () => {
      render(<Dashboard />);
      const streamSelect = screen.getByLabelText(/stream/i);

      act(() =>
        fireEvent.change(streamSelect, { target: { value: "candles" } }),
      );
      act(() => fireEvent.change(streamSelect, { target: { value: "all" } }));

      expect(screen.getByTestId("candle-chart")).toBeInTheDocument();
      expect(screen.getByTestId("order-book")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Pair selection
  // -------------------------------------------------------------------------
  describe("pair selection", () => {
    it("updates the heading when the pair is changed", () => {
      render(<Dashboard />);
      const pairSelect = screen.getByLabelText(/pair/i);

      act(() => {
        fireEvent.change(pairSelect, { target: { value: "ETH-USDT" } });
      });

      expect(
        screen.getByRole("heading", { name: /ETH-USDT/i }),
      ).toBeInTheDocument();
    });

    it("passes the new pair to useCryptoWebSocket after a change", () => {
      render(<Dashboard />);
      const pairSelect = screen.getByLabelText(/pair/i);

      act(() => {
        fireEvent.change(pairSelect, { target: { value: "XRP-USDT" } });
      });

      expect(mockUseCryptoWebSocket).toHaveBeenLastCalledWith("XRP-USDT");
    });
  });

  // -------------------------------------------------------------------------
  // Footer
  // -------------------------------------------------------------------------
  describe("footer", () => {
    it("renders the footer text", () => {
      render(<Dashboard />);
      expect(screen.getByText(/Mock Crypto Dashboard/i)).toBeInTheDocument();
    });
  });
});
