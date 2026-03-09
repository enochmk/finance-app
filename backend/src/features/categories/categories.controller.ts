import type { NextFunction, Request, Response } from 'express';

import categoriesService from './categories.service';
import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from './categories.schema';

class CategoriesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.list(
        String(req.user?.id),
        req.query as unknown as ListCategoriesInput
      );

      return res.status(200).json({
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.create(
        String(req.user?.id),
        req.body as CreateCategoryInput
      );

      return res.status(201).json({
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.update(
        String(req.params.id),
        String(req.user?.id),
        req.body as UpdateCategoryInput
      );

      return res.status(200).json({
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.remove(
        String(req.params.id),
        String(req.user?.id)
      );

      return res.status(200).json({
        data: category,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

const categoriesController = new CategoriesController();

export default categoriesController;
