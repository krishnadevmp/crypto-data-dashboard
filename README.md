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

## Assumptions

No mock backend was provided with the brief, so a custom Node.js + Express mock server was built to satisfy the API contract. The server lives in a separate repository and is required to be running locally before starting the frontend.

**Repository:** `https://github.com/krishnadevmp/crypto-data-dashboard-service`

The mock server provides:
- `GET /api/candles/:pair` — returns 60 hourly OHLCV candles generated with a seeded random walk, so the same pair always produces the same price history across restarts.
- `GET /api/orderbook/:pair` — returns a fresh order book snapshot on every request, with 15 ask and 15 bid levels centred on the current live price.
- `ws://localhost:3001` — WebSocket endpoint that pushes a `candle_update` (single latest candle) and `orderbook_update` (full snapshot) every 10 seconds for all subscribed pairs. Clients subscribe by sending `{ type: "subscribe", pair, stream }` and unsubscribe by `{ type: "unsubscribe", pair, stream }`. The live candle is the only thing that mutates on each tick — the 59 historical candles are fixed at server start and never change.

See the [crypto-data-dashboard-service README](https://github.com/krishnadevmp/crypto-data-dashboard-service/blob/main/README.md) for full setup instructions.

---

## Trade-offs

### Chart library: lightweight-charts

The candlestick chart uses [lightweight-charts](https://github.com/tradingview/lightweight-charts) by TradingView. It was chosen for its native candlestick support, tiny bundle (~50 KB), and its `update()` API which patches a single bar in-place rather than re-rendering the whole chart on every WebSocket tick.

The main trade-off is that it is not a React-native library — it exposes an imperative, instance-based API that lives outside React's render cycle. To bridge this gap, a custom `useCandleChart` hook was created to manage the chart lifecycle (init, resize, cleanup) through refs, and expose a clean declarative-friendly API (`setCandles`, `updateCandle`) for the consuming component to drive the chart without touching the underlying instance directly.

### State Management

**Decision: React local state (`useState`) only — no external state library.**

The component tree is shallow — `Dashboard` owns `pair`, `streamMode`, and WebSocket data, passing them one level down to `CandleChart` and `OrderBook`. There is no prop drilling beyond a single level and no shared state between unrelated components, so the complexity of Redux, Zustand, or Jotai is not justified. If the app grows to include watchlists or cross-component preferences, Zustand would be the natural lightweight upgrade.
