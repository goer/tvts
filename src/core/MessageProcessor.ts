import { TVMessage, SymbolConfig } from '../models/types.js';

/**
 * MessageProcessor
 *
 * Handles encoding and decoding of TradingView WebSocket protocol messages.
 * TradingView uses a custom Socket.IO format: ~m~<LENGTH>~m~<JSON>
 *
 * Example: ~m~34~m~{"m":"set_auth_token","p":["token123"]}
 */
export class MessageProcessor {
  /**
   * Encode a message with TradingView protocol headers
   * @param message - Message string to encode
   * @returns Encoded message with ~m~ headers
   */
  private prependHeader(message: string): string {
    return `~m~${message.length}~m~${message}`;
  }

  /**
   * Construct a TradingView message
   * @param method - Method name
   * @param params - Method parameters
   * @returns JSON string representation
   */
  private constructMessage(method: string, params: any[]): string {
    const message: TVMessage = { m: method, p: params };
    return JSON.stringify(message);
  }

  /**
   * Create an encoded message ready to send
   * @param method - Method name
   * @param params - Method parameters
   * @returns Fully encoded message
   */
  public createMessage(method: string, params: any[]): string {
    const messageJson = this.constructMessage(method, params);
    return this.prependHeader(messageJson);
  }

  /**
   * Create authentication message
   * @param token - Authentication token
   * @returns Encoded auth message
   */
  public createAuthMessage(token: string): string {
    return this.createMessage('set_auth_token', [token]);
  }

  /**
   * Create quote session message
   * @param sessionId - Quote session ID
   * @returns Encoded message
   */
  public createQuoteSession(sessionId: string): string {
    return this.createMessage('quote_create_session', [sessionId]);
  }

  /**
   * Create chart session message
   * @param sessionId - Chart session ID
   * @returns Encoded message
   */
  public createChartSession(sessionId: string): string {
    return this.createMessage('chart_create_session', [sessionId, '']);
  }

  /**
   * Set fields for quote session
   * @param sessionId - Quote session ID
   * @param fields - Fields to subscribe to
   * @returns Encoded message
   */
  public createQuoteSetFields(sessionId: string, fields: string[]): string {
    return this.createMessage('quote_set_fields', [sessionId, ...fields]);
  }

  /**
   * Add symbols to quote session
   * @param sessionId - Quote session ID
   * @param symbols - Symbols to add
   * @returns Encoded message
   */
  public createQuoteAddSymbols(sessionId: string, symbols: string[]): string {
    return this.createMessage('quote_add_symbols', [sessionId, ...symbols]);
  }

  /**
   * Resolve symbol for chart
   * @param sessionId - Chart session ID
   * @param symbolName - Symbol reference name (e.g., "symbol_1")
   * @param symbol - Symbol identifier (e.g., "IDX:BBCA")
   * @param config - Symbol configuration
   * @returns Encoded message
   */
  public createResolveSymbol(
    sessionId: string,
    symbolName: string,
    symbol: string,
    config?: Partial<SymbolConfig>
  ): string {
    const symbolConfig: SymbolConfig = {
      symbol,
      adjustment: config?.adjustment || 'splits',
      session: config?.session || 'extended',
      ...(config?.['currency-id'] && { 'currency-id': config['currency-id'] })
    };

    const symbolJson = `=${JSON.stringify(symbolConfig)}`;
    return this.createMessage('resolve_symbol', [sessionId, symbolName, symbolJson]);
  }

  /**
   * Create series for chart data
   * @param sessionId - Chart session ID
   * @param seriesId - Series ID (e.g., "s1")
   * @param seriesName - Series name (e.g., "s1")
   * @param symbolName - Symbol reference name (e.g., "symbol_1")
   * @param interval - Timeframe interval
   * @param bars - Number of bars to request
   * @returns Encoded message
   */
  public createSeries(
    sessionId: string,
    seriesId: string,
    seriesName: string,
    symbolName: string,
    interval: string,
    bars: number
  ): string {
    return this.createMessage('create_series', [
      sessionId,
      seriesId,
      seriesName,
      symbolName,
      interval,
      bars
    ]);
  }

  /**
   * Extract ping packet from message and create pong response
   * @param message - Received message
   * @returns Pong message or null if not a ping
   */
  public createPongMessage(message: string): string | null {
    const pingMatch = message.match(/~m~\d+~m~(~h~\d+)/);
    if (pingMatch && pingMatch[1]) {
      const pingStr = pingMatch[1];
      return this.prependHeader(pingStr);
    }
    return null;
  }

  /**
   * Decode incoming messages
   * @param rawMessage - Raw message from WebSocket
   * @returns Array of parsed JSON objects
   */
  public decodeMessage(rawMessage: string): any[] {
    const messages: any[] = [];

    // Split by ~m~ delimiter
    const parts = rawMessage.split('~m~');

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Skip empty parts and length indicators
      if (!part || /^\d+$/.test(part)) {
        continue;
      }

      // Skip ping/pong packets
      if (part.startsWith('~h~')) {
        continue;
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(part);
        messages.push(parsed);
      } catch (e) {
        // Not JSON, skip
        continue;
      }
    }

    return messages;
  }

  /**
   * Check if message is a ping packet
   * @param message - Message to check
   * @returns True if ping packet
   */
  public isPingPacket(message: string): boolean {
    return message.includes('~h~');
  }

  /**
   * Adjust bar count for daily timeframes
   * Daily data has gaps (weekends, holidays), so we need to request more bars
   * @param interval - Timeframe interval
   * @param bars - Requested bars
   * @returns Adjusted bar count
   */
  public adjustBarsForInterval(interval: string, bars: number): number {
    const isDailyOrHigher = ['1D', '1W', '1M'].includes(interval);
    return isDailyOrHigher ? bars * 2 : bars;
  }
}
