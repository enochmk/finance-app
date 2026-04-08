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

export async function ensureSystemCategory(key: SystemCategoryKey) {
  const definition = SYSTEM_CATEGORY_DEFINITIONS[key];

  // For TRANSFER, match by name only — handles migration from old EXPENSE type
  const existing = await prisma.categories.findFirst({
    where:
      key === 'TRANSFER'
        ? { name: definition.name, isSystem: true }
        : { name: definition.name, type: definition.type },
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
      name: definition.name,
      type: definition.type,
      color: definition.color,
      icon: definition.icon,
      isSystem: true,
      isArchived: false,
    },
  });
}

export async function ensureRequiredSystemCategories() {
  const [transferCategory, unknownExpenseCategory, unknownIncomeCategory] =
    await Promise.all([
      ensureSystemCategory('TRANSFER'),
      ensureSystemCategory('UNKNOWN_EXPENSE'),
      ensureSystemCategory('UNKNOWN_INCOME'),
    ]);

  return {
    transferCategory,
    unknownExpenseCategory,
    unknownIncomeCategory,
  };
}

export async function backfillTransferCategory(userId: string) {
  const transferCategory = await ensureSystemCategory('TRANSFER');

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
