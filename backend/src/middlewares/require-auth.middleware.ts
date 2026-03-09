import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';

import prisma from '../libs/prisma';
import env from '../env';

interface AuthPayload {
  sub: string;
  email: string;
}

export default async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw createHttpError(401, 'Authorization token is required');
    }

    const token = authorization.replace('Bearer ', '').trim();
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
      },
    });

    if (!user) {
      throw createHttpError(401, 'Authenticated user no longer exists');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (createHttpError.isHttpError(error)) {
      return next(error);
    }

    return next(createHttpError(401, 'Invalid or expired authorization token'));
  }
}
