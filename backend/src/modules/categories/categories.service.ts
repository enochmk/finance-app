import createHttpError from 'http-errors';

import type { EntryType } from '../../libs/entry-type';
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
  createdAt: Date;
  updatedAt: Date;
};

class CategoriesService {
  list = async (
    _userId: string,
    filters: ListCategoriesQuery
  ): Promise<CategoryResponse[]> => {
    await this.ensureStarterCategories();

    const parents = await prisma.categories.findMany({
      where: {
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
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        });
      }
    }
    return result;
  };

  listSubCategories = async (
    _userId: string,
    categoryId: string,
    filters: { isArchived?: boolean } = {}
  ): Promise<CategoryResponse[]> => {
    const parent = await prisma.categories.findFirst({
      where: { id: categoryId },
      select: { id: true, name: true, color: true, type: true },
    });

    if (!parent) throw createHttpError(404, 'Category not found');

    const subs = await prisma.subCategories.findMany({
      where: {
        categoryId,
        isArchived: filters.isArchived,
      },
      include: { category: true },
      orderBy: [{ name: 'asc' }],
    });

    return subs.map((sub) => ({
      id: sub.id,
      name: sub.name,
      type: parent.type,
      color: parent.color,
      icon: sub.icon,
      isSystem: sub.isSystem,
      isArchived: sub.isArchived,
      parentId: parent.id,
      parent: { id: parent.id, name: parent.name, color: parent.color },
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));
  };

  createSubCategory = async (
    userId: string,
    categoryId: string,
    data: {
      name: string;
      icon?: string | null;
      isSystem?: boolean;
      isArchived?: boolean;
    }
  ): Promise<CategoryResponse> => {
    const payload = {
      ...data,
      type: 'EXPENSE' as EntryType,
      color: undefined as any,
      parentId: categoryId,
    };

    // reuse create logic (parent-check and data shape normalization)
    return this.create(userId, payload as any);
  };

  updateSubCategory = async (
    categoryId: string,
    subCategoryId: string,
    _userId: string,
    data: {
      name?: string;
      icon?: string | null;
      isSystem?: boolean;
      isArchived?: boolean;
    }
  ): Promise<CategoryResponse> => {
    const sub = await prisma.subCategories.findFirst({
      where: { id: subCategoryId, categoryId },
      include: { category: true },
    });

    if (!sub) throw createHttpError(404, 'Category not found');

    const updated = await prisma.subCategories.update({
      where: { id: subCategoryId },
      data,
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
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  };

  removeSubCategory = async (
    categoryId: string,
    subCategoryId: string,
    _userId: string
  ) => {
    const sub = await prisma.subCategories.findFirst({
      where: { id: subCategoryId, categoryId },
      include: { category: true },
    });

    if (!sub) throw createHttpError(404, 'Category not found');

    if (sub.isSystem)
      throw createHttpError(409, 'System categories cannot be deleted');

    const usageCount = await prisma.transactions.count({
      where: { subCategoryId },
    });
    if (usageCount > 0) {
      throw createHttpError(
        409,
        'Category cannot be deleted while transactions reference it'
      );
    }

    return prisma.subCategories.delete({ where: { id: subCategoryId } });
  };

  seedDefaults = async (userId: string) => {
    await this.ensureStarterCategories();
    return this.list(userId, {});
  };

  create = async (
    _userId: string,
    data: CreateCategoryBody
  ): Promise<CategoryResponse> => {
    if (data.parentId) {
      const parent = await prisma.categories.findFirst({
        where: { id: data.parentId },
      });
      if (!parent) throw createHttpError(404, 'Parent category not found');

      const sub = await prisma.subCategories.create({
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
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    }

    const cat = await prisma.categories.create({
      data: {
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
    _userId: string,
    data: UpdateCategoryBody
  ): Promise<CategoryResponse> => {
    // Check if it's a SubCategory
    const sub = await prisma.subCategories.findFirst({
      where: { id },
      include: { category: true },
    });

    if (sub) {
      const updated = await prisma.subCategories.update({
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
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    await this.ensureCategoryExists(id);

    const cat = await prisma.categories.update({
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
    const sub = await prisma.subCategories.findFirst({
      where: { id },
      include: { category: true },
    });

    if (sub) {
      if (sub.isSystem)
        throw createHttpError(409, 'System categories cannot be deleted');

      const usageCount = await prisma.transactions.count({
        where: { subCategoryId: id },
      });
      if (usageCount > 0) {
        throw createHttpError(
          409,
          'Category cannot be deleted while transactions reference it'
        );
      }
      return prisma.subCategories.delete({ where: { id } });
    }

    const category = await this.ensureCategoryExists(id);
    if (category.isSystem)
      throw createHttpError(409, 'System categories cannot be deleted');

    const usageCount = await prisma.transactions.count({
      where: { categoryId: id },
    });
    if (usageCount > 0) {
      throw createHttpError(
        409,
        'Category cannot be deleted while transactions reference it'
      );
    }
    return prisma.categories.delete({ where: { id } });
  };

  private ensureCategoryExists = async (id: string) => {
    const category = await prisma.categories.findFirst({
      where: { id },
      select: { id: true, isSystem: true },
    });
    if (!category) throw createHttpError(404, 'Category not found');
    return category;
  };

  private findOrCreateCategory = async (data: {
    name: string;
    type: EntryType;
    color: string;
    parentId: string | null;
  }): Promise<string> => {
    if (data.parentId) {
      const existing = await prisma.subCategories.findFirst({
        where: { categoryId: data.parentId, name: data.name },
        select: { id: true },
      });
      if (existing) {
        await prisma.subCategories.update({
          where: { id: existing.id },
          data: { isSystem: true, isArchived: false },
        });
        return existing.id;
      }
      const created = await prisma.subCategories.create({
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

    const existing = await prisma.categories.findFirst({
      where: { name: data.name, type: data.type },
      select: { id: true },
    });
    if (existing) {
      await prisma.categories.update({
        where: { id: existing.id },
        data: { color: data.color, isSystem: true, isArchived: false },
      });
      return existing.id;
    }
    const created = await prisma.categories.create({
      data: {
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

  private ensureStarterCategories = async () => {
    await ensureRequiredSystemCategories();

    for (const parentDef of DEFAULT_CATEGORIES_TREE) {
      const parentId = await this.findOrCreateCategory({
        name: parentDef.name,
        type: parentDef.type,
        color: parentDef.color,
        parentId: null,
      });

      await Promise.all(
        parentDef.children.map((child) =>
          this.findOrCreateCategory({
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
