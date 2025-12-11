import { OHLCV, Quote, TVMessage } from '../models/types.js';

/**
 * DataParser
 *
 * Parses TradingView WebSocket messages and extracts OHLCV and quote data.
 * Handles different message types: timescale_update, du (delta update), qsd (quote data)
 */
export class DataParser {
  /**
   * Parse bar data from timescale_update or du messages
   * @param message - TradingView message
   * @returns Array of OHLCV data
   */
  public parseBarData(message: TVMessage): OHLCV[] {
    const bars: OHLCV[] = [];

    try {
      // Handle timescale_update message
      if (message.m === 'timescale_update') {
        const data = message.p[1];
        if (data) {
          // Data structure: { s1: { s: [{ i: 0, v: [...] }] } }
          // We need to iterate over all series IDs (s1, s2, etc.)
          for (const seriesId in data) {
            const seriesData = data[seriesId];
            if (seriesData && seriesData.s && Array.isArray(seriesData.s)) {
              for (const series of seriesData.s) {
                if (series.v && Array.isArray(series.v)) {
                  // Each bar is an array: [timestamp, open, high, low, close, volume]
                  for (let i = 0; i < series.v.length; i += 6) {
                    const bar: OHLCV = {
                      timestamp: new Date(series.v[i] * 1000),
                      open: series.v[i + 1],
                      high: series.v[i + 2],
                      low: series.v[i + 3],
                      close: series.v[i + 4],
                      volume: series.v[i + 5]
                    };
                    bars.push(bar);
                  }
                }
              }
            }
          }
        }
      }

      // Handle du (delta update) message
      if (message.m === 'du') {
        const data = message.p[1];
        if (data) {
          // Data structure: { s1: { s: [{ i: 9, v: [...] }] } }
          // Same structure as timescale_update
          for (const seriesId in data) {
            const seriesData = data[seriesId];
            if (seriesData && seriesData.s && Array.isArray(seriesData.s)) {
              for (const series of seriesData.s) {
                if (series.v && Array.isArray(series.v)) {
                  for (let i = 0; i < series.v.length; i += 6) {
                    const bar: OHLCV = {
                      timestamp: new Date(series.v[i] * 1000),
                      open: series.v[i + 1],
                      high: series.v[i + 2],
                      low: series.v[i + 3],
                      close: series.v[i + 4],
                      volume: series.v[i + 5]
                    };
                    bars.push(bar);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[DataParser] Error parsing bar data:', error);
    }

    return bars;
  }

  /**
   * Parse quote data from qsd messages
   * @param message - TradingView message
   * @returns Quote data or null
   */
  public parseQuoteData(message: TVMessage): Quote | null {
    try {
      if (message.m === 'qsd') {
        const sessionData = message.p[1];
        if (!sessionData) return null;

        // Extract symbol and values
        const symbol = sessionData.n || '';
        const values = sessionData.v || {};

        // Price priority: lp (last price) > ch (current/close) > bid > ask
        const price = values.lp || values.ch || values.bid || values.ask || 0;

        const quote: Quote = {
          symbol,
          price,
          bid: values.bid,
          ask: values.ask,
          volume: values.volume,
          timestamp: new Date()
        };

        return quote;
      }
    } catch (error) {
      console.error('[DataParser] Error parsing quote data:', error);
    }

    return null;
  }

  /**
   * Check if message contains bar data
   * @param message - TradingView message
   * @returns True if message contains bar data
   */
  public isBarDataMessage(message: TVMessage): boolean {
    return message.m === 'timescale_update' || message.m === 'du';
  }

  /**
   * Check if message contains quote data
   * @param message - TradingView message
   * @returns True if message contains quote data
   */
  public isQuoteDataMessage(message: TVMessage): boolean {
    return message.m === 'qsd';
  }

  /**
   * Check if message is a session completion indicator
   * @param message - TradingView message
   * @returns True if session is complete
   */
  public isSessionComplete(message: TVMessage): boolean {
    return message.m === 'quote_completed' ||
           (typeof message === 'object' && 'session_id' in message);
  }

  /**
   * Extract symbol from message
   * @param message - TradingView message
   * @returns Symbol string or null
   */
  public extractSymbol(message: TVMessage): string | null {
    try {
      if (message.m === 'qsd' && message.p && message.p[1]) {
        return message.p[1].n || null;
      }

      if (message.m === 'symbol_resolved' && message.p && message.p[2]) {
        return message.p[2].symbol || null;
      }
    } catch (error) {
      console.error('[DataParser] Error extracting symbol:', error);
    }

    return null;
  }

  /**
   * Sort OHLCV bars by timestamp
   * @param bars - Array of OHLCV data
   * @returns Sorted array
   */
  public sortBars(bars: OHLCV[]): OHLCV[] {
    return bars.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Remove duplicate bars based on timestamp
   * @param bars - Array of OHLCV data
   * @returns Deduplicated array
   */
  public deduplicateBars(bars: OHLCV[]): OHLCV[] {
    const seen = new Set<number>();
    return bars.filter(bar => {
      const timestamp = bar.timestamp.getTime();
      if (seen.has(timestamp)) {
        return false;
      }
      seen.add(timestamp);
      return true;
    });
  }

  /**
   * Process and clean bar data
   * @param bars - Raw OHLCV data
   * @returns Cleaned and sorted OHLCV data
   */
  public processBars(bars: OHLCV[]): OHLCV[] {
    return this.sortBars(this.deduplicateBars(bars));
  }
}
