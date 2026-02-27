# Crypto Data Dashboard

React + TypeScript crypto dashboard using REST for historical data and WebSockets for live updates. Implements client-side caching, efficient subscription management, and real-time candle/order book visualization with responsive design.

## Getting Started

### Install dependencies

```
npm install
```

### Run the app in development mode

```
npm run dev
```

The app will be available at the URL printed in the terminal (typically http://localhost:5173).

### Build for production

```
npm run build
```

### Preview the production build

```
npm run preview
```

## Testing

### Run all tests (headless)

```
npm test
```

### Run tests in UI mode

```
npm run test:ui
```

### Run tests once (CI mode)

```
npm run test:run
```

## Linting

```
npm run lint
```

---

## Trade-offs

### Chart library: lightweight-charts

The candlestick chart uses [lightweight-charts](https://github.com/tradingview/lightweight-charts) by TradingView. It was chosen for its native candlestick support, tiny bundle (~50 KB), and its `update()` API which patches a single bar in-place rather than re-rendering the whole chart on every WebSocket tick.

The main trade-off is that it is not a React-native library — it exposes an imperative, instance-based API that lives outside React's render cycle. To bridge this gap, a custom `useCandleChart` hook was created to manage the chart lifecycle (init, resize, cleanup) through refs, and expose a clean declarative-friendly API (`setCandles`, `updateCandle`) for the consuming component to drive the chart without touching the underlying instance directly.
