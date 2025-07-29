// src/lib/mockVenueData.ts

export interface VenueOrderbookEntry {
  price: number;
  quantity: number;
  venue: "Binance" | "OKX" | "Bybit";
}

export function generateMockVenueData(): {
  bids: VenueOrderbookEntry[];
  asks: VenueOrderbookEntry[];
} {
  const venues = ["Binance", "OKX", "Bybit"] as const;
  const bids: VenueOrderbookEntry[] = [];
  const asks: VenueOrderbookEntry[] = [];

  venues.forEach((venue, idx) => {
    for (let i = 0; i < 10; i++) {
      bids.push({
        price: 29000 + i * 10 + idx,
        quantity: Math.random() * 4,
        venue,
      });
      asks.push({
        price: 30000 + i * 10 + idx,
        quantity: Math.random() * 4,
        venue,
      });
    }
  });

  return { bids, asks };
}
