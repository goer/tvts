import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from '../build/routes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Swagger UI
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  // Swagger UI - load swagger.json dynamically
  try {
    const swaggerPath = join(__dirname, '../build/swagger.json');
    const swaggerDocument = JSON.parse(readFileSync(swaggerPath, 'utf8'));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'TVTS API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
    }));

    // Also serve raw swagger.json
    app.get('/swagger.json', (req: Request, res: Response) => {
      res.json(swaggerDocument);
    });
  } catch (error) {
    console.warn('Swagger documentation not available. Run "npm run build:api" first.');
  }

  // TSOA generated routes
  RegisterRoutes(app);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorMiddleware);

  return app;
}
