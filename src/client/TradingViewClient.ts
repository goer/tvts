import { OHLCV, Interval, Quote, StreamHandle, ClientOptions, DataCallback } from '../models/types.js';
import { HistoricalService } from '../services/HistoricalService.js';
import { StreamService } from '../services/StreamService.js';

/**
 * TradingViewClient
 *
 * Main client class providing yfinance-like API for TradingView data.
 * Supports both asynchronous (Promise-based) and synchronous (callback-based) data fetching.
 */
export class TradingViewClient {
  private authToken: string;
  private wsUrl: string;
  private timeout: number;
  private historicalService: HistoricalService;
  private streamService: StreamService;

  /**
   * Create TradingView client
   * @param authToken - TradingView authentication token (optional)
   * @param options - Client configuration options
   */
  constructor(authToken?: string, options?: ClientOptions) {
    // Get auth token from parameter, options, or environment
    this.authToken = authToken ||
                     options?.authToken ||
                     process.env.TVWS_AUTH_TOKEN ||
                     'unauthorized_user_token';

    this.wsUrl = options?.wsUrl || 'wss://data.tradingview.com/socket.io/websocket';
    this.timeout = options?.timeout || 30000;

    // Initialize services
    this.historicalService = new HistoricalService(this.authToken, this.wsUrl, this.timeout);
    this.streamService = new StreamService(this.authToken, this.wsUrl);
  }

  // ============================================================================
  // ASYNCHRONOUS METHODS (Promise-based)
  // ============================================================================

  /**
   * Download historical OHLCV data (async)
   *
   * Usage:
   * ```typescript
   * const data = await client.download('IDX:BBCA', '15', 100);
   * ```
   *
   * @param symbol - Trading symbol (e.g., "IDX:BBCA", "COINBASE:BTCUSD")
   * @param interval - Timeframe interval
   * @param bars - Number of bars to fetch
   * @param timeout - Request timeout in milliseconds (optional)
   * @returns Promise resolving to OHLCV array
   */
  public async download(
    symbol: string,
    interval: Interval,
    bars: number,
    timeout?: number
  ): Promise<OHLCV[]> {
    return this.historicalService.download(symbol, interval, bars, timeout);
  }

  /**
   * Get current price for a symbol (async)
   *
   * Usage:
   * ```typescript
   * const price = await client.getPrice('COINBASE:BTCUSD');
   * ```
   *
   * @param symbol - Trading symbol
   * @param timeout - Request timeout (optional)
   * @returns Promise resolving to current price
   */
  public async getPrice(symbol: string, timeout?: number): Promise<number> {
    return this.historicalService.getPrice(symbol, timeout);
  }

  /**
   * Get current quote for a symbol (async)
   *
   * Usage:
   * ```typescript
   * const quote = await client.getQuote('IDX:BBCA');
   * console.log(quote.price, quote.volume, quote.bid, quote.ask);
   * ```
   *
   * @param symbol - Trading symbol
   * @param timeout - Request timeout (optional)
   * @returns Promise resolving to Quote object
   */
  public async getQuote(symbol: string, timeout?: number): Promise<Quote> {
    return this.historicalService.getQuote(symbol, timeout);
  }

  // ============================================================================
  // SYNCHRONOUS METHODS (Callback-based streaming)
  // ============================================================================

  /**
   * Stream real-time bars (sync callback)
   *
   * Usage:
   * ```typescript
   * const handle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
   *   console.log('New bar:', bar);
   * });
   *
   * // Stop stream later
   * handle.stop();
   * ```
   *
   * @param symbol - Trading symbol
   * @param interval - Timeframe interval
   * @param callback - Callback function called for each new bar
   * @returns StreamHandle for controlling the stream
   */
  public streamBars(
    symbol: string,
    interval: Interval,
    callback: DataCallback<OHLCV>
  ): StreamHandle {
    return this.streamService.streamBars(symbol, interval, callback);
  }

  /**
   * Stream real-time quotes (sync callback)
   *
   * Usage:
   * ```typescript
   * const handle = client.streamQuote('IDX:BBCA', (quote) => {
   *   console.log('Price update:', quote.price);
   * });
   *
   * // Stop stream later
   * handle.stop();
   * ```
   *
   * @param symbol - Trading symbol
   * @param callback - Callback function called for each quote update
   * @returns StreamHandle for controlling the stream
   */
  public streamQuote(
    symbol: string,
    callback: DataCallback<Quote>
  ): StreamHandle {
    return this.streamService.streamQuote(symbol, callback);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Stop a specific stream
   * @param handle - StreamHandle to stop
   */
  public stopStream(handle: StreamHandle): void {
    handle.stop();
  }

  /**
   * Disconnect all active streams
   */
  public disconnect(): void {
    this.streamService.stopAllStreams();
  }

  /**
   * Get count of active streams
   * @returns Number of active streams
   */
  public getActiveStreamCount(): number {
    return this.streamService.getActiveStreamCount();
  }

  /**
   * Get all active stream IDs
   * @returns Array of active stream IDs
   */
  public getActiveStreamIds(): string[] {
    return this.streamService.getActiveStreamIds();
  }
}
