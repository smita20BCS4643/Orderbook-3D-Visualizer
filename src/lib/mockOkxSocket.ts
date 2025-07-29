export function connectToMockOkxOrderBook(
  onUpdate: (bids: number[][], asks: number[][]) => void
) {
  const interval = setInterval(() => {
    const bids = Array.from({ length: 10 }, (_, i) => [
      10000 - i * 10,
      parseFloat((Math.random() * 3).toFixed(2)),
    ]);
    const asks = Array.from({ length: 10 }, (_, i) => [
      10000 + i * 10,
      parseFloat((Math.random() * 3).toFixed(2)),
    ]);
    onUpdate(bids, asks);
  }, 3000);

  return () => clearInterval(interval);
}
