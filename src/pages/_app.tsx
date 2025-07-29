// import "@/styles/globals.css"; // ✅ if using alias
// import type { AppProps } from "next/app";

// export default function App({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />;
// }

"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import 3D component to avoid SSR issues
const Orderbook3D = dynamic(() => import("../components/Orderbook3D"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full h-[80vh]">
        <Orderbook3D />
      </div>
    </main>
  );
}
