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

  seedDefaults = async (userId: string) => {
    const defaultCategories = [
      {
        name: 'Food & Drinks',
        type: 'EXPENSE',
        color: '#b45309',
      },
      {
        name: 'Shopping',
        type: 'EXPENSE',
        color: '#176b6c',
      },
      {
        name: 'Housing',
        type: 'EXPENSE',
        color: '#9a3412',
      },
      {
        name: 'Transportation',
        type: 'EXPENSE',
        color: '#f59e0b',
      },
      {
        name: 'Vehicle',
        type: 'EXPENSE',
        color: '#475569',
      },
      {
        name: 'Life & Entertainment',
        type: 'EXPENSE',
        color: '#be185d',
      },
      {
        name: 'Communications, PC',
        type: 'EXPENSE',
        color: '#0f766e',
      },
      {
        name: 'Financial Expenses',
        type: 'EXPENSE',
        color: '#7c3aed',
      },
      {
        name: 'Investments',
        type: 'EXPENSE',
        color: '#1d4ed8',
      },
      {
        name: 'Income',
        type: 'INCOME',
        color: '#15803d',
      },
    ] as const;

    await Promise.all(
      defaultCategories.map((category) =>
        prisma.category.upsert({
          where: {
            userId_type_name: {
              userId,
              type: category.type,
              name: category.name,
            },
          },
          update: {
            color: category.color,
            isSystem: true,
          },
          create: {
            userId,
            name: category.name,
            type: category.type,
            color: category.color,
            isSystem: true,
            isArchived: false,
          },
        })
      )
    );

    return this.list(userId, {});
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
