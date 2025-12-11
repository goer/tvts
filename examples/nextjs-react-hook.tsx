/**
 * Next.js React Hook Example
 *
 * This example shows how to use TVTS in a React component
 * for client-side real-time streaming.
 *
 * File: hooks/useTradingViewStream.ts
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { TradingViewClient, OHLCV, StreamHandle } from 'tvts';

/**
 * React hook for streaming real-time bars
 */
export function useTradingViewStream(symbol: string, interval: string) {
  const [bars, setBars] = useState<OHLCV[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let handle: StreamHandle | null = null;

    const startStream = async () => {
      try {
        const client = new TradingViewClient();

        // Start streaming bars
        handle = client.streamBars(symbol, interval as any, (bar) => {
          setBars(prev => {
            // Keep only last 1000 bars to prevent memory issues
            const updated = [...prev, bar];
            return updated.slice(-1000);
          });

          if (!isConnected) {
            setIsConnected(true);
          }
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    };

    startStream();

    // Cleanup: stop stream on unmount or dependency change
    return () => {
      if (handle) {
        handle.stop();
      }
      setIsConnected(false);
    };
  }, [symbol, interval]);

  return { bars, isConnected, error };
}

/**
 * Example Component using the hook
 *
 * File: app/dashboard/page.tsx
 */
export function TradingDashboard() {
  const [symbol, setSymbol] = useState('COINBASE:BTCUSD');
  const [interval, setInterval] = useState('1');
  const { bars, isConnected, error } = useTradingViewStream(symbol, interval);

  const latestBar = bars[bars.length - 1];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Live Trading Dashboard</h1>

      {/* Controls */}
      <div className="mb-4 space-x-4">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="COINBASE:BTCUSD">BTC/USD</option>
          <option value="COINBASE:ETHUSD">ETH/USD</option>
          <option value="IDX:BBCA">BBCA (IDX)</option>
          <option value="IDX:BBRI">BBRI (IDX)</option>
        </select>

        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="1">1 minute</option>
          <option value="5">5 minutes</option>
          <option value="15">15 minutes</option>
          <option value="60">1 hour</option>
        </select>
      </div>

      {/* Status */}
      <div className="mb-4">
        <span className={`px-3 py-1 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {error && <span className="ml-4 text-red-600">{error}</span>}
      </div>

      {/* Latest Price */}
      {latestBar && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h2 className="text-xl font-semibold mb-2">Latest Bar</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>Time: {latestBar.timestamp.toLocaleString()}</div>
            <div>Close: ${latestBar.close.toFixed(2)}</div>
            <div>Open: ${latestBar.open.toFixed(2)}</div>
            <div>High: ${latestBar.high.toFixed(2)}</div>
            <div>Low: ${latestBar.low.toFixed(2)}</div>
            <div>Volume: {latestBar.volume.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Recent Bars */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Recent Bars ({bars.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Time</th>
                <th className="border px-4 py-2">Open</th>
                <th className="border px-4 py-2">High</th>
                <th className="border px-4 py-2">Low</th>
                <th className="border px-4 py-2">Close</th>
                <th className="border px-4 py-2">Volume</th>
              </tr>
            </thead>
            <tbody>
              {bars.slice(-10).reverse().map((bar, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{bar.timestamp.toLocaleTimeString()}</td>
                  <td className="border px-4 py-2">${bar.open.toFixed(2)}</td>
                  <td className="border px-4 py-2">${bar.high.toFixed(2)}</td>
                  <td className="border px-4 py-2">${bar.low.toFixed(2)}</td>
                  <td className="border px-4 py-2">${bar.close.toFixed(2)}</td>
                  <td className="border px-4 py-2">{bar.volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
