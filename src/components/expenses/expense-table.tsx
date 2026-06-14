import React from "react";
import { Expense } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
import { AmountDisplay } from "@/components/shared/amount-display";
import { CategoryBadge } from "@/components/shared/category-badge";
import { formatDate, formatDateShort } from "@/lib/utils/date";
import { EXPENSE_CATEGORIES } from "@/lib/constants/config";

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

function getCategoryEmoji(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category || c.label === category);
  return found?.emoji || "💳";
}

function getCategoryColor(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category || c.label === category);
  return found?.color || "#ff3b30";
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  return (
    <div className="apple-card overflow-hidden">
      {/* Mobile: card rows */}
      <div className="md:hidden divide-y divide-[var(--separator)]">
      {expenses.map((expense) => {
          const emoji = getCategoryEmoji(expense.category);
          const color = getCategoryColor(expense.category);
          return (
            <div key={expense.id} className="tx-card group">
              {/* Left color accent strip */}
              <div
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                style={{ background: 'var(--apple-red)' }}
              />
              <div className="tx-card-icon ml-2" style={{ background: `${color}18` }}>
                <span>{emoji}</span>
              </div>
              <div className="tx-card-body">
                <div className="tx-card-title">{expense.title}</div>
                <div className="tx-card-sub">
                  {expense.category} · {formatDateShort(expense.date)}
                  {expense.payment_method && ` · ${expense.payment_method}`}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <AmountDisplay amount={expense.amount} variant="danger" className="text-[15px] font-bold" />
                <div className="flex gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(expense)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(0,122,255,0.1)] text-[var(--apple-blue)] transition-all active:scale-90"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(255,59,48,0.1)] text-[var(--apple-red)] transition-all active:scale-90"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5 text-[11px] font-semibold uppercase tracking-[0.5px]">Date</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.5px]">Description</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.5px]">Category</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.5px]">Method</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.5px]">Amount</TableHead>
              <TableHead className="text-right pr-5 text-[11px] font-semibold uppercase tracking-[0.5px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense, i) => {
              const emoji = getCategoryEmoji(expense.category);
              const color = getCategoryColor(expense.category);
              return (
                <TableRow key={expense.id} className={`group transition-colors ${i % 2 === 0 ? '' : 'bg-[rgba(120,120,128,0.02)]'} hover:bg-[rgba(0,122,255,0.03)]`}>
                  <TableCell className="pl-5 text-[13px] text-[var(--text-tertiary)] tracking-[-0.1px]">
                    {formatDate(expense.date, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[15px]"
                        style={{ background: `${color}18` }}
                      >
                        {emoji}
                      </div>
                      <span className="font-semibold text-[14px] text-[var(--text-primary)] tracking-[-0.2px]">{expense.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={expense.category} type="expense" />
                  </TableCell>
                  <TableCell className="text-[13px] capitalize text-[var(--text-secondary)] tracking-[-0.1px]">
                    {expense.payment_method}
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountDisplay amount={expense.amount} variant="danger" />
                  </TableCell>
                  <TableCell className="text-right pr-5">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(expense)}
                        className="h-8 w-8 text-[var(--apple-blue)] hover:bg-[rgba(0,122,255,0.1)]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(expense.id)}
                        className="h-8 w-8 text-[var(--apple-red)] hover:bg-[rgba(255,59,48,0.1)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
