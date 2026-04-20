# Web Development Learning Guide
### JavaScript · TypeScript · React · Tooling

> This guide teaches the web development stack used to build the Stock Tracker app.
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
The proxy config is critical for the stock tracker — it forwards API calls to Yahoo Finance to avoid CORS issues:
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
