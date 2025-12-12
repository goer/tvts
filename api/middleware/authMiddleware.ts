import { Request } from 'express';

export function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (securityName === 'api_key') {
      const apiKey =
        request.headers['x-api-key'] as string ||
        request.query.apiKey as string;

      const validApiKey = process.env.API_KEY;

      if (!validApiKey) {
        reject(new Error('API_KEY not configured on server'));
        return;
      }

      if (!apiKey) {
        reject(new Error('No API key provided'));
        return;
      }

      if (apiKey === validApiKey) {
        resolve({ apiKey });
      } else {
        reject(new Error('Invalid API key'));
      }
    } else {
      reject(new Error('Unknown security scheme'));
    }
  });
}
