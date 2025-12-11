import { OHLCV, Interval, Quote } from '../models/types.js';
import { WebSocketClient } from '../core/WebSocketClient.js';
import { SessionManager } from '../core/SessionManager.js';
import { MessageProcessor } from '../core/MessageProcessor.js';
import { DataParser } from '../core/DataParser.js';

/**
 * HistoricalService
 *
 * Asynchronous service for fetching historical data.
 * Creates temporary WebSocket connections that auto-disconnect after data is received.
 */
export class HistoricalService {
  private authToken: string;
  private wsUrl: string;
  private defaultTimeout: number;

  constructor(authToken: string, wsUrl: string, defaultTimeout: number = 30000) {
    this.authToken = authToken;
    this.wsUrl = wsUrl;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Download historical OHLCV data
   * @param symbol - Trading symbol (e.g., "IDX:BBCA", "COINBASE:BTCUSD")
   * @param interval - Timeframe interval
   * @param bars - Number of bars to fetch
   * @param timeout - Request timeout in milliseconds
   * @returns Promise resolving to OHLCV array
   */
  public async download(
    symbol: string,
    interval: Interval,
    bars: number,
    timeout: number = this.defaultTimeout
  ): Promise<OHLCV[]> {
    return new Promise((resolve, reject) => {
      const dataContainer: OHLCV[] = [];
      let completionReached = false;

      // Create services
      const ws = new WebSocketClient(this.authToken, this.wsUrl);
      const sessionManager = new SessionManager();
      const messageProcessor = new MessageProcessor();
      const dataParser = new DataParser();

      // Generate session IDs
      const chartSession = sessionManager.generateChartSession();

      // Adjust bars for daily timeframes
      const adjustedBars = messageProcessor.adjustBarsForInterval(interval, bars);

      // Setup timeout
      const timer = setTimeout(() => {
        if (!completionReached) {
          completionReached = true;
          ws.disconnect();

          if (dataContainer.length > 0) {
            // Return partial data with warning
            console.warn(`[HistoricalService] Timeout reached, returning ${dataContainer.length}/${bars} bars`);
            resolve(dataParser.processBars(dataContainer));
          } else {
            reject(new Error(`Timeout: No data received for ${symbol} ${interval}`));
          }
        }
      }, timeout);

      // Handle messages
      const handleMessage = (rawMessage: string) => {
        const messages = messageProcessor.decodeMessage(rawMessage);

        for (const message of messages) {
          if (dataParser.isBarDataMessage(message)) {
            const newBars = dataParser.parseBarData(message);

            if (newBars.length > 0) {
              dataContainer.push(...newBars);

              // Check completion (80% of requested bars)
              if (dataContainer.length >= bars * 0.8 && !completionReached) {
                completionReached = true;
                clearTimeout(timer);
                ws.disconnect();
                resolve(dataParser.processBars(dataContainer));
              }
            }
          }
        }
      };

      // Handle errors
      const handleError = (error: Error) => {
        if (!completionReached) {
          completionReached = true;
          clearTimeout(timer);
          ws.disconnect();
          reject(error);
        }
      };

      // Register callbacks
      ws.onMessage(handleMessage);
      ws.onError(handleError);

      // Connect and subscribe
      ws.connect()
        .then(() => {
          // Create chart session
          ws.send(messageProcessor.createChartSession(chartSession));

          // Resolve symbol
          ws.send(messageProcessor.createResolveSymbol(chartSession, 'symbol_1', symbol));

          // Create series
          ws.send(messageProcessor.createSeries(
            chartSession,
            's1',
            's1',
            'symbol_1',
            interval,
            adjustedBars
          ));
        })
        .catch(handleError);
    });
  }

  /**
   * Get current price for a symbol
   * @param symbol - Trading symbol
   * @param timeout - Request timeout
   * @returns Promise resolving to current price
   */
  public async getPrice(symbol: string, timeout: number = this.defaultTimeout): Promise<number> {
    const quote = await this.getQuote(symbol, timeout);
    return quote.price;
  }

  /**
   * Get current quote for a symbol
   * @param symbol - Trading symbol
   * @param timeout - Request timeout
   * @returns Promise resolving to Quote
   */
  public async getQuote(symbol: string, timeout: number = this.defaultTimeout): Promise<Quote> {
    return new Promise((resolve, reject) => {
      let completionReached = false;

      // Create services
      const ws = new WebSocketClient(this.authToken, this.wsUrl);
      const sessionManager = new SessionManager();
      const messageProcessor = new MessageProcessor();
      const dataParser = new DataParser();

      // Generate session ID
      const quoteSession = sessionManager.generateQuoteSession();

      // Setup timeout
      const timer = setTimeout(() => {
        if (!completionReached) {
          completionReached = true;
          ws.disconnect();
          reject(new Error(`Timeout: No quote data received for ${symbol}`));
        }
      }, timeout);

      // Handle messages
      const handleMessage = (rawMessage: string) => {
        const messages = messageProcessor.decodeMessage(rawMessage);

        for (const message of messages) {
          if (dataParser.isQuoteDataMessage(message)) {
            const quote = dataParser.parseQuoteData(message);

            if (quote && !completionReached) {
              completionReached = true;
              clearTimeout(timer);
              ws.disconnect();
              resolve(quote);
            }
          }
        }
      };

      // Handle errors
      const handleError = (error: Error) => {
        if (!completionReached) {
          completionReached = true;
          clearTimeout(timer);
          ws.disconnect();
          reject(error);
        }
      };

      // Register callbacks
      ws.onMessage(handleMessage);
      ws.onError(handleError);

      // Connect and subscribe
      ws.connect()
        .then(() => {
          // Create quote session
          ws.send(messageProcessor.createQuoteSession(quoteSession));

          // Set fields
          ws.send(messageProcessor.createQuoteSetFields(quoteSession, ['lp', 'volume', 'bid', 'ask']));

          // Add symbol
          ws.send(messageProcessor.createQuoteAddSymbols(quoteSession, [symbol]));
        })
        .catch(handleError);
    });
  }
}
