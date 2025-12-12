import { createApp } from './app.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory (only in development)
// In production (Render/cloud), env vars are automatically injected
if (process.env.NODE_ENV !== 'production') {
  const envPath = join(__dirname, '../../.env');
  dotenv.config({ path: envPath });
}

const app = createApp();
const PORT = process.env.PORT || 3001;

// Export for serverless (Vercel)
export default app;

// Start server for traditional hosting (Render, Railway, etc.)
// This runs in both development and production on non-serverless platforms
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
  app.listen(PORT, () => {
    console.log(`TVTS API Server running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}
