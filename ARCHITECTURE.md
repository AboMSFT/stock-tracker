# 📈 Inwealthment — Architecture

A monorepo with three packages: a **React 19 PWA** for the web, an **Expo SDK 53 native iOS app**, and a **shared TypeScript layer** containing all business logic used by both.

---

## Table of Contents

1. [Monorepo Overview](#monorepo-overview)
2. [Shared Layer — `packages/shared`](#shared-layer--packagesshared)
3. [Web App — `packages/web`](#web-app--packagesweb)
4. [iOS Native App — `packages/mobile`](#ios-native-app--packagesmobile)
5. [Architecture Diagram](#architecture-diagram)
6. [File Structure](#file-structure)
7. [Data Flow](#data-flow)
8. [API & Proxy](#api--proxy)
9. [State Management](#state-management)
10. [Alert System](#alert-system)
11. [Drag-to-Reorder Grid](#drag-to-reorder-grid)
12. [Persistence](#persistence)

---

## Monorepo Overview

The repo uses **npm workspaces** declared in the root `package.json`:

```json
{ "workspaces": ["packages/*"] }
```

| Package | Path | Role |
|---|---|---|
| `@inwealthment/shared` | `packages/shared` | Hooks, types, StorageAdapter — **used by both apps** |
| `@inwealthment/web` | `packages/web` | React 19 + Vite 8 PWA — runs in the browser |
| `@inwealthment/mobile` | `packages/mobile` | Expo SDK 53 — native iOS app |

Both `web` and `mobile` declare `"@inwealthment/shared": "*"` as a dependency. npm workspaces resolve this to the local `packages/shared` directory — no publishing required.

```bash
# Install all workspace dependencies (run from repo root)
npm install --legacy-peer-deps
```

### Features at a glance

| Feature | Web | iOS |
|---|---|---|
| Watchlist tiles — ticker, price, % change, sparkline | ✅ | ✅ |
| Crypto support — BTC-USD, ETH-USD etc. | ✅ | ✅ |
| Search & add — debounced Yahoo Finance search | ✅ | ✅ |
| Intraday sparkline — 5-minute SVG mini-chart | ✅ | ✅ |
| Target price alert — fires when price crosses target | ✅ | ✅ |
| In-app alert banner — sticky, dismissible | ✅ | ✅ |
| Auto-refresh — prices polled every 30 seconds | ✅ | ✅ |
| Pull-to-refresh | ✅ | ✅ |
| **Drag-to-reorder tiles** | ❌ | ✅ |
| Browser push notification — Web Notifications API | ✅ | ❌ |
| Alert sound — Web Audio API | ✅ | ❌ |
| PWA installable — Chrome + Safari iOS | ✅ | ❌ |
| Offline-capable — Workbox service worker | ✅ | ❌ |
| Persistence | `localStorage` | `AsyncStorage` |

---

## Shared Layer — `packages/shared`

This is the heart of the monorepo. All business logic lives here and runs identically on web and iOS.

### StorageAdapter pattern

Platform storage APIs are abstracted behind a minimal interface:

```typescript
// packages/shared/src/storage.ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
```

Each platform provides its own implementation:

```typescript
// Web (packages/web) — wraps localStorage
export const localStorageAdapter: StorageAdapter = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
};

// iOS (packages/mobile) — wraps AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
export const asyncStorageAdapter: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};
```

The shared hooks only call `adapter.getItem()` / `adapter.setItem()` — they never touch platform APIs directly. This is the same principle as a C++ pure virtual interface with concrete implementations per platform.

### Shared hooks

| Hook | File | Purpose |
|---|---|---|
| `useWatchlist(storage)` | `hooks/useWatchlist.ts` | Watchlist CRUD; accepts a `StorageAdapter`; serializes writes to avoid race conditions |
| `useStockPrices(symbols)` | `hooks/useStockPrices.ts` | Polls Yahoo Finance every 30 seconds; returns a `Map<symbol, StockQuote>` |

### Shared types (`types.ts`)

| Type | Key fields |
|---|---|
| `WatchlistItem` | `symbol`, `companyName`, `assetType?`, `targetPrice?`, `alertDirection?`, `alertFired?` |
| `StockQuote` | `symbol`, `price`, `change`, `changePercent`, `currency`, `sparkline?` |
| `SearchResult` | `symbol`, `shortname`, `longname?`, `assetType?` |
| `AlertEvent` | `id`, `symbol`, `price`, `targetPrice` |

### What is NOT in shared

- UI components — each platform has its own (`StockTile`, `SearchModal`, etc.)
- Platform-specific adapters (`localStorage`, `AsyncStorage`)
- Navigation/routing — web uses Vite SPA, iOS uses Expo Router
- Gesture and animation — iOS uses RNGH + Reanimated

---

## Web App — `packages/web`

A **React 19 single-page application** built with Vite 8, deployed as a PWA on Azure Static Web Apps.

### Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| PWA | vite-plugin-pwa + Workbox |
| Icons | lucide-react |
| Styling | Plain CSS + custom properties |
| Dev proxy | Vite dev-server (injects Yahoo Finance headers) |
| Prod proxy | Azure Functions (`api/src/functions/quote.js`) |
| Hosting | Azure Static Web Apps |
| CI/CD | GitHub Actions |

### Running locally

```bash
cd packages/web
npx vite --host 0.0.0.0 --port 5173
# Web: http://localhost:5173
# Network (other devices on WiFi): http://192.168.x.x:5173
```

### Key components

| Component | Purpose |
|---|---|
| `App.tsx` | Root — layout, alert logic, pull-to-refresh |
| `StockTile.tsx` | Asset card: ticker, price, %, sparkline, target input |
| `Sparkline.tsx` | SVG intraday 5-minute mini-chart |
| `SearchModal.tsx` | Bottom-sheet search; stays open for multi-add |
| `AlertBanner.tsx` | Sticky in-app alert banner |
| `InstallBanner.tsx` | PWA install guidance (iOS Share / Chrome prompt) |
| `ErrorBoundary.tsx` | Catches render errors; shows fallback UI |

### PWA & Installability

| Platform | Install method |
|---|---|
| Chrome (desktop/Android) | Install button in `InstallBanner` or address bar icon |
| Safari iOS | Tap Share → Add to Home Screen |

- `registerType: 'autoUpdate'` — service worker silently updates on new deploy
- `display: 'standalone'` — hides browser chrome when launched from home screen

### Deployment pipeline

```
git push → GitHub Actions
  └─▶ npm ci --legacy-peer-deps
  └─▶ npm run build  (Vite → packages/web/dist/)
  └─▶ Azure Static Web Apps deploy
        ├─ dist/  → static hosting (CDN)
        └─ api/   → Azure Functions (Node.js)
```

---

## iOS Native App — `packages/mobile`

A **native iOS app** built with Expo SDK 53 on top of React Native. It shares all business logic with the web app via `packages/shared` but uses platform-native UI primitives, gestures, and animations.

### Tech stack

| Layer | Technology |
|---|---|
| Platform | React Native (Expo SDK 53) |
| Bundler | Metro (`disableHierarchicalLookup: true`) |
| Routing | Expo Router (file-based, like Next.js for native) |
| Gestures | React Native Gesture Handler (RNGH) |
| Animation | React Native Reanimated |
| Storage | `@react-native-async-storage/async-storage` |
| Build | Local Xcode (not EAS) |
| Bundle ID | `com.abohoseini.inwealthment` |
| Apple Team | `Y836Z4K5J8` |

### Running locally

```bash
cd packages/mobile
npx expo start --port 8081
# Scan QR code with Expo Go, or use development build on physical device
```

### App structure (Expo Router)

Expo Router uses **file-based routing** — the file path in `app/` directly maps to a screen.

```
packages/mobile/app/
├── _layout.tsx    ← Root layout: wraps everything in GestureHandlerRootView
│                    Required for RNGH gestures to work
└── index.tsx      ← Home screen: renders DraggableGrid of StockTile cards
                     Wires useWatchlist + useStockPrices from shared
```

**`_layout.tsx` (root layout):**
- Wraps the entire app in `<GestureHandlerRootView style={{ flex: 1 }}>`
- Required by RNGH — without it, no gesture recognizers work

**`index.tsx` (home screen):**
- Instantiates `asyncStorageAdapter` and passes it to `useWatchlist`
- Calls `useStockPrices` with the watchlist symbols
- Renders `<DraggableGrid>` with `<StockTile>` as `renderItem`
- Handles pull-to-refresh via `RefreshControl`

### Key components

| Component | Purpose |
|---|---|
| `StockTile.tsx` | Native asset card: ticker, price, %, sparkline, ⠿ drag handle |
| `DraggableGrid.tsx` | 2-column drag-to-reorder grid (Reanimated + RNGH) |

### Metro monorepo config

```js
// packages/mobile/metro.config.js
config.resolver.disableHierarchicalLookup = true;
```

Without this, Metro finds the workspace-root `react@19.2.5` instead of mobile's `react@19.0.0`, causing duplicate React and a runtime crash.

### Podfile compatibility patch

`packages/mobile/ios/Podfile` contains a `post_install` Ruby `gsub` that patches `fmt/base.h` for Xcode 26 / clang 21 compatibility. Required on modern Xcode versions.

### Physical device testing

```bash
# Build and run on connected iPhone
cd packages/mobile/ios
xcodebuild -workspace Inwealthment.xcworkspace \
           -scheme Inwealthment \
           -destination 'id=00008140-001A0DD82242801C' \
           -allowProvisioningUpdates

# Relaunch without rebuilding (hot reload via Metro)
xcrun devicectl device process launch \
  --device 00008140-001A0DD82242801C \
  --terminate-existing \
  com.abohoseini.inwealthment
```

---

## Architecture Diagram

```
┌──────────────────────────────┐    ┌──────────────────────────────────┐
│      packages/web            │    │       packages/mobile            │
│  React 19 + Vite 8 PWA      │    │   Expo SDK 53 + React Native     │
│                              │    │                                  │
│  App.tsx                     │    │  app/_layout.tsx                 │
│  StockTile  Sparkline        │    │    GestureHandlerRootView        │
│  SearchModal  AlertBanner    │    │  app/index.tsx                   │
│  InstallBanner ErrorBoundary │    │    DraggableGrid + StockTile     │
│                              │    │                                  │
│  localStorageAdapter         │    │  asyncStorageAdapter             │
└─────────────┬────────────────┘    └─────────────┬────────────────────┘
              │                                   │
              └──────────────┬────────────────────┘
                             │ imports @inwealthment/shared
              ┌──────────────▼──────────────────────────┐
              │           packages/shared               │
              │                                         │
              │  useWatchlist(StorageAdapter)           │
              │  useStockPrices(symbols)                │
              │  types: WatchlistItem StockQuote ...    │
              │  StorageAdapter interface               │
              └──────────────┬──────────────────────────┘
                             │ fetch /api/quote
              ┌──────────────▼──────────────────────────┐
              │  DEV:  Vite proxy (packages/web)        │
              │  PROD: Azure Functions (api/)           │
              └──────────────┬──────────────────────────┘
                             │ HTTPS (Referer: finance.yahoo.com)
                             ▼
              ┌──────────────────────────────────────────┐
              │         Yahoo Finance API                │
              │   query1.finance.yahoo.com               │
              │   /v8/finance/chart/{SYM}  (prices)     │
              │   /v1/finance/search       (search)      │
              └──────────────────────────────────────────┘
```

---

## File Structure

```
stock-tracker/                               # repo root (npm workspaces)
├── package.json                             # workspaces: ["packages/*"]
├── ARCHITECTURE.md
├── LEARNING.md
│
└── packages/
    │
    ├── shared/                              # @inwealthment/shared
    │   ├── package.json
    │   └── src/
    │       ├── index.ts                     # barrel exports
    │       ├── types.ts                     # WatchlistItem, StockQuote, SearchResult, AlertEvent
    │       ├── storage.ts                   # StorageAdapter interface
    │       └── hooks/
    │           ├── useWatchlist.ts          # Watchlist CRUD — platform-agnostic
    │           └── useStockPrices.ts        # Price polling — 30 s interval
    │
    ├── web/                                 # @inwealthment/web
    │   ├── package.json
    │   ├── index.html                       # PWA meta tags, apple-touch-icon
    │   ├── vite.config.ts                   # Vite + dev proxy + VitePWA plugin
    │   ├── public/
    │   │   ├── icon-192.png                 # PWA manifest icon
    │   │   ├── icon-512.png                 # PWA manifest icon
    │   │   └── apple-touch-icon.png         # iOS home screen icon
    │   ├── api/
    │   │   └── src/functions/
    │   │       ├── quote.js                 # Azure Function: proxies price calls
    │   │       └── stocksearch.js           # Azure Function: proxies search calls
    │   └── src/
    │       ├── main.tsx                     # React root; wrapped in ErrorBoundary
    │       ├── App.tsx                      # Root component — layout, alert logic
    │       ├── index.css                    # Global CSS (dark theme, mobile-first)
    │       ├── services/
    │       │   └── stockService.ts          # Yahoo Finance API calls
    │       └── components/
    │           ├── StockTile.tsx            # Asset card (stock or crypto)
    │           ├── Sparkline.tsx            # SVG intraday mini-chart
    │           ├── SearchModal.tsx          # Bottom-sheet search; multi-add
    │           ├── AlertBanner.tsx          # In-app target price alert banner
    │           ├── InstallBanner.tsx        # PWA install guidance
    │           └── ErrorBoundary.tsx        # React error boundary fallback
    │
    └── mobile/                              # @inwealthment/mobile
        ├── package.json
        ├── app.json                         # Expo config (bundle ID, team, SDK version)
        ├── metro.config.js                  # disableHierarchicalLookup: true
        ├── ios/
        │   ├── Podfile                      # fmt/Xcode 26 patch in post_install
        │   └── Inwealthment/
        │       └── Inwealthment.entitlements
        ├── app/                             # Expo Router — file = screen
        │   ├── _layout.tsx                  # Root: GestureHandlerRootView wrapper
        │   └── index.tsx                    # Home screen: wires shared hooks → UI
        └── src/
            └── components/
                ├── StockTile.tsx            # Native asset card + drag handle
                └── DraggableGrid.tsx        # 2-column drag-to-reorder grid
```

---

## Data Flow

### Loading prices on startup

```
App mounts (web or iOS)
  └─▶ useWatchlist(storageAdapter)
        └─▶ adapter.getItem('inwealthment-watchlist')  ← localStorage or AsyncStorage
        └─▶ setItems(parsed JSON)
  └─▶ useStockPrices(symbols)
        └─▶ stockService.fetchQuotes(symbols)
              └─▶ GET /api/quote?symbol={SYM}  (×N in parallel)
                    DEV:  Vite proxy → query1.finance.yahoo.com
                    PROD: Azure Function → query1.finance.yahoo.com
              └─▶ extracts price, change%, sparkline (5m candles)
        └─▶ setQuotes(Map<symbol, StockQuote>)   — triggers re-render
  └─▶ StockTile receives quote prop              — shows price, %, sparkline
```

### Adding an asset

```
User opens Search (web: SearchModal / iOS: same pattern)
  └─▶ types query (debounced 350 ms)
  └─▶ stockService.searchStocks(query)
        └─▶ GET /api/stocksearch?q=...
        └─▶ filters: EQUITY | ETF | INDEX | CRYPTOCURRENCY
  └─▶ User taps "+" on a result
  └─▶ useWatchlist.addStock(symbol, companyName, assetType)
        └─▶ adapter.setItem(key, JSON.stringify(items))
  └─▶ symbols array changes → useStockPrices re-runs
  └─▶ new price + sparkline fetched; tile appears
```

### Reordering tiles (iOS only)

```
User long-presses tile (300 ms) → RNGH Pan gesture activates
  └─▶ draggingIndex shared value set on UI thread
  └─▶ dragOffsetX / dragOffsetY update on UI thread (onChange)
  └─▶ useAnimatedStyle applies transform: [translateX, translateY]
        ← NOT left/top (avoids Yoga re-layout on every frame)
  └─▶ User releases → nearestIndex() worklet maps position → grid slot
  └─▶ onDragEnd(from, to) called on JS thread via runOnJS
  └─▶ useWatchlist.reorderAll(symbolOrder) updates + persists
```

### Target price alert

```
useStockPrices polls every 30 s
  └─▶ App.useEffect watches quotes Map
        └─▶ for each WatchlistItem with a targetPrice:
              if alertDirection === 'above' && price >= target  →  HIT
              if alertDirection === 'below' && price <= target  →  HIT
        └─▶ on HIT:
              useWatchlist.markAlertFired(symbol)     — prevents re-firing
              setActiveAlerts([...prev, AlertEvent])  — shows banner
              sendNotification(title, body)            — browser push (web only)
              playAlertSound()                         — Audio API beep (web only)
```

---

## API & Proxy

Both platforms call the same API endpoints. The Yahoo Finance API requires `Referer` and `Origin` header overrides to avoid being blocked — a proxy handles this.

| Environment | Proxy | Path |
|---|---|---|
| Web dev | Vite dev-server (`vite.config.ts`) | `/api/*` |
| Web prod | Azure Functions (`api/src/functions/`) | `/api/*` |
| Mobile dev | Metro + Vite proxy (same network URL) | `http://IP:8081/api/*` |

| Endpoint | Forwards to | Purpose |
|---|---|---|
| `GET /api/quote?symbol=AAPL&interval=5m&range=1d` | `query1.finance.yahoo.com/v8/finance/chart/AAPL` | Price + sparkline |
| `GET /api/stocksearch?q=apple` | `query2.finance.yahoo.com/v1/finance/search` | Search autocomplete |

**Key response fields (quote endpoint):**

| Field | Source | Used as |
|---|---|---|
| `regularMarketPrice` | `meta` | Current price |
| `chartPreviousClose` | `meta` | Previous close → change & % |
| `shortName` / `longName` | `meta` | Company display name |
| `currency` | `meta` | Currency code |
| `close[]` | `indicators.quote[0]` | Sparkline data (nulls filtered) |

---

## State Management

No global state library. State lives in React hooks, scoped to each component tree.

| State | Hook / Location | Persisted | Platform |
|---|---|---|---|
| Watchlist items + targets | `useWatchlist` | ✅ via StorageAdapter | Both |
| Live quotes + sparklines | `useStockPrices` | ❌ in-memory | Both |
| Refresh trigger | `useStockPrices` (refreshKey) | ❌ in-memory | Both |
| Active alert banners | `App` (useState array) | ❌ in-memory | Both |
| Search results | `SearchModal` | ❌ in-memory | Both |
| Notification permission | `App` | browser-managed | Web only |
| PWA install prompt | `InstallBanner` | sessionStorage | Web only |

---

## Alert System

1. User sets a **target price** on a tile — direction is inferred from current price:
   - `above` — alert when price rises **to or above** the target
   - `below` — alert when price falls **to or below** the target
2. On every 30-second poll, `App` checks all items with an active `alertDirection`
3. When the condition is met, the alert fires **once** (`alertFired = true`, `alertDirection` cleared)
4. Notifications fired simultaneously:
   - 🟠 **In-app sticky banner** — both platforms
   - 🔔 **Browser push notification** — web only (requires permission)
   - 🔊 **Audio beep** (Web Audio API, 880 Hz → 440 Hz) — web only

---

## Drag-to-Reorder Grid

`packages/mobile/src/components/DraggableGrid.tsx` — iOS only.

### Why custom instead of a library

`react-native-draggable-flatlist` only supports single-column lists. This app requires a **2-column grid** matching the web layout, so `DraggableGrid` is built from scratch using RNGH + Reanimated.

### Layout math

```
SPACING = 12                                    (uniform gap: sides + between)
TILE_W  = (screenWidth - SPACING × 3) / 2      (2 columns, 3 gaps)
tileLeft(i) = SPACING + (i % 2) × (TILE_W + SPACING)
tileTop(i)  = SPACING + ⌊i / 2⌋ × (itemH + SPACING)
gridHeight  = SPACING × (numRows + 1) + numRows × itemH
```

### Height probe

Tile height is not fixed — it varies between loading state (spinner, ~170 px) and loaded state (price + sparkline, ~210 px). A transparent, always-mounted `View` off-screen at `top: -9999` renders the first tile and fires `onLayout` whenever content changes. This updates `itemH`, which recalculates all tile positions.

### Gesture & animation

```
Gesture.Pan().activateAfterLongPress(300)
  onStart  → draggingIndex.value = index
  onChange → dragOffsetX.value += e.changeX
             dragOffsetY.value += e.changeY
  onEnd    → nearestIndex() worklet (UI thread) → logical slot
             runOnJS(onDragEnd)(from, to) → JS thread → reorder + persist
```

**Critical: `transform` not `left`/`top`**

```typescript
// ✅ Correct — transform bypasses Yoga; composited on GPU; 60 fps
transform: [{ translateX: dragOffsetX.value }, { translateY: dragOffsetY.value }]

// ❌ Wrong — left/top in useAnimatedStyle triggers Yoga re-layout every frame
left: bx + dragOffsetX.value,
top:  by + dragOffsetY.value,
```

`position: 'absolute'`, `left`, and `top` for the **resting position** live in a static style object so Yoga places the tile correctly on the first layout pass. Only visual drag movement uses `transform`.

### Three shared values across all tiles

| Shared value | Purpose |
|---|---|
| `draggingIndex` | Which tile is being dragged (-1 = none) |
| `dragOffsetX` | Horizontal drag offset from resting position |
| `dragOffsetY` | Vertical drag offset from resting position |

Each tile's `useAnimatedStyle` checks `draggingIndex.value === index` (closure-captured at render time).

---

## Persistence

The watchlist is stored under the key `inwealthment-watchlist` as a JSON array.

| Platform | Storage API | Adapter |
|---|---|---|
| Web | `localStorage` | `localStorageAdapter` |
| iOS | `AsyncStorage` | `asyncStorageAdapter` |

Both satisfy `StorageAdapter`. `useWatchlist` is fully platform-agnostic — it only calls `adapter.getItem()` and `adapter.setItem()`.

```json
[
  {
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "assetType": "stock",
    "targetPrice": 280,
    "alertDirection": "above",
    "alertFired": false
  },
  {
    "symbol": "BTC-USD",
    "companyName": "Bitcoin USD",
    "assetType": "crypto"
  }
]
```

Live prices and sparklines are **not** persisted — they are always fetched fresh on app load.
