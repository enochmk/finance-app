/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';

/**
 * Input sanitization middleware for search and filter parameters
 */
export default function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // Remove potential SQL injection patterns
        const sanitized = value
          .replace(/[<>'"&]/g, '') // Remove HTML/XML characters
          .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UNION|UPDATE)\b)/gi, '') // Remove SQL keywords
          .trim();

        // Validate length
        if (sanitized.length > 255) {
          throw createHttpError(400, `Query parameter '${key}' is too long (max 255 characters)`);
        }

        req.query[key] = sanitized;
      }
    }
  }

  // Sanitize body for string fields
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Only sanitize search-like fields, preserve passwords and other sensitive fields
          if (
            key.toLowerCase().includes('search') ||
            key.toLowerCase().includes('filter') ||
            key === 'q'
          ) {
            obj[key] = value
              .replace(/[<>'"&]/g, '')
              .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UNION|UPDATE)\b)/gi, '')
              .trim();
          }
        } else if (typeof value === 'object' && value !== null) {
          obj[key] = sanitizeObject(value);
        }
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
  }

  next();
}
