/**
 * TVTS - TypeScript TradingView Library
 *
 * A yfinance-like library for fetching TradingView data using WebSocket connections.
 * Supports both asynchronous (Promise-based) and synchronous (callback-based) data fetching.
 *
 * @packageDocumentation
 */

// Main client
export { TradingViewClient } from './client/TradingViewClient.js';

// Type definitions
export type {
  OHLCV,
  Quote,
  Interval,
  StreamHandle,
  ClientOptions,
  TVMessage,
  SymbolConfig,
  DataCallback,
  ErrorCallback
} from './models/types.js';

export { ConnectionState } from './models/types.js';

// Core classes (for advanced usage)
export { WebSocketClient } from './core/WebSocketClient.js';
export { MessageProcessor } from './core/MessageProcessor.js';
export { SessionManager } from './core/SessionManager.js';
export { DataParser } from './core/DataParser.js';

// Services (for advanced usage)
export { HistoricalService } from './services/HistoricalService.js';
export { StreamService } from './services/StreamService.js';
