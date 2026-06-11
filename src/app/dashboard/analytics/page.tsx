"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AmountDisplay } from "@/components/shared/amount-display";
import { format, subMonths } from "date-fns";

const AnalyticsLineChart = dynamic(
  () => import("@/components/dashboard/analytics-chart").then((mod) => mod.AnalyticsLineChart),
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
  stats: {
    dailyAverage: number;
    biggestExpense: number;
    monthOverMonthChange: number;
  };
}

interface AmountRow {
  amount: number | null;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    monthlyTrend: [],
    stats: {
      dailyAverage: 0,
      biggestExpense: 0,
      monthOverMonthChange: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
        <AnalyticsLineChart monthlyTrend={data.monthlyTrend} />
      </div>
    </div>
  );
}
