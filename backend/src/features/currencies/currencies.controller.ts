import type { Request, Response } from 'express';
import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import { getLogger } from '../../libs/logger';

const logger = getLogger('CurrenciesController');

export async function list(_req: Request, res: Response) {
  const currencies = await prisma.currency.findMany({
    orderBy: { name: 'asc' },
  });

  logger.info('Listed currencies', { count: currencies.length });

  res.json({ data: currencies });
}

export async function create(req: Request, res: Response) {
  const { name, shortcode, symbol } = req.body as {
    name: string;
    shortcode: string;
    symbol: string;
  };

  const existing = await prisma.currency.findUnique({
    where: { shortcode: shortcode.toUpperCase() },
  });

  if (existing) {
    throw createHttpError(
      409,
      `Currency with shortcode ${shortcode.toUpperCase()} already exists`
    );
  }

  const currency = await prisma.currency.create({
    data: { name, shortcode: shortcode.toUpperCase(), symbol },
  });

  logger.info('Created currency', { shortcode: currency.shortcode });

  res.status(201).json({ data: currency });
}

export async function update(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { name, symbol } = req.body as { name?: string; symbol?: string };

  const existing = await prisma.currency.findUnique({ where: { id } });

  if (!existing) {
    throw createHttpError(404, 'Currency not found');
  }

  const currency = await prisma.currency.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(symbol !== undefined ? { symbol } : {}),
    },
  });

  logger.info('Updated currency', { shortcode: currency.shortcode });

  res.json({ data: currency });
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  const existing = await prisma.currency.findUnique({ where: { id } });

  if (!existing) {
    throw createHttpError(404, 'Currency not found');
  }

  await prisma.currency.delete({ where: { id } });

  logger.info('Deleted currency', { shortcode: existing.shortcode });

  res.json({ data: existing });
}
