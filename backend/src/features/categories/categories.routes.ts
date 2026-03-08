import { Router } from 'express';

import resourceValidator from '../../middlewares/schema-validation.middleware';
import categoriesController from './categories.controller';
import {
  createCategorySchema,
  deleteCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from './categories.schema';

const categoriesRoutes = Router();

categoriesRoutes.get(
  '/',
  resourceValidator(listCategoriesSchema),
  categoriesController.list.bind(categoriesController)
);

categoriesRoutes.post(
  '/',
  resourceValidator(createCategorySchema),
  categoriesController.create.bind(categoriesController)
);

categoriesRoutes.patch(
  '/:id',
  resourceValidator(updateCategorySchema),
  categoriesController.update.bind(categoriesController)
);

categoriesRoutes.delete(
  '/:id',
  resourceValidator(deleteCategorySchema),
  categoriesController.remove.bind(categoriesController)
);

export default categoriesRoutes;
