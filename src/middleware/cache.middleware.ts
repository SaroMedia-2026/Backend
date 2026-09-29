import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  expiry: number;
}

const cacheStore = new Map<string, CacheEntry>();

/**
 * Clean up expired entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiry <= now) {
      cacheStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * In-memory response cache for repeated public GET requests.
 * @param ttlSeconds Time-to-live in seconds (default: 60s)
 */
export function cacheResponse(ttlSeconds: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if request has authorization header (authenticated admin)
    if (req.headers.authorization) {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    const cached = cacheStore.get(key);

    if (cached && cached.expiry > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=120`);
      return res.json(cached.data);
    }

    // Override res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data: body,
          expiry: Date.now() + ttlSeconds * 1000,
        });
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=120`);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Clear cache tags when admins create, update, or delete records.
 */
export function clearCache(prefix?: string) {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(prefix)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Middleware that clears matching cache entries when a mutating request finishes successfully.
 */
export function invalidateCache(prefix: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        clearCache(prefix);
      }
    });
    next();
  };
}

