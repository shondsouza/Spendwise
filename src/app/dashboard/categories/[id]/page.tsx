"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Expense, Income, Category, Budget } from "@/types";
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
import { formatCurrency } from "@/lib/utils/currency";
import { ArrowLeft, FolderOpen, Target, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/config";
import { getBudgetCategoryKey, getCategoryAliases } from "@/lib/utils/category-aliases";

interface CategoryInfo {
  name: string;
  emoji: string;
  type: "expense" | "income" | "both";
  budgetKey: string;
}

const parseCategoryParam = (rawParam: string) => {
  if (rawParam.startsWith("default::")) {
    const [, type, ...valueParts] = rawParam.split("::");
    const value = valueParts.join("::");

    if (type === "expense") {
      const category = EXPENSE_CATEGORIES.find((item) => item.value === value);
      if (category) {
        return {
          kind: "default" as const,
          name: category.label,
          emoji: category.emoji,
          type: "expense" as const,
          queryValues: [category.value, category.label],
        };
      }
    }

    if (type === "income") {
      const category = INCOME_CATEGORIES.find((item) => item.value === value);
      if (category) {
        return {
          kind: "default" as const,
          name: category.label,
          emoji: category.emoji,
          type: "income" as const,
          queryValues: [category.value, category.label],
        };
      }
    }
  }

  if (rawParam.startsWith("custom::")) {
    return {
      kind: "custom" as const,
      id: rawParam.slice("custom::".length),
    };
  }

  const legacyExpense = EXPENSE_CATEGORIES.find(
    (item) => item.value === rawParam || item.label === rawParam
  );
  if (legacyExpense) {
    return {
      kind: "default" as const,
      name: legacyExpense.label,
      emoji: legacyExpense.emoji,
      type: "expense" as const,
      queryValues: [legacyExpense.value, legacyExpense.label],
    };
  }

  const legacyIncome = INCOME_CATEGORIES.find(
    (item) => item.value === rawParam || item.label === rawParam
  );
  if (legacyIncome) {
    return {
      kind: "default" as const,
      name: legacyIncome.label,
      emoji: legacyIncome.emoji,
      type: "income" as const,
      queryValues: [legacyIncome.value, legacyIncome.label],
    };
  }

  return {
    kind: "legacy-custom-name" as const,
    name: rawParam,
  };
};

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [showLimitInput, setShowLimitInput] = useState(false);
  const [limitValue, setLimitValue] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);
  const categoryParam = decodeURIComponent(params.id as string);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fetchData = useCallback(
    async (rawParam: string) => {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Unauthorized");
        }

        const resolvedCategory = parseCategoryParam(rawParam);

        let nextCategoryInfo: CategoryInfo;
        let categoryValues: string[] = [];
        let fetchExpenses = true;
        let fetchIncome = true;

        if (resolvedCategory.kind === "default") {
          const [, defaultType, defaultValue] = rawParam.split("::");
          const { data: override } = await supabase
            .from("categories")
            .select("name, type, emoji, is_deleted")
            .eq("user_id", user.id)
            .eq("default_key", `${defaultType}:${defaultValue}`)
            .maybeSingle();

          if (override?.is_deleted) {
            throw new Error("Category not found");
          }

          const budgetKey = getBudgetCategoryKey(defaultValue || resolvedCategory.name);
          nextCategoryInfo = {
            name: override?.name ?? resolvedCategory.name,
            emoji: override?.emoji ?? resolvedCategory.emoji,
            type: override?.type ?? resolvedCategory.type,
            budgetKey,
          };
          categoryValues = Array.from(
            new Set([
              ...resolvedCategory.queryValues,
              ...(override?.name ? [override.name] : []),
              ...getCategoryAliases(budgetKey),
            ])
          );
          fetchExpenses = nextCategoryInfo.type !== "income";
          fetchIncome = nextCategoryInfo.type !== "expense";
        } else if (resolvedCategory.kind === "custom") {
          const { data: category, error: categoryError } = await supabase
            .from("categories")
            .select("*")
            .eq("id", resolvedCategory.id)
            .eq("user_id", user.id)
            .single<Category>();

          if (categoryError || !category) {
            throw categoryError || new Error("Category not found");
          }

          nextCategoryInfo = {
            name: category.name,
            emoji: category.emoji,
            type: category.type,
            budgetKey: category.name,
          };
          categoryValues = [category.name];
          fetchExpenses = category.type === "expense" || category.type === "both";
          fetchIncome = category.type === "income" || category.type === "both";
        } else {
          nextCategoryInfo = {
            name: resolvedCategory.name,
            emoji: "📂",
            type: "both",
            budgetKey: getBudgetCategoryKey(resolvedCategory.name),
          };
          categoryValues = Array.from(
            new Set([resolvedCategory.name, ...getCategoryAliases(resolvedCategory.name)])
          );
        }

        setCategoryInfo(nextCategoryInfo);

        const expensesQuery = fetchExpenses
          ? supabase
              .from("expenses")
              .select("*")
              .eq("user_id", user.id)
              .in("category", categoryValues)
              .order("date", { ascending: false })
          : Promise.resolve({ data: [], error: null });

        const incomeQuery = fetchIncome
          ? supabase
              .from("income")
              .select("*")
              .eq("user_id", user.id)
              .in("category", categoryValues)
              .order("date", { ascending: false })
          : Promise.resolve({ data: [], error: null });

        // Load recurring monthly budget for this category.
        // Prefer current month; otherwise carry forward the latest previous limit.
        const budgetQuery = supabase
          .from("budgets")
          .select("id, user_id, category, amount, month, year, created_at")
          .eq("user_id", user.id)
          .in("category", categoryValues)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        const [expensesResult, incomeResult, budgetResult] = await Promise.all([
          expensesQuery,
          incomeQuery,
          budgetQuery,
        ]);

        if (expensesResult.error) throw expensesResult.error;
        if (incomeResult.error) throw incomeResult.error;
        if (budgetResult.error) throw budgetResult.error;

        setExpenses((expensesResult.data as Expense[]) || []);
        setIncome((incomeResult.data as Income[]) || []);

        const budgetRows = (budgetResult.data as Budget[] | null) ?? [];
        const currentMonthBudget =
          budgetRows.find(
            (row) => Number(row.month) === currentMonth && Number(row.year) === currentYear
          ) ?? null;
        const latestBudget = budgetRows[0] ?? null;

        let loadedBudget: Budget | null = null;
        if (currentMonthBudget) {
          loadedBudget = {
            ...currentMonthBudget,
            amount: Number(currentMonthBudget.amount) || 0,
          };
        } else if (latestBudget) {
          // Carry the monthly limit into the new month with a fresh spend counter.
          const { data: carried, error: carryError } = await supabase
            .from("budgets")
            .upsert(
              {
                user_id: user.id,
                category: nextCategoryInfo.budgetKey,
                amount: Number(latestBudget.amount) || 0,
                month: currentMonth,
                year: currentYear,
              },
              { onConflict: "user_id,category,month,year" }
            )
            .select("id, user_id, category, amount, month, year, created_at")
            .single();

          if (!carryError && carried) {
            loadedBudget = {
              ...(carried as Budget),
              amount: Number((carried as Budget).amount) || 0,
            };
          } else {
            loadedBudget = {
              ...latestBudget,
              amount: Number(latestBudget.amount) || 0,
              month: currentMonth,
              year: currentYear,
            };
          }
        }

        setBudget(loadedBudget);
      } catch {
        toast.error("Failed to load category transactions");
        router.push("/dashboard/categories");
      } finally {
        setLoading(false);
      }
    },
    [router, currentMonth, currentYear]
  );

  useEffect(() => {
    if (params.id) {
      fetchData(categoryParam);
    }
  }, [params.id, categoryParam, fetchData]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  const totalIncome = income.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0) || 0;

  // Current month's spending only (for limit tracking)
  const thisMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const spentThisMonth = expenses
    .filter((e) => e.date.startsWith(thisMonthStr))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSaveLimit = async () => {
    const amount = parseFloat(limitValue);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSavingLimit(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const catKey = categoryInfo?.budgetKey || getBudgetCategoryKey(categoryInfo?.name || "");
      const { data, error } = await supabase
        .from("budgets")
        .upsert(
          {
            user_id: user.id,
            category: catKey,
            amount,
            month: currentMonth,
            year: currentYear,
          },
          { onConflict: "user_id,category,month,year" }
        )
        .select("id, user_id, category, amount, month, year, created_at")
        .single();
      if (error) throw error;
      setBudget({
        ...(data as Budget),
        amount: Number((data as Budget).amount) || 0,
      });
      toast.success("Monthly spending limit saved!");
      setShowLimitInput(false);
      setLimitValue("");
    } catch {
      toast.error("Failed to save spending limit");
    } finally {
      setSavingLimit(false);
    }
  };

  const handleRemoveLimit = async () => {
    if (!budget || !categoryInfo) return;
    if (!confirm("Remove the monthly spending limit for this category?")) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const aliases = getCategoryAliases(categoryInfo.budgetKey);
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("user_id", user.id)
        .in("category", aliases);
      if (error) throw error;
      setBudget(null);
      toast.success("Spending limit removed");
    } catch {
      toast.error("Failed to remove spending limit");
    }
  };

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

  const monthlyStats = React.useMemo(() => {
    const stats: Record<string, { expenses: number; income: number; sortDate: number }> = {};
    
    allTransactions.forEach((t) => {
      const date = new Date(t.date);
      const monthYear = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!stats[monthYear]) {
        stats[monthYear] = {
          expenses: 0,
          income: 0,
          sortDate: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
        };
      }
      if (t.type === "expense") {
        stats[monthYear].expenses += (t.amount || 0);
      } else {
        stats[monthYear].income += (t.amount || 0);
      }
    });

    return Object.entries(stats)
      .map(([monthYear, data]) => ({ monthYear, ...data }))
      .sort((a, b) => b.sortDate - a.sortDate);
  }, [allTransactions]);

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
            title={`${categoryInfo?.emoji || "📂"} ${categoryInfo?.name || "Category"}`}
            description={`All transactions for ${categoryInfo?.name || "this category"}`}
          />

          {/* Spending Limit Card — only for expense/both categories */}
          {categoryInfo?.type !== "income" && (
            <div className="mb-6">
              {!budget && !showLimitInput && (
                <button
                  onClick={() => {
                    setShowLimitInput(true);
                    setLimitValue("");
                  }}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--apple-blue)] px-4 py-3 text-[14px] font-medium text-[var(--apple-blue)] transition-all hover:bg-[rgba(0,122,255,0.06)] w-full sm:w-auto"
                >
                  <Target className="h-4 w-4" />
                  Set Monthly Spending Limit
                </button>
              )}

              {(budget || showLimitInput) && (
                <div className="apple-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-[var(--apple-blue)]" />
                      <span className="font-semibold text-[15px] text-[var(--text-primary)]">
                        Monthly Spending Limit
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {budget && !showLimitInput && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--apple-blue)]"
                            onClick={() => {
                              setLimitValue(String(budget.amount));
                              setShowLimitInput(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--apple-red)] hover:text-[var(--apple-red)]"
                            onClick={handleRemoveLimit}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {showLimitInput && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--text-secondary)]"
                          onClick={() => { setShowLimitInput(false); setLimitValue(""); }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {showLimitInput ? (
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm font-medium">₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Enter limit amount"
                          value={limitValue}
                          onChange={(e) => setLimitValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveLimit()}
                          className="w-full rounded-xl border border-[var(--separator)] bg-[rgba(120,120,128,0.08)] px-3 py-2 pl-7 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--apple-blue)] focus:ring-2 focus:ring-[rgba(0,122,255,0.15)]"
                          autoFocus
                        />
                      </div>
                      <Button
                        size="sm"
                        disabled={savingLimit}
                        onClick={handleSaveLimit}
                        className="gap-1.5 bg-[var(--apple-blue)] text-white hover:bg-[var(--apple-blue)]/90"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {savingLimit ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  ) : budget ? (
                    <>
                      {/* Progress bar */}
                      {(() => {
                        const limit = Number(budget.amount) || 0;
                        const pct = limit > 0 ? Math.min((spentThisMonth / limit) * 100, 100) : 0;
                        const remaining = limit - spentThisMonth;
                        const overBudget = remaining < 0;
                        return (
                          <div className="space-y-3">
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-[12px] text-[var(--text-secondary)] mb-0.5">
                                  {overBudget ? "Over by" : "Remaining"}
                                </p>
                                <p className={`text-[22px] font-bold tabular-nums ${
                                  overBudget ? "text-[var(--apple-red)]" : "text-[var(--apple-green)]"
                                }`}>{formatCurrency(Math.abs(remaining))}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[12px] text-[var(--text-secondary)] mb-0.5">Monthly limit</p>
                                <p className="text-[15px] font-semibold text-[var(--text-primary)]">{formatCurrency(limit)}</p>
                                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                                  {formatCurrency(spentThisMonth)} spent
                                </p>
                              </div>
                            </div>

                            <div className="relative h-2.5 w-full rounded-full bg-[rgba(120,120,128,0.15)] overflow-hidden">
                              <div
                                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: overBudget
                                    ? "var(--apple-red)"
                                    : pct > 80
                                    ? "var(--apple-orange)"
                                    : "var(--apple-blue)",
                                }}
                              />
                            </div>

                            <p className={`text-[13px] font-medium ${
                              overBudget
                                ? "text-[var(--apple-red)]"
                                : pct > 80
                                ? "text-[var(--apple-orange)]"
                                : "text-[var(--apple-green)]"
                            }`}>
                              {overBudget
                                ? `Budget exceeded this month`
                                : `${formatCurrency(remaining)} left this month · resets next month`}
                            </p>
                          </div>
                        );
                      })()}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {categoryInfo?.type !== "income" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AmountDisplay amount={totalExpenses} variant="danger" className="text-2xl" />
                </CardContent>
              </Card>
            )}

            {categoryInfo?.type !== "expense" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                    Total Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AmountDisplay amount={totalIncome} variant="success" className="text-2xl" />
                </CardContent>
              </Card>
            )}

            {categoryInfo?.type === "both" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                    Net Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AmountDisplay amount={totalIncome - totalExpenses} className="text-2xl" />
                </CardContent>
              </Card>
            )}
          </div>

          {allTransactions.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No transactions for this category"
              description="Add expenses or income with this category to see them here"
            />
          ) : (
            <>
              {monthlyStats.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Monthly Summary</h3>
                  <div className="apple-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          {categoryInfo?.type !== "income" && (
                            <TableHead className="text-right">Expenses</TableHead>
                          )}
                          {categoryInfo?.type !== "expense" && (
                            <TableHead className="text-right">Income</TableHead>
                          )}
                          {categoryInfo?.type === "both" && (
                            <TableHead className="text-right">Net</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyStats.map((stat) => (
                          <TableRow key={stat.monthYear}>
                            <TableCell className="font-medium">{stat.monthYear}</TableCell>
                            {categoryInfo?.type !== "income" && (
                              <TableCell className="text-right">
                                <AmountDisplay amount={stat.expenses} variant="danger" />
                              </TableCell>
                            )}
                            {categoryInfo?.type !== "expense" && (
                              <TableCell className="text-right">
                                <AmountDisplay amount={stat.income} variant="success" />
                              </TableCell>
                            )}
                            {categoryInfo?.type === "both" && (
                              <TableCell className="text-right">
                                <AmountDisplay amount={stat.income - stat.expenses} />
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-medium text-[var(--text-primary)]">All Transactions</h3>
              </div>
              <div className="apple-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    {categoryInfo?.type === "both" && <TableHead>Type</TableHead>}
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-[13px] text-[var(--text-tertiary)]">
                        {formatDate(transaction.date, "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.title}</TableCell>
                      {categoryInfo?.type === "both" && (
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
                      )}
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
        </>
      )}
    </div>
  );
}
