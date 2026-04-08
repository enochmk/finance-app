import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import categoriesController from './categories.controller';
import {
  createCategorySchema,
  createSubCategorySchema,
  deleteCategorySchema,
  deleteSubCategorySchema,
  listCategoriesSchema,
  listSubCategoriesSchema,
  seedCategoriesSchema,
  updateCategorySchema,
  updateSubCategorySchema,
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

categoriesRoutes.post(
  '/seed-defaults',
  resourceValidator(seedCategoriesSchema),
  categoriesController.seedDefaults
);

categoriesRoutes.get(
  '/:categoryId/subcategories',
  resourceValidator(listSubCategoriesSchema),
  categoriesController.listSubCategories
);

categoriesRoutes.post(
  '/:categoryId/subcategories',
  resourceValidator(createSubCategorySchema),
  categoriesController.createSubCategory
);

categoriesRoutes.patch(
  '/:categoryId/subcategories/:id',
  resourceValidator(updateSubCategorySchema),
  categoriesController.updateSubCategory
);

categoriesRoutes.delete(
  '/:categoryId/subcategories/:id',
  resourceValidator(deleteSubCategorySchema),
  categoriesController.removeSubCategory
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
