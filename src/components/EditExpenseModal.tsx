import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from '../types/expense';
import {
  countChars,
  MAX_MEMO_LENGTH,
  validateAmount,
  validateDate,
  validateExpenseForm,
  validateMemo,
} from '../utils/expenseValidation';

interface EditExpenseModalProps {
  expense: Expense | null;
  onClose: () => void;
  onSave: (updated: {
    id: string;
    date: string;
    category: ExpenseCategory;
    amount: number;
    memo: string;
  }) => void;
}

export function EditExpenseModal({
  expense,
  onClose,
  onSave,
}: EditExpenseModalProps) {
  const [values, setValues] = useState<ExpenseFormValues>({
    date: '',
    category: '食費',
    amount: '',
    memo: '',
  });
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (expense) {
      setValues({
        date: expense.date,
        category: expense.category,
        amount: String(expense.amount),
        memo: expense.memo,
      });
      setErrors({});
      setHasSubmitted(false);
    }
  }, [expense]);

  useEffect(() => {
    if (!expense) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expense, onClose]);

  if (!expense) {
    return null;
  }

  const memoCount = countChars(values.memo);
  const isMemoOver = memoCount > MAX_MEMO_LENGTH;

  function handleDateChange(nextDate: string) {
    setValues((prev) => ({ ...prev, date: nextDate }));
    if (hasSubmitted || errors.date) {
      setErrors((prev) => ({ ...prev, date: validateDate(nextDate) }));
    }
  }

  function handleAmountChange(nextAmount: string) {
    setValues((prev) => ({ ...prev, amount: nextAmount }));
    if (hasSubmitted || errors.amount) {
      const result = validateAmount(nextAmount);
      setErrors((prev) => ({ ...prev, amount: result.error }));
    }
  }

  function handleMemoChange(nextMemo: string) {
    setValues((prev) => ({ ...prev, memo: nextMemo }));
    const memoError = validateMemo(nextMemo);
    if (memoError || hasSubmitted || errors.memo) {
      setErrors((prev) => ({ ...prev, memo: memoError }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expense) return;
    setHasSubmitted(true);

    const validation = validateExpenseForm(values);
    if (!validation.isValid || validation.parsedAmount === undefined) {
      setErrors(validation.errors);
      return;
    }

    onSave({
      id: expense.id,
      date: values.date.trim(),
      category: values.category,
      amount: validation.parsedAmount,
      memo: values.memo.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-expense-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl border border-gray-200 shadow-xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <h3
            id="edit-expense-title"
            className="text-base font-semibold text-gray-900"
          >
            支出を編集
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          {/* 日付 */}
          <div>
            <label
              htmlFor="edit-expense-date"
              className="block text-sm font-medium text-gray-800 mb-1.5"
            >
              日付 <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="edit-expense-date"
              type="date"
              value={values.date}
              onChange={(e) => handleDateChange(e.target.value)}
              aria-invalid={Boolean(errors.date)}
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono tabular-nums bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                errors.date
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-700 focus:ring-blue-100'
              }`}
            />
            {errors.date && (
              <p
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errors.date}</span>
              </p>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <label
              htmlFor="edit-expense-category"
              className="block text-sm font-medium text-gray-800 mb-1.5"
            >
              カテゴリ <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <select
              id="edit-expense-category"
              value={values.category}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  category: e.target.value as ExpenseCategory,
                }))
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 金額 */}
          <div>
            <label
              htmlFor="edit-expense-amount"
              className="block text-sm font-medium text-gray-800 mb-1.5"
            >
              金額（円） <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-500"
                aria-hidden="true"
              >
                ¥
              </span>
              <input
                id="edit-expense-amount"
                type="text"
                inputMode="numeric"
                value={values.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                aria-invalid={Boolean(errors.amount)}
                className={`w-full min-h-[44px] pl-7 pr-3 py-2 rounded-lg border text-sm font-mono tabular-nums bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                  errors.amount
                    ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-700 focus:ring-blue-100'
                }`}
              />
            </div>
            {errors.amount && (
              <p
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errors.amount}</span>
              </p>
            )}
          </div>

          {/* メモ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-expense-memo"
                className="block text-sm font-medium text-gray-800"
              >
                メモ
              </label>
              <span
                className={`text-xs font-mono tabular-nums ${
                  isMemoOver ? 'font-semibold text-red-600' : 'text-gray-500'
                }`}
              >
                {memoCount} / {MAX_MEMO_LENGTH}文字
              </span>
            </div>
            <input
              id="edit-expense-memo"
              type="text"
              placeholder="20文字以内"
              value={values.memo}
              onChange={(e) => handleMemoChange(e.target.value)}
              aria-invalid={Boolean(errors.memo)}
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                errors.memo
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-700 focus:ring-blue-100'
              }`}
            />
            {errors.memo && (
              <p
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errors.memo}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6E] text-white text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
