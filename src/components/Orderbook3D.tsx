"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";
import * as THREE from "three";

// Constants for positioning and thresholds
const BID_X = -8;
const ASK_X = 8;
const Z_GAP = 0.8;
const MAX_ORDERS = 20;
const PRESSURE_THRESHOLD = 2.0;
const BAR_WIDTH = 0.6;
const BAR_DEPTH = 0.6;

interface OrderbookEntry {
  price: number;
  quantity: number;
  venue: string;
  timestamp: number;
  cumulativeQuantity?: number;
}

interface VenueConfig {
  name: string;
  enabled: boolean;
  color: string;
  bidColor: string;
  askColor: string;
}

interface PressureZone {
  priceLevel: number;
  totalQuantity: number;
  venues: string[];
  intensity: number;
}

// WebSocket connection for Binance
function connectToBinanceOrderBook(
  onUpdate: (data: { bids: number[][]; asks: number[][] }) => void
) {
  const ws = new WebSocket(
    "wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms"
  );

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.bids && message.asks) {
      onUpdate({
        bids: message.bids.slice(0, MAX_ORDERS),
        asks: message.asks.slice(0, MAX_ORDERS),
      });
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return () => ws.close();
}

// Mock data for additional venues
function generateMockVenueData(basePrice: number, spread: number) {
  const venues = ["OKX", "Bybit", "Deribit"];
  const mockData = venues.map((venue) => {
    const bids = Array.from({ length: 15 }, (_, i) => [
      basePrice - spread / 2 - i * 0.5,
      Math.random() * 3 + 0.1,
    ]);
    const asks = Array.from({ length: 15 }, (_, i) => [
      basePrice + spread / 2 + i * 0.5,
      Math.random() * 3 + 0.1,
    ]);
    return { venue, bids, asks };
  });

  return mockData;
}

