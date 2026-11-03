import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { TradingViewClient } from './client/TradingViewClient.js';
import { Interval, StreamHandle } from './models/types.js';
import { openApiSpec } from './openapi.js';

const app = express();
const port = 7070;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Client
const client = new TradingViewClient();

// Serve OpenAPI Spec
app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiSpec);
});

// Root Route
app.get('/', (_req, res) => {
    res.json({
        message: "TVTS API is running",
        documentation: "/api/openapi.json",
        endpoints: [
            "/api/price/:symbol",
            "/api/quote/:symbol",
            "/api/history/:symbol"
        ]
    });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket Connection Handler
wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    const activeStreams: StreamHandle[] = [];

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'subscribe') {
                if (data.channel === 'quote' && data.symbol) {
                    console.log(`Subscribing to quote: ${data.symbol}`);
                    const handle = client.streamQuote(data.symbol, (quote) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: 'quote',
                                symbol: data.symbol,
                                data: quote
                            }));
                        }
                    });
                    activeStreams.push(handle);
                } else if (data.channel === 'bars' && data.symbol) {
                    console.log(`Subscribing to bars: ${data.symbol}`);
                    const interval = data.interval || '1';
                    const handle = client.streamBars(data.symbol, interval, (bar) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: 'bar',
                                symbol: data.symbol,
                                data: bar
                            }));
                        }
                    });
                    activeStreams.push(handle);
                }
            } else if (data.type === 'unsubscribe') {
                // Implement unsubscribe logic if needed, for now just closing handles on disconnect
            }
        } catch (e) {
            console.error('Error parsing message:', e);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected, cleaning up streams');
        activeStreams.forEach(handle => handle.stop());
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        activeStreams.forEach(handle => handle.stop());
    });
});

// HTTP Routes (Keep existing ones)

/**
 * GET /api/quote/:symbol
 */
app.get('/api/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const quote = await client.getQuote(symbol);
        res.json(quote);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch quote' });
    }
});

/**
 * GET /api/price/:symbol
 */
app.get('/api/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const price = await client.getPrice(symbol);
        res.json({ symbol, price });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch price' });
    }
});

/**
 * GET /api/history/:symbol
 */
// TradingView limits connections per IP (HTTP 429), and each download opens one.
// So: cache recent answers, share identical in-flight requests, cap concurrency,
// and pause after a 429 (serving the last good answer meanwhile).
const MAX_CONCURRENT = 3;
const COOLDOWN_MS = 90_000;
const cache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const waiting: Array<() => void> = [];
let active = 0;
let coolUntil = 0;

const ttlFor = (interval: string) => (/^(D|1D|W|1W|M|1M)$/i.test(interval) ? 10 * 60_000 : 60_000);

async function limited<T>(task: () => Promise<T>): Promise<T> {
    if (active >= MAX_CONCURRENT) await new Promise<void>((resume) => waiting.push(resume));
    active++;
    try {
        return await task();
    } finally {
        active--;
        waiting.shift()?.();
    }
}

async function history(symbol: string, interval: Interval, bars: number) {
    const key = `${symbol}|${interval}|${bars}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttlFor(interval)) return hit.data;
    if (Date.now() < coolUntil) {
        if (hit) return hit.data;
        throw new Error('TradingView rate limit (429); cooling down');
    }
    const pending = inflight.get(key);
    if (pending) return pending;
    const job = limited(() => client.download(symbol, interval, bars))
        .then((data) => {
            cache.set(key, { at: Date.now(), data });
            if (cache.size > 2000) cache.delete(cache.keys().next().value!);
            return data;
        })
        .catch((error: any) => {
            if (/429/.test(String(error?.message))) coolUntil = Date.now() + COOLDOWN_MS;
            if (hit) return hit.data;
            throw error;
        })
        .finally(() => inflight.delete(key));
    inflight.set(key, job);
    return job;
}

app.get('/api/history/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const interval = (req.query.interval as Interval) || '15';
        const bars = parseInt(req.query.bars as string) || 100;
        res.json(await history(symbol, interval, bars));
    } catch (error: any) {
        const message = error.message || 'Failed to fetch history';
        res.status(/429/.test(message) ? 503 : 500).json({ error: message });
    }
});

// Helpful 400 for missing symbol on history
app.get('/api/history', (_req, res) => {
    res.status(400).json({ error: "Missing symbol. Usage: /api/history/:symbol" });
});

// Start Server if run directly
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    server.listen(port, () => {
        console.log(`TVTS API Server running on port ${port}`);
        console.log(`WebSocket Server ready at ws://localhost:${port}`);
    });
}

export default app;
