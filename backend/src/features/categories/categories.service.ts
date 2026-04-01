import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import { DEFAULT_CATEGORIES_TREE } from '../workspace/default-workspace';
import { ensureRequiredSystemCategories } from './system-categories';
import type {
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
} from './categories.schema';

type CategoryResponse = {
  id: string;
  name: string;
  type: string;
  color: string | null | undefined;
  icon: string | null | undefined;
  isSystem: boolean;
  isArchived: boolean;
  parentId: string | null;
  parent: { id: string; name: string; color: string | null | undefined } | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

class CategoriesService {
  list = async (
    userId: string,
    filters: ListCategoriesQuery
  ): Promise<CategoryResponse[]> => {
    await this.ensureStarterCategories(userId);

    const parents = await prisma.category.findMany({
      where: {
        userId,
        type: filters.type,
        isArchived: filters.isArchived,
      },
      include: { subCategories: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    const result: CategoryResponse[] = [];
    for (const parent of parents) {
      result.push({
        id: parent.id,
        name: parent.name,
        type: parent.type,
        color: parent.color,
        icon: parent.icon,
        isSystem: parent.isSystem,
        isArchived: parent.isArchived,
        parentId: null,
        parent: null,
        userId: parent.userId,
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
      });
      for (const sub of parent.subCategories) {
        if (
          filters.isArchived !== undefined &&
          sub.isArchived !== filters.isArchived
        )
          continue;
        result.push({
          id: sub.id,
          name: sub.name,
          type: parent.type,
          color: parent.color,
          icon: sub.icon,
          isSystem: sub.isSystem,
          isArchived: sub.isArchived,
          parentId: parent.id,
          parent: { id: parent.id, name: parent.name, color: parent.color },
          userId: parent.userId,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        });
      }
    }
    return result;
  };

  seedDefaults = async (userId: string) => {
    await this.ensureStarterCategories(userId);
    return this.list(userId, {});
  };

  create = async (
    userId: string,
    data: CreateCategoryBody
  ): Promise<CategoryResponse> => {
    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, userId },
      });
      if (!parent) throw createHttpError(404, 'Parent category not found');

      const sub = await prisma.subCategory.create({
        data: {
          categoryId: data.parentId,
          name: data.name,
          icon: data.icon,
          isSystem: data.isSystem ?? false,
          isArchived: data.isArchived ?? false,
        },
      });

      return {
        id: sub.id,
        name: sub.name,
        type: parent.type,
        color: parent.color,
        icon: sub.icon,
        isSystem: sub.isSystem,
        isArchived: sub.isArchived,
        parentId: parent.id,
        parent: { id: parent.id, name: parent.name, color: parent.color },
        userId: parent.userId,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    }

    const cat = await prisma.category.create({
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
    return { ...cat, parentId: null, parent: null };
  };

  update = async (
    id: string,
    userId: string,
    data: UpdateCategoryBody
  ): Promise<CategoryResponse> => {
    // Check if it's a SubCategory
    const sub = await prisma.subCategory.findFirst({
      where: { id },
      include: { category: true },
    });

    if (sub) {
      if (sub.category.userId !== userId)
        throw createHttpError(404, 'Category not found');

      const updated = await prisma.subCategory.update({
        where: { id },
        data: {
          name: data.name,
          icon: data.icon,
          isSystem: data.isSystem,
          isArchived: data.isArchived,
        },
        include: { category: true },
      });

      return {
        id: updated.id,
        name: updated.name,
        type: updated.category.type,
        color: updated.category.color,
        icon: updated.icon,
        isSystem: updated.isSystem,
        isArchived: updated.isArchived,
        parentId: updated.categoryId,
        parent: {
          id: updated.category.id,
          name: updated.category.name,
          color: updated.category.color,
        },
        userId: updated.category.userId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    await this.ensureOwnedCategory(id, userId);

    const cat = await prisma.category.update({
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
    return { ...cat, parentId: null, parent: null };
  };

  remove = async (id: string, userId: string) => {
    // Check if it's a SubCategory
    const sub = await prisma.subCategory.findFirst({
      where: { id },
      include: { category: { select: { userId: true } } },
    });

    if (sub) {
      if (sub.category.userId !== userId)
        throw createHttpError(404, 'Category not found');
      if (sub.isSystem)
        throw createHttpError(409, 'System categories cannot be deleted');

      const usageCount = await prisma.transaction.count({
        where: { userId, subCategoryId: id },
      });
      if (usageCount > 0) {
        throw createHttpError(
          409,
          'Category cannot be deleted while transactions reference it'
        );
      }
      return prisma.subCategory.delete({ where: { id } });
    }

    const category = await this.ensureOwnedCategory(id, userId);
    if (category.isSystem)
      throw createHttpError(409, 'System categories cannot be deleted');

    const usageCount = await prisma.transaction.count({
      where: { userId, categoryId: id },
    });
    if (usageCount > 0) {
      throw createHttpError(
        409,
        'Category cannot be deleted while transactions reference it'
      );
    }
    return prisma.category.delete({ where: { id } });
  };

  private ensureOwnedCategory = async (id: string, userId: string) => {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true, isSystem: true },
    });
    if (!category) throw createHttpError(404, 'Category not found');
    return category;
  };

  private findOrCreateCategory = async (data: {
    userId: string;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    color: string;
    parentId: string | null;
  }): Promise<string> => {
    if (data.parentId) {
      const existing = await prisma.subCategory.findFirst({
        where: { categoryId: data.parentId, name: data.name },
        select: { id: true },
      });
      if (existing) {
        await prisma.subCategory.update({
          where: { id: existing.id },
          data: { isSystem: true, isArchived: false },
        });
        return existing.id;
      }
      const created = await prisma.subCategory.create({
        data: {
          categoryId: data.parentId,
          name: data.name,
          isSystem: true,
          isArchived: false,
        },
        select: { id: true },
      });
      return created.id;
    }

    const existing = await prisma.category.findFirst({
      where: { userId: data.userId, name: data.name, type: data.type },
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
