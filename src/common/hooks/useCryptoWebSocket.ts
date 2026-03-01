import { useEffect, useRef, useState } from "react";
import type { Candle, CryptoPair, OrderBook } from "../../services/apiTypes";

interface SubscribePayload {
  type: "subscribe" | "unsubscribe";
  pair: CryptoPair;
  stream: "all";
}

interface CandleUpdateMessage {
  type: "candle_update";
  pair: CryptoPair;
  candle: Candle;
}

interface OrderBookUpdateMessage {
  type: "orderbook_update";
  pair: CryptoPair;
  data: OrderBook;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

type InboundMessage =
  | CandleUpdateMessage
  | OrderBookUpdateMessage
  | ErrorMessage;

export function useCryptoWebSocket(pair: CryptoPair) {
  const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
  const socketRef = useRef<WebSocket | null>(null);
  const currentPairRef = useRef<CryptoPair | null>(null);

  const [updatedCandle, setUpdatedCandle] = useState<Candle | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);

  /*
   * Establish WebSocket connection once
   */
  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    currentPairRef.current = "BTC-USDT";

    socket.onopen = () => {
      console.log("WebSocket connected");

      // Default subscription on initial load
      socket.send(
        JSON.stringify({
          type: "subscribe",
          pair: "BTC-USDT",
          stream: "all",
        } satisfies SubscribePayload),
      );
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      let msg: InboundMessage;
      try {
        msg = JSON.parse(event.data) as InboundMessage;
      } catch {
        return;
      }

      // Ignore messages for pairs we are no longer subscribed to
      if (msg.type === "error") {
        console.warn("[ws] server error:", msg.message);
        return;
      }

      if (msg.pair !== currentPairRef.current) return;

      switch (msg.type) {
        case "candle_update":
          setUpdatedCandle(msg.candle);
          break;

        case "orderbook_update":
          setOrderBook(msg.data);
          break;
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const previousPair = currentPairRef.current;

    if (previousPair && previousPair !== pair) {
      socket.send(
        JSON.stringify({
          type: "unsubscribe",
          pair: previousPair,
          stream: "all",
        } satisfies SubscribePayload),
      );
    }

    socket.send(
      JSON.stringify({
        type: "subscribe",
        pair,
        stream: "all",
      } satisfies SubscribePayload),
    );

    currentPairRef.current = pair;
  }, [pair]);

  return {
    updatedCandle,
    orderBook,
  };
}
