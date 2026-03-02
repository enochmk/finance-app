import type { NextFunction, Request, Response } from 'express';

export default function notFoundMiddleware(req: Request, res: Response, _next: NextFunction) {
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
}
