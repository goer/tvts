import { Controller, Get, Route, Tags, SuccessResponse } from 'tsoa';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
}

@Route('api')
@Tags('Health')
export class HealthController extends Controller {
  /**
   * Health check endpoint
   * @summary Check API health status
   */
  @Get('health')
  @SuccessResponse(200, 'API is healthy')
  public async getHealth(): Promise<HealthResponse> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
