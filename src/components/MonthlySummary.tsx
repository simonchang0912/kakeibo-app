import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
} from '../types/expense';
import {
  formatMonthLabel,
  formatYen,
  getCurrentMonthString,
  shiftMonthString,
  validateBudget,
} from '../utils/expenseValidation';

interface MonthlySummaryProps {
  allExpenses: Expense[];
  periodExpenses: Expense[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  selectedCategory: 'すべて' | ExpenseCategory;
  onSelectCategory: (category: 'すべて' | ExpenseCategory) => void;
  monthlyBudget: number | null;
  onSaveBudget: (budget: number | null) => boolean;
}

export function MonthlySummary({
  allExpenses,
  periodExpenses,
  selectedMonth,
  onSelectMonth,
  selectedCategory,
  onSelectCategory,
  monthlyBudget,
  onSaveBudget,
}: MonthlySummaryProps) {
  const currentMonth = getCurrentMonthString();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Collect all unique months from expenses + current month, sorted newest first
  const monthSet = new Set<string>([currentMonth]);
  for (const item of allExpenses) {
    monthSet.add(item.date.slice(0, 7));
  }
  if (selectedMonth !== 'all') {
    monthSet.add(selectedMonth);
  }
  const availableMonths = Array.from(monthSet).sort((a, b) =>
    b.localeCompare(a)
  );

  const periodTotal = periodExpenses.reduce((sum, item) => sum + item.amount, 0);

  const categoryTotals = EXPENSE_CATEGORIES.map((category) => {
    const amount = periodExpenses
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.amount, 0);
    const ratio = periodTotal > 0 ? Math.round((amount / periodTotal) * 100) : 0;
    return { category, amount, ratio };
  });

  function openBudgetEditor() {
    setBudgetInput(monthlyBudget !== null ? String(monthlyBudget) : '');
    setBudgetError(null);
    setIsEditingBudget(true);
  }

