import { useEffect, useState } from "react";
import type {
  CryptoPair,
  OrderBook as OrderBookData,
} from "../../services/apiTypes";
import { fetchOrderBook } from "../../services/cryptoApiService";

export interface OrderBookProps {
  pair: CryptoPair;
  updatedOrderBook: OrderBookData | null;
}
export function useOrderbookController({
  pair,
  updatedOrderBook,
}: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderBook(pair);
        if (!cancelled) {
          setOrderBook(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to fetch order book");
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [pair]);

  // Use updatedOrderBook if available, otherwise fallback to fetched orderBook
  const displayedOrderBook = updatedOrderBook ?? orderBook;

  return {
    state: {
      displayedOrderBook,
      loading,
      error,
    },
  };
}
