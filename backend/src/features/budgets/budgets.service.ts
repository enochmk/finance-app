import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateBudgetInput,
  ListBudgetsInput,
  UpdateBudgetInput,
} from './budgets.schema';

class BudgetsService {
  async list(filters: ListBudgetsInput) {
    return prisma.budget.findMany({
      where: {
        userId: filters.userId,
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

  async create(data: CreateBudgetInput) {
    await this.ensureOwnedCategory(data.categoryId, data.userId);

    return prisma.budget.create({
      data: {
        userId: data.userId,
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

  async update(id: string, data: UpdateBudgetInput) {
    const existingBudget = await this.ensureOwnedBudget(id, data.userId);

    const categoryId = data.categoryId ?? existingBudget.categoryId;
    await this.ensureOwnedCategory(categoryId, data.userId);

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
