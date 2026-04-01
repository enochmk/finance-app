import { z } from 'zod';

export const ENTRY_TYPE_VALUES = ['INCOME', 'EXPENSE', 'TRANSFER'] as const;

export const entryTypeSchema = z.enum(ENTRY_TYPE_VALUES);

export type EntryType = (typeof ENTRY_TYPE_VALUES)[number];