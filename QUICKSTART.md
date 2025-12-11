# TVTS Quick Start Guide

## Installation

```bash
cd tvts
npm install
npm run build
```

## Environment Setup

Create `.env` file:
```bash
TVWS_AUTH_TOKEN=your_tradingview_auth_token
```

## Basic Usage

### 1. Import the Library

```typescript
import { TradingViewClient } from './dist/index.js';
```

### 2. Create Client

```typescript
const client = new TradingViewClient(process.env.TVWS_AUTH_TOKEN);
```

### 3. Fetch Historical Data (Async)

```typescript
// Download 100 bars of 15-minute data
const data = await client.download('IDX:BBCA', '15', 100);
console.log(data);
```

### 4. Stream Real-Time Data (Sync)

```typescript
// Stream 1-minute bars
const handle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
  console.log(`${bar.timestamp}: $${bar.close}`);
});

// Stop after 60 seconds
setTimeout(() => handle.stop(), 60000);
```

## Test Examples

### Run Basic Example

```bash
cd tvts
node --loader ts-node/esm examples/basic-usage.ts
```

Or create a simple test file:

```typescript
// test.ts
import { TradingViewClient } from './dist/index.js';

const client = new TradingViewClient();

// Test async
const data = await client.download('IDX:BBCA', '15', 10);
console.log('Downloaded:', data.length, 'bars');
console.log('Latest:', data[data.length - 1]);

// Test sync
const handle = client.streamQuote('COINBASE:BTCUSD', (quote) => {
  console.log('BTC:', quote.price);
});

setTimeout(() => {
  handle.stop();
  console.log('Stopped');
}, 10000);
```

Run it:
```bash
node test.ts
```

## Common Symbols

Indonesian Stocks:
- `IDX:BBCA` - Bank Central Asia
- `IDX:BBRI` - Bank Rakyat Indonesia
- `IDX:TBLA` - Tunas Baru Lampung
- `IDX:SSIA` - Surya Semesta Internusa

Crypto:
- `COINBASE:BTCUSD` - Bitcoin
- `COINBASE:ETHUSD` - Ethereum
- `BINANCE:BTCUSDT` - Bitcoin (Binance)

## Timeframes

- `'1'` - 1 minute
- `'5'` - 5 minutes
- `'15'` - 15 minutes
- `'60'` - 1 hour
- `'240'` - 4 hours
- `'1D'` - 1 day

## Next.js Integration

### API Route
```typescript
// app/api/stock/route.ts
import { TradingViewClient } from 'tvts';

export async function GET() {
  const client = new TradingViewClient(process.env.TVWS_AUTH_TOKEN);
  const data = await client.download('IDX:BBCA', '15', 100);
  return Response.json(data);
}
```

### React Component
```typescript
'use client';
import { useEffect, useState } from 'react';
import { TradingViewClient, OHLCV } from 'tvts';

export default function LiveChart() {
  const [bars, setBars] = useState<OHLCV[]>([]);

  useEffect(() => {
    const client = new TradingViewClient();
    const handle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
      setBars(prev => [...prev.slice(-100), bar]);
    });

    return () => handle.stop();
  }, []);

  return (
    <div>
      <h1>Live BTC/USD</h1>
      <p>Bars: {bars.length}</p>
      {bars.slice(-5).map((bar, i) => (
        <div key={i}>{bar.timestamp.toLocaleString()}: ${bar.close}</div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### "Cannot find module"
Make sure you built the project:
```bash
npm run build
```

### "TVWS_AUTH_TOKEN not found"
Set environment variable or pass token directly:
```typescript
const client = new TradingViewClient('your_token_here');
```

### "Connection timeout"
Increase timeout:
```typescript
const data = await client.download('IDX:BBCA', '15', 100, 60000); // 60s
```

### Build errors
Check TypeScript version:
```bash
npx tsc --version  # Should be 5.3.0 or higher
```

## Development

Watch mode:
```bash
npm run dev
```

Clean build:
```bash
npm run clean
npm run build
```

## Documentation

- `README.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `examples/` - Usage examples

## Support

For issues and questions, refer to the implementation documentation or check the Python reference implementation in `../tv/`.
