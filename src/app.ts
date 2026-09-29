import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiV1Router from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ApiError } from './utils/apiError.js';
import { globalLimiter } from './middleware/rateLimiter.middleware.js';
import { requestTimeout } from './middleware/timeout.middleware.js';

const app: Application = express();

// Global request timeout (30 seconds)
app.use(requestTimeout(30000));

// Normalize multiple slashes in request URLs (e.g. //auth/login -> /auth/login)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS Setup
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://saromedia.com.np',
  'https://www.saromedia.com.np',
];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production' ||
        origin.endsWith('.vercel.app') ||
        origin === 'https://saromedia.com.np' ||
        origin === 'http://saromedia.com.np' ||
        origin.endsWith('.saromedia.com.np')
      ) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// 3. Request Logging
if (!env.isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Welcome & Health Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Saro Agency Backend CMS & Admin API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      public: [
        'GET  /api/v1/testimonials',
        'GET  /api/v1/portfolio',
        'GET  /api/v1/portfolio/slug/:slug',
        'GET  /api/v1/careers',
        'GET  /api/v1/careers/:id',
        'POST /api/v1/contact',
        'POST /api/v1/careers/:id/apply',
        'GET  /api/v1/client-logos',
        'GET  /api/v1/site-settings',
      ],
      admin: [
        'GET  /api/v1/analytics/summary',
        'POST /api/v1/upload',
        'GET  /api/v1/applications',
        'PATCH/DELETE /api/v1/applications/:id',
        'GET  /api/v1/contacts',
        'PATCH/DELETE /api/v1/contacts/:id',
        'POST/PUT/DELETE /api/v1/portfolio',
        'POST/PUT/DELETE /api/v1/testimonials',
        'POST/PUT/DELETE /api/v1/careers',
        'POST/PUT/DELETE /api/v1/client-logos',
        'PUT  /api/v1/site-settings',
      ],
    },
  });
});

// 6. Mount API v1 Routes with global rate limiter
app.use('/api/v1', globalLimiter, apiV1Router);

// 7. Route Alias Fallback: seamlessly handle requests missing /api/v1 prefix
app.use('/', globalLimiter, apiV1Router);

// 7. Handle Unmatched 404 Routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// 8. Global Error Handler
app.use(errorHandler);

export default app;
