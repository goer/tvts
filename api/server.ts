import { createApp } from './app.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory (only in development)
// In production (Vercel), env vars are automatically injected
if (process.env.NODE_ENV !== 'production') {
  const envPath = join(__dirname, '../../.env');
  dotenv.config({ path: envPath });
}

const app = createApp();
const PORT = process.env.PORT || 3001;

// Vercel serverless export
export default app;

// Local development server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`TVTS API Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
