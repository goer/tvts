# TVTS - TypeScript TradingView Library

A **yfinance-like** TypeScript library for fetching TradingView data using WebSocket connections. Supports both **asynchronous** (Promise-based) and **synchronous** (callback-based) data fetching.

## Features

- TypeScript with full type safety
- Asynchronous API for one-time data fetches (async/await)
- Synchronous API for real-time streaming (callbacks)
- Automatic reconnection with exponential backoff
- Next.js 14+ compatible
- Minimal dependencies (only `ws`)
- OOP design with clean architecture

## Installation

```bash
npm install tvts
# or
yarn add tvts
```

## Quick Start

### Asynchronous Usage (Promises)

Perfect for API routes, server-side data fetching, and one-time queries:

```typescript
import { TradingViewClient } from 'tvts';

const client = new TradingViewClient(process.env.TVWS_AUTH_TOKEN);

// Download historical OHLCV data
const data = await client.download('IDX:BBCA', '15', 100);
console.log(data);
// [
//   { timestamp: Date, open: 4500, high: 4520, low: 4490, close: 4510, volume: 1000000 },
//   ...
// ]

// Get current price
const price = await client.getPrice('COINBASE:BTCUSD');
console.log('Current price:', price);

// Get full quote
const quote = await client.getQuote('IDX:BBCA');
console.log(quote.price, quote.volume, quote.bid, quote.ask);
```

### Synchronous Usage (Callbacks)

Perfect for real-time dashboards, live charts, and continuous monitoring:

```typescript
import { TradingViewClient } from 'tvts';

const client = new TradingViewClient(process.env.TVWS_AUTH_TOKEN);

// Stream real-time bars
const handle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
  console.log('New bar:', bar);
});

// Stream real-time quotes
const quoteHandle = client.streamQuote('IDX:BBCA', (quote) => {
  console.log('Price update:', quote.price);
});

// Stop specific stream later
setTimeout(() => handle.stop(), 60000);

// Or disconnect all streams
client.disconnect();
```

## API Reference

### Constructor

```typescript
new TradingViewClient(authToken?: string, options?: ClientOptions)
```

