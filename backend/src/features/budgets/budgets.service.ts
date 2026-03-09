import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateBudgetInput,
  ListBudgetsInput,
  UpdateBudgetInput,
} from './budgets.schema';

class BudgetsService {
  async list(userId: string, filters: ListBudgetsInput) {
    return prisma.budget.findMany({
      where: {
        userId,
        month: filters.month,
        year: filters.year,
        categoryId: filters.categoryId,
      },
      include: {
        category: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, data: CreateBudgetInput) {
    await this.ensureOwnedCategory(data.categoryId, userId);

    return prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        month: data.month,
        year: data.year,
        notes: data.notes,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateBudgetInput) {
    const existingBudget = await this.ensureOwnedBudget(id, userId);

    const categoryId = data.categoryId ?? existingBudget.categoryId;
    await this.ensureOwnedCategory(categoryId, userId);

    return prisma.budget.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        amount: data.amount,
        month: data.month,
        year: data.year,
        notes: data.notes,
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.ensureOwnedBudget(id, userId);

    return prisma.budget.delete({
      where: { id },
    });
  }

  private async ensureOwnedCategory(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }
  }

  private async ensureOwnedBudget(id: string, userId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      select: { id: true, categoryId: true },
    });

    if (!budget) {
      throw createHttpError(404, 'Budget not found');
    }

    return budget;
  }
}

const budgetsService = new BudgetsService();

export default budgetsService;
