import { TradingViewClient } from '../../src/client/TradingViewClient.js';
import { OHLCV, Quote, Interval, StreamHandle } from '../../src/models/types.js';

// Singleton client instance for reuse across requests
let globalClient: TradingViewClient | null = null;

export class TradingViewService {
  private client: TradingViewClient;

  constructor() {
    // Reuse global client instance in serverless environment
    if (globalClient) {
      this.client = globalClient;
    } else {
      // Client will use TVWS_AUTH_TOKEN from environment
      this.client = new TradingViewClient(undefined, {
        timeout: 10000 // Reduce timeout to 10s for serverless
      });
      globalClient = this.client;
    }
  }

  public async download(
    symbol: string,
    interval: Interval,
    bars: number,
    timeout?: number
  ): Promise<OHLCV[]> {
    try {
      // Use shorter timeout for serverless (max 10s on Vercel)
      const effectiveTimeout = Math.min(timeout || 10000, 8000);
      return await this.client.download(symbol, interval, bars, effectiveTimeout);
    } catch (error) {
      console.error('[TradingViewService] Download error:', error);
      throw new Error(`Failed to download data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getPrice(symbol: string, timeout?: number): Promise<number> {
    try {
      // Use shorter timeout for serverless (max 10s on Vercel)
      const effectiveTimeout = Math.min(timeout || 10000, 8000);
      return await this.client.getPrice(symbol, effectiveTimeout);
    } catch (error) {
      console.error('[TradingViewService] GetPrice error:', error);
      throw new Error(`Failed to get price: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getQuote(symbol: string, timeout?: number): Promise<Quote> {
    try {
      // Use shorter timeout for serverless (max 10s on Vercel)
      const effectiveTimeout = Math.min(timeout || 10000, 8000);
      return await this.client.getQuote(symbol, effectiveTimeout);
    } catch (error) {
      console.error('[TradingViewService] GetQuote error:', error);
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public streamBars(
    symbol: string,
    interval: Interval,
    callback: (data: OHLCV) => void
  ): StreamHandle {
    return this.client.streamBars(symbol, interval, callback);
  }

  public streamQuote(
    symbol: string,
    callback: (data: Quote) => void
  ): StreamHandle {
    return this.client.streamQuote(symbol, callback);
  }

  public disconnect(): void {
    this.client.disconnect();
  }
}
