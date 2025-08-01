# 📊 Orderbook Depth 3D Visualizer

A sophisticated **Next.js** application that displays a **rotating 3D graph visualization** of cryptocurrency orderbook data with real-time updates, venue filtering, and pressure zone analysis.

---

## 🚀 Features

### 🧩 Core Functionality
- **3D Interactive Visualization**: Price (X-axis), Quantity (Y-axis), and Time (Z-axis) representation
- **Real-time Data Integration**: Live orderbook data from Binance WebSocket API
- **Multi-Venue Support**: Binance, OKX, Bybit, and Deribit visualization
- **Pressure Zone Analysis**: Automatic detection and highlighting of high-volume areas
- **Interactive Controls**: Manual rotation, zoom, pan, and filtering capabilities

### 🔍 Advanced Features
- **Smooth Animations**: Powered by `@react-spring/three` for seamless transitions
- **Venue Filtering**: Toggle visibility of different trading venues
- **Quantity Thresholds**: Filter orders based on minimum quantity
- **Auto-Rotation**: Automatic spinning around Z-axis to emphasize temporal dimension
- **Hover Information**: Get detailed order insights on hover
- **Live Statistics**: Market stats like spread, volume, and ratios updated in real-time

### ⚙️ Technical Implementation
- **TypeScript**: Type-safe development with strong tooling support
- **Three.js + @react-three/fiber**: Robust 3D rendering
- **Tailwind CSS**: For rapid and responsive UI styling
- **WebSocket**: Native integration for real-time orderbook streams
- **React Hooks & Context**: For clean and efficient state management
- **Responsive UI**: Works well across all screen sizes
- **Error Handling**: Robust handling of WebSocket and data errors

---

## 🛠️ Technology Stack

| Category         | Tech Stack                                  |
|------------------|----------------------------------------------|
| Framework        | Next.js 14 (App Router)                     |
| Language         | TypeScript                                  |
| 3D Rendering     | Three.js, @react-three/fiber                |
| Animations       | @react-spring/three                         |
| Styling          | Tailwind CSS                                |
| Real-time Data   | WebSocket API (Binance & others)            |
| State Management | React hooks, React context API              |

---
###  System Architecture 
```
Binance WebSocket API
        ↓
Real-time Parser (Node/React)
        ↓
State Manager (React Context)
        ↓
3D Renderer (@react-three/fiber)
        ↓
UI + Animations (React + Tailwind + @react-spring)
```

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/smitass-404/Orderbook-Depth-3D-Visualizer.git
cd Orderbook-Depth-3D-Visualizer
```

### 2. Install Dependecies

```
npm install
```

### 3. Run the development server

```
npm run dev
```
### 4. Open in browser
```
Visit: http://localhost:3000

```
![Demo](https://user-images.githubusercontent.com/your-gif-path.gif)



## 🎮 Usage

### Control Panel

- **Trading Venues**: Toggle visibility of different exchanges  
- **View Mode**: Switch between real-time and historical data  
- **Time Range**: Select from 1 minute, 5 minutes, 15 minutes, or 1 hour intervals  
- **Filters**: Set minimum quantity thresholds for order visibility  
- **Pressure Zone Highlighting**: Toggle visualization of high-volume areas  
- **Auto Rotate**: Enable/disable automatic camera rotation  

### 3D Interaction

#### Mouse Controls
- Left click + drag: Rotate view  
- Right click + drag: Pan view  
- Scroll wheel: Zoom in/out  

#### Touch Controls
- Pinch to zoom  
- Drag to rotate (mobile/tablet)

#### Hover Effects
- Hover over bars to see detailed order information

### Visual Elements

- **Green Bars**: Bid orders (buy orders)  
- **Red Bars**: Ask orders (sell orders)  
- **Glowing Bars**: Pressure zones with high order concentration  
- **Grid System**: 3D grid for spatial reference  
- **Axes Labels**: Clear labeling of Price, Quantity, and Time dimensions  

---

## 📊 Data Sources

### Primary Data Source

- **Binance WebSocket API**: Real-time orderbook depth data for BTC/USDT  
- **Endpoint**: `wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms`  
- **Update Frequency**: 100ms (10 times per second)

### Mock Data Sources

- **OKX**: Simulated orderbook data based on Binance spreads  
- **Bybit**: Generated mock data with realistic price variations  
- **Deribit**: Synthetic orderbook data for demonstration  

---



