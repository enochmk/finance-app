import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import { DEFAULT_CATEGORIES_TREE } from '../workspace/default-workspace';
import { ensureRequiredSystemCategories } from './system-categories';
import type {
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
} from './categories.schema';

class CategoriesService {
  list = async (userId: string, filters: ListCategoriesQuery) => {
    await this.ensureStarterCategories(userId);

    return prisma.category.findMany({
      where: {
        userId,
        type: filters.type,
        isArchived: filters.isArchived,
      },
      include: {
        parent: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: [{ type: 'asc' }, { parentId: 'asc' }, { name: 'asc' }],
    });
  };

  seedDefaults = async (userId: string) => {
    await this.ensureStarterCategories(userId);

    return this.list(userId, {});
  };

  create = async (userId: string, data: CreateCategoryBody) => {
    if (data.parentId) {
      await this.ensureOwnedCategory(data.parentId, userId);
    }

    return prisma.category.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        parentId: data.parentId ?? null,
        isSystem: data.isSystem ?? false,
        isArchived: data.isArchived ?? false,
      },
      include: {
        parent: {
          select: { id: true, name: true, color: true },
        },
      },
    });
  };

  update = async (id: string, userId: string, data: UpdateCategoryBody) => {
    await this.ensureOwnedCategory(id, userId);

    if (data.parentId) {
      await this.ensureOwnedCategory(data.parentId, userId);
    }

    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
        parentId: data.parentId,
        isSystem: data.isSystem,
        isArchived: data.isArchived,
      },
      include: {
        parent: {
          select: { id: true, name: true, color: true },
        },
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

  private findOrCreateCategory = async (data: {
    userId: string;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    color: string;
    parentId: string | null;
  }) => {
    const existing = await prisma.category.findFirst({
      where: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        parentId: data.parentId,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { color: data.color, isSystem: true, isArchived: false },
      });
      return existing.id;
    }

    const created = await prisma.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        color: data.color,
        parentId: data.parentId,
        isSystem: true,
        isArchived: false,
      },
      select: { id: true },
    });
    return created.id;
  };

  private ensureStarterCategories = async (userId: string) => {
    await ensureRequiredSystemCategories(userId);

    for (const parentDef of DEFAULT_CATEGORIES_TREE) {
      const parentId = await this.findOrCreateCategory({
        userId,
        name: parentDef.name,
        type: parentDef.type,
        color: parentDef.color,
        parentId: null,
      });

      await Promise.all(
        parentDef.children.map((child) =>
          this.findOrCreateCategory({
            userId,
            name: child.name,
            type: parentDef.type,
            color: child.color,
            parentId,
          })
        )
      );
    }
  };
}

const categoriesService = new CategoriesService();

export default categoriesService;
