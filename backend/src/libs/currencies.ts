import prisma from './prisma';
import { getLogger } from './logger';

const logger = getLogger('Currencies');

const DEFAULT_CURRENCIES = [
  { name: 'Ghana Cedis', shortcode: 'GHS', symbol: '₵' },
  { name: 'Dollar', shortcode: 'USD', symbol: '$' },
  { name: 'Pounds', shortcode: 'GBP', symbol: '£' },
  { name: 'Euro', shortcode: 'EUR', symbol: '€' },
];

export async function ensureCurrencies() {
  await Promise.all(
    DEFAULT_CURRENCIES.map((currency) =>
      prisma.currency.upsert({
        where: { shortcode: currency.shortcode },
        update: { name: currency.name, symbol: currency.symbol },
        create: currency,
      })
    )
  );

  logger.info('Default currencies seeded', {
    count: DEFAULT_CURRENCIES.length,
  });
}
