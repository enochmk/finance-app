import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
} from './categories.schema';

class CategoriesService {
  list = async (userId: string, filters: ListCategoriesQuery) => {
    return prisma.category.findMany({
      where: {
        userId,
        type: filters.type,
        isArchived: filters.isArchived,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  };

  create = async (userId: string, data: CreateCategoryBody) => {
    return prisma.category.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        isSystem: data.isSystem ?? false,
        isArchived: data.isArchived ?? false,
      },
    });
  };

  update = async (id: string, userId: string, data: UpdateCategoryBody) => {
    await this.ensureOwnedCategory(id, userId);

    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        isSystem: data.isSystem,
        isArchived: data.isArchived,
      },
    });
  };

  remove = async (id: string, userId: string) => {
    const category = await this.ensureOwnedCategory(id, userId);

    if (category.isSystem) {
      throw createHttpError(409, 'System categories cannot be deleted');
    }

    const usageCount = await prisma.transaction.count({
      where: { userId, categoryId: id },
    });

    if (usageCount > 0) {
      throw createHttpError(
        409,
        'Category cannot be deleted while transactions reference it'
      );
    }

    return prisma.category.delete({
      where: { id },
    });
  };

  private ensureOwnedCategory = async (id: string, userId: string) => {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true, isSystem: true },
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }

    return category;
  };
}

const categoriesService = new CategoriesService();

export default categoriesService;
