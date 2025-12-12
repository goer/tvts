import { Controller, Get, Route, Tags } from 'tsoa';

interface DebugInfo {
  nodeEnv: string;
  hasApiKey: boolean;
  apiKeyValue: string;
  hasTvwsToken: boolean;
  tvwsTokenPreview: string;
  envVars: string[];
  timestamp: string;
}

@Route('api/debug')
@Tags('Debug')
export class DebugController extends Controller {
  /**
   * Debug endpoint to check environment variables
   * @summary Get environment debug information
   */
  @Get()
  public async getDebug(): Promise<DebugInfo> {
    const apiKey = process.env.API_KEY || '';
    const tvwsToken = process.env.TVWS_AUTH_TOKEN || '';

    return {
      nodeEnv: process.env.NODE_ENV || 'not set',
      hasApiKey: !!process.env.API_KEY,
      apiKeyValue: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET',
      hasTvwsToken: !!process.env.TVWS_AUTH_TOKEN,
      tvwsTokenPreview: tvwsToken ? `${tvwsToken.substring(0, 20)}...` : 'NOT SET',
      envVars: Object.keys(process.env).filter(k => k.includes('API') || k.includes('TVWS') || k.includes('VERCEL')),
      timestamp: new Date().toISOString(),
    };
  }
}
