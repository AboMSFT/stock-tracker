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
9. [Authentication](#authentication)
10. [State Management](#state-management)
11. [Alert System](#alert-system)
12. [Drag-to-Reorder Grid](#drag-to-reorder-grid)
13. [Persistence & Cloud Sync](#persistence--cloud-sync)

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
| **User authentication** — sign up, sign in, forgot password | ✅ | ✅ |
| **Cloud watchlist sync** — per-user, survives reinstall | ✅ | ✅ |
| **Drag-to-reorder tiles** | ❌ | ✅ |
| Browser push notification — Web Notifications API | ✅ | ❌ |
| Alert sound — Web Audio API | ✅ | ❌ |
| PWA installable — Chrome + Safari iOS | ✅ | ❌ |
| Offline-capable — Workbox service worker | ✅ | ❌ |
| Persistence | Supabase (cloud) | Supabase (cloud) |

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
export const webStorageAdapter: StorageAdapter = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(void localStorage.setItem(key, value)),
};

// iOS (packages/mobile) — wraps AsyncStorage (used for migration only now)
import AsyncStorage from '@react-native-async-storage/async-storage';
export const mobileStorageAdapter: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};

// Cloud — Supabase (both platforms, created per authenticated user)
export function createSupabaseStorageAdapter(supabase, userId): StorageAdapter {
  return {
    async getItem(key) { /* SELECT from user_storage WHERE user_id = userId */ },
    async setItem(key, value) { /* UPSERT into user_storage */ },
  };
}
```

The shared hooks only call `adapter.getItem()` / `adapter.setItem()` — they never touch platform APIs directly. This is the same principle as a C++ pure virtual interface with concrete implementations per platform.

### AuthAdapter pattern

Authentication is similarly abstracted so the same `useAuth` hook works on both platforms:

```typescript
// packages/shared/src/auth.ts
export interface AuthAdapter {
  onAuthStateChange(cb: (user: User | null, event: AuthEvent) => void): () => void;
  signUp(email, password): Promise<{ user, error }>;
  signIn(email, password): Promise<{ user, error }>;
  signOut(): Promise<void>;
  resetPassword(email): Promise<{ error }>;
  updatePassword(password): Promise<{ error }>;
}
```

Both platforms implement this against Supabase:
- `packages/web/src/authAdapter.ts` — uses `@supabase/supabase-js` with the web Supabase client
- `packages/mobile/src/authAdapter.ts` — uses `@supabase/supabase-js` with the mobile Supabase client

### Shared hooks

| Hook | File | Purpose |
|---|---|---|
| `useWatchlist(storage, userId)` | `hooks/useWatchlist.ts` | Watchlist CRUD; accepts a `StorageAdapter`; serializes writes; `hydratedKeyRef` guards against premature saves |
| `useStockPrices(symbols)` | `hooks/useStockPrices.ts` | Polls Yahoo Finance every 30 seconds; returns a `Map<symbol, StockQuote>` |
| `useAuth(adapter)` | `hooks/useAuth.ts` | Subscribes to auth state via `onAuthStateChange`; exposes `user`, `loading`, `signOut`, etc. |

### Shared types (`types.ts`)

| Type | Key fields |
|---|---|
| `WatchlistItem` | `symbol`, `companyName`, `assetType?`, `targetPrice?`, `alertDirection?`, `alertFired?` |
| `StockQuote` | `symbol`, `price`, `change`, `changePercent`, `currency`, `sparkline?` |
| `SearchResult` | `symbol`, `shortname`, `longname?`, `assetType?` |
| `AlertEvent` | `id`, `symbol`, `price`, `targetPrice` |
| `User` | `id`, `email` |
| `AuthEvent` | `'INITIAL_SESSION' \| 'SIGNED_IN' \| 'SIGNED_OUT' \| 'PASSWORD_RECOVERY'` |

### What is NOT in shared

- UI components — each platform has its own (`StockTile`, `SearchModal`, etc.)
- Platform-specific adapters (`localStorage`, `AsyncStorage`, Supabase client instances)
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
| Auth & DB | Supabase (`@supabase/supabase-js`) |
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
| `App.tsx` | Root — auth guard, Supabase storage adapter (useMemo), layout, alert logic, pull-to-refresh, localStorage→Supabase migration |
| `AuthScreen.tsx` | Sign-in / sign-up / forgot-password / password-reset UI |
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
| Auth & DB | Supabase (`@supabase/supabase-js`) |
| Build | Local Xcode (not EAS) |
| Bundle ID | `com.abohoseini.inwealthment` |
| Apple Team | `Y836Z4K5J8` |

### Running locally

```bash
cd packages/mobile
npx expo start --port 8081 --clear
# Scan QR code with Expo Go, or use development build on physical device
```

### Custom entry point & warning suppression

Metro's entry point is `packages/mobile/index.ts` (set via `"main"` in `package.json`). It imports `suppressWarnings.ts` **before** `expo-router/entry`, ensuring `console.warn` is patched before any module (including `expo-av`) can fire deprecation warnings at module-load time.

```
index.ts
  └─▶ import './src/suppressWarnings'  ← patches console.warn first
  └─▶ import 'expo-router/entry'       ← registers Expo Router
```

This is necessary because `LogBox.ignoreLogs` and in-component patches run too late — `expo-av` fires its warning at module evaluation time, before any React component mounts.

### App structure (Expo Router)

Expo Router uses **file-based routing** — the file path in `app/` directly maps to a screen.

```
packages/mobile/app/
├── _layout.tsx          ← Root layout: AuthContext.Provider, auth guard, GestureHandlerRootView
├── (auth)/
│   ├── login.tsx        ← Sign-in screen
│   ├── signup.tsx       ← Sign-up screen
│   └── forgot-password.tsx
└── (app)/
    └── index.tsx        ← Protected home screen: DraggableGrid of StockTile cards
```

**`_layout.tsx` (root layout):**
- The **only** place `useAuth(mobileAuthAdapter)` is called — a single `onAuthStateChange` subscription
- Wraps the tree in `<AuthContext.Provider>` — shares `{ user, loading, signOut }` to all screens
- Auth guard: `!user && !inAuthGroup` → redirect to `/(auth)/login`; `user && !inAppGroup` → redirect to `/(app)`
- Always renders `<Stack>` — never conditionally omitted (Expo Router navigator must stay mounted for navigation calls to work)
- Loading overlay is an `absoluteFill` sibling of `<Stack>`, not a replacement

**Why `AuthContext` instead of calling `useAuth` in each screen:**  
Calling `useAuth` (which calls `onAuthStateChange`) in multiple screens creates multiple concurrent Supabase subscriptions. These race each other and produce spurious `SIGNED_OUT` events, logging the user out immediately after login. `AuthContext` solves this by having a single subscription in the root layout.

**`(app)/index.tsx` (protected home screen):**
- Reads `{ user, signOut }` from `useAuthContext()`
- Creates Supabase storage adapter via `useMemo([user?.id])` — stable reference prevents unnecessary re-saves
- Calls `useWatchlist(storageAdapter, user.id)` and `useStockPrices(symbols)`
- Renders `<DraggableGrid>` with `<StockTile>` as `renderItem`
- Handles pull-to-refresh via `RefreshControl`

### Key components

| Component | Purpose |
|---|---|
| `StockTile.tsx` | Native asset card: ticker, price, %, sparkline, ⠿ drag handle |
| `DraggableGrid.tsx` | 2-column drag-to-reorder grid (Reanimated + RNGH) |
| `AuthContext.tsx` | React context: single `useAuth` call shared to all screens |

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
│  AuthScreen                  │    │    AuthContext.Provider          │
│  StockTile  Sparkline        │    │    auth guard + routing          │
│  SearchModal  AlertBanner    │    │  app/(app)/index.tsx             │
│  InstallBanner ErrorBoundary │    │    DraggableGrid + StockTile     │
│                              │    │  app/(auth)/login|signup|...     │
│  webAuthAdapter              │    │  mobileAuthAdapter               │
│  createSupabaseStorageAdapter│    │  createSupabaseStorageAdapter    │
└──────────┬───────────────────┘    └──────────┬───────────────────────┘
           │                                   │
           └──────────────┬────────────────────┘
                          │ imports @inwealthment/shared
           ┌──────────────▼──────────────────────────┐
           │           packages/shared               │
           │                                         │
           │  useAuth(AuthAdapter)                   │
           │  useWatchlist(StorageAdapter, userId)   │
           │  useStockPrices(symbols)                │
           │  createSupabaseStorageAdapter(sb, uid)  │
           │  types: WatchlistItem StockQuote User   │
           │  StorageAdapter / AuthAdapter interface │
           └──────┬───────────────────┬─────────────┘
                  │ fetch /api/quote  │ REST + RLS
           ┌──────▼──────┐    ┌──────▼──────────────┐
           │  DEV: Vite  │    │  Supabase            │
           │  PROD: Azure│    │  auth.users (JWT)    │
           │  Functions  │    │  user_storage table  │
           └──────┬──────┘    └──────────────────────┘
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
    │       ├── types.ts                     # WatchlistItem, StockQuote, User, AuthEvent…
    │       ├── storage.ts                   # StorageAdapter interface
    │       ├── auth.ts                      # AuthAdapter interface
    │       ├── supabaseStorageAdapter.ts    # createSupabaseStorageAdapter(supabase, userId)
    │       └── hooks/
    │           ├── useWatchlist.ts          # Watchlist CRUD — platform-agnostic
    │           ├── useStockPrices.ts        # Price polling — 30 s interval
    │           └── useAuth.ts              # Auth state subscription hook
    │
    ├── web/                                 # @inwealthment/web
    │   ├── package.json
    │   ├── index.html                       # PWA meta tags, apple-touch-icon
    │   ├── vite.config.ts                   # Vite + dev proxy + VitePWA plugin
    │   ├── public/
    │   │   ├── icon.svg                     # Browser favicon (SVG)
    │   │   ├── icon-192.png                 # PWA manifest icon
    │   │   ├── icon-512.png                 # PWA manifest icon
    │   │   └── apple-touch-icon.png         # iOS home screen icon (180×180)
    │   ├── api/
    │   │   └── src/functions/
    │   │       ├── quote.js                 # Azure Function: proxies price calls
    │   │       └── stocksearch.js           # Azure Function: proxies search calls
    │   └── src/
    │       ├── main.tsx                     # React root; wrapped in ErrorBoundary
    │       ├── App.tsx                      # Root: auth guard, storage adapter, alert logic
    │       ├── authAdapter.ts               # webAuthAdapter — wraps Supabase auth
    │       ├── supabase.ts                  # Supabase client (VITE_SUPABASE_* env vars)
    │       ├── storage.ts                   # webStorageAdapter — wraps localStorage
    │       ├── index.css                    # Global CSS (dark theme, mobile-first)
    │       ├── services/
    │       │   └── stockService.ts          # Yahoo Finance API calls
    │       └── components/
    │           ├── auth/
    │           │   └── AuthScreen.tsx       # Sign-in / sign-up / reset-password UI
    │           ├── StockTile.tsx            # Asset card (stock or crypto)
    │           ├── Sparkline.tsx            # SVG intraday mini-chart
    │           ├── SearchModal.tsx          # Bottom-sheet search; multi-add
    │           ├── AlertBanner.tsx          # In-app target price alert banner
    │           ├── InstallBanner.tsx        # PWA install guidance
    │           └── ErrorBoundary.tsx        # React error boundary fallback
    │
    └── mobile/                              # @inwealthment/mobile
        ├── package.json                     # "main": "index.ts" (custom entry)
        ├── index.ts                         # Custom entry: suppressWarnings → expo-router/entry
        ├── app.json                         # Expo config (bundle ID, team, SDK version)
        ├── metro.config.js                  # disableHierarchicalLookup: true
        ├── ios/
        │   ├── Podfile                      # fmt/Xcode 26 patch in post_install
        │   └── Inwealthment/
        │       ├── Inwealthment.entitlements
        │       └── Images.xcassets/
        │           └── AppIcon.appiconset/  # App icon (1024×1024 IW green)
        ├── app/                             # Expo Router — file = screen
        │   ├── _layout.tsx                  # Root: AuthContext.Provider, auth guard, Stack
        │   ├── (auth)/
        │   │   ├── login.tsx                # Sign-in screen
        │   │   ├── signup.tsx               # Sign-up screen
        │   │   └── forgot-password.tsx      # Password reset screen
        │   └── (app)/
        │       └── index.tsx                # Protected home screen
        ├── assets/
        │   └── icon.png                     # Source icon (1024×1024, green IW)
        └── src/
            ├── suppressWarnings.ts          # Patches console.warn before any module loads
            ├── AuthContext.tsx              # React context — single useAuth subscription
            ├── authAdapter.ts               # mobileAuthAdapter — wraps Supabase auth
            ├── supabase.ts                  # Supabase client (EXPO_PUBLIC_SUPABASE_* env vars)
            ├── storage.ts                   # mobileStorageAdapter — wraps AsyncStorage
            └── components/
                ├── StockTile.tsx            # Native asset card + drag handle
                └── DraggableGrid.tsx        # 2-column drag-to-reorder grid
```

---

## Data Flow

### App startup & auth

```
App mounts (web or iOS)
  └─▶ useAuth(authAdapter)  [called ONCE in root layout]
        └─▶ supabase.onAuthStateChange fires INITIAL_SESSION
              └─▶ user = null  → render auth screens
              └─▶ user = User  → render app screens
  └─▶ (if user) useWatchlist(supabaseStorageAdapter, user.id)
        └─▶ supabase SELECT FROM user_storage WHERE user_id = $uid AND key = $key
        └─▶ hydratedKeyRef.current = storageKey  (marks hydration complete)
        └─▶ setItems(parsed JSON)   [safe — save effect blocked until this runs]
  └─▶ useStockPrices(symbols)  ...
```

### Loading prices on startup

```
App mounts (web or iOS)
  └─▶ useWatchlist(supabaseStorageAdapter, userId)
        └─▶ adapter.getItem('inwealthment-watchlist:{uid}')
              └─▶ SELECT value FROM user_storage WHERE user_id=uid AND key=key
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
              └─▶ UPSERT INTO user_storage (user_id, key, value, updated_at)
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
  └─▶ useWatchlist.reorderAll(symbolOrder) updates + persists to Supabase
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

## Authentication

Authentication is handled by **Supabase Auth** (email + password). The same `useAuth` hook and `AuthAdapter` interface are used on both platforms.

### Supabase project

| Setting | Value |
|---|---|
| Project URL | `https://zcpkjqbxqfvuxgosossc.supabase.co` |
| Auth provider | Email + password (built-in) |
| Database table | `user_storage` (per-user key-value store) |

### Auth flow

```
User enters email + password
  └─▶ authAdapter.signIn(email, password)
        └─▶ supabase.auth.signInWithPassword(...)
        └─▶ Supabase issues JWT (access token + refresh token)
        └─▶ onAuthStateChange fires SIGNED_IN → user set in state
        └─▶ root layout redirects to /(app)
```

### Auth screens (mobile route group `(auth)/`)

| Screen | Route | Purpose |
|---|---|---|
| Login | `/(auth)/login` | Email + password sign-in |
| Sign Up | `/(auth)/signup` | New account creation |
| Forgot Password | `/(auth)/forgot-password` | Send reset email |

Auth screens call adapter methods directly (`mobileAuthAdapter.signIn(...)`) — they don't need `useAuth` since they don't consume user/loading state.

### Security: Row Level Security (RLS)

The `user_storage` table uses Postgres RLS so each user can only read and write their own rows:

```sql
create policy "Users manage their own storage"
  on user_storage for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Supabase automatically validates the JWT and exposes `auth.uid()` to the policy. No server-side code required.

---



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
| Authenticated user | `useAuth` → `AuthContext` | Supabase session (JWT) | Both |
| Auth loading | `useAuth` | ❌ in-memory | Both |
| Watchlist items + targets | `useWatchlist` | ✅ Supabase `user_storage` | Both |
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

## Persistence & Cloud Sync

The watchlist is stored in Supabase under the key `inwealthment-watchlist:{userId}` as a JSON array, scoped per user.

### Supabase `user_storage` table

```sql
create table user_storage (
  user_id    uuid references auth.users(id) on delete cascade not null,
  key        text not null,
  value      text not null,
  updated_at timestamptz default now() not null,
  primary key (user_id, key)
);
```

| Platform | Storage | Adapter |
|---|---|---|
| Web | Supabase `user_storage` | `createSupabaseStorageAdapter(supabase, userId)` |
| iOS | Supabase `user_storage` | `createSupabaseStorageAdapter(supabase, userId)` |

Both platforms use the identical adapter, so the watchlist is automatically synced — add a stock on iPhone, see it on the web app on next load.

### Adapter design decisions

**`userId` passed as a parameter** (not retrieved on every call) — avoids an expensive `getUser()` round-trip on every read/write.

**Throws on DB errors** (does not return `null`) — if the Supabase read fails, `useWatchlist`'s `.catch` sets `loadError` and leaves `hydrated = false`, preventing a subsequent save of `[]` that would wipe the real watchlist.

**`hydratedKeyRef` race condition guard** — the save effect in `useWatchlist` has `storage` and `storageKey` as deps. When a user signs in, both change simultaneously. React's effects fire with the stale closure values, so `hydrated` can be `true` from the previous cycle while `items` is `[]`. The guard `hydratedKeyRef.current !== storageKey` blocks any save until the async `getItem` for the *current* key has completed.

```
storageKey changes
  ├─▶ Hydration effect: hydratedKeyRef.current = null
  │     then async getItem …
  │     … resolves → hydratedKeyRef.current = storageKey → setHydrated(true)
  └─▶ Save effect: hydrated=true (stale) BUT hydratedKeyRef.current ≠ storageKey → SKIP
        (re-fires after setHydrated(true) with matching ref → save allowed)
```

**Stable adapter reference** — both platforms create the adapter via `useMemo([user?.id])`, preventing `useWatchlist`'s save effect from re-firing unnecessarily on every render.

### Web localStorage migration

When a user first signs in on the web after the Supabase migration, `App.tsx` runs a one-time `useEffect` that reads any existing watchlist from `localStorage` and upserts it to Supabase. It only removes the local copy after the write succeeds.

```typescript
useEffect(() => {
  const legacyRaw = localStorage.getItem(`inwealthment-watchlist:${user.id}`);
  if (!legacyRaw) return;
  supabase.from('user_storage').upsert({ user_id, key, value: legacyRaw })
    .then(({ error }) => { if (!error) localStorage.removeItem(key); });
}, [user?.id]);
```

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
