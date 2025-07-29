// // // // src/lib/binanceSocket.ts

// // // type OrderbookData = {
// // //   bids: number[];
// // //   asks: number[];
// // // };

// // // export function connectToBinanceOrderBook(
// // //   onUpdate: (data: OrderbookData) => void
// // // ) {
// // //   const socket = new WebSocket(
// // //     "wss://stream.binance.com:9443/ws/btcusdt@depth10@100ms"
// // //   );

// // //   socket.onmessage = (event) => {
// // //     const data = JSON.parse(event.data);
// // //     const bids = data.bids.map((bid: [string, string]) => parseFloat(bid[1]));
// // //     const asks = data.asks.map((ask: [string, string]) => parseFloat(ask[1]));
// // //     onUpdate({ bids, asks });
// // //   };

// // //   socket.onerror = (error) => {
// // //     console.error("WebSocket error:", error);
// // //   };

// // //   socket.onclose = () => {
// // //     console.warn("WebSocket connection closed");
// // //   };

// // //   return () => socket.close(); // return a cleanup function
// // // }

// // // export function connectBinanceSocket(callback: (data: unknown) => void) {
// // //   const socket = new WebSocket(
// // //     "wss://stream.binance.com:9443/ws/btcusdt@depth"
// // //   );

// // //   socket.onmessage = (event) => {
// // //     const message = JSON.parse(event.data);
// // //     callback(message);
// // //   };

// // //   socket.onopen = () => {
// // //     console.log("Connected to Binance WebSocket");
// // //   };

// // //   socket.onerror = (error) => {
// // //     console.error("WebSocket Error:", error);
// // //   };

// // //   socket.onclose = () => {
// // //     console.log("WebSocket closed");
// // //   };
// // // }

// // // /lib/binanaceSocket.ts
// // export function connectToBinanceOrderBook(
// //   onData: (data: { bids: number[][]; asks: number[][] }) => void
// // ) {
// //   const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@depth");

// //   ws.onmessage = (event) => {
// //     const depthData = JSON.parse(event.data);
// //     const bids = depthData.b?.slice(0, 30) || []; // top 30 bids
// //     const asks = depthData.a?.slice(0, 30) || []; // top 30 asks
// //     onData({ bids, asks });
// //   };

// //   return () => {
// //     ws.close();
// //   };
// // }

// // src/lib/binanaceSocket.ts

// export interface VenueOrderbookEntry {
//   price: number;
//   quantity: number;
//   venue: "Binance" | "OKX" | "Bybit";
// }

// export function connectToBinanceOrderBook(
//   onUpdate: (bids: VenueOrderbookEntry[], asks: VenueOrderbookEntry[]) => void
// ) {
//   const socket = new WebSocket(
//     "wss://stream.binance.com:9443/ws/btcusdt@depth"
//   );

//   socket.onmessage = (event) => {
//     const data = JSON.parse(event.data);

//     const fakeVenue = () => {
//       const venues = ["Binance", "OKX", "Bybit"];
//       return venues[Math.floor(Math.random() * venues.length)];
//     };

//     const bids = (data.bids || [])
//       .slice(0, 20)
//       .map(([price, quantity]: [string, string]) => ({
//         price: parseFloat(price),
//         quantity: parseFloat(quantity),
//         venue: fakeVenue(),
//       }));

//     const asks = (data.asks || [])
//       .slice(0, 20)
//       .map(([price, quantity]: [string, string]) => ({
//         price: parseFloat(price),
//         quantity: parseFloat(quantity),
//         venue: fakeVenue(),
//       }));

//     onUpdate(bids, asks);
//   };

//   return () => socket.close();
// }

export function connectToBinanceOrderBook(
  onUpdate: (data: { bids: number[][]; asks: number[][] }) => void
) {
  const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@depth");

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const bids = message.b?.slice(0, 20) || []; // top 20 bids
    const asks = message.a?.slice(0, 20) || []; // top 20 asks

    onUpdate({ bids, asks });
  };

  return () => ws.close();
}
