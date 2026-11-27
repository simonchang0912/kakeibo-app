import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type ExpenseFormErrors,
  type ExpenseFormValues,
  type SortOption,
} from '../types/expense';

export const MAX_AMOUNT = 1_000_000;
export const MIN_AMOUNT = 1;
export const MAX_MEMO_LENGTH = 20;
export const MAX_BUDGET = 10_000_000;

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  return getTodayDateString().slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  if (monthKey === 'all') {
    return 'すべての期間';
  }
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) {
    return monthKey;
  }
  return `${match[1]}年${Number(match[2])}月`;
}

export function shiftMonthString(monthKey: string, delta: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) {
    return getCurrentMonthString();
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function countChars(value: string): number {
  return Array.from(value).length;
}

export function normalizeFullWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

export function isValidCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export function validateDate(date: string): string | undefined {
  const trimmed = date.trim();
  if (!trimmed) {
    return '日付を入力してください';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return '有効な日付（YYYY-MM-DD）を入力してください';
  }
  const [y, m, d] = trimmed.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return '存在しない日付が指定されています';
  }
  return undefined;
}

export function validateAmount(rawAmount: string): {
  error?: string;
  parsed?: number;
} {
  const normalized = normalizeFullWidthDigits(rawAmount.trim());
  if (!normalized) {
    return { error: '金額を入力してください' };
  }
  if (!/^\d+$/.test(normalized)) {
    return { error: '金額は1〜1,000,000の整数で入力してください' };
  }
  const num = Number(normalized);
  if (!Number.isSafeInteger(num) || num < MIN_AMOUNT || num > MAX_AMOUNT) {
    return { error: '金額は1〜1,000,000の整数で入力してください' };
  }
  return { parsed: num };
}

export function validateBudget(rawBudget: string): {
  error?: string;
  parsed?: number | null;
} {
  const normalized = normalizeFullWidthDigits(rawBudget.trim());
  if (!normalized) {
    return { parsed: null };
  }
  if (!/^\d+$/.test(normalized)) {
    return { error: '予算は1〜10,000,000の整数で入力してください' };
  }
  const num = Number(normalized);
  if (!Number.isSafeInteger(num) || num < 1 || num > MAX_BUDGET) {
    return { error: '予算は1〜10,000,000の整数で入力してください' };
  }
  return { parsed: num };
}

export function validateMemo(memo: string): string | undefined {
  const length = countChars(memo);
  if (length > MAX_MEMO_LENGTH) {
    return `メモは${MAX_MEMO_LENGTH}文字以内で入力してください（現在 ${length}文字）`;
  }
  return undefined;
}

export function validateExpenseForm(values: ExpenseFormValues): {
  errors: ExpenseFormErrors;
  isValid: boolean;
  parsedAmount?: number;
} {
  const errors: ExpenseFormErrors = {};

  const dateError = validateDate(values.date);
  if (dateError) {
    errors.date = dateError;
  }

  if (!isValidCategory(values.category)) {
    errors.category = '有効なカテゴリを選択してください';
  }

  const amountResult = validateAmount(values.amount);
  if (amountResult.error) {
    errors.amount = amountResult.error;
  }

  const memoError = validateMemo(values.memo);
  if (memoError) {
    errors.memo = memoError;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    parsedAmount: amountResult.parsed,
  };
}

export function formatYen(amount: number): string {
  return `¥${new Intl.NumberFormat('ja-JP').format(amount)}`;
}

export function sortExpensesNewestFirst(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) {
      return dateCmp;
    }
    return b.createdAt - a.createdAt;
  });
}

export function sortExpenses(
  expenses: Expense[],
  sortBy: SortOption
): Expense[] {
  if (sortBy === 'newest') {
    return sortExpensesNewestFirst(expenses);
  }
  return [...expenses].sort((a, b) => {
    if (sortBy === 'oldest') {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.createdAt - b.createdAt;
    }
    if (sortBy === 'amount-desc') {
      const amountCmp = b.amount - a.amount;
      if (amountCmp !== 0) return amountCmp;
      return b.date.localeCompare(a.date);
    }
    const amountCmp = a.amount - b.amount;
    if (amountCmp !== 0) return amountCmp;
    return b.date.localeCompare(a.date);
  });
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

export function exportExpensesToCsv(
  expenses: Expense[],
  filenameSuffix: string
): void {
  const header = ['日付', 'カテゴリ', '金額', 'メモ'].join(',');
  const rows = expenses.map((item) =>
    [
      escapeCsvCell(item.date),
      escapeCsvCell(item.category),
      String(item.amount),
      escapeCsvCell(item.memo),
    ].join(',')
  );
  const csvContent = `\uFEFF${[header, ...rows].join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kakeibo_${filenameSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
