"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AmountDisplay } from "@/components/shared/amount-display";
import { format, subMonths } from "date-fns";
import { useGuestData } from "@/lib/guest-data";
import {
  PeriodTotals,
  type CategoryAmount,
  type PeriodAmount,
} from "@/components/dashboard/period-totals";

const AnalyticsBarChart = dynamic(
  () => import("@/components/dashboard/analytics-chart").then((mod) => mod.AnalyticsBarChart),
  {
    ssr: false,
    loading: () => <div className="apple-card h-80 animate-pulse" />,
  }
);

interface MonthlyTrendItem {
  month: string;
  expenses: number;
  income: number;
}

interface AnalyticsData {
  monthlyTrend: MonthlyTrendItem[];
  months: PeriodAmount[];
  years: PeriodAmount[];
  allTime: Omit<PeriodAmount, "period">;
  stats: {
    dailyAverage: number;
    biggestExpense: number;
    monthOverMonthChange: number;
  };
}

interface AmountRow {
  amount: number | null;
}

interface DatedAmountRow extends AmountRow {
  date: string;
  category: string | null;
}

interface AggregatedPeriods {
  months: Map<string, number>;
  years: Map<string, number>;
  categoriesByMonth: Map<string, Map<string, number>>;
  categoriesByYear: Map<string, Map<string, number>>;
  categoriesAllTime: Map<string, number>;
  total: number;
}

async function getAggregatedPeriods(
  supabase: ReturnType<typeof createClient>,
  table: "expenses" | "income",
  userId: string
) {
  const pageSize = 1000;
  let start = 0;
  const result: AggregatedPeriods = {
    months: new Map(),
    years: new Map(),
    categoriesByMonth: new Map(),
    categoriesByYear: new Map(),
    categoriesAllTime: new Map(),
    total: 0,
  };

  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("amount, date, category")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .range(start, start + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data as DatedAmountRow[]) {
      const amount = Number(row.amount) || 0;
      const month = row.date.slice(0, 7);
      const year = row.date.slice(0, 4);
      result.months.set(month, (result.months.get(month) ?? 0) + amount);
      result.years.set(year, (result.years.get(year) ?? 0) + amount);
      const category = row.category?.trim() || "Uncategorized";
      const monthCategories = result.categoriesByMonth.get(month) ?? new Map<string, number>();
      monthCategories.set(category, (monthCategories.get(category) ?? 0) + amount);
      result.categoriesByMonth.set(month, monthCategories);
      const yearCategories = result.categoriesByYear.get(year) ?? new Map<string, number>();
      yearCategories.set(category, (yearCategories.get(category) ?? 0) + amount);
      result.categoriesByYear.set(year, yearCategories);
      result.categoriesAllTime.set(
        category,
        (result.categoriesAllTime.get(category) ?? 0) + amount
      );
      result.total += amount;
    }
    if (data.length < pageSize) break;
    start += pageSize;
  }

  return result;
}

function combinePeriodAmounts(expenses: AggregatedPeriods, income: AggregatedPeriods) {
  const months = new Set([...expenses.months.keys(), ...income.months.keys()]);
  const years = new Set([...expenses.years.keys(), ...income.years.keys()]);
  const categories = (source: Map<string, number> | undefined): CategoryAmount[] =>
    [...(source ?? new Map())]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

  return {
    months: [...months]
      .sort((a, b) => b.localeCompare(a))
      .map((period) => ({
        period,
        expenses: expenses.months.get(period) ?? 0,
        income: income.months.get(period) ?? 0,
        categories: categories(expenses.categoriesByMonth.get(period)),
      })),
    years: [...years]
      .sort((a, b) => b.localeCompare(a))
      .map((period) => ({
        period,
        expenses: expenses.years.get(period) ?? 0,
        income: income.years.get(period) ?? 0,
        categories: categories(expenses.categoriesByYear.get(period)),
      })),
    allTime: {
      expenses: expenses.total,
      income: income.total,
      categories: categories(expenses.categoriesAllTime),
    },
  };
}

