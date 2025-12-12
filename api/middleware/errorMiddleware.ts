import { Request, Response, NextFunction } from 'express';
import { ValidateError } from 'tsoa';

export interface ApiError extends Error {
  statusCode?: number;
  status?: number;
}

export function errorMiddleware(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  // TSOA validation errors
  if (err instanceof ValidateError) {
    console.warn('Validation Error:', err.fields);
    res.status(400).json({
      error: 'Validation Failed',
      message: 'Invalid request parameters',
      details: err.fields,
    });
    return;
  }

  // Custom status codes
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Error:', {
    statusCode,
    message,
    stack: err.stack,
    path: req.path,
  });

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : message,
    message: statusCode === 500 ? 'An unexpected error occurred' : message,
  });
}
