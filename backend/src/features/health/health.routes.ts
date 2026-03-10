import { Router } from 'express';

import prisma from '../../libs/prisma';

const healthRoutes = Router();

healthRoutes.get('/', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'ok',
      service: 'backend',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

export default healthRoutes;
