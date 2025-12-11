/**
 * Next.js API Route Example
 *
 * This example shows how to use TVTS in a Next.js API route
 * for server-side data fetching with async/await.
 *
 * File: app/api/stock-data/route.ts
 */

import { TradingViewClient, OHLCV } from 'tvts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Get query parameters
  const symbol = searchParams.get('symbol') || 'IDX:BBCA';
  const interval = searchParams.get('interval') || '15';
  const bars = parseInt(searchParams.get('bars') || '100');

  try {
    // Create client with auth token from environment
    const client = new TradingViewClient(process.env.TVWS_AUTH_TOKEN);

    // Download historical data (async)
    const data = await client.download(
      symbol,
      interval as any,
      bars,
      30000 // 30 second timeout
    );

    // Return JSON response
    return Response.json({
      success: true,
      symbol,
      interval,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('Error fetching stock data:', error);

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Usage:
 *
 * GET /api/stock-data?symbol=COINBASE:BTCUSD&interval=1&bars=50
 *
 * Response:
 * {
 *   "success": true,
 *   "symbol": "COINBASE:BTCUSD",
 *   "interval": "1",
 *   "count": 50,
 *   "data": [
 *     {
 *       "timestamp": "2025-12-11T12:00:00.000Z",
 *       "open": 43250.5,
 *       "high": 43280.0,
 *       "low": 43240.0,
 *       "close": 43260.5,
 *       "volume": 1000000
 *     },
 *     ...
 *   ]
 * }
 */
