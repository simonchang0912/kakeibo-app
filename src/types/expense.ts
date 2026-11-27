export const EXPENSE_CATEGORIES = [
  '食費',
  '日用品',
  '交通費',
  '家賃/光熱費',
  '交際費',
  'その他',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type SortOption = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  memo: string;
  createdAt: number;
}

export interface ExpenseFormValues {
  date: string;
  category: ExpenseCategory;
  amount: string;
  memo: string;
}

export interface ExpenseFormErrors {
  date?: string;
  category?: string;
  amount?: string;
  memo?: string;
}
