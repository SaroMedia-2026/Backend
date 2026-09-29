import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';

/**
 * Enforces a maximum execution time on incoming requests.
 * @param timeoutMs Timeout in milliseconds (default: 30,000ms / 30s)
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        next(ApiError.gatewayTimeout('Request timed out. Please try again.'));
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

/**
 * In-memory registry to prevent duplicate form submissions (same IP + payload hash within window).
 */
const recentSubmissions = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60000) {
      recentSubmissions.delete(key);
    }
  }
}, 60000);

export function preventDuplicateSubmission(windowMs: number = 10000) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email || '';
    const content = req.body?.message || req.body?.subject || '';
    const key = `${ip}:${email}:${content.slice(0, 50)}`;

    const lastTime = recentSubmissions.get(key);
    const now = Date.now();

    if (lastTime && now - lastTime < windowMs) {
      throw ApiError.badRequest('Duplicate submission detected. Please wait a moment before submitting again.');
    }

    recentSubmissions.set(key, now);
    next();
  };
}
