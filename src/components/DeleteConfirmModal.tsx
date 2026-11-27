import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Expense } from '../types/expense';
import { formatYen } from '../utils/expenseValidation';

interface DeleteConfirmModalProps {
  expense: Expense | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

export function DeleteConfirmModal({
  expense,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!expense) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expense, onCancel]);

  if (!expense) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl border border-gray-200 shadow-xl p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="delete-confirm-title"
              className="text-base font-semibold text-gray-900"
            >
              本当に削除しますか？
            </h3>
            <p
              id="delete-confirm-description"
              className="text-xs text-gray-600 mt-1"
            >
              この操作は取り消せません。次の支出データを削除します。
            </p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-mono tabular-nums">{expense.date}</span>
              <span aria-hidden="true">·</span>
              <span>{expense.category}</span>
            </div>
            <span className="font-mono tabular-nums font-semibold text-gray-900">
              {formatYen(expense.amount)}
            </span>
          </div>
          {expense.memo && (
            <p className="text-xs text-gray-700 break-words">{expense.memo}</p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => onConfirm(expense.id)}
            className="min-h-[44px] px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
