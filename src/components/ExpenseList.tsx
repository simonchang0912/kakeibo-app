import { Download, Pencil, Receipt, Search, Trash2, X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type SortOption,
} from '../types/expense';
import {
  exportExpensesToCsv,
  formatMonthLabel,
  formatYen,
  sortExpenses,
} from '../utils/expenseValidation';

interface ExpenseListProps {
  expenses: Expense[];
  selectedMonth: string;
  selectedCategory: 'すべて' | ExpenseCategory;
  onSelectCategory: (category: 'すべて' | ExpenseCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onEdit: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
}

const FILTER_OPTIONS: ReadonlyArray<'すべて' | ExpenseCategory> = [
  'すべて',
  ...EXPENSE_CATEGORIES,
];

const SORT_LABELS: Record<SortOption, string> = {
  newest: '新しい順',
  oldest: '古い順',
  'amount-desc': '金額が高い順',
  'amount-asc': '金額が安い順',
};

export function ExpenseList({
  expenses,
  selectedMonth,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onEdit,
  onRequestDelete,
}: ExpenseListProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredExpenses = sortExpenses(
    expenses.filter((item) => {
      if (selectedCategory !== 'すべて' && item.category !== selectedCategory) {
        return false;
      }
      if (normalizedQuery) {
        const matchesMemo = item.memo.toLowerCase().includes(normalizedQuery);
        const matchesCategory = item.category
          .toLowerCase()
          .includes(normalizedQuery);
        return matchesMemo || matchesCategory;
      }
      return true;
    }),
    sortBy
  );

  const filteredTotal = filteredExpenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const hasActiveFilter =
    selectedCategory !== 'すべて' || normalizedQuery.length > 0;

  return (
    <section
      aria-labelledby="expense-list-heading"
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      {/* Header, Controls & Summary */}
      <div className="p-5 sm:p-6 border-b border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="expense-list-heading"
              className="text-lg font-semibold text-gray-900 tracking-tight"
            >
              支出の一覧
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatMonthLabel(selectedMonth)} · {SORT_LABELS[sortBy]}で表示
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-baseline gap-2 text-sm text-gray-600">
              <span>表示合計</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-lg font-bold text-gray-900">
                {formatYen(filteredTotal)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-xs text-gray-500">
                {filteredExpenses.length}件
              </span>
            </div>

            <button
              type="button"
              disabled={filteredExpenses.length === 0}
              onClick={() =>
                exportExpensesToCsv(
                  filteredExpenses,
                  selectedMonth === 'all' ? 'all' : selectedMonth
                )
              }
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-gray-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>CSV出力</span>
            </button>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search
              className="pointer-events-none w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="メモやカテゴリを検索"
              placeholder="メモで検索（例: スーパー、電車）"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="検索をクリア"
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              aria-label="並び替え"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
              <option value="amount-desc">金額が高い順</option>
              <option value="amount-asc">金額が安い順</option>
            </select>
          </div>
        </div>

        {/* Interactive Category Filter */}
        <div
          role="group"
          aria-label="カテゴリで絞り込む"
          className="flex flex-wrap items-center gap-1.5"
        >
          {FILTER_OPTIONS.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                aria-pressed={isActive}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty States */}
      {expenses.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-3">
            <Receipt className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            {selectedMonth === 'all'
              ? 'まだ支出の記録がありません'
              : `${formatMonthLabel(selectedMonth)}の支出はまだありません`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            上の入力欄から支出を登録してください。
          </p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">
            条件に一致する支出が見つかりません
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                onSelectCategory('すべて');
                onSearchChange('');
              }}
              className="mt-3 min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              絞り込みを解除
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile List View (< md) */}
          <ul className="divide-y divide-gray-200 md:hidden">
            {filteredExpenses.map((expense) => (
              <li key={expense.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-mono tabular-nums font-medium text-gray-800">
                        {expense.date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-gray-700">
                        {expense.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 break-words">
                      {expense.memo ? (
                        expense.memo
                      ) : (
                        <span className="text-gray-400">（メモなし）</span>
                      )}
                    </p>
                  </div>

                  <p className="font-mono tabular-nums text-base font-semibold text-gray-900 whitespace-nowrap shrink-0">
                    {formatYen(expense.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onEdit(expense)}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]"
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>編集</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDelete(expense)}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>削除</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop Ledger Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-medium text-gray-600">
                  <th scope="col" className="py-3 pl-6 pr-4 w-32">
                    日付
                  </th>
                  <th scope="col" className="py-3 px-4 w-36">
                    カテゴリ
                  </th>
                  <th scope="col" className="py-3 px-4">
                    メモ
                  </th>
                  <th scope="col" className="py-3 px-4 text-right w-36">
                    金額
                  </th>
                  <th scope="col" className="py-3 pl-4 pr-6 text-right w-44">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="py-3.5 pl-6 pr-4 font-mono tabular-nums text-gray-800 whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 whitespace-nowrap">
                      {expense.category}
                    </td>
                    <td className="py-3.5 px-4 text-gray-900">
                      {expense.memo ? (
                        expense.memo
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-gray-900 whitespace-nowrap">
                      {formatYen(expense.amount)}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(expense)}
                          className="min-h-[36px] px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]"
                        >
                          <Pencil className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>編集</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(expense)}
                          className="min-h-[36px] px-3 py-1.5 rounded-md border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>削除</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
