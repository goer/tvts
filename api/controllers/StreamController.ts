import { Controller, Get, Query, Route, Tags, Security, Response, Request } from 'tsoa';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { TradingViewService } from '../services/TradingViewService.js';
import { Interval, OHLCV, Quote } from '../../src/models/types.js';
import { ErrorResponse } from '../types/responses.js';

@Route('api/stream')
@Tags('Streaming Data')
export class StreamController extends Controller {
  private tvService: TradingViewService;

  constructor() {
    super();
    this.tvService = new TradingViewService();
  }

  /**
   * Stream real-time bars via Server-Sent Events
   * @summary Subscribe to real-time bar updates
   * @param symbol Trading symbol
   * @param interval Timeframe interval
   */
  @Get('bars')
  @Security('api_key')
  @Response<ErrorResponse>(400, 'Invalid request parameters')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async streamBars(
    @Request() req: ExpressRequest,
    @Query() symbol: string,
    @Query() interval: Interval
  ): Promise<void> {
    const res = req.res as ExpressResponse;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', symbol, interval })}\n\n`);

    // Start streaming
    const handle = this.tvService.streamBars(
      symbol,
      interval,
      (bar: OHLCV) => {
        const message = {
          type: 'bar',
          data: bar,
        };
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    );

    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client disconnected from bars stream: ${symbol}`);
      handle.stop();
      res.end();
    });

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  }

  /**
   * Stream real-time quotes via Server-Sent Events
   * @summary Subscribe to real-time quote updates
   * @param symbol Trading symbol
   */
  @Get('quote')
  @Security('api_key')
  @Response<ErrorResponse>(400, 'Invalid request parameters')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async streamQuote(
    @Request() req: ExpressRequest,
    @Query() symbol: string
  ): Promise<void> {
    const res = req.res as ExpressResponse;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ type: 'connected', symbol })}\n\n`);

    const handle = this.tvService.streamQuote(
      symbol,
      (quote: Quote) => {
        const message = {
          type: 'quote',
          data: quote,
        };
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    );

    req.on('close', () => {
      console.log(`Client disconnected from quote stream: ${symbol}`);
      handle.stop();
      res.end();
    });

    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  }
}