function aggregateGuestPeriods(
  expenses: { amount: number; date: string }[],
  income: { amount: number; date: string }[]
) {
  const aggregateRows = (rows: { amount: number; date: string; category?: string }[]) => {
    const result: AggregatedPeriods = {
      months: new Map(),
      years: new Map(),
      categoriesByMonth: new Map(),
      categoriesByYear: new Map(),
      categoriesAllTime: new Map(),
      total: 0,
    };
    for (const row of rows) {
      const amount = Number(row.amount) || 0;
      const month = row.date.slice(0, 7);
      const year = row.date.slice(0, 4);
      result.months.set(month, (result.months.get(month) ?? 0) + amount);
      result.years.set(year, (result.years.get(year) ?? 0) + amount);
      if (row.category) {
        const monthCategories = result.categoriesByMonth.get(month) ?? new Map<string, number>();
        monthCategories.set(row.category, (monthCategories.get(row.category) ?? 0) + amount);
        result.categoriesByMonth.set(month, monthCategories);
        const yearCategories = result.categoriesByYear.get(year) ?? new Map<string, number>();
        yearCategories.set(row.category, (yearCategories.get(row.category) ?? 0) + amount);
        result.categoriesByYear.set(year, yearCategories);
        result.categoriesAllTime.set(
          row.category,
          (result.categoriesAllTime.get(row.category) ?? 0) + amount
        );
      }
      result.total += amount;
    }
    return result;
  };

  return combinePeriodAmounts(aggregateRows(expenses), aggregateRows(income));
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    monthlyTrend: [],
    months: [],
    years: [],
    allTime: { expenses: 0, income: 0, categories: [] },
    stats: {
      dailyAverage: 0,
      biggestExpense: 0,
      monthOverMonthChange: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const guestData = useGuestData();

  useEffect(() => {
    if (guestData.isGuest) {
      const monthlyTrend: MonthlyTrendItem[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const month = date.getMonth();
        const year = date.getFullYear();
        monthlyTrend.push({
          month: format(date, "MMM"),
          expenses: guestData.expenses.filter((item) => {
            const value = new Date(item.date);
            return value.getMonth() === month && value.getFullYear() === year;
          }).reduce((sum, item) => sum + Number(item.amount), 0),
          income: guestData.income.filter((item) => {
            const value = new Date(item.date);
            return value.getMonth() === month && value.getFullYear() === year;
          }).reduce((sum, item) => sum + Number(item.amount), 0),
        });
      }
      const now = new Date();
      const year = now.getFullYear();
      const currentExpenses = guestData.expenses.filter((item) => {
        const value = new Date(item.date);
        return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear();
      });
      const total = currentExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
      const periodAmounts = aggregateGuestPeriods(guestData.expenses, guestData.income);
      setData({
        monthlyTrend,
        ...periodAmounts,
        stats: {
          dailyAverage: Math.round(total / new Date(year, now.getMonth() + 1, 0).getDate()),
          biggestExpense: Math.max(0, ...currentExpenses.map((item) => Number(item.amount))),
          monthOverMonthChange: 0,
        },
      });
      setLoading(false);
    } else fetchAnalytics();
  }, [guestData.isGuest, guestData.expenses, guestData.income]);

  const fetchAnalytics = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setLoading(true);

    try {
      const monthlyData: Record<string, MonthlyTrendItem> = {};

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data: expenseRows } = await supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user.id)
          .gte("date", format(monthStart, "yyyy-MM-dd"))
          .lte("date", format(monthEnd, "yyyy-MM-dd"))
          .range(0, 499);

        const { data: incomeRows } = await supabase
          .from("income")
          .select("amount")
          .eq("user_id", user.id)
          .gte("date", format(monthStart, "yyyy-MM-dd"))
          .lte("date", format(monthEnd, "yyyy-MM-dd"))
          .range(0, 499);

        const expenses = (expenseRows ?? []) as AmountRow[];
        const income = (incomeRows ?? []) as AmountRow[];
        const expenseSum = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        const incomeSum = income.reduce((sum, item) => sum + (item.amount || 0), 0);

        monthlyData[format(monthStart, "MMM")] = {
          month: format(monthStart, "MMM"),
          expenses: expenseSum,
          income: incomeSum,
        };
      }

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const [expensePeriods, incomePeriods] = await Promise.all([
        getAggregatedPeriods(supabase, "expenses", user.id),
        getAggregatedPeriods(supabase, "income", user.id),
      ]);

      const { data: currentExpenseRows } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))
        .range(0, 499);

      const currentExpenses = (currentExpenseRows ?? []) as AmountRow[];
      const totalExpenses = currentExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
      const daysInMonth = monthEnd.getDate();
      const dailyAverage = Math.round(totalExpenses / daysInMonth);
      const biggestExpense = Math.max(...currentExpenses.map((item) => item.amount || 0), 0);

      setData({
        monthlyTrend: Object.values(monthlyData),
        ...combinePeriodAmounts(expensePeriods, incomePeriods),
        stats: {
          dailyAverage,
          biggestExpense,
          monthOverMonthChange: 5.2,
        },
      });
    } catch {
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader title="📊 Analytics" description="Insights into your spending and income patterns" />
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="apple-card h-32 animate-pulse" />
            ))}
          </div>
          <div className="apple-card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader title="📊 Analytics" description="Insights into your spending and income patterns" />

      <div className="space-y-6">
        <PeriodTotals months={data.months} years={data.years} allTime={data.allTime} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium text-[var(--text-secondary)]">
                📅 Daily Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[28px] font-semibold">
                <AmountDisplay amount={data.stats.dailyAverage} />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium text-[var(--text-secondary)]">
                🔥 Biggest Expense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[28px] font-semibold">
                <AmountDisplay amount={data.stats.biggestExpense} variant="danger" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium text-[var(--text-secondary)]">
                📈 Month-over-Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[28px] font-semibold text-[var(--apple-green)]">
                +{data.stats.monthOverMonthChange}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Chart */}
        <AnalyticsBarChart monthlyTrend={data.monthlyTrend} />
      </div>
    </div>
  );
}
