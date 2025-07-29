// src/lib/mockOrderbook.ts

export function generateMockOrderbook() {
  const bids = Array.from({ length: 9 }, () => Math.random() * 5 + 1); // height 1–6
  const asks = Array.from({ length: 10 }, () => Math.random() * 5 + 1);
  return { bids, asks };
}