  function handleBudgetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateBudget(budgetInput);
    if (result.error) {
      setBudgetError(result.error);
      return;
    }
    if (onSaveBudget(result.parsed ?? null)) {
      setIsEditingBudget(false);
      setBudgetError(null);
    }
  }

  function handleClearBudget() {
    if (onSaveBudget(null)) {
      setIsEditingBudget(false);
      setBudgetError(null);
    }
  }

  const isMonthlyView = selectedMonth !== 'all';
  const budgetRemaining =
    isMonthlyView && monthlyBudget !== null ? monthlyBudget - periodTotal : null;
  const budgetUsagePercent =
    isMonthlyView && monthlyBudget !== null && monthlyBudget > 0
      ? Math.round((periodTotal / monthlyBudget) * 100)
      : null;

  return (
    <section
      aria-labelledby="summary-heading"
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      {/* Period Selector Bar */}
      <div className="px-5 py-3.5 sm:px-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
        <h2
          id="summary-heading"
          className="text-sm font-semibold text-gray-900 whitespace-nowrap"
        >
          集計・予算サマリー
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
            <button
              type="button"
              onClick={() =>
                onSelectMonth(
                  shiftMonthString(
                    selectedMonth === 'all' ? currentMonth : selectedMonth,
                    -1
                  )
                )
              }
              aria-label="前の月"
              className="min-h-[40px] min-w-[40px] px-2 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer border-r border-gray-200"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            <select
              aria-label="表示する期間"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 bg-white text-sm font-medium text-gray-900 focus:outline-none cursor-pointer"
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
              <option value="all">すべての期間</option>
            </select>

            <button
              type="button"
              onClick={() =>
                onSelectMonth(
                  shiftMonthString(
                    selectedMonth === 'all' ? currentMonth : selectedMonth,
                    1
                  )
                )
              }
              aria-label="次の月"
              className="min-h-[40px] min-w-[40px] px-2 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer border-l border-gray-200"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {selectedMonth !== currentMonth && (
            <button
              type="button"
              onClick={() => onSelectMonth(currentMonth)}
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-xs font-medium text-gray-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              今月へ
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Summary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Left: Total Spending & Monthly Budget */}
        <div className="p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div>
            <p className="text-xs font-medium text-gray-500">
              {formatMonthLabel(selectedMonth)}の支出合計
            </p>
            <div className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
              <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {formatYen(periodTotal)}
              </span>
              <span aria-hidden="true" className="text-gray-400">
                ·
              </span>
              <span className="font-mono tabular-nums text-sm text-gray-600">
                {periodExpenses.length}件
              </span>
            </div>
          </div>

          {/* Monthly Budget Panel */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-800">
                月の予算（目標）
              </span>
              {!isEditingBudget && (
                <button
                  type="button"
                  onClick={openBudgetEditor}
                  className="min-h-[36px] px-2.5 py-1 rounded-md text-xs font-medium text-[#1E3A8A] hover:bg-blue-50 inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{monthlyBudget !== null ? '変更' : '予算を設定'}</span>
                </button>
              )}
            </div>

            {isEditingBudget ? (
              <form onSubmit={handleBudgetSubmit} noValidate className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-500"
                      aria-hidden="true"
                    >
                      ¥
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="月の予算（円）"
                      placeholder="例: 80000（空で解除）"
                      value={budgetInput}
                      onChange={(e) => {
                        setBudgetInput(e.target.value);
                        if (budgetError) {
                          const res = validateBudget(e.target.value);
                          setBudgetError(res.error ?? null);
                        }
                      }}
                      className={`w-full min-h-[42px] pl-7 pr-3 py-1.5 rounded-lg border text-sm font-mono tabular-nums bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                        budgetError
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-700 focus:ring-blue-100'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="submit"
                      className="min-h-[42px] px-4 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6E] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      保存
                    </button>
                    {monthlyBudget !== null && (
                      <button
                        type="button"
                        onClick={handleClearBudget}
                        className="min-h-[42px] px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium whitespace-nowrap cursor-pointer"
                      >
                        解除
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingBudget(false);
                        setBudgetError(null);
                      }}
                      className="min-h-[42px] px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium whitespace-nowrap cursor-pointer"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
                {budgetError && (
                  <p
                    role="alert"
                    className="flex items-start gap-1.5 text-xs font-medium text-red-600"
                  >
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{budgetError}</span>
                  </p>
                )}
              </form>
            ) : monthlyBudget === null ? (
              <p className="text-xs text-gray-500">
                月の予算を設定すると、残高と使用率を確認できます。
              </p>
            ) : !isMonthlyView ? (
              <p className="text-xs text-gray-600">
                設定中の月間予算：{' '}
                <span className="font-mono tabular-nums font-semibold text-gray-900">
                  {formatYen(monthlyBudget)}
                </span>
                （月別表示に切り替えると残高を確認できます）
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-gray-600">
                    予算{' '}
                    <span className="font-mono tabular-nums font-semibold text-gray-900">
                      {formatYen(monthlyBudget)}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-gray-600">
                    使用率 {budgetUsagePercent}%
                  </span>
                </div>

                <div
                  className="w-full h-2 rounded-full bg-gray-100 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.min(budgetUsagePercent ?? 0, 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="予算の使用率"
                >
                  <div
                    className={`h-full transition-all duration-200 ${
                      (budgetRemaining ?? 0) < 0
                        ? 'bg-red-600'
                        : (budgetUsagePercent ?? 0) >= 85
                        ? 'bg-amber-500'
                        : 'bg-[#1E3A8A]'
                    }`}
                    style={{
                      width: `${Math.min(budgetUsagePercent ?? 0, 100)}%`,
                    }}
                  />
                </div>

                {budgetRemaining !== null && budgetRemaining < 0 ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      予算を{' '}
                      <span className="font-mono tabular-nums font-semibold">
                        {formatYen(Math.abs(budgetRemaining))}
                      </span>{' '}
                      超過しています
                    </span>
                  </p>
                ) : budgetRemaining !== null && (budgetUsagePercent ?? 0) >= 85 ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      残り{' '}
                      <span className="font-mono tabular-nums font-semibold">
                        {formatYen(budgetRemaining)}
                      </span>
                      （予算上限に近づいています）
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      残り予算{' '}
                      <span className="font-mono tabular-nums font-semibold">
                        {formatYen(budgetRemaining ?? 0)}
                      </span>
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Category Breakdown */}
        <div className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <h3 className="text-sm font-medium text-gray-800">
              カテゴリ別の内訳
            </h3>
            <span className="text-xs text-gray-500">
              選択で一覧を絞り込み
            </span>
          </div>

          <div className="space-y-1.5">
            {categoryTotals.map(({ category, amount, ratio }) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    onSelectCategory(isSelected ? 'すべて' : category)
                  }
                  aria-pressed={isSelected}
                  className={`w-full min-h-[38px] px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 ring-1 ring-[#1E3A8A]/30'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-xs mb-1">
                    <span
                      className={`font-medium ${
                        isSelected ? 'text-[#1E3A8A]' : 'text-gray-800'
                      }`}
                    >
                      {category}
                    </span>
                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-gray-500">{ratio}%</span>
                      <span className="font-semibold text-gray-900 min-w-[74px] text-right">
                        {formatYen(amount)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        isSelected ? 'bg-[#1E3A8A]' : 'bg-gray-400'
                      }`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
