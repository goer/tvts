import {
  Controller,
  Get,
  Query,
  Route,
  Tags,
  Security,
  SuccessResponse,
  Response,
} from 'tsoa';
import { TradingViewService } from '../services/TradingViewService.js';
import { OHLCV, Quote, Interval } from '../../src/models/types.js';
import { ErrorResponse } from '../types/responses.js';

@Route('api')
@Tags('Historical Data')
export class HistoricalController extends Controller {
  private tvService: TradingViewService;

  constructor() {
    super();
    this.tvService = new TradingViewService();
  }

  /**
   * Download historical OHLCV data
   * @summary Get historical bars for a symbol
   * @param symbol Trading symbol (e.g., "IDX:BBCA", "COINBASE:BTCUSD")
   * @param interval Timeframe interval
   * @param bars Number of bars to fetch
   * @param timeout Request timeout in milliseconds (optional)
   */
  @Get('download')
  @Security('api_key')
  @SuccessResponse(200, 'Successfully retrieved historical data')
  @Response<ErrorResponse>(400, 'Invalid request parameters')
  @Response<ErrorResponse>(401, 'Unauthorized - Invalid API key')
  @Response<ErrorResponse>(500, 'Internal server error')
  public async download(
    @Query() symbol: string,
    @Query() interval: Interval,
    @Query() bars: number,
    @Query() timeout?: number
  ): Promise<OHLCV[]> {
    try {
      return await this.tvService.download(symbol, interval, bars, timeout);
    } catch (error) {
      this.setStatus(500);
      throw new Error(`Failed to download data: ${(error as Error).message}`);
    }
  }

  /**
   * Get current price for a symbol
   * @summary Get real-time price
   * @param symbol Trading symbol
   * @param timeout Request timeout (optional)
   */
  @Get('price')
  @Security('api_key')
  @SuccessResponse(200, 'Successfully retrieved price')
  @Response<ErrorResponse>(400, 'Invalid request parameters')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async getPrice(
    @Query() symbol: string,
    @Query() timeout?: number
  ): Promise<{ symbol: string; price: number; timestamp: string }> {
    try {
      const price = await this.tvService.getPrice(symbol, timeout);
      return {
        symbol,
        price,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.setStatus(500);
      throw new Error(`Failed to get price: ${(error as Error).message}`);
    }
  }

  /**
   * Get current quote for a symbol
   * @summary Get full quote with bid/ask/volume
   * @param symbol Trading symbol
   * @param timeout Request timeout (optional)
   */
  @Get('quote')
  @Security('api_key')
  @SuccessResponse(200, 'Successfully retrieved quote')
  @Response<ErrorResponse>(400, 'Invalid request parameters')
  @Response<ErrorResponse>(401, 'Unauthorized')
  public async getQuote(
    @Query() symbol: string,
    @Query() timeout?: number
  ): Promise<Quote> {
    try {
      return await this.tvService.getQuote(symbol, timeout);
    } catch (error) {
      this.setStatus(500);
      throw new Error(`Failed to get quote: ${(error as Error).message}`);
    }
  }
}
