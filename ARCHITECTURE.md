# 📈 StockTracker — Documentation

A mobile-optimized React web app for tracking US stock prices in real time with target price alerts.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Class & Component Diagram](#class--component-diagram)
- [Data Flow](#data-flow)
- [API & Proxy](#api--proxy)
- [State Management](#state-management)
- [Alert System](#alert-system)
- [Persistence](#persistence)

---

## Features

| Feature | Details |
|---|---|
| **Watchlist tiles** | Pin stocks to a 2-column grid; each tile shows ticker, company name, live price, and today's % change |
| **Search & add** | Bottom-sheet modal with debounced search across all US stocks and ETFs via Yahoo Finance |
| **Color coding** | Green top-border + green % for gains, red for losses |
| **Target price alert** | Set a price target per tile; fires when the price crosses the target |
| **Browser notification** | Push notification via the Web Notifications API |
| **In-app alert banner** | Sticky banner with dismiss button |
| **Alert sound** | Beep via Web Audio API |
| **Auto-refresh** | Prices polled every 30 seconds |
| **Persistence** | Watchlist and targets saved to `localStorage` — no login required |
| **Mobile-first UI** | Max-width 480 px, dark theme, touch-friendly tiles |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Icons | lucide-react |
| Styling | Plain CSS with custom properties (no framework) |
| Stock data | Yahoo Finance (`v8/finance/chart`, `v1/finance/search`) |
| CORS proxy | Vite dev-server proxy (overrides `Referer`/`Origin` headers) |
| Persistence | Browser `localStorage` |
| Notifications | Web Notifications API |
| Audio | Web Audio API |

---

## Getting Started

```bash
# Install dependencies
cd stock-tracker
npm install

# Start dev server (includes Yahoo Finance proxy)
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Note:** The Yahoo Finance proxy only works while the Vite dev server is running.  
> For production you would need a small backend proxy (e.g. Express or a serverless function).

---

## Architecture Overview

The app is a **single-page React application** with no backend. All data is fetched client-side through the Vite dev-server proxy, which forwards requests to Yahoo Finance with the correct headers to avoid being blocked.

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│                                             │
│  ┌──────────┐    ┌──────────────────────┐   │
│  │  React   │───▶│    localStorage      │   │
│  │   App    │    │  (watchlist + targets│   │
│  └────┬─────┘    └──────────────────────┘   │
│       │                                     │
│       │  fetch /api/yahoo/...               │
│       ▼                                     │
│  ┌──────────┐                               │
│  │  Vite    │                               │
│  │  Proxy   │                               │
│  └────┬─────┘                               │
└───────┼─────────────────────────────────────┘
        │  HTTPS  (Referer: finance.yahoo.com)
        ▼
┌───────────────────────┐
│  query1.finance.      │
│  yahoo.com            │
│  /v8/finance/chart/   │
│  {SYMBOL}             │
└───────────────────────┘
```

---

## File Structure

```
stock-tracker/
├── index.html                  # Entry HTML, sets viewport & theme-color
├── vite.config.ts              # Vite config + Yahoo Finance proxy rules
├── src/
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Root component — layout, alert logic
│   ├── types.ts                # Shared TypeScript interfaces
│   ├── index.css               # Global CSS (dark theme, mobile-first)
│   │
│   ├── services/
│   │   └── stockService.ts     # Yahoo Finance API calls
│   │
│   ├── hooks/
│   │   ├── useWatchlist.ts     # Watchlist CRUD + localStorage sync
│   │   └── useStockPrices.ts   # Price polling hook (30 s interval)
│   │
│   ├── components/
│   │   ├── StockTile.tsx       # Individual stock card
│   │   ├── SearchModal.tsx     # Bottom-sheet stock search
│   │   └── AlertBanner.tsx     # In-app target price alert banner
│   │
│   └── utils/
│       ├── audio.ts            # Web Audio API beep
│       └── notifications.ts    # Web Notifications API helpers
```

---

## Class & Component Diagram

```mermaid
classDiagram
    class WatchlistItem {
        +string symbol
        +string companyName
        +number? targetPrice
        +AlertDirection? alertDirection
        +boolean? alertFired
    }

    class StockQuote {
        +string symbol
        +number price
        +number change
        +number changePercent
        +string companyName
        +string currency
    }

    class SearchResult {
        +string symbol
        +string shortname
        +string? longname
        +string? typeDisp
        +string? exchDisp
    }

    class AlertEvent {
        +string id
        +string symbol
        +string companyName
        +number price
        +number targetPrice
    }

    class stockService {
        +fetchQuotes(symbols) StockQuote[]
        -fetchSingleQuote(symbol) StockQuote?
        +searchStocks(query) SearchResult[]
    }

    class useWatchlist {
        +WatchlistItem[] items
        +addStock(symbol, companyName) void
        +removeStock(symbol) void
        +setTargetPrice(symbol, price, current) void
        +markAlertFired(symbol) void
    }

    class useStockPrices {
        +Map~string,StockQuote~ quotes
        +boolean loading
        +boolean hasFetched
        +string? error
    }

    class App {
        -WatchlistItem[] items
        -Map~string,StockQuote~ quotes
        -AlertEvent[] activeAlerts
        -boolean showSearch
        -boolean notifGranted
    }

    class StockTile {
        +WatchlistItem item
        +StockQuote? quote
        +boolean hasFetched
        -boolean showTargetInput
    }

    class SearchModal {
        +string[] existingSymbols
        -string query
        -SearchResult[] results
        -boolean loading
    }

    class AlertBanner {
        +AlertEvent[] alerts
    }

    App --> useWatchlist : uses
    App --> useStockPrices : uses
    App *-- StockTile : renders
    App *-- SearchModal : renders
    App *-- AlertBanner : renders
    useWatchlist --> WatchlistItem : manages
    useStockPrices --> stockService : calls
    useStockPrices --> StockQuote : produces
    stockService --> StockQuote : returns
    stockService --> SearchResult : returns
    App --> AlertEvent : creates
    StockTile --> WatchlistItem : displays
    StockTile --> StockQuote : displays
    SearchModal --> SearchResult : displays
    AlertBanner --> AlertEvent : displays
```

---

## Data Flow

### Loading prices on startup

```
App mounts
  └─▶ useWatchlist.loadFromStorage()       — reads localStorage
  └─▶ useStockPrices(symbols)
        └─▶ stockService.fetchQuotes()
              └─▶ GET /api/yahoo/v8/finance/chart/{symbol}  (×N in parallel)
                    └─▶ Vite proxy ──▶ query1.finance.yahoo.com
        └─▶ setQuotes(Map)                 — triggers re-render
  └─▶ StockTile receives quote prop        — shows price & % change
```

### Adding a stock

```
User opens SearchModal
  └─▶ types query (debounced 350 ms)
  └─▶ stockService.searchStocks(query)
        └─▶ GET /api/search/v1/finance/search?q=...
  └─▶ User taps result
  └─▶ useWatchlist.addStock(symbol, companyName)
        └─▶ saves to localStorage
  └─▶ symbols array changes → useStockPrices effect re-runs
  └─▶ new price fetched and tile appears
```

### Target price alert

```
useStockPrices polls every 30 s
  └─▶ App.useEffect watches quotes Map
        └─▶ for each WatchlistItem with a targetPrice:
              if alertDirection === 'above' && price >= target  →  HIT
              if alertDirection === 'below' && price <= target  →  HIT
        └─▶ on HIT:
              useWatchlist.markAlertFired(symbol)   — prevents re-firing
              setActiveAlerts([...prev, AlertEvent]) — shows banner
              sendNotification(title, body)          — browser push
              playAlertSound()                       — Web Audio beep
```

---

## API & Proxy

All requests go through the **Vite dev-server proxy** defined in `vite.config.ts`, which adds the required `Referer` and `Origin` headers so Yahoo Finance accepts the requests.

| Proxy path | Forwards to | Used for |
|---|---|---|
| `/api/yahoo/*` | `https://query1.finance.yahoo.com` | Price quotes |
| `/api/search/*` | `https://query2.finance.yahoo.com` | Stock search autocomplete |

### Quote endpoint

```
GET /api/yahoo/v8/finance/chart/{SYMBOL}?interval=1d&range=1d
```

Key fields used from `chart.result[0].meta`:

| Field | Used as |
|---|---|
| `regularMarketPrice` | Current price |
| `chartPreviousClose` | Previous close (to compute change & %) |
| `shortName` / `longName` | Company display name |
| `currency` | Currency code (USD) |

### Search endpoint

```
GET /api/search/v1/finance/search?q={QUERY}&quotesCount=10&newsCount=0
```

Returns `quotes[]` filtered to `EQUITY`, `ETF`, and `INDEX` types.

---

## State Management

There is no global state library. State is managed with React hooks and `localStorage`.

| State | Location | Persisted |
|---|---|---|
| Watchlist items + targets | `useWatchlist` (useState) | ✅ localStorage |
| Live quotes | `useStockPrices` (useState Map) | ❌ in-memory |
| Active alert banners | `App` (useState array) | ❌ in-memory |
| Search results | `SearchModal` (useState) | ❌ in-memory |
| Notification permission | `App` (useState boolean) | browser-managed |

---

## Alert System

When the user sets a **target price** on a tile:

1. The current price is compared to the target to determine **direction**:
   - `above` — alert when price rises **to or above** the target
   - `below` — alert when price falls **to or below** the target
2. On every 30-second poll, `App` checks all items with an active `alertDirection`
3. When the condition is met the alert fires **once** (`alertFired = true`, `alertDirection` cleared) — it will not repeat until the user sets a new target
4. Three simultaneous notifications are sent:
   - 🔔 **Browser push notification** (requires permission)
   - 🟠 **In-app sticky banner** (always shown, dismissible)
   - 🔊 **Audio beep** via Web Audio API (880 Hz → 440 Hz tone)

---

## Persistence

The watchlist is stored in `localStorage` under the key `stock-tracker-watchlist` as a JSON array of `WatchlistItem` objects.

```json
[
  {
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "targetPrice": 280,
    "alertDirection": "above",
    "alertFired": false
  }
]
```

Live prices are **not** persisted — they are always fetched fresh on app load.
