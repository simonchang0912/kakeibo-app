import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { MonthlySummary } from './components/MonthlySummary';
import type { Expense, ExpenseCategory, SortOption } from './types/expense';
import {
  formatYen,
  getCurrentMonthString,
  sortExpensesNewestFirst,
} from './utils/expenseValidation';
import {
  generateExpenseId,
  loadExpenses,
  loadMonthlyBudget,
  saveExpenses,
  saveMonthlyBudget,
} from './utils/storage';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(() =>
    loadMonthlyBudget()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentMonthString()
  );
  const [selectedCategory, setSelectedCategory] = useState<
    'すべて' | ExpenseCategory
  >('すべて');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  const periodExpenses =
    selectedMonth === 'all'
      ? expenses
      : expenses.filter((item) => item.date.startsWith(selectedMonth));

  function persistExpenses(nextExpenses: Expense[]): boolean {
    const sorted = sortExpensesNewestFirst(nextExpenses);
    const ok = saveExpenses(sorted);
    if (!ok) {
      setStorageError(
        'ブラウザへのデータ保存に失敗しました。ストレージの空き容量や設定を確認してください。'
      );
      return false;
    }
    setStorageError(null);
    setExpenses(sorted);
    return true;
  }

  function handleSaveBudget(budget: number | null): boolean {
    const ok = saveMonthlyBudget(budget);
    if (!ok) {
      setStorageError(
        'ブラウザへの予算データの保存に失敗しました。ストレージの設定を確認してください。'
      );
      return false;
    }
    setStorageError(null);
    setMonthlyBudget(budget);
    return true;
  }

  function handleAddExpense(data: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    memo: string;
  }): boolean {
    const newExpense: Expense = {
      id: generateExpenseId(),
      date: data.date,
      category: data.category,
      amount: data.amount,
      memo: data.memo,
      createdAt: Date.now(),
    };
    const saved = persistExpenses([newExpense, ...expenses]);
    if (saved) {
      const entryMonth = data.date.slice(0, 7);
      if (selectedMonth !== 'all' && selectedMonth !== entryMonth) {
        setSelectedMonth(entryMonth);
      }
      if (selectedCategory !== 'すべて' && selectedCategory !== data.category) {
        setSelectedCategory('すべて');
      }
    }
    return saved;
  }

  function handleSaveEdit(updated: {
    id: string;
    date: string;
    category: ExpenseCategory;
    amount: number;
    memo: string;
  }) {
    const nextExpenses = expenses.map((item) =>
      item.id === updated.id
        ? {
            ...item,
            date: updated.date,
            category: updated.category,
            amount: updated.amount,
            memo: updated.memo,
          }
        : item
    );
    if (persistExpenses(nextExpenses)) {
      setEditingExpense(null);
    }
  }

  function handleConfirmDelete(id: string) {
    const nextExpenses = expenses.filter((item) => item.id !== id);
    if (persistExpenses(nextExpenses)) {
      setDeletingExpense(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap shrink-0">
            留学生の家計簿
          </h1>

          <div className="flex items-baseline gap-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap shrink-0">
            <span className="hidden sm:inline">累計支出</span>
            <span className="font-mono tabular-nums font-semibold text-gray-900 text-sm sm:text-base">
              {formatYen(totalAmount)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-gray-500">
              {expenses.length}件
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
        {storageError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{storageError}</span>
          </div>
        )}

        <ExpenseForm onAddExpense={handleAddExpense} />

        <MonthlySummary
          allExpenses={expenses}
          periodExpenses={periodExpenses}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          monthlyBudget={monthlyBudget}
          onSaveBudget={handleSaveBudget}
        />

        <ExpenseList
          expenses={periodExpenses}
          selectedMonth={selectedMonth}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onEdit={(expense) => setEditingExpense(expense)}
          onRequestDelete={(expense) => setDeletingExpense(expense)}
        />
      </main>

      <EditExpenseModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleSaveEdit}
      />

      <DeleteConfirmModal
        expense={deletingExpense}
        onCancel={() => setDeletingExpense(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
