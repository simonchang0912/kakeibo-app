import type { Expense } from '../types/expense';
import {
  countChars,
  isValidCategory,
  MAX_AMOUNT,
  MAX_BUDGET,
  MAX_MEMO_LENGTH,
  MIN_AMOUNT,
  sortExpensesNewestFirst,
  validateDate,
} from './expenseValidation';

const STORAGE_KEY = 'ryugaku_kakeibo_expenses_v1';
const BUDGET_STORAGE_KEY = 'ryugaku_kakeibo_budget_v1';

export function generateExpenseId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isValidExpenseRecord(item: unknown): item is Expense {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const record = item as Record<string, unknown>;
  if (typeof record.id !== 'string' || record.id.trim().length === 0) {
    return false;
  }
  if (typeof record.date !== 'string' || validateDate(record.date) !== undefined) {
    return false;
  }
  if (typeof record.category !== 'string' || !isValidCategory(record.category)) {
    return false;
  }
  if (
    typeof record.amount !== 'number' ||
    !Number.isInteger(record.amount) ||
    record.amount < MIN_AMOUNT ||
    record.amount > MAX_AMOUNT
  ) {
    return false;
  }
  if (typeof record.memo !== 'string' || countChars(record.memo) > MAX_MEMO_LENGTH) {
    return false;
  }
  return true;
}

export function loadExpenses(): Expense[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const validExpenses: Expense[] = [];
    for (const item of parsed) {
      if (isValidExpenseRecord(item)) {
        validExpenses.push({
          id: item.id,
          date: item.date,
          category: item.category,
          amount: item.amount,
          memo: item.memo,
          createdAt:
            typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)
              ? item.createdAt
              : 0,
        });
      }
    }
    return sortExpensesNewestFirst(validExpenses);
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch {
    return false;
  }
}

export function loadMonthlyBudget(): number | null {
  try {
    const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_BUDGET) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveMonthlyBudget(budget: number | null): boolean {
  try {
    if (budget === null) {
      window.localStorage.removeItem(BUDGET_STORAGE_KEY);
    } else {
      window.localStorage.setItem(BUDGET_STORAGE_KEY, String(budget));
    }
    return true;
  } catch {
    return false;
  }
}
