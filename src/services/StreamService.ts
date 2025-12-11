import { OHLCV, Interval, Quote, StreamHandle, DataCallback } from '../models/types.js';
import { WebSocketClient } from '../core/WebSocketClient.js';
import { SessionManager } from '../core/SessionManager.js';
import { MessageProcessor } from '../core/MessageProcessor.js';
import { DataParser } from '../core/DataParser.js';

/**
 * Active Stream Info
 */
interface ActiveStream {
  id: string;
  ws: WebSocketClient;
  sessionManager: SessionManager;
  type: 'bars' | 'quote';
  symbol: string;
}

/**
 * StreamService
 *
 * Synchronous callback-based service for real-time streaming.
 * Maintains persistent WebSocket connections for continuous data updates.
 */
export class StreamService {
  private authToken: string;
  private wsUrl: string;
  private activeStreams: Map<string, ActiveStream> = new Map();
  private streamIdCounter: number = 0;

  constructor(authToken: string, wsUrl: string) {
    this.authToken = authToken;
    this.wsUrl = wsUrl;
  }

  /**
   * Generate unique stream ID
   */
  private generateStreamId(): string {
    return `stream_${Date.now()}_${this.streamIdCounter++}`;
  }

  /**
   * Stream real-time bars
   * @param symbol - Trading symbol
   * @param interval - Timeframe interval
   * @param callback - Callback function for each bar
   * @returns StreamHandle for controlling the stream
   */
  public streamBars(
    symbol: string,
    interval: Interval,
    callback: DataCallback<OHLCV>
  ): StreamHandle {
    const streamId = this.generateStreamId();

    // Create services
    const ws = new WebSocketClient(this.authToken, this.wsUrl);
    const sessionManager = new SessionManager();
    const messageProcessor = new MessageProcessor();
    const dataParser = new DataParser();

    // Generate session ID
    const chartSession = sessionManager.generateChartSession();

    // Handle messages
    const handleMessage = (rawMessage: string) => {
      const messages = messageProcessor.decodeMessage(rawMessage);

      for (const message of messages) {
        if (dataParser.isBarDataMessage(message)) {
          const bars = dataParser.parseBarData(message);

          // Call user callback for each bar
          for (const bar of bars) {
            try {
              callback(bar);
            } catch (error) {
              console.error('[StreamService] Error in user callback:', error);
            }
          }
        }
      }
    };

    // Handle errors
    const handleError = (error: Error) => {
      console.error('[StreamService] Stream error:', error);
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

        // Create series with continuous streaming (large bar count)
        ws.send(messageProcessor.createSeries(
          chartSession,
          's1',
          's1',
          'symbol_1',
          interval,
          1000 // Request enough bars for historical context
        ));
      })
      .catch(handleError);

    // Store active stream
    this.activeStreams.set(streamId, {
      id: streamId,
      ws,
      sessionManager,
      type: 'bars',
      symbol
    });

    // Create stream handle
    const handle: StreamHandle = {
      id: streamId,
      stop: () => this.stopStream(streamId),
      isActive: () => this.isStreamActive(streamId)
    };

    return handle;
  }

  /**
   * Stream real-time quotes
   * @param symbol - Trading symbol
   * @param callback - Callback function for each quote
   * @returns StreamHandle for controlling the stream
   */
  public streamQuote(
    symbol: string,
    callback: DataCallback<Quote>
  ): StreamHandle {
    const streamId = this.generateStreamId();

    // Create services
    const ws = new WebSocketClient(this.authToken, this.wsUrl);
    const sessionManager = new SessionManager();
    const messageProcessor = new MessageProcessor();
    const dataParser = new DataParser();

    // Generate session ID
    const quoteSession = sessionManager.generateQuoteSession();

    // Handle messages
    const handleMessage = (rawMessage: string) => {
      const messages = messageProcessor.decodeMessage(rawMessage);

      for (const message of messages) {
        if (dataParser.isQuoteDataMessage(message)) {
          const quote = dataParser.parseQuoteData(message);

          if (quote) {
            try {
              callback(quote);
            } catch (error) {
              console.error('[StreamService] Error in user callback:', error);
            }
          }
        }
      }
    };

    // Handle errors
    const handleError = (error: Error) => {
      console.error('[StreamService] Stream error:', error);
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

    // Store active stream
    this.activeStreams.set(streamId, {
      id: streamId,
      ws,
      sessionManager,
      type: 'quote',
      symbol
    });

    // Create stream handle
    const handle: StreamHandle = {
      id: streamId,
      stop: () => this.stopStream(streamId),
      isActive: () => this.isStreamActive(streamId)
    };

    return handle;
  }

  /**
   * Stop a specific stream
   * @param streamId - Stream ID to stop
   */
  public stopStream(streamId: string): void {
    const stream = this.activeStreams.get(streamId);

    if (stream) {
      stream.ws.disconnect();
      stream.sessionManager.destroyAllSessions();
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Check if stream is active
   * @param streamId - Stream ID to check
   * @returns True if stream is active
   */
  public isStreamActive(streamId: string): boolean {
    return this.activeStreams.has(streamId);
  }

  /**
   * Stop all active streams
   */
  public stopAllStreams(): void {
    const streamIds = Array.from(this.activeStreams.keys());

    for (const streamId of streamIds) {
      this.stopStream(streamId);
    }
  }

  /**
   * Get count of active streams
   * @returns Number of active streams
   */
  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Get all active stream IDs
   * @returns Array of stream IDs
   */
  public getActiveStreamIds(): string[] {
    return Array.from(this.activeStreams.keys());
  }
}
