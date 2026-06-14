import React from "react";
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

function getCategoryEmoji(category: string, type: "expense" | "income"): string {
  const list = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const found = list.find((c) => c.value === category || c.label === category);
  return found?.emoji || (type === "expense" ? "💳" : "💰");
}

function getCategoryColor(category: string, type: "expense" | "income"): string {
  const list = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const found = list.find((c) => c.value === category || c.label === category);
  return found?.color || (type === "expense" ? "#ff3b30" : "#34c759");
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const shown = transactions.slice(0, 8);

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-0 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[17px] font-bold tracking-[-0.3px]">Recent Transactions</CardTitle>
          {transactions.length > 0 && (
            <span className="text-[12px] font-medium text-[var(--text-tertiary)]">
              Last {Math.min(shown.length, transactions.length)} of {transactions.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-3">
        {transactions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-[15px] font-semibold text-[var(--text-secondary)]">No transactions yet</p>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1">Add your first expense or income to get started</p>
          </div>
        ) : (
          <>
            {/* Mobile: card rows */}
            <div className="md:hidden divide-y divide-[var(--separator)]">
              {shown.map((tx) => {
                const emoji = getCategoryEmoji(tx.category, tx.type);
                const color = getCategoryColor(tx.category, tx.type);
                const isIncome = tx.type === "income";
                return (
                  <div key={tx.id} className="tx-card">
                    {/* Left color accent strip */}
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                      style={{ background: isIncome ? "var(--apple-green)" : "var(--apple-red)" }}
                    />
                    <div
                      className="tx-card-icon ml-2"
                      style={{ background: `${color}18` }}
                    >
                      <span>{emoji}</span>
                    </div>
                    <div className="tx-card-body">
                      <div className="tx-card-title">{tx.title}</div>
                      <div className="tx-card-sub flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.4px]"
                          style={{
                            background: isIncome ? "rgba(52,199,89,0.12)" : "rgba(255,59,48,0.10)",
                            color: isIncome ? "var(--apple-green)" : "var(--apple-red)",
                          }}
                        >
                          {isIncome ? "IN" : "EX"}
                        </span>
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span>{formatDateShort(tx.date)}</span>
                      </div>
                    </div>
                    <AmountDisplay
                      amount={tx.amount}
                      variant={tx.type === "expense" ? "danger" : "success"}
                      className="tx-card-amount text-[15px]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5 text-[11px] font-semibold uppercase tracking-[0.5px]">Description</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.5px]">Category</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-[0.5px]">Date</TableHead>
                    <TableHead className="text-right pr-5 text-[11px] font-semibold uppercase tracking-[0.5px]">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((transaction, i) => {
                    const emoji = getCategoryEmoji(transaction.category, transaction.type);
                    const color = getCategoryColor(transaction.category, transaction.type);
                    return (
                      <TableRow
                        key={transaction.id}
                        className={`group transition-colors ${
                          i % 2 === 0 ? "" : "bg-[rgba(120,120,128,0.02)]"
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
                            <span className="font-semibold text-[14px] text-[var(--text-primary)] tracking-[-0.2px]">
                              {transaction.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={transaction.category} type={transaction.type} />
                        </TableCell>
                        <TableCell className="text-[13px] text-[var(--text-tertiary)] tracking-[-0.1px]">
                          {formatDateShort(transaction.date)}
                        </TableCell>
                        <TableCell className="text-right pr-5">
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
