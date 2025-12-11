import WebSocket from 'ws';
import { ConnectionState, DataCallback, ErrorCallback } from '../models/types.js';
import { MessageProcessor } from './MessageProcessor.js';

/**
 * WebSocketClient
 *
 * Low-level WebSocket connection manager for TradingView.
 * Handles connection, reconnection, ping/pong, and message routing.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private authToken: string;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private messageProcessor: MessageProcessor;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private messageCallbacks: Set<DataCallback<string>> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private consecutiveEmptyMessages: number = 0;
  private maxConsecutiveEmpty: number = 5;
  private pingIntervalId: NodeJS.Timeout | null = null;

  constructor(
    authToken: string = 'unauthorized_user_token',
    wsUrl: string = 'wss://data.tradingview.com/socket.io/websocket',
    maxReconnectAttempts: number = 5
  ) {
    this.authToken = authToken;
    this.wsUrl = wsUrl;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.messageProcessor = new MessageProcessor();
  }

  /**
   * Connect to TradingView WebSocket
   */
  public async connect(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.connectionState = ConnectionState.CONNECTING;

        this.ws = new WebSocket(this.wsUrl, {
          headers: {
            'Origin': 'https://data.tradingview.com'
          },
          handshakeTimeout: 30000
        });

        this.ws.on('open', () => {
          this.connectionState = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.consecutiveEmptyMessages = 0;

          // Send authentication
          this.sendAuthToken();

          // Start ping monitoring
          this.startPingMonitoring();

          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('error', (error: Error) => {
          console.error('[WebSocketClient] Error:', error.message);
          this.notifyError(error);
        });

        this.ws.on('close', () => {
          this.connectionState = ConnectionState.DISCONNECTED;
          this.stopPingMonitoring();

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          } else {
            this.notifyError(new Error('Max reconnection attempts reached'));
          }
        });

        // Connection timeout
        setTimeout(() => {
          if (this.connectionState !== ConnectionState.CONNECTED) {
            reject(new Error('Connection timeout'));
            this.disconnect();
          }
        }, 30000);

      } catch (error) {
        this.connectionState = ConnectionState.ERROR;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    this.stopPingMonitoring();

    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  /**
   * Reconnect with exponential backoff
   */
  private async reconnect(): Promise<void> {
    this.connectionState = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(`[WebSocketClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.connect();
    } catch (error) {
      console.error('[WebSocketClient] Reconnection failed:', error);
    }
  }

  /**
   * Send authentication token
   */
  private sendAuthToken(): void {
    const authMessage = this.messageProcessor.createAuthMessage(this.authToken);
    this.send(authMessage);
  }

  /**
   * Send raw message to WebSocket
   */
  public send(message: string): void {
    if (this.ws && this.connectionState === ConnectionState.CONNECTED) {
      this.ws.send(message);
    } else {
      console.warn('[WebSocketClient] Cannot send message: not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(rawMessage: string): void {
    // Check for empty messages
    if (!rawMessage || rawMessage.trim().length === 0) {
      this.consecutiveEmptyMessages++;
      console.warn(`[WebSocketClient] Empty message received (${this.consecutiveEmptyMessages}/${this.maxConsecutiveEmpty})`);

      if (this.consecutiveEmptyMessages >= this.maxConsecutiveEmpty) {
        console.error('[WebSocketClient] Too many empty messages, disconnecting');
        this.disconnect();
      }
      return;
    }

    // Reset empty message counter
    this.consecutiveEmptyMessages = 0;

    // Handle ping/pong
    if (this.messageProcessor.isPingPacket(rawMessage)) {
      const pongMessage = this.messageProcessor.createPongMessage(rawMessage);
      if (pongMessage) {
        this.send(pongMessage);
      }
      return;
    }

    // Notify all message callbacks
    this.notifyMessageCallbacks(rawMessage);
  }

  /**
   * Start ping monitoring (keep-alive)
   */
  private startPingMonitoring(): void {
    this.stopPingMonitoring();

    this.pingIntervalId = setInterval(() => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        // TradingView sends pings to us, we just respond
        // This interval is just for timeout detection
      }
    }, 30000);
  }

  /**
   * Stop ping monitoring
   */
  private stopPingMonitoring(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  /**
   * Register message callback
   */
  public onMessage(callback: DataCallback<string>): void {
    this.messageCallbacks.add(callback);
  }

  /**
   * Unregister message callback
   */
  public offMessage(callback: DataCallback<string>): void {
    this.messageCallbacks.delete(callback);
  }

  /**
   * Register error callback
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.add(callback);
  }

  /**
   * Unregister error callback
   */
  public offError(callback: ErrorCallback): void {
    this.errorCallbacks.delete(callback);
  }

  /**
   * Notify all message callbacks
   */
  private notifyMessageCallbacks(message: string): void {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('[WebSocketClient] Error in message callback:', error);
      }
    });
  }

  /**
   * Notify all error callbacks
   */
  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (e) {
        console.error('[WebSocketClient] Error in error callback:', e);
      }
    });
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }
}