// Animated 3D Bar Component
const AnimatedBar = ({
  position,
  height,
  color,
  isPressureZone,
  emissiveIntensity = 0,
  venue,
  price,
  quantity,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  isPressureZone: boolean;
  emissiveIntensity?: number;
  venue: string;
  price: number;
  quantity: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { scale, emissive } = useSpring({
    scale: [1, Math.max(height, 0.1), 1] as [number, number, number],
    emissive: isPressureZone ? 0.3 : emissiveIntensity,
    config: { tension: 120, friction: 20 },
  });

  // Hover effect
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <a.mesh
        ref={meshRef}
        position={position}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[BAR_WIDTH, 1, BAR_DEPTH]} />
        <a.meshStandardMaterial
          color={color}
          emissive={isPressureZone ? "#ffffff" : "#000000"}
          emissiveIntensity={emissive}
          opacity={hovered ? 0.8 : 1}
          transparent
        />
      </a.mesh>

      {hovered && (
        <Text
          position={[position[0], position[1] + height + 1, position[2]]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${venue}\nPrice: $${
            typeof price === "number" ? price.toFixed(2) : "0.00"
          }\nQty: ${
            typeof quantity === "number" ? quantity.toFixed(4) : "0.0000"
          }`}
        </Text>
      )}
    </group>
  );
};

// Grid and axes component
const GridAndAxes = () => {
  return (
    <group>
      {/* Grid */}
      <gridHelper args={[40, 40, "#444444", "#222222"]} />

      {/* Axes */}
      <group>
        {/* X-axis (Price) */}
        <arrowHelper
          args={[
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-15, 0, 0),
            30,
            "#ff0000",
          ]}
        />
        <Text position={[16, 0, 0]} fontSize={0.5} color="#ff0000">
          Price
        </Text>

        {/* Y-axis (Quantity) */}
        <arrowHelper
          args={[
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            15,
            "#00ff00",
          ]}
        />
        <Text position={[0, 16, 0]} fontSize={0.5} color="#00ff00">
          Quantity
        </Text>

        {/* Z-axis (Time) */}
        <arrowHelper
          args={[
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -10),
            20,
            "#0000ff",
          ]}
        />
        <Text position={[0, 0, 12]} fontSize={0.5} color="#0000ff">
          Time
        </Text>
      </group>
    </group>
  );
};

// Rotating camera component
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const RotatingCamera = ({ autoRotate }: { autoRotate: boolean }) => {
  const ref = useRef<OrbitControlsImpl>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.autoRotate = autoRotate;
      ref.current.autoRotateSpeed = 0.5;
    }
  });

  return <DreiOrbitControls ref={ref} enableDamping dampingFactor={0.05} />;
};

export default function Orderbook3D() {
  const [bids, setBids] = useState<OrderbookEntry[]>([]);
  const [asks, setAsks] = useState<OrderbookEntry[]>([]);
  const [venues, setVenues] = useState<{ [key: string]: VenueConfig }>({
    Binance: {
      name: "Binance",
      enabled: true,
      color: "#F3BA2F",
      bidColor: "#00C851",
      askColor: "#FF4444",
    },
    OKX: {
      name: "OKX",
      enabled: true,
      color: "#0052FF",
      bidColor: "#00AA44",
      askColor: "#CC3333",
    },
    Bybit: {
      name: "Bybit",
      enabled: true,
      color: "#FFA500",
      bidColor: "#009933",
      askColor: "#AA2222",
    },
    Deribit: {
      name: "Deribit",
      enabled: true,
      color: "#6C5CE7",
      bidColor: "#008822",
      askColor: "#991111",
    },
  });

  const [filters, setFilters] = useState({
    quantityThreshold: 0,
    priceRangeMin: 0,
    priceRangeMax: 0,
    showPressureZones: true,
    autoRotate: true,
  });

  const [viewMode, setViewMode] = useState<"realtime" | "historical">(
    "realtime"
  );
  const [timeRange, setTimeRange] = useState("1m");
  const [orderHistory, setOrderHistory] = useState<{
    bids: OrderbookEntry[][];
    asks: OrderbookEntry[][];
  }>({
    bids: [],
    asks: [],
  });

  // Connection to real-time data
  useEffect(() => {
    if (viewMode !== "realtime") return;

    const cleanup = connectToBinanceOrderBook((data) => {
      const timestamp = Date.now();

      // Process Binance data
      const binanceBids: OrderbookEntry[] = data.bids.map(
        ([price, quantity]) => ({
          price: price,
          quantity: quantity,
          venue: "Binance",
          timestamp,
        })
      );

      const binanceAsks: OrderbookEntry[] = data.asks.map(
        ([price, quantity]) => ({
          price: price,
          quantity: quantity,
          venue: "Binance",
          timestamp,
        })
      );

      // Generate mock data for other venues
      if (binanceBids.length > 0 && binanceAsks.length > 0) {
        const midPrice = (binanceBids[0].price + binanceAsks[0].price) / 2;
        const spread = binanceAsks[0].price - binanceBids[0].price;
        const mockVenues = generateMockVenueData(midPrice, spread);

        const allBids: OrderbookEntry[] = [...binanceBids];
        const allAsks: OrderbookEntry[] = [...binanceAsks];

        mockVenues.forEach(({ venue, bids: venueBids, asks: venueAsks }) => {
          if (venues[venue]?.enabled) {
            allBids.push(
              ...venueBids.map(([price, quantity]) => ({
                price: price as number,
                quantity: quantity as number,
                venue,
                timestamp,
              }))
            );

            allAsks.push(
              ...venueAsks.map(([price, quantity]) => ({
                price: price as number,
                quantity: quantity as number,
                venue,
                timestamp,
              }))
            );
          }
        });

        // Sort and calculate cumulative quantities
        allBids.sort((a, b) => b.price - a.price);
        allAsks.sort((a, b) => a.price - b.price);

        let cumulativeBid = 0;
        allBids.forEach((bid) => {
          cumulativeBid += bid.quantity;
          bid.cumulativeQuantity = cumulativeBid;
        });

        let cumulativeAsk = 0;
        allAsks.forEach((ask) => {
          cumulativeAsk += ask.quantity;
          ask.cumulativeQuantity = cumulativeAsk;
        });

        // Apply filters
        const filteredBids = allBids
          .filter(
            (order) =>
              venues[order.venue]?.enabled &&
              order.quantity >= filters.quantityThreshold &&
              (filters.priceRangeMin === 0 ||
                order.price >= filters.priceRangeMin) &&
              (filters.priceRangeMax === 0 ||
                order.price <= filters.priceRangeMax)
          )
          .slice(0, MAX_ORDERS);

        const filteredAsks = allAsks
          .filter(
            (order) =>
              venues[order.venue]?.enabled &&
              order.quantity >= filters.quantityThreshold &&
              (filters.priceRangeMin === 0 ||
                order.price >= filters.priceRangeMin) &&
              (filters.priceRangeMax === 0 ||
                order.price <= filters.priceRangeMax)
          )
          .slice(0, MAX_ORDERS);

        setBids(filteredBids);
        setAsks(filteredAsks);

        // Store for historical view
        setOrderHistory((prev) => ({
          bids: [...prev.bids.slice(-59), filteredBids], // keep last 60 snapshots
          asks: [...prev.asks.slice(-59), filteredAsks],
        }));
      }
    });

    return cleanup;
  }, [venues, filters, viewMode]);

  // Pressure zone detection
  const pressureZones = useMemo((): PressureZone[] => {
    const zones: PressureZone[] = [];
    const allOrders = [...bids, ...asks];

    // Group by price level (rounded)
    const priceGroups: { [key: number]: OrderbookEntry[] } = {};
    allOrders.forEach((order) => {
      const roundedPrice = Math.round(order.price);
      if (!priceGroups[roundedPrice]) priceGroups[roundedPrice] = [];
      priceGroups[roundedPrice].push(order);
    });

    // Identify pressure zones
    Object.entries(priceGroups).forEach(([price, orders]) => {
      const totalQuantity = orders.reduce(
        (sum, order) => sum + order.quantity,
        0
      );
      if (totalQuantity >= PRESSURE_THRESHOLD) {
        zones.push({
          priceLevel: parseFloat(price),
          totalQuantity,
          venues: Array.from(new Set(orders.map((o) => o.venue))),
          intensity: Math.min(totalQuantity / PRESSURE_THRESHOLD, 3),
        });
      }
    });

    return zones;
  }, [bids, asks]);

  // Statistics
  const stats = useMemo(() => {
    const totalBidVolume = bids.reduce((sum, bid) => sum + bid.quantity, 0);
    const totalAskVolume = asks.reduce((sum, ask) => sum + ask.quantity, 0);
    const spread =
      asks.length > 0 && bids.length > 0 ? asks[0].price - bids[0].price : 0;

    return {
      totalBidVolume,
      totalAskVolume,
      spread,
      bidAskRatio: totalAskVolume > 0 ? totalBidVolume / totalAskVolume : 0,
      pressureZones: pressureZones.length,
    };
  }, [bids, asks, pressureZones]);

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "#0a0a0a",
      }}
    >
      {/* Control Panel */}
      <div
        style={{
          width: "350px",
          padding: "20px",
          background: "rgba(20, 20, 20, 0.95)",
          color: "white",
          overflowY: "auto",
          borderRight: "1px solid #333",
        }}
      >
        <h3 style={{ color: "#4CAF50", marginBottom: "20px" }}>
          Orderbook Controls
        </h3>

        {/* Venue Filters */}
        <div style={{ marginBottom: "20px" }}>
          <h4>Trading Venues</h4>
          {Object.entries(venues).map(([key, venue]) => (
            <label
              key={key}
              style={{ display: "block", margin: "8px 0", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={venue.enabled}
                onChange={(e) =>
                  setVenues((prev) => ({
                    ...prev,
                    [key]: { ...venue, enabled: e.target.checked },
                  }))
                }
                style={{ marginRight: "8px" }}
              />
              <span style={{ color: venue.color }}>● {venue.name}</span>
            </label>
          ))}
        </div>

        {/* View Mode */}
        <div style={{ marginBottom: "20px" }}>
          <h4>View Mode</h4>
          <select
            value={viewMode}
            onChange={(e) =>
              setViewMode(e.target.value as "realtime" | "historical")
            }
            style={{
              width: "100%",
              padding: "8px",
              background: "#333",
              color: "white",
              border: "1px solid #555",
            }}
          >
            <option value="realtime">Real-time</option>
            <option value="historical">Historical</option>
          </select>
        </div>

        {/* Time Range */}
        <div style={{ marginBottom: "20px" }}>
          <h4>Time Range</h4>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              background: "#333",
              color: "white",
              border: "1px solid #555",
            }}
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
          </select>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "20px" }}>
          <h4>Filters</h4>
          <div style={{ marginBottom: "10px" }}>
            <label>Min Quantity: {filters.quantityThreshold}</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={filters.quantityThreshold}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  quantityThreshold: parseFloat(e.target.value),
                }))
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>
              <input
                type="checkbox"
                checked={filters.showPressureZones}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    showPressureZones: e.target.checked,
                  }))
                }
                style={{ marginRight: "8px" }}
              />
              Highlight Pressure Zones
            </label>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={filters.autoRotate}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    autoRotate: e.target.checked,
                  }))
                }
                style={{ marginRight: "8px" }}
              />
              Auto Rotate
            </label>
          </div>
        </div>

        {/* Statistics */}
        <div
          style={{
            background: "rgba(50, 50, 50, 0.5)",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h4 style={{ color: "#4CAF50" }}>Market Stats</h4>
          <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
            <div>
              Bid Volume:{" "}
              {stats && typeof stats.totalBidVolume === "number"
                ? stats.totalBidVolume.toFixed(4)
                : "0.0000"}
            </div>
            <div>
              Ask Volume:{" "}
              {stats && typeof stats.totalAskVolume === "number"
                ? stats.totalAskVolume.toFixed(4)
                : "0.0000"}
            </div>
            <div>
              Spread: $
              {stats && typeof stats.spread === "number"
                ? stats.spread.toFixed(2)
                : "0.00"}
            </div>
            <div>
              Bid/Ask Ratio:{" "}
              {stats && typeof stats.bidAskRatio === "number"
                ? stats.bidAskRatio.toFixed(3)
                : "0.000"}
            </div>
            <div>Pressure Zones: {stats ? stats.pressureZones : 0}</div>
            <div>Active Orders: {bids.length + asks.length}</div>
          </div>
        </div>
      </div>

      {/* 3D Visualization */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas
          camera={{ position: [0, 25, 35], fov: 75 }}
          style={{ background: "linear-gradient(to bottom, #1a1a2e, #16213e)" }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight
            position={[-10, -10, -10]}
            intensity={0.4}
            color="#4CAF50"
          />

          <RotatingCamera autoRotate={filters.autoRotate} />
          <GridAndAxes />

          {/* Bid bars */}
          {bids.map((bid, index) => {
            const isPressureZone =
              filters.showPressureZones &&
              pressureZones.some(
                (zone) => Math.abs(zone.priceLevel - bid.price) < 1
              );

            return (
              <AnimatedBar
                key={`bid-${bid.venue}-${index}`}
                position={[
                  BID_X + (index % 3) * 0.8,
                  bid.quantity / 2,
                  -index * Z_GAP,
                ]}
                height={bid.quantity * 2}
                color={
                  isPressureZone
                    ? "#00ff41"
                    : venues[bid.venue]?.bidColor || "#00C851"
                }
                isPressureZone={isPressureZone}
                venue={bid.venue}
                price={bid.price}
                quantity={bid.quantity}
              />
            );
          })}

          {/* Ask bars */}
          {asks.map((ask, index) => {
            const isPressureZone =
              filters.showPressureZones &&
              pressureZones.some(
                (zone) => Math.abs(zone.priceLevel - ask.price) < 1
              );

            return (
              <AnimatedBar
                key={`ask-${ask.venue}-${index}`}
                position={[
                  ASK_X + (index % 3) * 0.8,
                  ask.quantity / 2,
                  -index * Z_GAP,
                ]}
                height={ask.quantity * 2}
                color={
                  isPressureZone
                    ? "#ff4141"
                    : venues[ask.venue]?.askColor || "#FF4444"
                }
                isPressureZone={isPressureZone}
                venue={ask.venue}
                price={ask.price}
                quantity={ask.quantity}
              />
            );
          })}

          {/* Labels */}
          <Text
            position={[BID_X, -2, 5]}
            fontSize={1}
            color="#00C851"
            anchorX="center"
          >
            BIDS
          </Text>
          <Text
            position={[ASK_X, -2, 5]}
            fontSize={1}
            color="#FF4444"
            anchorX="center"
          >
            ASKS
          </Text>
        </Canvas>

        {/* Connection Status */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
          }}
        >
          <div style={{ color: "#4CAF50" }}>
            ● Connected to Binance WebSocket
          </div>
          <div>Last Update: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
}
