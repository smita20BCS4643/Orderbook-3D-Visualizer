import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the 3D component to avoid SSR issues
const Orderbook3D = dynamic(() => import("@/components/Orderbook3D"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0a0a0a",
        color: "white",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "20px" }}>🚀</div>
        <div>Loading Orderbook 3D Visualizer...</div>
        <div style={{ fontSize: "12px", marginTop: "10px", opacity: 0.7 }}>
          Connecting to cryptocurrency exchanges...
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0a0a0a",
          color: "white",
        }}
      >
        Initializing...
      </div>
    );
  }

  return (
    <main style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      <Orderbook3D />
    </main>
  );
}
