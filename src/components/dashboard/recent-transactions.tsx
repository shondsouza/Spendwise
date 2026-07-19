"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AmountDisplay } from "@/components/shared/amount-display";
import { CategoryBadge } from "@/components/shared/category-badge";
import { formatDateShort } from "@/lib/utils/date";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";

interface Transaction {
  id: string;
  type: "expense" | "income";
  title: string;
  amount: number;
  category: string;
  date: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

type FilterType = "all" | "expense" | "income";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "income", label: "Income" },
];

function getCategoryEmoji(category: string, type: "expense" | "income"): string {
  const list = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const found = list.find((item) => item.value === category || item.label === category);
  return found?.emoji || (type === "expense" ? "💳" : "💰");
}

function getCategoryColor(category: string, type: "expense" | "income"): string {
  const list = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const found = list.find((item) => item.value === category || item.label === category);
  return found?.color || (type === "expense" ? "#ff3b30" : "#34c759");
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered =
    filter === "all" ? transactions : transactions.filter((tx) => tx.type === filter);
  const shown = filtered.slice(0, 8);

  const viewAllHref =
    filter === "income" ? "/dashboard/income" : "/dashboard/expenses";

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="px-5 pb-0 pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-[17px] font-bold tracking-[-0.3px]">
              Recent Activity
            </CardTitle>
            {transactions.length > 0 && (
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {filtered.length === 0
                  ? `No ${filter === "all" ? "transactions" : filter === "expense" ? "expenses" : "income entries"} yet`
                  : `Latest ${Math.min(shown.length, filtered.length)} of ${filtered.length}`}
              </p>
            )}
          </div>

          {transactions.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full bg-[rgba(120,120,128,0.10)] p-0.5">
                {filters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-200",
                      filter === item.value
                        ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {filtered.length > 0 && (
                <Link
                  href={viewAllHref}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[var(--apple-blue)] transition-colors hover:bg-[rgba(0,122,255,0.08)]"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="mt-3 p-0">
        {transactions.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(120,120,128,0.10)] text-[var(--text-secondary)]">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
              No transactions yet
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
              Add your first expense or income to get started and bring your dashboard to life.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <AddExpenseDialog />
              <AddIncomeDialog />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[14px] font-medium text-[var(--text-secondary)]">
              Nothing in this category yet.
            </p>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-2 text-[13px] font-semibold text-[var(--apple-blue)] hover:underline"
            >
              Show all transactions
            </button>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-[var(--separator)]">
              {shown.map((transaction) => {
                const emoji = getCategoryEmoji(transaction.category, transaction.type);
                const color = getCategoryColor(transaction.category, transaction.type);
                const isIncome = transaction.type === "income";

                return (
                  <div key={transaction.id} className="tx-card">
                    <div
                      className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full"
                      style={{
                        background: isIncome ? "var(--apple-green)" : "var(--apple-red)",
                      }}
                    />
                    <div className="tx-card-icon ml-2" style={{ background: `${color}18` }}>
                      <span>{emoji}</span>
                    </div>
                    <div className="tx-card-body">
                      <div className="tx-card-title">{transaction.title}</div>
                      <div className="tx-card-sub flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.4px]"
                          style={{
                            background: isIncome
                              ? "rgba(52,199,89,0.12)"
                              : "rgba(255,59,48,0.10)",
                            color: isIncome ? "var(--apple-green)" : "var(--apple-red)",
                          }}
                        >
                          {isIncome ? "IN" : "OUT"}
                        </span>
                        <span className="truncate">{transaction.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateShort(transaction.date)}</span>
                      </div>
                    </div>
                    <AmountDisplay
                      amount={transaction.amount}
                      variant={transaction.type === "expense" ? "danger" : "success"}
                      className="tx-card-amount text-[15px]"
                    />
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5 text-[11px] font-semibold uppercase tracking-[0.5px]">
                      Description
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.5px]">
                      Category
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.5px]">
                      Date
                    </TableHead>
                    <TableHead className="pr-5 text-right text-[11px] font-semibold uppercase tracking-[0.5px]">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((transaction, index) => {
                    const emoji = getCategoryEmoji(transaction.category, transaction.type);
                    const color = getCategoryColor(transaction.category, transaction.type);

                    return (
                      <TableRow
                        key={transaction.id}
                        className={`group transition-colors ${
                          index % 2 === 0 ? "" : "bg-[rgba(120,120,128,0.02)]"
                        } hover:bg-[rgba(0,122,255,0.03)]`}
                      >
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[15px]"
                              style={{ background: `${color}18` }}
                            >
                              {emoji}
                            </div>
                            <span className="font-semibold text-[14px] tracking-[-0.2px] text-[var(--text-primary)]">
                              {transaction.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={transaction.category} type={transaction.type} />
                        </TableCell>
                        <TableCell className="text-[13px] tracking-[-0.1px] text-[var(--text-tertiary)]">
                          {formatDateShort(transaction.date)}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <AmountDisplay
                            amount={transaction.amount}
                            variant={transaction.type === "expense" ? "danger" : "success"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
