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

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>💳 Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-[15px] text-[var(--text-secondary)]">
            No transactions yet.
          </div>
        ) : (
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
              {transactions.slice(0, 5).map((transaction) => (
                <TableRow key={transaction.id}>
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
        )}
      </CardContent>
    </Card>
  );
}
