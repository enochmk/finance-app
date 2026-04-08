import type { NextFunction, Request, Response } from 'express';

import categoriesService from './categories.service';
import type {
  CreateCategoryBody,
  CreateSubCategoryBody,
  DeleteCategoryParams,
  DeleteSubCategoryParams,
  ListCategoriesQuery,
  ListSubCategoriesQuery,
  UpdateCategoryBody,
  UpdateCategoryParams,
  UpdateSubCategoryBody,
  UpdateSubCategoryParams,
} from './categories.schema';

type EmptyObject = Record<string, never>;
type ListCategoriesRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  ListCategoriesQuery
>;
type CreateCategoryRequest = Request<
  EmptyObject,
  unknown,
  CreateCategoryBody,
  EmptyObject
>;
type UpdateCategoryRequest = Request<
  UpdateCategoryParams,
  unknown,
  UpdateCategoryBody,
  EmptyObject
>;
type DeleteCategoryRequest = Request<DeleteCategoryParams>;

class CategoriesController {
  list = async (
    req: ListCategoriesRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const categories = await categoriesService.list(req.user!.id, req.query);

      return res.status(200).json({
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  listSubCategories = async (
    req: Request<
      { categoryId: string },
      unknown,
      unknown,
      ListSubCategoriesQuery
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const subcategories = await categoriesService.listSubCategories(
        req.user!.id,
        req.params.categoryId,
        { isArchived: req.query.isArchived }
      );

      return res.status(200).json({
        data: subcategories,
        count: subcategories.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  createSubCategory = async (
    req: Request<{ categoryId: string }, unknown, CreateSubCategoryBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const subcategory = await categoriesService.createSubCategory(
        req.user!.id,
        req.params.categoryId,
        req.body
      );

      return res.status(201).json({
        data: subcategory,
      });
    } catch (error) {
      return next(error);
    }
  };

  updateSubCategory = async (
    req: Request<UpdateSubCategoryParams, unknown, UpdateSubCategoryBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const category = await categoriesService.updateSubCategory(
        req.params.categoryId,
        req.params.id,
        req.user!.id,
        req.body
      );

      return res.status(200).json({
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  };

  removeSubCategory = async (
    req: Request<DeleteSubCategoryParams>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await categoriesService.removeSubCategory(
        req.params.categoryId,
        req.params.id,
        req.user!.id
      );

      return res.status(200).json({
        data: {},
        message: 'Sub-category deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  create = async (
    req: CreateCategoryRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const category = await categoriesService.create(req.user!.id, req.body);

      return res.status(201).json({
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  };

  seedDefaults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await categoriesService.seedDefaults(req.user!.id);

      return res.status(200).json({
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (
    req: UpdateCategoryRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const category = await categoriesService.update(
        req.params.id,
        req.user!.id,
        req.body
      );

      return res.status(200).json({
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  };

  remove = async (
    req: DeleteCategoryRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const category = await categoriesService.remove(
        req.params.id,
        req.user!.id
      );

      return res.status(200).json({
        data: category,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  };
}

const categoriesController = new CategoriesController();

export default categoriesController;
