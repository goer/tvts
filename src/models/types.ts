/**
 * OHLCV (Open, High, Low, Close, Volume) data structure
 */
export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Real-time quote data
 */
export interface Quote {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  timestamp: Date;
}

/**
 * Supported timeframe intervals
 */
export type Interval = '1' | '5' | '15' | '30' | '60' | '240' | '1D' | '1W' | '1M';

/**
 * TradingView WebSocket message structure
 */
export interface TVMessage {
  m: string;  // method name
  p: any[];   // parameters
}

/**
 * Parsed message from DataParser
 */
export interface ParsedMessage {
  type: string;
  data: any;
}

/**
 * Client configuration options
 */
export interface ClientOptions {
  authToken?: string;
  timeout?: number;
  maxReconnectAttempts?: number;
  wsUrl?: string;
}

/**
 * Handle for managing active streams
 */
export interface StreamHandle {
  id: string;
  stop(): void;
  isActive(): boolean;
}

/**
 * Symbol configuration for TradingView
 */
export interface SymbolConfig {
  symbol: string;
  adjustment?: 'splits' | 'dividends';
  session?: 'regular' | 'extended';
  'currency-id'?: string;
}

/**
 * WebSocket connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Callback type for data streaming
 */
export type DataCallback<T> = (data: T) => void;

/**
 * Error callback type
 */
export type ErrorCallback = (error: Error) => void;
