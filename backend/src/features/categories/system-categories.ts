import prisma from '../../libs/prisma';

type SystemCategoryKey = 'TRANSFER' | 'UNKNOWN_EXPENSE' | 'UNKNOWN_INCOME';

const SYSTEM_CATEGORY_DEFINITIONS = {
  TRANSFER: {
    name: 'Transfer',
    type: 'EXPENSE',
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

  return prisma.category.upsert({
    where: {
      userId_type_name: {
        userId,
        type: definition.type,
        name: definition.name,
      },
    },
    update: {
      color: definition.color,
      icon: definition.icon,
      isSystem: true,
      isArchived: false,
    },
    create: {
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

  await prisma.transaction.updateMany({
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
