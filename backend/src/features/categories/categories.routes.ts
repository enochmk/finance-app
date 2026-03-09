import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import categoriesController from './categories.controller';
import {
  createCategorySchema,
  deleteCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from './categories.schema';

const categoriesRoutes = Router();

categoriesRoutes.use(requireAuth);

categoriesRoutes.get(
  '/',
  resourceValidator(listCategoriesSchema),
  categoriesController.list
);

categoriesRoutes.post(
  '/',
  resourceValidator(createCategorySchema),
  categoriesController.create
);

categoriesRoutes.patch(
  '/:id',
  resourceValidator(updateCategorySchema),
  categoriesController.update
);

categoriesRoutes.delete(
  '/:id',
  resourceValidator(deleteCategorySchema),
  categoriesController.remove
);

export default categoriesRoutes;
