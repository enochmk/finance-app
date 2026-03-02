import rtracer from 'cls-rtracer';
import dayjs from 'dayjs';
import type { NextFunction, Request, Response } from 'express';

import { getLogger, sanitizeSensitiveInfo } from '../libs/logger';

const logger = getLogger('Request-Logger');

export default async function requestLogger(req: Request, res: Response, next: NextFunction) {
  res.locals.requestId = rtracer.id();
  res.locals.timestamp = dayjs().toISOString();
  res.locals.requestTimestamp = dayjs().toISOString();
  const requestLogDetails = {
    ...res.locals,
    userAgent: req.get('User-Agent') ?? '',
    referrer: req.get('Referrer') ?? '',
    headers: sanitizeSensitiveInfo(req.headers),
    method: req.method,
    url: req.originalUrl,
    data: {
      body: req.body,
      query: req.query,
      params: req.params,
    },
  };
  logger.info('Request received', requestLogDetails);
  return next();
}
