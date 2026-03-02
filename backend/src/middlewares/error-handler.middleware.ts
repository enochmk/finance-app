import type { NextFunction, Request } from 'express';
import { HttpError } from 'http-errors';

import { getLogger } from '../libs/logger';

const logger = getLogger('ErrorHandler');

interface IErrorResponse {
  requestTimestamp: string;
  requestID: string;
  message: string;
}

const GENERIC_ERROR = 'An unexpected error occurred';

export default function errorHandler(error: any, req: Request, res: any, _next: NextFunction) {
  let statusCode = 500;
  let message = GENERIC_ERROR;

  const errorLog: any = {
    requestID: res.locals.requestID,
    requestTimestamp: res.locals.timestamp,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
    },
    headers: req.headers,
    endpoint: {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    },
  };

  // ! Handled Error
  if (error instanceof HttpError) {
    statusCode = error.statusCode;
    message = error.message;

    const response: IErrorResponse = {
      requestID: res.locals.requestID,
      requestTimestamp: res.locals.timestamp,
      message,
    };

    errorLog.response = response;
    logger.warn(message, errorLog);
    return res.status(statusCode).json(response);
  }

  const response: IErrorResponse = {
    requestID: res.locals.requestID,
    requestTimestamp: res.locals.timestamp,
    message,
  };

  errorLog.response = response;
  errorLog.error.stack = error.stack;
  logger.error(error.message, errorLog);
  return res.status(statusCode).json(response);
}
