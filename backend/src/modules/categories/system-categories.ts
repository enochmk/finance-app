import prisma from '../../libs/prisma';

type SystemCategoryKey = 'TRANSFER' | 'UNKNOWN_EXPENSE' | 'UNKNOWN_INCOME';

const SYSTEM_CATEGORY_DEFINITIONS = {
  TRANSFER: {
    name: 'Transfer',
    type: 'TRANSFER',
    color: '#0f766e',
    icon: '↔️',
  },
  UNKNOWN_EXPENSE: {
    name: 'Unknown',
    type: 'EXPENSE',
    color: '#dc2626',
    icon: '❓',
  },
  UNKNOWN_INCOME: {
    name: 'Unknown',
    type: 'INCOME',
    color: '#2563eb',
    icon: '❓',
  },
} as const;

export async function ensureSystemCategory(
  userId: string,
  key: SystemCategoryKey
) {
  const definition = SYSTEM_CATEGORY_DEFINITIONS[key];

  // For TRANSFER, match by name only — handles migration from old EXPENSE type
  const existing = await prisma.categories.findFirst({
    where:
      key === 'TRANSFER'
        ? { userId, name: definition.name, isSystem: true }
        : { userId, name: definition.name, type: definition.type },
  });

  if (existing) {
    return prisma.categories.update({
      where: { id: existing.id },
      data: {
        type: definition.type,
        color: definition.color,
        icon: definition.icon,
        isSystem: true,
        isArchived: false,
      },
    });
  }

  return prisma.categories.create({
    data: {
      userId,
      name: definition.name,
      type: definition.type,
      color: definition.color,
      icon: definition.icon,
      isSystem: true,
      isArchived: false,
    },
  });
}

export async function ensureRequiredSystemCategories(userId: string) {
  const [transferCategory, unknownExpenseCategory, unknownIncomeCategory] =
    await Promise.all([
      ensureSystemCategory(userId, 'TRANSFER'),
      ensureSystemCategory(userId, 'UNKNOWN_EXPENSE'),
      ensureSystemCategory(userId, 'UNKNOWN_INCOME'),
    ]);

  return {
    transferCategory,
    unknownExpenseCategory,
    unknownIncomeCategory,
  };
}

export async function backfillTransferCategory(userId: string) {
  const transferCategory = await ensureSystemCategory(userId, 'TRANSFER');

  await prisma.transactions.updateMany({
    where: {
      userId,
      type: 'TRANSFER',
      categoryId: null,
    },
    data: {
      categoryId: transferCategory.id,
    },
  });

  return transferCategory;
}
