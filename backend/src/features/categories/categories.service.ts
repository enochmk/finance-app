import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from './categories.schema';

class CategoriesService {
  async list(filters: ListCategoriesInput) {
    return prisma.category.findMany({
      where: {
        userId: filters.userId,
        type: filters.type,
        isArchived: filters.isArchived,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async create(data: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        isSystem: data.isSystem ?? false,
        isArchived: data.isArchived ?? false,
      },
    });
  }

  async update(id: string, data: UpdateCategoryInput) {
    await this.ensureOwnedCategory(id, data.userId);

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
  }

  async remove(id: string, userId: string) {
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
  }

  private async ensureOwnedCategory(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true, isSystem: true },
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }

    return category;
  }
}

const categoriesService = new CategoriesService();

export default categoriesService;
