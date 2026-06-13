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
      <CardHeader className="pb-2">
        <CardTitle className="text-[17px]">💳 Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-[15px] text-[var(--text-secondary)]">
            No transactions yet.
          </div>
        ) : (
          <>
            {/* Mobile: card rows */}
            <div className="md:hidden divide-y divide-[var(--separator)]">
              {shown.map((tx) => {
                const emoji = getCategoryEmoji(tx.category, tx.type);
                const color = getCategoryColor(tx.category, tx.type);
                return (
                  <div key={tx.id} className="tx-card">
                    <div
                      className="tx-card-icon"
                      style={{ background: `${color}18` }}
                    >
                      <span>{emoji}</span>
                    </div>
                    <div className="tx-card-body">
                      <div className="tx-card-title">{tx.title}</div>
                      <div className="tx-card-sub">{tx.category} · {formatDateShort(tx.date)}</div>
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
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((transaction) => (
                    <TableRow key={transaction.id} className="group hover:bg-[rgba(120,120,128,0.03)] transition-colors">
                      <TableCell className="font-medium">{transaction.title}</TableCell>
                      <TableCell>
                        <CategoryBadge category={transaction.category} type={transaction.type} />
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--text-tertiary)]">
                        {formatDateShort(transaction.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <AmountDisplay
                          amount={transaction.amount}
                          variant={transaction.type === "expense" ? "danger" : "success"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