**Parameters:**
- `authToken` (optional): TradingView authentication token
- `options` (optional): Configuration options
  - `authToken`: Alternative way to provide auth token
  - `timeout`: Request timeout in milliseconds (default: 30000)
  - `wsUrl`: WebSocket URL (default: wss://data.tradingview.com/socket.io/websocket)

**Auth Token Priority:**
1. Constructor parameter
2. Options parameter
3. Environment variable `TVWS_AUTH_TOKEN`
4. Unauthorized mode (limited access)

### Asynchronous Methods

#### `download(symbol, interval, bars, timeout?): Promise<OHLCV[]>`

Download historical OHLCV data.

**Parameters:**
- `symbol`: Trading symbol (e.g., "IDX:BBCA", "COINBASE:BTCUSD")
- `interval`: Timeframe - `'1'` | `'5'` | `'15'` | `'30'` | `'60'` | `'240'` | `'1D'` | `'1W'` | `'1M'`
- `bars`: Number of bars to fetch
- `timeout` (optional): Request timeout in milliseconds

**Returns:** Promise resolving to array of OHLCV objects

**Example:**
```typescript
const data = await client.download('IDX:BBCA', '15', 100);
```

#### `getPrice(symbol, timeout?): Promise<number>`

Get current price for a symbol.

**Returns:** Promise resolving to current price

**Example:**
```typescript
const price = await client.getPrice('COINBASE:BTCUSD');
```

#### `getQuote(symbol, timeout?): Promise<Quote>`

Get current quote with price, volume, bid, ask.

**Returns:** Promise resolving to Quote object

**Example:**
```typescript
const quote = await client.getQuote('IDX:BBCA');
console.log(quote.price, quote.volume);
```

### Synchronous Methods

#### `streamBars(symbol, interval, callback): StreamHandle`

Stream real-time bars continuously.

**Parameters:**
- `symbol`: Trading symbol
- `interval`: Timeframe interval
- `callback`: Function called for each new bar

**Returns:** StreamHandle with `stop()` and `isActive()` methods

**Example:**
```typescript
const handle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
  console.log('New bar:', bar);
});

// Stop stream
handle.stop();
```

#### `streamQuote(symbol, callback): StreamHandle`

Stream real-time quotes continuously.

**Parameters:**
- `symbol`: Trading symbol
- `callback`: Function called for each quote update

**Returns:** StreamHandle

**Example:**
```typescript
const handle = client.streamQuote('IDX:BBCA', (quote) => {
  console.log('Price:', quote.price);
});
```

### Utility Methods

#### `stopStream(handle): void`

Stop a specific stream.

#### `disconnect(): void`

Disconnect all active streams.

#### `getActiveStreamCount(): number`

Get number of active streams.

#### `getActiveStreamIds(): string[]`

Get all active stream IDs.

## Symbol Formats

| Market | Format | Example |
|--------|--------|---------|
| Indonesian Stocks | `IDX:SYMBOL` | `IDX:BBCA`, `IDX:BBRI` |
| Crypto (Coinbase) | `COINBASE:PAIR` | `COINBASE:BTCUSD` |
| Crypto (Binance) | `BINANCE:PAIR` | `BINANCE:BTCUSDT` |
| US Stocks | `NASDAQ:SYMBOL` | `NASDAQ:AAPL` |

## TypeScript Types

```typescript
interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Quote {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  timestamp: Date;
}

interface StreamHandle {
  id: string;
  stop(): void;
  isActive(): boolean;
}

type Interval = '1' | '5' | '15' | '30' | '60' | '240' | '1D' | '1W' | '1M';
```

## Next.js Integration

### API Route (Server-Side)

```typescript
// app/api/stock-data/route.ts
import { TradingViewClient } from 'tvts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'IDX:BBCA';
  const interval = searchParams.get('interval') || '15';

  const client = new TradingViewClient(process.env.TVWS_AUTH_TOKEN);
  const data = await client.download(symbol, interval as any, 100);

  return Response.json(data);
}
```

### React Hook (Client-Side)

```typescript
// hooks/useTradingViewStream.ts
'use client';

import { useEffect, useState } from 'react';
import { TradingViewClient, OHLCV } from 'tvts';

export function useTradingViewStream(symbol: string, interval: string) {
  const [data, setData] = useState<OHLCV[]>([]);

  useEffect(() => {
    const client = new TradingViewClient();

    const handle = client.streamBars(symbol, interval as any, (bar) => {
      setData(prev => [...prev, bar]);
    });

    return () => handle.stop();
  }, [symbol, interval]);

  return data;
}
```

### Usage in Component

```typescript
// app/dashboard/page.tsx
'use client';

import { useTradingViewStream } from '@/hooks/useTradingViewStream';

export default function Dashboard() {
  const bars = useTradingViewStream('COINBASE:BTCUSD', '1');

  return (
    <div>
      <h1>BTC/USD Live Chart</h1>
      <p>Latest bars: {bars.length}</p>
      {bars.slice(-10).map((bar, i) => (
        <div key={i}>
          {bar.timestamp.toLocaleString()}: ${bar.close}
        </div>
      ))}
    </div>
  );
}
```

## Environment Setup

Create a `.env.local` file:

```bash
TVWS_AUTH_TOKEN=your_tradingview_auth_token_here
```

To get your auth token, see the TradingView authentication documentation.

## Error Handling

```typescript
try {
  const data = await client.download('IDX:INVALID', '15', 100);
} catch (error) {
  if (error.message.includes('Timeout')) {
    console.error('Request timed out');
  } else {
    console.error('Failed to fetch data:', error);
  }
}
```

## Advanced Usage

### Custom WebSocket URL

```typescript
const client = new TradingViewClient(token, {
  wsUrl: 'wss://prodata.tradingview.com/socket.io/websocket'
});
```

### Custom Timeout

```typescript
const data = await client.download('IDX:BBCA', '15', 100, 60000); // 60 second timeout
```

### Multiple Concurrent Streams

```typescript
const btcHandle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
  console.log('BTC:', bar.close);
});

const ethHandle = client.streamBars('COINBASE:ETHUSD', '1', (bar) => {
  console.log('ETH:', bar.close);
});

// Stop all streams
client.disconnect();
```

## Building

```bash
npm run build
```

## Development

```bash
npm run dev  # Watch mode
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
