import { useEffect, useState } from "react";

type Order = {
  price: number;
  size: number;
};

export function useOrderbook() {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@depth");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.b)
        setBids(
          data.b.map(([price, size]: [string, string]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
          }))
        );

      if (data.a)
        setAsks(
          data.a.map(([price, size]: [string, string]) => ({
            price: parseFloat(price),
            size: parseFloat(size),
          }))
        );
    };

    return () => {
      ws.close();
    };
  }, []);

  return { bids, asks };
}
