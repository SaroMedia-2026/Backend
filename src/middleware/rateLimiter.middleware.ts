import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/apiError.js';

/**
 * Global rate limiter: protects general API endpoints from flood/DoS.
 * Limit: 300 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in a few minutes.',
  },
});

/**
 * Strict authentication limiter: prevents credential stuffing & brute-force attacks on login.
 * Limit: 5 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    throw ApiError.tooManyRequests(
      'Too many failed login attempts from this IP. Please wait 15 minutes before trying again.'
    );
  },
});

/**
 * Form submission limiter: prevents spam submissions on public contact & job application endpoints.
 * Limit: 10 submissions per hour per IP.
 */
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    throw ApiError.tooManyRequests(
      'Too many submissions from this IP. Please wait before submitting another inquiry.'
    );
  },
});

/**
 * File upload limiter: prevents storage exhaustion & spending spikes.
 * Limit: 30 uploads per hour per IP.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    throw ApiError.tooManyRequests(
      'Upload quota exceeded for this IP. Please wait before uploading more assets.'
    );
  },
});
