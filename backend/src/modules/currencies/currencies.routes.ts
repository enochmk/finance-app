import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import { list, create, update, remove } from './currencies.controller';

const currenciesRoutes = Router();

currenciesRoutes.get('/', list);
currenciesRoutes.post('/', requireAuth, create);
currenciesRoutes.patch('/:id', requireAuth, update);
currenciesRoutes.delete('/:id', requireAuth, remove);

export default currenciesRoutes;
