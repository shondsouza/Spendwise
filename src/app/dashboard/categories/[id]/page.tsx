"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Expense, Income } from "@/types";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountDisplay } from "@/components/shared/amount-display";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils/date";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/config";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const categoryName = decodeURIComponent(params.id as string);

  // Find category info from defaults
  const defaultExpenseCat = EXPENSE_CATEGORIES.find(c => c.label === categoryName);
  const defaultIncomeCat = INCOME_CATEGORIES.find(c => c.label === categoryName);
  const categoryEmoji = defaultExpenseCat?.emoji || defaultIncomeCat?.emoji || "📂";

  const fetchData = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("category", name)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;

      const { data: incomeData, error: incomeError } = await supabase
        .from("income")
        .select("*")
        .eq("category", name)
        .order("date", { ascending: false });

      if (incomeError) throw incomeError;

      setExpenses(expensesData || []);
      setIncome(incomeData || []);
    } catch {
      toast.error("Failed to load category transactions");
      router.push("/dashboard/categories");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.id) {
      fetchData(categoryName);
    }
  }, [params.id, categoryName, fetchData]);

  const totalExpenses =
    expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const totalIncome =
    income.reduce((sum, inc) => sum + (inc.amount || 0), 0) || 0;

  const allTransactions = [
    ...expenses.map((exp) => ({
      ...exp,
      type: "expense" as const,
    })),
    ...income.map((inc) => ({
      ...inc,
      type: "income" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="page-enter">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => router.push("/dashboard/categories")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Categories
      </Button>

      {loading ? (
        <div className="space-y-6">
          <div className="h-16 w-64 animate-pulse rounded-xl bg-[rgba(120,120,128,0.12)]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="apple-card h-32 animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[rgba(120,120,128,0.12)]" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <PageHeader
            title={`${categoryEmoji} ${categoryName}`}
            description={`All transactions for ${categoryName}`}
          />

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay
                  amount={totalExpenses}
                  variant="danger"
                  className="text-2xl"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay
                  amount={totalIncome}
                  variant="success"
                  className="text-2xl"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Net Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay
                  amount={totalIncome - totalExpenses}
                  className="text-2xl"
                />
              </CardContent>
            </Card>
          </div>

          {allTransactions.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No transactions for this category"
              description="Add expenses or income with this category to see them here"
            />
          ) : (
            <div className="apple-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-[13px] text-[var(--text-tertiary)]">
                        {formatDate(transaction.date, "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.title}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                            transaction.type === "expense"
                              ? "bg-[rgba(255,59,48,0.12)] text-[var(--apple-red)]"
                              : "bg-[rgba(52,199,89,0.12)] text-[var(--apple-green)]"
                          }`}
                        >
                          {transaction.type.toUpperCase()}
                        </span>
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
          )}
        </>
      )}
    </div>
  );
}
