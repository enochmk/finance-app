import type { NextFunction, Request, Response } from 'express';
import type { ZodObject } from 'zod';

import { getLogger } from '../libs/logger';

const logger = getLogger('ResourceValidator');

const resourceValidator =
  (schema: ZodObject<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const data = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    try {
      const parsed = await schema.parseAsync(data);
      // Assign coerced values back so downstream handlers receive the correct types
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      return next();
    } catch (err: any) {
      const zodErrors = err?.errors ?? [];

      // Format a simple human-friendly message for terminal inspection
      const pretty = zodErrors
        .map((e: any) => {
          const loc =
            Array.isArray(e.path) && e.path.length
              ? e.path.join('.')
              : '<root>';
          return `- ${loc}: ${e.message}`;
        })
        .join('\n');

      // Log to console for immediate terminal visibility and also use structured logger
      if (pretty) {
        console.error(
          '\n[Validation Error] ' +
            req.method +
            ' ' +
            req.originalUrl +
            '\n' +
            pretty +
            '\n'
        );
      }

      // Build human-readable summary sentence
      const summary = zodErrors.length
        ? `${zodErrors.length} validation error${zodErrors.length > 1 ? 's' : ''} encountered`
        : 'Request validation failed';

      // Respond directly (do not delegate to global error handler)
      const singleLinePretty = (pretty ?? '').replace(/\n/g, ' ');
      const message = `${summary} ${singleLinePretty}`;
      logger.warn(message, {
        request: { method: req.method, url: req.originalUrl },
        data,
        errors: zodErrors,
      });

      return res.status(400).json({
        success: false,
        message,
        errors: zodErrors.map((e: any) => ({
          path: e.path,
          // safe string path representation
          field: Array.isArray(e.path) ? e.path.join('.') : e.path,
          message: e.message,
          code: e.code,
        })),
        pretty: singleLinePretty ?? undefined,
        request: { method: req.method, url: req.originalUrl },
        timestamp: new Date().toISOString(),
      });
    }
  };

export default resourceValidator;
