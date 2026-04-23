# Web Development Learning Guide
### JavaScript · TypeScript · React · Tooling

> This guide teaches the web development stack used to build the Inwealthment app.
> It assumes you know **C++ basics** and **HTML/CSS fundamentals**.
> Each lesson includes explanations, examples, and exercises with answers.

---

## Table of Contents

1. [JavaScript](#javascript)
   - [Arrow Functions](#1-arrow-functions)
   - [const and let](#2-const-and-let)
   - [async and await](#3-async--await)
   - [fetch — Making API Calls](#4-fetch--making-api-calls)
   - [Objects and Destructuring](#5-objects--destructuring)
   - [Template Literals](#6-template-literals)
   - [Spread Operator](#7-spread-operator)
   - [Optional Chaining and Nullish Coalescing](#8-optional-chaining--nullish-coalescing)
   - [Promise.allSettled](#9-promiseallsettled)
2. [TypeScript](#typescript)
   - [Basic Types](#1-basic-types)
   - [Interfaces](#2-interfaces)
   - [Functions with Types](#3-functions-with-types)
   - [Union Types](#4-union-types)
   - [Generics](#5-generics)
3. [React](#react)
   - [Components](#1-components)
   - [Props](#2-props)
   - [useState](#3-usestate)
   - [useEffect](#4-useeffect)
   - [Rendering Lists](#5-rendering-lists)
   - [Conditional Rendering](#6-conditional-rendering)
4. [Tooling](#tooling)
   - [npm](#1-npm)
   - [Vite](#2-vite)
   - [Git](#3-git)
   - [Running on Your Phone](#4-running-on-your-phone)
5. [Deploying to Production](#deploying-to-production)
   - [What is a Production Build?](#what-is-a-production-build)
   - [Static Hosting — Vercel, Netlify, GitHub Pages](#static-hosting--vercel-netlify-github-pages)
   - [Self-hosted — Nginx and Apache](#self-hosted--nginx-and-apache)
   - [Azure — Static Web Apps + Azure Functions](#azure--static-web-apps--azure-functions)
6. [Quick Reference Tables](#quick-reference-tables)
7. [Authentication & Backend (Supabase)](#section-12-authentication--backend-as-a-service-supabase)
   - [What is a Backend?](#1-what-is-a-backend)
   - [Authentication Flow](#2-authentication-flow)
   - [React Context](#3-react-context--sharing-state-without-prop-drilling)
   - [Row Level Security (RLS)](#4-row-level-security-rls)
   - [useMemo — Stable References](#5-usememo--stable-object-references)
   - [Async Race Conditions](#6-async-race-conditions)
   - [Building & Deploying iOS](#7-building--deploying-a-native-ios-app)

---

# JavaScript

## 1. Arrow Functions

In C++ you have lambdas:
```cpp
auto double_it = [](int x) { return x * 2; };
```

In JavaScript, the equivalent is an **arrow function**:
```javascript
const doubleIt = (x) => x * 2;
```

### Regular vs Arrow function
```javascript
// Old style
function greet(name) {
    return "Hello " + name;
}

// Modern arrow function — same result
const greet = (name) => "Hello " + name;
```

### Used with array methods
```javascript
const numbers = [1, 2, 3, 4, 5];

// .map() — transform every element (like std::transform)
const doubled = numbers.map((n) => n * 2);
// → [2, 4, 6, 8, 10]

// .filter() — keep matching elements (like std::copy_if)
const evens = numbers.filter((n) => n % 2 === 0);
// → [2, 4]
```

### C++ comparison
| JavaScript | C++ |
|---|---|
| `arr.map(x => x * 2)` | `std::transform` |
| `arr.filter(x => x > 0)` | `std::copy_if` |
| `(x) => x * 2` | `[](auto x){ return x*2; }` |

### ✏️ Exercise
What does this return?
```javascript
const stocks = ["AAPL", "MSFT", "GOOGL", "TSLA"];
const short = stocks.filter((s) => s.length === 4);
```
<details>
<summary>Answer</summary>

`["AAPL", "MSFT", "TSLA"]` — "GOOGL" has 5 letters so it's filtered out.
</details>

---

## 2. const and let

```cpp
// C++
int x = 5;        // mutable
const int y = 5;  // immutable
```

```javascript
// JavaScript
let x = 5;    // can reassign
const y = 5;  // cannot reassign
```

**Rule:** always use `const` by default. Only use `let` when you need to reassign.

> ⚠️ `var` exists but is outdated — never use it.

### Important gotcha — const on objects
`const` locks the **binding**, not the **contents**:
```javascript
const stock = { symbol: "AAPL", price: 150 };
stock.price = 200;   // ✅ works — modifying contents
stock = {};          // ❌ crashes — reassigning the variable
```

C++ equivalent:
```cpp
Stock* const stock = new Stock("AAPL", 150);
stock->price = 200;  // ✅ fine
stock = new Stock(); // ❌ can't reassign the pointer
```

### ✏️ Exercise
Which line throws an error?
```javascript
const price = 150;
price = 200;        // line A

let name = "AAPL";
name = "MSFT";      // line B
```
<details>
<summary>Answer</summary>

**Line A** — `const` cannot be reassigned. Line B is fine because `let` allows reassignment.
</details>

---

## 3. async / await

JavaScript is asynchronous by nature. `async`/`await` makes it readable.

```javascript
async function getPrice(symbol) {
    const response = await fetch(`/api/price/${symbol}`);
    const data = await response.json();
    return data.price;
}
```

- `async` — marks a function as asynchronous
- `await` — pauses **inside the async function** until the result is ready
- The **caller keeps running** while the function is paused

### Execution order example
```javascript
async function main() {
    console.log("A");
    const result = await fetch("/api/price");
    console.log("B");
}

console.log("C");
main();
console.log("D");

// Output: C → A → D → B
```

Why? `await` pauses `main()` but doesn't block the outer code. `D` prints while `main()` waits for the fetch.

### C++ analogy
```cpp
int main() {
    cout << "C";
    auto future = std::async([]() {
        cout << "A";
        // waiting for network...
        cout << "B";
    });
    cout << "D";    // runs while async waits
    future.get();
}
// Output: C A D B
```

### ✏️ Exercise
What order do these print?
```javascript
async function load() {
    console.log("1");
    await fetchData();
    console.log("2");
}
console.log("3");
load();
console.log("4");
```
<details>
<summary>Answer</summary>

`3 → 1 → 4 → 2`

- `"3"` — runs first, synchronous
- `load()` starts → `"1"` prints immediately
- `await fetchData()` — pauses `load()`
- `"4"` — outer code continues while `load()` is paused
- `"2"` — `load()` resumes after fetch completes
</details>

---

## 4. fetch — Making API Calls

`fetch` is built into JavaScript for HTTP requests:

```javascript
const response = await fetch("https://api.example.com/price/AAPL");
const data = await response.json();
console.log(data);
```

Two `await`s:
1. First — waits for HTTP response headers
2. Second — waits for body to be parsed as JSON

### Checking for errors
```javascript
const response = await fetch("/api/price/AAPL");
if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
}
const data = await response.json();
```

`response.ok` is `true` for status 200–299, `false` for 404, 500 etc.

### Error handling with try/catch
```javascript
// JavaScript
try {
    const data = await fetchPrice("AAPL");
} catch (error) {
    console.error(error.message);
}
```

```cpp
// C++ equivalent
try {
    auto data = fetchPrice("AAPL");
} catch (const std::exception& e) {
    std::cerr << e.what();
}
```

### ✏️ Exercise
Fill in the blanks:
```javascript
async function getStock() {
    const response = await _____________________;
    const data = await _____________________;
    return data;
}
```
<details>
<summary>Answer</summary>

```javascript
async function getStock() {
    const response = await fetch('/api/stock/MSFT');
    const data = await response.json();
    return data;
}
```
</details>

---

## 5. Objects & Destructuring

### Objects
```javascript
const stock = {
    symbol: "AAPL",
    price: 189.5,
    change: 1.2
};

console.log(stock.symbol); // "AAPL"
```

C++ equivalent:
```cpp
struct Stock { string symbol; double price; double change; };
Stock stock = { "AAPL", 189.5, 1.2 };
```

### Destructuring — unpack in one line
```javascript
// Without destructuring
const symbol = stock.symbol;
const price = stock.price;

// With destructuring
const { symbol, price } = stock;
```

Picks fields **by name** — you get exactly what you ask for.

### Array destructuring
```javascript
const colors = ["red", "green", "blue"];
const [first, second] = colors;
// first = "red", second = "green"
```

### ✏️ Exercise
What does this print?
```javascript
const quote = { symbol: "TSLA", price: 242.0, change: -3.5 };
const { price, change } = quote;
console.log(price + change);
```
<details>
<summary>Answer</summary>

`238.5` — `242.0 + (-3.5) = 238.5`
</details>

---

## 6. Template Literals

```cpp
// C++
auto url = fmt::format("/api/stock/{}?range={}", symbol, range);
```

```javascript
// JavaScript — use backticks and ${}
const url = `/api/stock/${symbol}?range=${range}`;
```

Any expression works inside `${}`:
```javascript
const msg = `Price is ${isPositive ? "up" : "down"} by ${Math.abs(change)}%`;
```

### ✏️ Exercise
Write a template literal that produces `"Fetching price for AAPL with interval 1d"`:
```javascript
const symbol = "AAPL";
const interval = "1d";
const msg = ____________________;
```
<details>
<summary>Answer</summary>

```javascript
const msg = `Fetching price for ${symbol} with interval ${interval}`;
```
</details>

---

## 7. Spread Operator

Copies and extends arrays or objects without mutating the original.

### Arrays
```javascript
const a = [1, 2, 3];
const b = [...a, 4];  // [1, 2, 3, 4] — a is unchanged
```

### Objects
```javascript
const stock = { symbol: "AAPL", price: 150 };
const updated = { ...stock, price: 200 };
// { symbol: "AAPL", price: 200 }
```

Later spread wins on conflicts.

### ✏️ Exercise
What is `result`?
```javascript
const defaults = { interval: "1d", range: "1d", market: "US" };
const custom = { range: "5d", market: "UK" };
const result = { ...defaults, ...custom };
```
<details>
<summary>Answer</summary>

`{ interval: "1d", range: "5d", market: "UK" }`

`...defaults` laid everything down, then `...custom` overwrote the conflicts.
</details>

---

## 8. Optional Chaining & Nullish Coalescing

### Optional chaining `?.`
Safely access nested properties without crashing on null:

```javascript
// Without optional chaining — verbose
if (stock && stock.quote && stock.quote.price) {
    const price = stock.quote.price;
}

// With optional chaining — clean
const price = stock?.quote?.price;
// If anything is null/undefined → returns undefined, no crash
```

### Nullish coalescing `??`
Provide a default when value is `null` or `undefined`:

```javascript
const price = quote?.regularMarketPrice ?? 0;
// if price is undefined → use 0
```

C++ equivalent:
```cpp
double price = quote ? quote->regularMarketPrice : 0.0;
```

### ✏️ Exercise
What does this print?
```javascript
const stock = { symbol: "AAPL", quote: null };
const price = stock?.quote?.price ?? "No price";
console.log(price);
```
<details>
<summary>Answer</summary>

`"No price"` — `stock?.quote` is `null`, so `?.price` short-circuits to `undefined`, then `?? "No price"` kicks in.
</details>

---

## 9. Promise.allSettled

Fetches multiple things **in parallel** — like C++ async threads:

```javascript
// Sequential — slow (waits for each one)
await fetchA();  // 300ms
await fetchB();  // 300ms
await fetchC();  // 300ms
// Total: 900ms

// Parallel — fast (all run at once)
await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
// Total: ~300ms
```

Each result is either:
```javascript
{ status: "fulfilled", value: data }  // success
{ status: "rejected",  reason: error } // failed
```

`allSettled` never throws — it waits for all regardless of failures.

### C++ analogy
```cpp
auto a = std::async(fetchA);
auto b = std::async(fetchB);
auto c = std::async(fetchC);
a.get(); b.get(); c.get();  // wait for all
```

---

# TypeScript

TypeScript is JavaScript with types. Coming from C++, you'll feel right at home.

## 1. Basic Types

```cpp
// C++
int age = 25;
double price = 189.5;
std::string symbol = "AAPL";
bool isOpen = true;
```

```typescript
// TypeScript
let age: number = 25;        // no int/float/double — just number
let price: number = 189.5;
let symbol: string = "AAPL";
let isOpen: boolean = true;
```

### Type inference — like `auto` in C++
```typescript
const price = 189.5;  // TS infers: number
const symbol = "AAPL"; // TS infers: string
```

### Arrays
```typescript
const symbols: string[] = ["AAPL", "MSFT"];
// equivalent to std::vector<std::string>
```

### ✏️ Exercise
What's wrong with this code?
```typescript
const price: number = "189.5";
const symbols: string[] = ["AAPL", 42, "TSLA"];
```
<details>
<summary>Answer</summary>

Two errors:
1. `"189.5"` is a string being assigned to a `number` type
2. `42` is a number inside a `string[]` array

TypeScript catches both at compile time — before the code runs.
</details>

---

## 2. Interfaces

```cpp
// C++
struct StockQuote {
    std::string symbol;
    double regularMarketPrice;
    double regularMarketChangePercent;
};
```

```typescript
// TypeScript
interface StockQuote {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
}
```

### Optional fields with `?`
Like `std::optional<T>` in C++17:
```typescript
interface WatchlistItem {
    symbol: string;
    companyName: string;
    targetPrice?: number;   // may or may not exist
    alertFired?: boolean;
}
```

### ✏️ Exercise
Write a TypeScript interface for:
```cpp
struct Alert {
    std::string symbol;
    double targetPrice;
    double currentPrice;
    bool triggered;
    std::string message;  // optional
};
```
<details>
<summary>Answer</summary>

```typescript
interface Alert {
    symbol: string;
    targetPrice: number;
    currentPrice: number;
    triggered: boolean;
    message?: string;
}
```
</details>

---

## 3. Functions with Types

```cpp
// C++
double calculateChange(double current, double previous) {
    return ((current - previous) / previous) * 100;
}
```

```typescript
// TypeScript — types after parameter names, return type after ()
function calculateChange(current: number, previous: number): number {
    return ((current - previous) / previous) * 100;
}
```

### Arrow function with types
```typescript
const calculateChange = (current: number, previous: number): number =>
    ((current - previous) / previous) * 100;
```

### ✏️ Exercise
Fill in the parameter and return types:
```typescript
function formatPrice(______): ______ {
    return `$${price.toFixed(2)}`;
}
```
<details>
<summary>Answer</summary>

```typescript
function formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
}
```

The function takes a `number` and returns a `string` like `"$189.50"`.
</details>

---

## 4. Union Types

A variable that can be one of several specific values:

```typescript
type Direction = "up" | "down" | "flat";
let status: "loading" | "success" | "error";

// Also works with types:
let id: string | number;
id = "AAPL";   // ✅
id = 42;       // ✅
id = true;     // ❌ not in the union
```

TypeScript will flag comparisons against values not in the union — catching logic bugs at compile time.

---

## 5. Generics

Like C++ templates:

```cpp
// C++
template<typename T>
T getFirst(std::vector<T> items) { return items[0]; }
```

```typescript
// TypeScript
function getFirst<T>(items: T[]): T {
    return items[0];
}

getFirst(["AAPL", "MSFT"]);  // T inferred as string → returns string
getFirst([1, 2, 3]);          // T inferred as number → returns number
```

### Map with generics
```typescript
const quotes = new Map<string, StockQuote>();
// like std::unordered_map<string, StockQuote>
```

---

# React

## The One Big Idea

> You describe what the UI **should look like**. React handles **updating it**.

In plain HTML you manually update the DOM when data changes. React automates this — when your data changes, the UI updates automatically.

---

## 1. Components

A component is a **function that returns JSX** (HTML-like syntax):

```tsx
function StockBadge() {
    return <div>AAPL — $189.50</div>;
}
```

### Two rules:
1. Name must start with a **capital letter**
2. Must return **one root element**

```tsx
// ❌ lowercase — React thinks it's an HTML tag
function stockBadge() { ... }

// ❌ two root elements
function StockBadge() {
    return <div>AAPL</div><div>$189</div>;
}

// ✅ correct — wrap in one parent
function StockBadge() {
    return (
        <div>
            <div>AAPL</div>
            <div>$189</div>
        </div>
    );
}
```

### ✏️ Exercise
Which is valid?
```tsx
// A
function showPrice() { return <div>$189</div>; }

// B
function ShowPrice() { return <div>$189</div>; }

// C
function ShowPrice() { return <div>$189</div><div>AAPL</div>; }
```
<details>
<summary>Answer</summary>

**B only.**
- A: lowercase name ❌
- C: two root elements ❌
</details>

---

## 2. Props

Pass data into components — like function arguments:

```tsx
function StockBadge({ symbol, price }: { symbol: string; price: number }) {
    return <div>{symbol} — ${price}</div>;
}

// Usage
<StockBadge symbol="AAPL" price={189} />
<StockBadge symbol="MSFT" price={420} />
```

### Why `{ symbol, price }: { symbol: string; price: number }`?

React passes props as **one object**. The syntax destructures it immediately:
```tsx
// These are equivalent:
function StockBadge(props: { symbol: string; price: number }) {
    return <div>{props.symbol} — ${props.price}</div>;
}

function StockBadge({ symbol, price }: { symbol: string; price: number }) {
    return <div>{symbol} — ${price}</div>;  // cleaner
}
```

### ✏️ Exercise
What renders?
```tsx
function Alert({ message, count }: { message: string; count: number }) {
    return <p>{message} ({count} times)</p>;
}

<Alert message="Price reached target" count={3} />
```
<details>
<summary>Answer</summary>

`Price reached target (3 times)`
</details>

---

## 3. useState

Remembers values that change. When state updates, React re-renders the component.

```tsx
function ShowPrice() {
    const [price, setPrice] = useState(189);
    //     ^^^^^  ^^^^^^^^   ^^^^^^^^^
    //     value  setter     initial value

    return (
        <div>
            <p>Price: ${price}</p>
            <button onClick={() => setPrice(200)}>Update</button>
        </div>
    );
}
```

### The golden rule
```tsx
price = 200;       // ❌ React doesn't know — screen won't update
setPrice(200);     // ✅ React re-renders — screen updates
```

### ✏️ Exercise
User clicks the button 4 times. What shows on screen?
```tsx
function Counter() {
    const [count, setCount] = useState(10);
    return (
        <button onClick={() => setCount(count + 5)}>
            Count: {count}
        </button>
    );
}
```
<details>
<summary>Answer</summary>

`Count: 30`

`10 → 15 → 20 → 25 → 30` after 4 clicks.
</details>

---

## 4. useEffect

Runs code automatically when something changes — like a constructor + event listener combined.

```tsx
function StockPrice({ symbol }: { symbol: string }) {
    const [price, setPrice] = useState(0);

    useEffect(() => {
        fetchPrice(symbol).then(setPrice);
    }, [symbol]);  // ← dependency array

    return <div>{symbol}: ${price}</div>;
}
```

### The dependency array controls when it runs:
```tsx
useEffect(() => { ... }, []);        // once — on first load
useEffect(() => { ... }, [symbol]);  // on load + when symbol changes
useEffect(() => { ... }, [a, b]);    // on load + when a OR b changes
```

### Cleanup — like a destructor
```tsx
useEffect(() => {
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);  // runs on unmount
}, []);
```

### C++ analogy
```cpp
StockPrice() { startPolling(); }   // constructor = [] useEffect
~StockPrice() { stopPolling(); }   // destructor = cleanup return
```

### ✏️ Exercise
When does `fetchPrice` get called?
```tsx
const [symbol, setSymbol] = useState("AAPL");

useEffect(() => {
    fetchPrice(symbol).then(setPrice);
}, [symbol]);
```

**Scenario 1:** App loads → runs?
**Scenario 2:** Symbol changes to "MSFT" → runs?
**Scenario 3:** `setSymbol("MSFT")` called when already "MSFT" → runs?
<details>
<summary>Answer</summary>

1. **Yes** — always runs on first load
2. **Yes** — dependency changed
3. **No** — no change, React skips it
</details>

---

## 5. Rendering Lists

Use `.map()` to render one component per item:

```tsx
const stocks = ["AAPL", "MSFT", "TSLA"];

return (
    <div>
        {stocks.map((symbol) => (
            <div key={symbol}>{symbol}</div>
        ))}
    </div>
);
```

### The `key` prop — required
React needs `key` to track items when the list changes:
```tsx
<div key={symbol}>{symbol}</div>
//   ^^^^^^^^^^^^ must be unique — like a primary key
```

### ✏️ Exercise
Write JSX to render `"AAPL: $189"`, `"MSFT: $420"` from:
```tsx
const watchlist = [
    { symbol: "AAPL", price: 189 },
    { symbol: "MSFT", price: 420 },
];
```
<details>
<summary>Answer</summary>

```tsx
<div>
    {watchlist.map((stock) => (
        <div key={stock.symbol}>
            {stock.symbol}: ${stock.price}
        </div>
    ))}
</div>
```
</details>

---

## 6. Conditional Rendering

### Pattern 1: `&&` — show or nothing
```tsx
{isLoading && <p>Loading...</p>}
// true → shows element
// false → shows nothing
```

### Pattern 2: Ternary — one or the other
```tsx
{isPositive ? <span>↑ Up</span> : <span>↓ Down</span>}
```

### Pattern 3: Early return
```tsx
function StockTile({ quote }) {
    if (!quote) return <div>No data</div>;
    return <div>${quote.price}</div>;
}
```

### ✏️ Exercise
What renders when `isLoading=true`, `price=189`?
```tsx
function PriceDisplay({ isLoading, price }: { isLoading: boolean; price: number }) {
    return (
        <div>
            {isLoading ? <p>Loading...</p> : <p>${price}</p>}
            {isLoading && <span>Please wait</span>}
        </div>
    );
}
```
<details>
<summary>Answer</summary>

```
Loading...
Please wait
```

When `isLoading=false, price=189`:
```
$189
```
(the `&&` shows nothing when false)
</details>

---

# Tooling

## 1. npm

Package manager for JavaScript — like `vcpkg` or `apt` for C++.

### Key commands
```bash
npm install           # install all dependencies (run after cloning)
npm install react     # add a new package
npm uninstall react   # remove a package
npm run dev           # start dev server
npm run build         # build for production
```

### `package.json` — project manifest
Like `CMakeLists.txt`:
```json
{
  "name": "stock-tracker",
  "dependencies": {
    "react": "^19.2.4",
    "@dnd-kit/core": "^6.3.1"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

### `node_modules/` — never commit this
Downloaded packages live here. Always in `.gitignore` — like a `build/` folder.

### ✏️ Exercise
Your teammate clones the repo. `node_modules/` is missing. What do they run first?
<details>
<summary>Answer</summary>

```bash
npm install
```

This reads `package.json` and downloads all dependencies. Then they can run `npm run dev`.
</details>

---

## 2. Vite

Dev server and bundler for modern web apps.

### Two modes
```bash
npm run dev      # development — hot reload, instant feedback
npm run build    # production — optimized bundle in dist/
```

### `vite.config.ts` — app configuration
The proxy config is critical for Inwealthment — it forwards API calls to Yahoo Finance to avoid CORS issues:
```typescript
export default defineConfig({
    server: {
        host: true,  // expose on LAN (for phone testing)
        proxy: {
            '/api/yahoo': {
                target: 'https://query1.finance.yahoo.com',
                changeOrigin: true,
                headers: {
                    Referer: 'https://finance.yahoo.com/',
                    Origin: 'https://finance.yahoo.com',
                }
            }
        }
    }
});
```

### ✏️ Exercise
What's the difference between `npm run dev` and `npm run build`?
<details>
<summary>Answer</summary>

- `npm run dev` — starts a local dev server with hot reload at `localhost:5173`. For development only.
- `npm run build` — packages everything into optimized files in `dist/` for deploying to production.
</details>

---

## 3. Git

Version control — save snapshots of your code.

### Core workflow
```bash
git status           # see what changed
git diff             # see line-by-line changes
git add .            # stage all changes
git commit -m "msg"  # save snapshot
git push             # upload to GitHub
```

### The three areas
```
Working directory  →  git add  →  Staging area  →  git commit  →  Repository
(your files)                      (ready to save)                  (history)
```

### Key commands reference
| Command | What it does |
|---|---|
| `git init` | Start a new repo |
| `git status` | Show changed files |
| `git diff` | Show line-by-line changes |
| `git add .` | Stage everything |
| `git commit -m ""` | Save snapshot |
| `git push` | Upload to GitHub |
| `git pull` | Download latest changes |
| `git log --oneline` | See commit history |
| `git checkout -b name` | Create new branch |

### Branching
Work on features without breaking the main code:
```bash
git checkout -b feature/dark-mode  # create + switch
# make changes...
git commit -m "Add dark mode"
git push
# open Pull Request on GitHub
```

### ✏️ Exercise
Put these in the correct order:
```
A. git push
B. git add .
C. git commit -m "Add feature"
D. git status
```
<details>
<summary>Answer</summary>

**D → B → C → A**

1. `git status` — see what changed
2. `git add .` — stage changes
3. `git commit -m "..."` — save snapshot
4. `git push` — upload to GitHub
</details>

---

## 4. Running on Your Phone

By default Vite only listens on `localhost` — only your computer can reach it. One config change exposes it to your whole WiFi network.

### The change — `vite.config.ts`
```typescript
server: {
    host: true,  // ← add this line
    proxy: { ... }
}
```

### What it does

| Without `host: true` | With `host: true` |
|---|---|
| `localhost:5173` — your PC only | `localhost:5173` — your PC |
| | `192.168.x.x:5173` — any device on same WiFi |

### How to use it
1. Start the dev server: `npm run dev`
2. Vite prints two URLs:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.68.124:5173/   ← open this on your phone
```
3. Make sure your phone is on the **same WiFi** as your computer
4. Type the Network URL into your phone's browser

### C++ analogy
```cpp
// Without host: true — localhost only
bind(sock, "127.0.0.1", 5173);

// With host: true — all network interfaces
bind(sock, "0.0.0.0", 5173);
```

---

# Deploying to Production

## What is a Production Build?

During development, Vite runs a local server that serves your files on the fly. For production, you need to **build** your app into optimized static files:

```bash
npm run build
```

This creates a `dist/` folder:
```
dist/
├── index.html          ← entry point
├── assets/
│   ├── index-abc123.js ← all your JS, minified + bundled
│   └── index-abc123.css
└── staticwebapp.config.json
```

These are plain HTML/CSS/JS files — any web server can host them.

> ⚠️ **Important for this app:** The Vite proxy (used for Yahoo Finance API calls) only works in dev. In production you need a real backend to proxy the API. See the Azure section below.

---

## Static Hosting — Vercel, Netlify, GitHub Pages

Best for simple apps with no backend requirements.

### Vercel (Recommended — easiest)
```bash
npm install -g vercel
vercel          # follow prompts, auto-detects Vite
```
Or connect your GitHub repo on [vercel.com](https://vercel.com) — deploys automatically on every `git push`.

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --dir=dist --prod
```
Or drag and drop your `dist/` folder at [netlify.com](https://netlify.com).

### GitHub Pages
```bash
npm install -D gh-pages

# Add to package.json scripts:
"deploy": "vite build && gh-pages -d dist"

npm run deploy
```

> ⚠️ **Limitation:** These platforms host static files only. The Yahoo Finance proxy won't work — you'd need to add a serverless function (Vercel Functions, Netlify Functions) separately.

---

## Self-hosted — Nginx and Apache

If you have your own Linux server or VM.

### Nginx

**1. Build your app:**
```bash
npm run build
```

**2. Copy `dist/` to the server:**
```bash
scp -r dist/* user@yourserver:/var/www/stock-tracker/
```

**3. Nginx config (`/etc/nginx/sites-available/stock-tracker`):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/stock-tracker;
    index index.html;

    # SPA routing — send all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy Yahoo Finance API calls
    location /api/quote {
        proxy_pass https://query1.finance.yahoo.com/v8/finance/chart/;
        proxy_set_header Referer "https://finance.yahoo.com/";
        proxy_set_header Origin "https://finance.yahoo.com";
    }

    location /api/stocksearch {
        proxy_pass https://query2.finance.yahoo.com/v1/finance/search;
        proxy_set_header Referer "https://finance.yahoo.com/";
        proxy_set_header Origin "https://finance.yahoo.com";
    }
}
```

**4. Enable and restart:**
```bash
sudo ln -s /etc/nginx/sites-available/stock-tracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Apache

**Apache config (`.htaccess` in your `dist/` folder):**
```apache
Options -MultiViews
RewriteEngine On

# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

> The `try_files` / `RewriteRule` for SPA routing is critical — without it, refreshing the page on any route other than `/` gives a 404.

---

## Azure — Static Web Apps + Azure Functions

The best option if you have an Azure subscription. Hosts the frontend **and** the API proxy together, both on the free tier.

### Architecture

```
Browser
   ↓
Azure Static Web Apps     ← hosts dist/ (your React app)
   ↓ /api/* routes
Azure Functions           ← proxies Yahoo Finance calls
   ↓
Yahoo Finance API
```

### Why Azure Functions for the API?

The Vite dev proxy only runs locally. In production, the browser can't call Yahoo Finance directly (CORS + Referer blocking). Azure Functions act as a server-side proxy — just like the Vite proxy did in dev.

### Project structure

```
stock-tracker/
├── src/                  ← React app (unchanged)
├── public/
│   └── staticwebapp.config.json  ← SPA routing config
├── api/                  ← Azure Functions
│   ├── host.json         ← Functions runtime config
│   ├── package.json      ← Functions dependencies
│   └── src/functions/
│       ├── quote.js      ← proxies stock price calls
│       └── stocksearch.js ← proxies search calls
└── vite.config.ts        ← dev proxy (unchanged for local dev)
```

### The Azure Functions (v4 model)

**`api/src/functions/quote.js`** — handles `/api/quote?symbol=AAPL`:
```javascript
const { app } = require('@azure/functions');

const YAHOO_HEADERS = {
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
    'User-Agent': 'Mozilla/5.0 ...',
};

app.http('quote', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request) => {
        const symbol = request.query.get('symbol');
        const interval = request.query.get('interval') || '1d';
        const range = request.query.get('range') || '1d';

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
        const upstream = await fetch(url, { headers: YAHOO_HEADERS });
        const body = await upstream.text();

        return {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
            body,  // pass Yahoo's response through unchanged
        };
    },
});
```

**`api/src/functions/stocksearch.js`** — handles `/api/stocksearch?q=apple`:
```javascript
app.http('stocksearch', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request) => {
        const query = request.query.get('q');
        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`;
        const upstream = await fetch(url, { headers: YAHOO_HEADERS });
        const body = await upstream.text();
        return {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
            body,
        };
    },
});
```

### `public/staticwebapp.config.json` — SPA routing

```json
{
  "routes": [
    { "route": "/api/*", "allowedRoles": ["anonymous"] }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "*.css", "*.js", "*.png", "*.svg", "*.ico"]
  }
}
```

This tells Azure: send all page requests to `index.html` (React handles routing), but leave `/api/*` alone for Functions.

### How dev vs production works

| | Development | Production (Azure) |
|---|---|---|
| Frontend | Vite dev server | Azure Static Web Apps |
| API proxy | Vite proxy config | Azure Functions |
| `/api/quote` | Vite rewrites → Yahoo | Azure Function → Yahoo |
| Command | `npm run dev` | `git push` → auto deploy |

### Deploying to Azure

**Option 1: Azure Portal + GitHub (Recommended)**
1. Go to [portal.azure.com](https://portal.azure.com)
2. Create → Static Web App
3. Connect your GitHub repo (`AboMSFT/stock-tracker`)
4. Azure auto-detects Vite, sets build config
5. Every `git push` → automatic deploy ✅

**Option 2: Azure CLI**
```bash
az staticwebapp create \
  --name stock-tracker \
  --resource-group myRG \
  --source https://github.com/AboMSFT/stock-tracker \
  --branch master \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist"
```

### Cost

| Service | Free tier |
|---|---|
| Azure Static Web Apps | ✅ Free (2 apps) |
| Azure Functions (integrated) | ✅ Included free |
| Custom domain + SSL | ✅ Free |
| **Total** | **$0/month** |

---

## Deployment Options Comparison

| Option | Effort | Cost | Backend API | Best for |
|---|---|---|---|---|
| Vercel / Netlify | ⭐ Easiest | Free | Needs serverless fn | Quick demos |
| GitHub Pages | Easy | Free | ❌ No backend | Pure static apps |
| Nginx / Apache | Medium | Server cost | ✅ Full control | Own server |
| **Azure SWA** | Medium | **Free** | ✅ Azure Functions | **This app** |

---

# Quick Reference Tables

## JavaScript
| Concept | Syntax | C++ equivalent |
|---|---|---|
| Arrow function | `(x) => x * 2` | `[](auto x){ return x*2; }` |
| `const` | can't reassign | `const` |
| `let` | can reassign | regular variable |
| `async`/`await` | pause inside fn, caller runs | `std::future` |
| `fetch` | `await fetch(url)` + `await res.json()` | libcurl |
| Destructuring | `const { a, b } = obj` | — |
| Template literal | `` `Hello ${name}` `` | `fmt::format` |
| Spread | `{ ...obj, key: val }` | copy + override |
| Optional chaining | `a?.b?.c` | null pointer chain |
| Nullish coalescing | `val ?? "default"` | ternary null check |
| `Promise.allSettled` | parallel fetches | `std::async` × N |
| `.map()` | transform array | `std::transform` |
| `.filter()` | filter array | `std::copy_if` |

## TypeScript
| Concept | Syntax | C++ equivalent |
|---|---|---|
| Number | `number` | `int`, `double`, `float` |
| String | `string` | `std::string` |
| Boolean | `boolean` | `bool` |
| Array | `string[]` | `std::vector<std::string>` |
| Interface | `interface Foo { x: number }` | `struct Foo { int x; }` |
| Optional field | `name?: string` | `std::optional<string>` |
| Return type | `(): string` | `string func()` |
| Union type | `"a" \| "b"` | enum |
| Generic | `function f<T>(x: T): T` | `template<typename T>` |
| Map | `Map<string, Value>` | `std::unordered_map` |

## React
| Concept | Purpose |
|---|---|
| Component | Function returning JSX — capital name, one root |
| Props | Data passed in — like function arguments |
| `useState` | Remember values — update triggers re-render |
| `useEffect` | Run code on load or when dependencies change |
| `key` prop | Unique ID for list items |
| `&&` | Conditional — show or nothing |
| Ternary `? :` | Conditional — one or the other |

## Tooling
| Tool | Command | Purpose |
|---|---|---|
| npm | `npm install` | Download dependencies |
| npm | `npm run dev` | Start dev server |
| npm | `npm run build` | Build for production |
| Vite | config | Proxy, host, build settings |
| Git | `add → commit → push` | Save and upload changes |

---

# Section 7: Monorepos & npm Workspaces

## 1. What is a Monorepo?

A **monorepo** is a single Git repository that contains multiple packages or projects. Instead of having three separate repos (`stock-tracker-web`, `stock-tracker-mobile`, `stock-tracker-shared`), everything lives together:

```
stock-tracker/          ← one Git repo
├── packages/
│   ├── web/            ← React PWA
│   ├── mobile/         ← Expo iOS app
│   └── shared/         ← shared hooks + types
```

**Benefits:**
- Share code between packages without publishing to npm
- One `npm install` installs everything
- Atomic commits across packages ("add feature X to web + mobile at once")

### C++ analogy
Like a CMake project with multiple `add_subdirectory()` targets:
```cmake
# CMakeLists.txt (root)
add_subdirectory(lib/shared)   # shared library
add_subdirectory(app/desktop)  # desktop app — links to shared
add_subdirectory(app/mobile)   # mobile app  — links to shared
```

---

## 2. npm Workspaces

**npm workspaces** is npm's built-in monorepo support. You declare it in the root `package.json`:

```json
{
  "name": "stock-tracker",
  "private": true,
  "workspaces": ["packages/*"]
}
```

npm then:
1. Installs all dependencies from all `packages/*/package.json` files
2. Hoists shared dependencies to the root `node_modules/`
3. Creates symlinks for local packages

---

## 3. How Packages Reference Each Other

`packages/web/package.json` declares a dependency on the local shared package:

```json
{
  "dependencies": {
    "@inwealthment/shared": "*"
  }
}
```

npm workspaces resolves `@inwealthment/shared` to `packages/shared/` on disk — no publishing required. You import it like any npm package:

```typescript
// packages/web/src/App.tsx
import { useWatchlist, type WatchlistItem } from '@inwealthment/shared';
```

---

## 4. Running Commands

From the **repo root** — runs across all workspaces:
```bash
npm install --legacy-peer-deps   # install everything
npm run build --workspaces       # build all packages
```

From a **specific package** directory:
```bash
cd packages/web
npx vite --host 0.0.0.0 --port 5173

cd packages/mobile
npx expo start --port 8081
```

Or target a workspace from root with `-w`:
```bash
npm run dev -w packages/web
```

### ✏️ Exercise
You add a new type `PriceAlert` to `packages/shared/src/types.ts`. Which other packages can immediately use it without any publishing step?

<details>
<summary>Answer</summary>

Both `packages/web` and `packages/mobile` — npm workspaces symlinks `@inwealthment/shared` directly to the local directory. Any change is immediately available on the next TypeScript compilation or bundler refresh.
</details>

---

# Section 8: React Native — Primitives vs DOM

## 1. No HTML Elements

In React for the web you write HTML elements:
```jsx
<div className="tile">
  <p>AAPL</p>
  <span>$150.00</span>
</div>
```

In React Native there is no DOM. You use **primitive components** from `react-native`:

```jsx
import { View, Text } from 'react-native';

<View style={styles.tile}>
  <Text style={styles.symbol}>AAPL</Text>
  <Text style={styles.price}>$150.00</Text>
</View>
```

| Web (HTML) | React Native | Notes |
|---|---|---|
| `<div>` | `<View>` | layout container |
| `<p>`, `<span>`, `<h1>` | `<Text>` | all text uses `<Text>` |
| `<img>` | `<Image>` | requires `source` prop |
| `<button>` | `<TouchableOpacity>` | touchable wrapper |
| `<input>` | `<TextInput>` | text input field |
| `<ul>` / `<li>` | `<FlatList>` | virtualized list |
| `<div style="overflow: scroll">` | `<ScrollView>` | scrollable container |

---

## 2. No CSS Files — StyleSheet.create

There are no `.css` files in React Native. Styles are JavaScript objects:

```typescript
import { StyleSheet, View, Text } from 'react-native';

export function StockTile() {
  return (
    <View style={styles.tile}>
      <Text style={styles.symbol}>AAPL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
  },
  symbol: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

Properties are the same as CSS but in **camelCase**: `backgroundColor`, `borderRadius`, `fontSize`. `StyleSheet.create` validates the object at startup and optimises style IDs.

---

## 3. Flexbox Defaults

React Native uses Flexbox for layout — but with a different default:

| Property | Web default | React Native default |
|---|---|---|
| `flexDirection` | `row` | **`column`** |
| `alignItems` | `stretch` | `stretch` |
| `position` | `static` | `relative` |

So in React Native, children stack **vertically** by default. To lay them out horizontally:
```jsx
<View style={{ flexDirection: 'row' }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>
```

---

## 4. TouchableOpacity vs button

```jsx
// Web
<button onClick={() => remove(symbol)}>Remove</button>

// React Native
import { TouchableOpacity } from 'react-native';

<TouchableOpacity onPress={() => remove(symbol)} activeOpacity={0.7}>
  <Text>Remove</Text>
</TouchableOpacity>
```

`activeOpacity` dims the element while pressed (0 = invisible, 1 = no change). For modern React Native you can also use `Pressable` for more control.

---

## 5. Platform-Specific Code

```typescript
import { Platform } from 'react-native';

const statusBarHeight = Platform.OS === 'ios' ? 44 : 24;

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.select({ ios: 44, android: 24, default: 0 }),
  },
});
```

### C++ analogy
Like writing Qt widgets vs HTML — same layout concepts (flexbox ≈ QHBoxLayout/QVBoxLayout), same event concepts (onPress ≈ QPushButton::clicked), but completely different API surface.

### ✏️ Exercise
Convert this web component to React Native:
```jsx
<div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
  <span style={{ color: 'green', fontWeight: 'bold' }}>+2.5%</span>
</div>
```

<details>
<summary>Answer</summary>

```jsx
import { View, Text, StyleSheet } from 'react-native';

<View style={styles.row}>
  <Text style={styles.gain}>+2.5%</Text>
</View>

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  gain: { color: 'green', fontWeight: 'bold' },
});
```

Note: `gap` is supported in React Native 0.71+. For older versions, use `marginRight` instead.
</details>

---

# Section 9: Expo & Metro

## 1. What is Expo?

**Expo** is a toolchain and SDK built on top of React Native. It provides:
- Pre-built native modules (camera, notifications, filesystem, etc.)
- A managed build service (EAS Build) — optional
- A development client with fast refresh
- File-based routing via **Expo Router**

Think of Expo as "Create React App for React Native" — it handles the native build configuration so you don't have to write Swift or Kotlin.

This app uses **Expo SDK 53** in a "bare workflow" — meaning the `ios/` Xcode project is exposed and editable (unlike the managed workflow where Expo owns it).

---

## 2. Expo Router

**Expo Router** brings file-based routing to React Native — just like Next.js does for the web.

| File | Route | Equivalent |
|---|---|---|
| `app/index.tsx` | `/` (home screen) | `pages/index.tsx` in Next.js |
| `app/_layout.tsx` | Root layout wrapper | `app/layout.tsx` in Next.js |
| `app/settings.tsx` | `/settings` screen | `pages/settings.tsx` in Next.js |

```typescript
// app/_layout.tsx — wraps every screen
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
```

```typescript
// app/index.tsx — the home screen
export default function HomeScreen() {
  return <WatchlistGrid />;
}
```

---

## 3. Metro Bundler

**Metro** is React Native's equivalent of Vite. It:
- Bundles JavaScript and TypeScript files
- Resolves module imports
- Watches files and sends updates to the device via Fast Refresh

In a monorepo, Metro needs extra configuration to find modules in sibling packages:

```js
// packages/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Don't look up directory tree past packages/mobile for node_modules
// This prevents React from being loaded twice (once from shared, once from mobile)
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

### Metro vs Vite

| Feature | Vite (web) | Metro (mobile) |
|---|---|---|
| Dev server port | 5173 | 8081 |
| Hot reload | Vite HMR | Fast Refresh |
| Bundled output | `dist/` | in-memory (sent to device) |
| Config file | `vite.config.ts` | `metro.config.js` |

---

## 4. Starting the Dev Server

```bash
cd packages/mobile
npx expo start --port 8081
```

This prints a QR code. Options:
- **Expo Go app** (scan QR) — limited to Expo SDK APIs only
- **Development build** — your own native app with Expo dev client; required when using custom native modules (like RNGH)
- **Physical device with Xcode build** — full native build installed directly

---

## 5. Physical Device Testing

After building with Xcode (`Product → Run`), launch the app on a connected device:

```bash
xcrun devicectl device process launch --device 00008140-001A0DD82242801C com.abohoseini.inwealthment
```

The Metro server running on port 8081 serves the JS bundle to the app over your local network.

### ✏️ Exercise
You add a new screen `app/portfolio.tsx`. How does Expo Router make it accessible as a screen in the app?

<details>
<summary>Answer</summary>

Automatically — Expo Router scans the `app/` directory and creates a route for every file. `app/portfolio.tsx` becomes the `/portfolio` route. You navigate to it with `router.push('/portfolio')` from `expo-router`. No route registration required.
</details>

---

# Section 10: React Native Reanimated & Gesture Handler

## 1. Why Not CSS Transitions?

In the browser, CSS transitions run on the compositor thread — separate from JavaScript. In React Native, the default animation API (`Animated`) runs on the JavaScript thread, which also handles all React rendering. If JS is busy (re-rendering, fetching), animations stutter.

**React Native Reanimated** solves this by running animations on the **UI thread** (native, not JS), giving smooth 60/120 fps animations even when JS is busy.

### C++ analogy
| Concept | C++ equivalent |
|---|---|
| JS thread | Game logic thread |
| UI thread | Rendering/compositor thread |
| `useSharedValue` | Thread-safe atomic variable |
| `'worklet'` directive | Function compiled to run on rendering thread |

---

## 2. useSharedValue

Like `useRef` but synced between JS and UI threads:

```typescript
import { useSharedValue } from 'react-native-reanimated';

const offsetX = useSharedValue(0);  // starts at 0
const offsetY = useSharedValue(0);

// Update from JS thread (e.g. on gesture)
offsetX.value = 100;

// Update with animation
import { withSpring } from 'react-native-reanimated';
offsetX.value = withSpring(0);  // spring back to 0
```

---

## 3. useAnimatedStyle

Computes styles **on the UI thread** based on shared values:

```typescript
import { useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: offsetX.value },
    { translateY: offsetY.value },
  ],
}));

// Use Animated.View instead of View
<Animated.View style={[styles.tile, animatedStyle]}>
  ...
</Animated.View>
```

The callback runs on the UI thread every frame — never on JS.

---

## 4. 'worklet' Directive

When a function needs to run on the UI thread (e.g. called from `useAnimatedStyle` or gesture handlers):

```typescript
function clamp(value: number, min: number, max: number): number {
  'worklet';  // ← tells Reanimated to compile this for the UI thread
  return Math.min(Math.max(value, min), max);
}
```

Without `'worklet'`, calling this from `useAnimatedStyle` would crash because the UI thread can't call regular JS functions.

---

## 5. Gesture Handler

**React Native Gesture Handler** (RNGH) replaces React Native's built-in touch system with native gesture recognisers. This is required for:
- Simultaneous gestures (pan + pinch)
- Gestures inside scroll views
- Long-press-then-drag

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const panGesture = Gesture.Pan()
  .activateAfterLongPress(300)          // wait 300 ms before drag starts
  .onUpdate((event) => {
    'worklet';
    offsetX.value = event.translationX;
    offsetY.value = event.translationY;
  })
  .onEnd(() => {
    'worklet';
    offsetX.value = withSpring(0);      // snap back (or recalculate position)
    offsetY.value = withSpring(0);
  });

<GestureDetector gesture={panGesture}>
  <Animated.View style={[styles.tile, animatedStyle]}>
    ...
  </Animated.View>
</GestureDetector>
```

`GestureHandlerRootView` must wrap the entire app (done in `app/_layout.tsx`):
```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <Stack />
</GestureHandlerRootView>
```

---

## 6. The Key Insight: transform vs left/top

When dragging a tile, you have two options:

```typescript
// ❌ Bad — updates left/top
const badStyle = useAnimatedStyle(() => ({
  left: offsetX.value,
  top: offsetY.value,
}));
```

```typescript
// ✅ Good — uses transform
const goodStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: offsetX.value },
    { translateY: offsetY.value },
  ],
}));
```

**Why?** `left`/`top` are **layout properties** — changing them forces Yoga (React Native's layout engine) to recalculate every sibling's size and position on each frame. That's O(N) layout work per frame.

`transform` is a **rendering property** — it's applied after layout, directly on the GPU. Yoga never runs. The tile visually moves while siblings stay exactly where they are.

### ✏️ Exercise
Why does `DraggableGrid` use an always-on height probe instead of measuring tile height after the first render?

<details>
<summary>Answer</summary>

Because the grid needs to know the tile height **before** it can calculate where each tile should be positioned in the grid. If it waited for the first render, there would be a frame where tiles are rendered at position 0 (or incorrectly), causing a visible layout jump. The height probe renders a single invisible tile off-screen, measures it, and stores the height — then the real grid renders at the correct positions from the first frame.
</details>

---

# Section 11: Platform-Agnostic Code Patterns

## 1. The Problem

```typescript
// This works in the browser:
localStorage.setItem('key', 'value');

// This crashes in React Native — localStorage does not exist:
localStorage.setItem('key', 'value');  // ❌ ReferenceError
```

```typescript
// This works in React Native:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('key', 'value');

// This crashes in the browser — AsyncStorage is not available:
import AsyncStorage from '@react-native-async-storage/async-storage';  // ❌
```

If you put platform-specific code in the shared `useWatchlist` hook, it will break on one platform or the other.

---

## 2. Solution: Interface + Dependency Injection

Define an **interface** that both platforms implement:

```typescript
// packages/shared/src/storage.ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
```

Write the hook to accept the adapter as a parameter:

```typescript
// packages/shared/src/hooks/useWatchlist.ts
export function useWatchlist(storage: StorageAdapter) {
  const load = async () => {
    const raw = await storage.getItem('inwealthment-watchlist');
    return raw ? JSON.parse(raw) : [];
  };

  const save = async (items: WatchlistItem[]) => {
    await storage.setItem('inwealthment-watchlist', JSON.stringify(items));
  };

  // ... rest of hook
}
```

Each platform provides its own concrete implementation:

```typescript
// packages/web/src/storage.ts
import type { StorageAdapter } from '@inwealthment/shared';

export const localStorageAdapter: StorageAdapter = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
};
```

```typescript
// packages/mobile/src/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@inwealthment/shared';

export const asyncStorageAdapter: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};
```

Each app passes its adapter in:
```typescript
// Web App.tsx
const { items, addStock } = useWatchlist(localStorageAdapter);

// Mobile index.tsx
const { items, addStock } = useWatchlist(asyncStorageAdapter);
```

---

## 3. C++ Analogy

This is **dependency injection via pure virtual interface**:

```cpp
// Interface (abstract base class)
class StorageAdapter {
public:
    virtual std::optional<std::string> getItem(const std::string& key) = 0;
    virtual void setItem(const std::string& key, const std::string& value) = 0;
    virtual ~StorageAdapter() = default;
};

// Web implementation
class LocalStorageAdapter : public StorageAdapter {
public:
    std::optional<std::string> getItem(const std::string& key) override { ... }
    void setItem(const std::string& key, const std::string& value) override { ... }
};

// Mobile implementation
class AsyncStorageAdapter : public StorageAdapter {
public:
    std::optional<std::string> getItem(const std::string& key) override { ... }
    void setItem(const std::string& key, const std::string& value) override { ... }
};

// Shared hook — works with any implementation
void useWatchlist(StorageAdapter& storage) {
    auto raw = storage.getItem("inwealthment-watchlist");
    ...
}
```

The `useWatchlist` hook is the function that accepts a `StorageAdapter&` — it never knows whether it's talking to a browser or a phone.

---

## 4. When to Use This Pattern

Use the StorageAdapter / dependency injection pattern whenever:
- A feature needs to work on multiple platforms
- The platform APIs differ but the *behaviour* is the same
- You want to test the shared logic with a mock implementation

```typescript
// Easy to test with an in-memory adapter:
const mockAdapter: StorageAdapter = {
  getItem: async (key) => memStore[key] ?? null,
  setItem: async (key, value) => { memStore[key] = value; },
};

const { addStock, items } = useWatchlist(mockAdapter);
```

### ✏️ Exercise
You want to add an analytics event every time a stock is added to the watchlist. You want to send to `window.gtag` on web and `Analytics.logEvent` from Expo on mobile. Design the interface.

<details>
<summary>Answer</summary>

```typescript
// packages/shared/src/analytics.ts
export interface AnalyticsAdapter {
  logEvent(name: string, params?: Record<string, unknown>): void;
}
```

```typescript
// packages/web/src/analytics.ts
export const webAnalyticsAdapter: AnalyticsAdapter = {
  logEvent: (name, params) => window.gtag?.('event', name, params),
};
```

```typescript
// packages/mobile/src/analytics.ts
import * as Analytics from 'expo-firebase-analytics';
export const mobileAnalyticsAdapter: AnalyticsAdapter = {
  logEvent: (name, params) => Analytics.logEvent(name, params),
};
```

Pass `AnalyticsAdapter` into `useWatchlist` alongside `StorageAdapter`, or create a separate `useAnalytics` hook.
</details>

---

# Section 12: Authentication & Backend-as-a-Service (Supabase)

## 1. What is a Backend?

Most apps need a **server** to:
- Store data in a database (so it survives a page refresh)
- Verify who a user is (authentication)
- Keep data private (authorisation — each user only sees their own data)

Building this from scratch requires: a server process, a database, a JWT library, session management, password hashing, email sending… that's weeks of work.

**Backend-as-a-Service (BaaS)** gives you all of this via a hosted service. You call a JavaScript library and the server side is already done.

**Supabase** is the BaaS used in this app. It provides:
- Postgres database (real SQL)
- Auth (sign-up, sign-in, JWT sessions)
- REST and realtime API auto-generated from your tables
- Row Level Security (RLS) — SQL-based access control

---

## 2. Authentication Flow

When a user signs in, Supabase issues a **JWT** (JSON Web Token):

```
User → email + password → Supabase Auth
                            └─▶ check password hash in auth.users
                            └─▶ issue JWT { sub: user_id, exp: ... }
                            └─▶ store in localStorage (web) or memory (mobile)

Later, when calling the database:
  request headers: Authorization: Bearer <JWT>
  Supabase verifies the JWT → extracts user_id → enforces RLS policy
```

In C++ terms: the JWT is like a signed ticket. Anyone can read it but only Supabase can forge it (because it's signed with Supabase's secret key). The database checks the ticket on every query.

---

## 3. React Context — Sharing State Without Prop Drilling

When many components need the same data (like "who is the logged-in user?"), passing it as props through every component gets messy:

```typescript
// ❌ Prop drilling — every layer has to pass it through
<App user={user}>
  <Layout user={user}>
    <HomeScreen user={user}>
      <Header user={user} />
```

**React Context** solves this: one component provides the data, any descendant can consume it directly.

```typescript
// 1. Create the context
const AuthContext = createContext<AuthContextValue | null>(null);

// 2. Provide it at the top level (root layout)
export function AuthProvider({ children }) {
  const { user, loading, signOut } = useAuth(mobileAuthAdapter);
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Consume it anywhere in the tree — no props needed
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}

// In any screen:
function HomeScreen() {
  const { user, signOut } = useAuthContext(); // ← no props!
}
```

**Why not call `useAuth` in every screen?**  
`useAuth` calls `supabase.onAuthStateChange` which creates a new subscription. Multiple subscriptions on the same client race each other and produce spurious `SIGNED_OUT` events. Context lets us have exactly one subscription shared everywhere.

---

## 4. Row Level Security (RLS)

RLS is a Postgres feature that adds a filter to **every** query on a table automatically. Even if you write `SELECT * FROM user_storage`, Postgres silently adds `AND user_id = auth.uid()`.

```sql
-- Create the policy
create policy "Users manage their own storage"
  on user_storage for all
  using  (auth.uid() = user_id)   -- applied to SELECT / UPDATE / DELETE
  with check (auth.uid() = user_id); -- applied to INSERT / UPDATE
```

`auth.uid()` is a Postgres function that reads the user ID from the JWT in the request header. Supabase calls it automatically.

| Without RLS | With RLS |
|---|---|
| `SELECT * FROM user_storage` → all rows | `SELECT * FROM user_storage` → only your rows |
| Any user can read/write any row | Users are isolated by the policy |

In C++ terms: RLS is like a firewall rule built into the database itself.

---

## 5. useMemo — Stable Object References

`useMemo` caches a value and only recomputes it when its dependencies change:

```typescript
// Without useMemo — new object on every render
const adapter = createSupabaseStorageAdapter(supabase, user.id); // new object!

// With useMemo — same object until user.id changes
const adapter = useMemo(
  () => createSupabaseStorageAdapter(supabase, user.id),
  [user?.id]  // only recreate when user.id changes
);
```

**Why does this matter?**  
`useWatchlist` has a `useEffect` that depends on the `storage` adapter. If `storage` is a new object every render, the effect fires every render — which means saving `[]` to the database constantly.

In C++ terms: it's like memoizing a factory function so you don't reconstruct an expensive object on every loop iteration.

---

## 6. Async Race Conditions

A common React bug: you start an async operation, state changes before it finishes, and the result arrives stale.

**The watchlist hydration race:**

```
Render 1: userId = ''   → adapter with userId=''  → storageKey = 'watchlist:'
          getItem('watchlist:') → returns null → items=[], hydrated=true

Render 2: userId = 'abc' → NEW adapter → storageKey = 'watchlist:abc'
          useEffect fires (storageKey changed):
            setHydrated(false), setItems([])      ← scheduled, not applied yet
          save effect ALSO fires (storageKey changed):
            sees hydrated=true (STALE from Render 1!) → SAVES [] TO SUPABASE ❌
```

**The fix — `hydratedKeyRef`:**

```typescript
const hydratedKeyRef = useRef<string | null>(null);

// In hydration effect:
hydratedKeyRef.current = null;  // clear immediately
getItem(storageKey).then(() => {
  hydratedKeyRef.current = storageKey;  // set AFTER load
  setHydrated(true);
});

// In save effect:
if (!hydrated || hydratedKeyRef.current !== storageKey) return; // guard
```

The `ref` is synchronous — it updates immediately, unlike `useState`. So the save effect sees the up-to-date ref value even before the next render.

---

## 7. Building & Deploying a Native iOS App

Unlike a website (upload files to a server), a native app must be **compiled**, **signed**, and **installed**:

```
Source code (TypeScript/React Native)
  └─▶ Metro bundler → JavaScript bundle
  └─▶ Xcode compiles native Swift/ObjC + bundles JS
  └─▶ Code signing: Apple verifies the developer identity
  └─▶ xcrun devicectl device install app → copied to device
  └─▶ App runs: loads JS bundle from Metro (dev) or embedded (prod)
```

**Code signing** is Apple's way of ensuring only authorised developers can run code on iPhones. In dev mode, your Mac signs the app with your Apple Developer certificate. The first time you install, you must "Trust" the developer on the device:

> Settings → General → VPN & Device Management → [your cert] → Trust

**Development vs Production build:**
- **Dev (Debug)**: JS bundle is loaded from Metro over your local network → instant JS changes with no rebuild
- **Prod (Release)**: JS bundle is embedded in the app binary → requires full rebuild for any change

### ✏️ Exercise
Why is it safe to store the Supabase `anon` key in the client-side JavaScript, but unsafe to store the `service_role` key?

<details>
<summary>Answer</summary>

The `anon` key only grants access that RLS policies allow — i.e., a user can only read their own data. The `service_role` key **bypasses RLS entirely**, giving full read/write access to all rows. Putting it in client-side code would let any user extract it and access everyone's data.

</details>

---



## JavaScript
| Concept | Syntax | C++ equivalent |
|---|---|---|
| Arrow function | `(x) => x * 2` | `[](auto x){ return x*2; }` |
| `const` | can't reassign | `const` |
| `let` | can reassign | regular variable |
| `async`/`await` | pause inside fn, caller runs | `std::future` |
| `fetch` | `await fetch(url)` + `await res.json()` | libcurl |
| Destructuring | `const { a, b } = obj` | — |
| Template literal | `` `Hello ${name}` `` | `fmt::format` |
| Spread | `{ ...obj, key: val }` | copy + override |
| Optional chaining | `a?.b?.c` | null pointer chain |
| Nullish coalescing | `val ?? "default"` | ternary null check |
| `Promise.allSettled` | parallel fetches | `std::async` × N |
| `.map()` | transform array | `std::transform` |
| `.filter()` | filter array | `std::copy_if` |

## TypeScript
| Concept | Syntax | C++ equivalent |
|---|---|---|
| Number | `number` | `int`, `double`, `float` |
| String | `string` | `std::string` |
| Boolean | `boolean` | `bool` |
| Array | `string[]` | `std::vector<std::string>` |
| Interface | `interface Foo { x: number }` | `struct Foo { int x; }` |
| Optional field | `name?: string` | `std::optional<string>` |
| Return type | `(): string` | `string func()` |
| Union type | `"a" \| "b"` | enum |
| Generic | `function f<T>(x: T): T` | `template<typename T>` |
| Map | `Map<string, Value>` | `std::unordered_map` |

## React
| Concept | Purpose |
|---|---|
| Component | Function returning JSX — capital name, one root |
| Props | Data passed in — like function arguments |
| `useState` | Remember values — update triggers re-render |
| `useEffect` | Run code on load or when dependencies change |
| `key` prop | Unique ID for list items |
| `&&` | Conditional — show or nothing |
| Ternary `? :` | Conditional — one or the other |

## React Native
| Concept | Web equivalent | Notes |
|---|---|---|
| `<View>` | `<div>` | layout container |
| `<Text>` | `<p>`, `<span>`, `<h1>` | all text nodes |
| `<Image>` | `<img>` | requires `source={{ uri }}` |
| `<TouchableOpacity>` | `<button>` | `onPress` not `onClick` |
| `<TextInput>` | `<input>` | `onChangeText` not `onChange` |
| `<ScrollView>` | `overflow: scroll` | full-page scroll |
| `<FlatList>` | `<ul>` | virtualized, use for long lists |
| `StyleSheet.create` | CSS file | camelCase properties |
| `flexDirection: 'column'` | default is `row` in CSS | RN default is column |
| `Platform.OS` | — | `'ios'` \| `'android'` \| `'web'` |
| `useSharedValue` | CSS custom property (runtime) | synced to UI thread |
| `useAnimatedStyle` | CSS transition | runs on UI thread, not JS |
| `'worklet'` | — | compile fn for UI thread |

## Tooling
| Tool | Command | Purpose |
|---|---|---|
| npm | `npm install --legacy-peer-deps` | Download all workspace dependencies |
| npm | `npm run dev` | Start web dev server |
| npm | `npm run build` | Build web for production |
| Vite | config | Proxy, host, build settings |
| Metro | `npx expo start` | Start mobile bundler |
| Expo | `npx expo start --port 8081` | Mobile dev server |
| xcrun | `xcrun devicectl device process launch` | Launch on physical device |
| Git | `add → commit → push` | Save and upload changes |
