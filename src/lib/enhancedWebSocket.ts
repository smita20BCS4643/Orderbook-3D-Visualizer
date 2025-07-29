// src/lib/enhancedWebSocket.ts

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
}

export class EnhancedWebSocket {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private messageHandlers: Map<string, (data: unknown) => void> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("WebSocket connected to:", this.config.url);
      this.reconnectAttempts = 0;
      this.config.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => handler(data));
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      this.config.onDisconnect?.();

      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.config.onError?.(error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(
        `Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`
      );
      this.config.onReconnect?.(this.reconnectAttempts);
      this.connect();
    }, this.config.reconnectInterval);
  }

  public addMessageHandler(id: string, handler: (data: unknown) => void) {
    this.messageHandlers.set(id, handler);
  }

  public removeMessageHandler(id: string) {
    this.messageHandlers.delete(id);
  }

  public send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected. Cannot send message.");
    }
  }

  public close() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
  }

  public getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  public getConnectionStatus(): string {
    switch (this.getReadyState()) {
      case WebSocket.CONNECTING:
        return "Connecting";
      case WebSocket.OPEN:
        return "Connected";
      case WebSocket.CLOSING:
        return "Closing";
      case WebSocket.CLOSED:
        return "Closed";
      default:
        return "Unknown";
    }
  }
}

// Enhanced Binance connection with retry logic
export function createEnhancedBinanceConnection(
  onUpdate: (data: { bids: number[][]; asks: number[][] }) => void,
  onConnectionChange?: (status: string) => void
) {
  const wsConfig: WebSocketConfig = {
    url: "wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms",
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    onConnect: () => onConnectionChange?.("Connected"),
    onDisconnect: () => onConnectionChange?.("Disconnected"),
    onError: (error) => {
      console.error("Binance WebSocket error:", error);
      onConnectionChange?.("Error");
    },
    onReconnect: (attempt) => {
      onConnectionChange?.(`Reconnecting (${attempt})`);
    },
  };

  const enhancedWS = new EnhancedWebSocket(wsConfig);

  enhancedWS.addMessageHandler("orderbook", (data) => {
    if (
      typeof data === "object" &&
      data !== null &&
      "bids" in data &&
      "asks" in data &&
      Array.isArray((data as { bids?: unknown; asks?: unknown }).bids) &&
      Array.isArray((data as { bids?: unknown; asks?: unknown }).asks)
    ) {
      const { bids, asks } = data as { bids: number[][]; asks: number[][] };
      onUpdate({
        bids: bids.slice(0, 20),
        asks: asks.slice(0, 20),
      });
    }
  });

  return () => enhancedWS.close();
}

// Multi-venue data aggregator
export interface VenueData {
  venue: string;
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
  timestamp: number;
  latency?: number;
}

export class MultiVenueAggregator {
  private venues: Map<string, VenueData> = new Map();
  private updateCallbacks: Array<(data: Map<string, VenueData>) => void> = [];
  private connections: Map<string, () => void> = new Map();

  constructor() {
    this.setupBinanceConnection();
    this.setupMockConnections();
  }

  private setupBinanceConnection() {
    const cleanup = createEnhancedBinanceConnection((data) => {
      this.updateVenueData("Binance", {
        venue: "Binance",
        bids: (data.bids as number[][]).filter(
          (b: number[]) => b.length === 2
        ) as [number, number][],
        asks: (data.asks as number[][]).filter(
          (a: number[]) => a.length === 2
        ) as [number, number][],
        timestamp: Date.now(),
      });
    });

    this.connections.set("Binance", cleanup);
  }

  private setupMockConnections() {
    // Mock OKX connection
    const okxInterval = setInterval(() => {
      const basePrice = 50000;
      const spread = 10;

      this.updateVenueData("OKX", {
        venue: "OKX",
        bids: Array.from({ length: 15 }, (_, i) => [
          basePrice - spread / 2 - i * 0.5,
          Math.random() * 2 + 0.1,
        ]),
        asks: Array.from({ length: 15 }, (_, i) => [
          basePrice + spread / 2 + i * 0.5,
          Math.random() * 2 + 0.1,
        ]),
        timestamp: Date.now(),
        latency: Math.random() * 20 + 5, // Mock latency
      });
    }, 500);

    // Mock Bybit connection
    const bybitInterval = setInterval(() => {
      const basePrice = 50005; // Slightly different price
      const spread = 12;

      this.updateVenueData("Bybit", {
        venue: "Bybit",
        bids: Array.from({ length: 12 }, (_, i) => [
          basePrice - spread / 2 - i * 0.7,
          Math.random() * 1.5 + 0.2,
        ]),
        asks: Array.from({ length: 12 }, (_, i) => [
          basePrice + spread / 2 + i * 0.7,
          Math.random() * 1.5 + 0.2,
        ]),
        timestamp: Date.now(),
        latency: Math.random() * 30 + 10,
      });
    }, 750);

    this.connections.set("OKX", () => clearInterval(okxInterval));
    this.connections.set("Bybit", () => clearInterval(bybitInterval));
  }

  private updateVenueData(venue: string, data: VenueData) {
    this.venues.set(venue, data);
    this.updateCallbacks.forEach((callback) => callback(new Map(this.venues)));
  }

  public subscribe(callback: (data: Map<string, VenueData>) => void) {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  public getVenueData(venue: string): VenueData | undefined {
    return this.venues.get(venue);
  }

  public getAllVenues(): string[] {
    return Array.from(this.venues.keys());
  }

  public getLatency(venue: string): number | undefined {
    return this.venues.get(venue)?.latency;
  }

  public close() {
    this.connections.forEach((cleanup) => cleanup());
    this.connections.clear();
    this.venues.clear();
    this.updateCallbacks = [];
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  public startTimer(label: string) {
    this.startTimes.set(label, performance.now());
  }

  public endTimer(label: string) {
    const startTime = this.startTimes.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;

      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }

      const measurements = this.metrics.get(label)!;
      measurements.push(duration);

      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }

      this.startTimes.delete(label);
      return duration;
    }
    return 0;
  }

  public getAverageTime(label: string): number {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) return 0;

    return (
      measurements.reduce((sum, time) => sum + time, 0) / measurements.length
    );
  }

  public getMetrics(): Record<
    string,
    { average: number; count: number; latest: number }
  > {
    const result: Record<
      string,
      { average: number; count: number; latest: number }
    > = {};

    this.metrics.forEach((measurements, label) => {
      result[label] = {
        average: this.getAverageTime(label),
        count: measurements.length,
        latest: measurements[measurements.length - 1] || 0,
      };
    });

    return result;
  }

  public reset() {
    this.metrics.clear();
    this.startTimes.clear();
  }
}
