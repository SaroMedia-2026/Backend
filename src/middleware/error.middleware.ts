import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`[${req.method}] ${req.path} >> Error: ${err.message}`, err.stack);

  // Handle custom ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(env.isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size limit exceeded. Please upload a smaller file.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected file field: ${err.field}`;
    }

    res.status(400).json({
      success: false,
      message,
      code: err.code,
    });
    return;
  }

  // Handle Supabase Postgrest errors
  if (err && typeof err === 'object' && 'code' in err && 'details' in err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Database error occurred',
      details: err.details,
      hint: err.hint,
      code: err.code,
    });
    return;
  }

  // Default fallback 500 error
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: env.isProduction && statusCode === 500 ? 'Internal Server Error' : message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
};
