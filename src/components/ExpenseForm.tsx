import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from '../types/expense';
import {
  countChars,
  getTodayDateString,
  MAX_MEMO_LENGTH,
  validateAmount,
  validateDate,
  validateExpenseForm,
  validateMemo,
} from '../utils/expenseValidation';

interface ExpenseFormProps {
  onAddExpense: (data: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    memo: string;
  }) => boolean;
}

export function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(() => ({
    date: getTodayDateString(),
    category: '食費',
    amount: '',
    memo: '',
  }));

  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const memoCount = countChars(values.memo);
  const isMemoOver = memoCount > MAX_MEMO_LENGTH;

  function handleDateChange(nextDate: string) {
    setValues((prev) => ({ ...prev, date: nextDate }));
    setSavedNotice(false);
    if (hasSubmitted || errors.date) {
      setErrors((prev) => ({ ...prev, date: validateDate(nextDate) }));
    }
  }

  function handleCategoryChange(nextCategory: ExpenseCategory) {
    setValues((prev) => ({ ...prev, category: nextCategory }));
    setSavedNotice(false);
  }

  function handleAmountChange(nextAmount: string) {
    setValues((prev) => ({ ...prev, amount: nextAmount }));
    setSavedNotice(false);
    if (hasSubmitted || errors.amount) {
      const result = validateAmount(nextAmount);
      setErrors((prev) => ({ ...prev, amount: result.error }));
    }
  }

  function handleMemoChange(nextMemo: string) {
    setValues((prev) => ({ ...prev, memo: nextMemo }));
    setSavedNotice(false);
    const memoError = validateMemo(nextMemo);
    if (memoError || hasSubmitted || errors.memo) {
      setErrors((prev) => ({ ...prev, memo: memoError }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    setSavedNotice(false);

    const validation = validateExpenseForm(values);
    if (!validation.isValid || validation.parsedAmount === undefined) {
      setErrors(validation.errors);
      return;
    }

    const saved = onAddExpense({
      date: values.date.trim(),
      category: values.category,
      amount: validation.parsedAmount,
      memo: values.memo.trim(),
    });

    if (saved) {
      setValues((prev) => ({
        date: prev.date || getTodayDateString(),
        category: prev.category,
        amount: '',
        memo: '',
      }));
      setErrors({});
      setHasSubmitted(false);
      setSavedNotice(true);
      window.setTimeout(() => {
        setSavedNotice(false);
      }, 2500);
    }
  }

  return (
    <section
      aria-labelledby="expense-form-heading"
      className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h2
            id="expense-form-heading"
            className="text-lg font-semibold text-gray-900 tracking-tight"
          >
            支出の登録
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            日付・カテゴリ・金額（1〜1,000,000円）・メモ（20文字以内）を入力してください
          </p>
        </div>

        {savedNotice && (
          <div
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>登録しました</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* 日付 */}
          <div className="md:col-span-4">
            <label
              htmlFor="expense-date"
              className="block text-sm font-medium text-gray-800 mb-1.5"
            >
              日付 <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="expense-date"
              name="date"
              type="date"
              value={values.date}
              onChange={(e) => handleDateChange(e.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'expense-date-error' : undefined}
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono tabular-nums bg-white text-gray-900 transition-colors focus:outline-none focus:ring-2 ${
                errors.date
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-700 focus:ring-blue-100'
              }`}
            />
            {errors.date && (
              <p
                id="expense-date-error"
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errors.date}</span>
              </p>
            )}
          </div>

          {/* カテゴリ */}
          <div className="md:col-span-4">
            <label
              htmlFor="expense-category"
              className="block text-sm font-medium text-gray-800 mb-1.5"
            >
              カテゴリ <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <select
              id="expense-category"
              name="category"
              value={values.category}
              onChange={(e) =>
                handleCategoryChange(e.target.value as ExpenseCategory)
              }
              aria-invalid={Boolean(errors.category)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errors.category}</span>
              </p>
            )}
          </div>

          {/* 金額 */}
          <div className="md:col-span-4">
            <label
              htmlFor="expense-amount"
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
                id="expense-amount"
                name="amount"
                type="text"
                inputMode="numeric"
                placeholder="例: 850"
                value={values.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
                className={`w-full min-h-[44px] pl-7 pr-3 py-2 rounded-lg border text-sm font-mono tabular-nums bg-white text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 ${
                  errors.amount
                    ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-700 focus:ring-blue-100'
                }`}
              />
            </div>
            {errors.amount && (
              <p
                id="expense-amount-error"
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errors.amount}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* メモ */}
          <div className="md:col-span-9">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="expense-memo"
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
              id="expense-memo"
              name="memo"
              type="text"
              placeholder="例: スーパーで食材購入（20文字以内）"
              value={values.memo}
              onChange={(e) => handleMemoChange(e.target.value)}
              aria-invalid={Boolean(errors.memo)}
              aria-describedby={errors.memo ? 'expense-memo-error' : undefined}
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm bg-white text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 ${
                errors.memo
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-700 focus:ring-blue-100'
              }`}
            />
            {errors.memo && (
              <p
                id="expense-memo-error"
                role="alert"
                className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errors.memo}</span>
              </p>
            )}
          </div>

          {/* 登録ボタン */}
          <div className="md:col-span-3 md:pt-[26px]">
            <button
              type="submit"
              className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6E] active:scale-[0.99] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1E3A8A]"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>登録</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
