import React from "react";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import ChartsClient from "@/components/dashboard/charts-client";
import { LoanDashboardWidget } from "@/components/loans/loan-dashboard-widget";
import { DashboardSnapshot } from "@/components/dashboard/dashboard-snapshot";
import type { UserLoan } from "@/types/loan.types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const today = new Date();
  const todayStart = startOfDay(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = endOfMonth(today);
  const prevMonthStart = subMonths(monthStart, 1);

  const todayDate = format(todayStart, "yyyy-MM-dd");
  const monthStartDate = format(monthStart, "yyyy-MM-dd");
  const monthEndDate = format(monthEnd, "yyyy-MM-dd");
  const prevMonthDate = format(prevMonthStart, "yyyy-MM-dd");

  const [
    { data: todayExpensesData },
    { data: monthExpensesData },
    { data: monthExpenseSummaryData },
    { data: prevMonthExpenseSummary },
    { data: monthIncomeData },
    { data: recentExpensesData },
    { data: recentIncomeData },
    { data: activeLoansData },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .eq("date", todayDate)
      .range(0, 99),
    supabase
      .from("expenses")
      .select("amount, category, date")
      .eq("user_id", user.id)
      .gte("date", monthStartDate)
      .lte("date", monthEndDate)
      .range(0, 499),
    supabase
      .from("monthly_expense_summary")
      .select("category, total")
      .eq("user_id", user.id)
      .eq("month", monthStartDate)
      .range(0, 19),
    supabase
      .from("monthly_expense_summary")
      .select("total")
      .eq("user_id", user.id)
      .eq("month", prevMonthDate)
      .range(0, 99),
    supabase
      .from("income")
      .select("amount")
      .eq("user_id", user.id)
      .gte("date", monthStartDate)
      .lte("date", monthEndDate)
      .range(0, 99),
    supabase
      .from("expenses")
      .select("id, title, amount, category, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .range(0, 9),
    supabase
      .from("income")
      .select("id, title, amount, category, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .range(0, 9),
    supabase
      .from("user_loans")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  const todayExpenses = todayExpensesData ?? [];
  const monthExpenses = monthExpensesData ?? [];
  const monthExpenseSummary = monthExpenseSummaryData ?? [];
  const prevMonthExpenses = prevMonthExpenseSummary ?? [];
  const monthIncome = monthIncomeData ?? [];
  const recentExpenses = recentExpensesData ?? [];
  const recentIncome = recentIncomeData ?? [];
  const activeLoans = (activeLoansData ?? []) as UserLoan[];

  const totalSpentToday = todayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalSpentMonth = monthExpenseSummary.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );
  const totalSpentPrevMonth = prevMonthExpenses.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );
  const totalIncomeMonth = monthIncome.reduce((sum, income) => sum + (income.amount || 0), 0);
  const netBalance = totalIncomeMonth - totalSpentMonth;
  const dailyAverage = today.getDate() > 0 ? totalSpentMonth / today.getDate() : 0;
  const savingsRate = totalIncomeMonth > 0 ? (netBalance / totalIncomeMonth) * 100 : 0;
  const boundedSavingsRate = Math.max(-100, Math.min(100, savingsRate));

  let monthOverMonthChange = 0;
  if (totalSpentPrevMonth > 0) {
    monthOverMonthChange = ((totalSpentPrevMonth - totalSpentMonth) / totalSpentPrevMonth) * 100;
  } else if (totalSpentMonth > 0) {
    monthOverMonthChange = -100;
  }

  const dailyData = Array.from(
    { length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() },
    (_, i) => {
      const day = i + 1;
      const dayString = format(new Date(today.getFullYear(), today.getMonth(), day), "yyyy-MM-dd");
      const dayExpenses = monthExpenses.filter((expense) => expense.date === dayString);
      const amount = dayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      return { day, amount };
    }
  );

  const categoryData = monthExpenseSummary.map((item) => ({
    name: item.category,
    value: Number(item.total) || 0,
  }));
  const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];

  const allTransactions = [
    ...recentExpenses.map((expense) => ({
      id: expense.id,
      type: "expense" as const,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    })),
    ...recentIncome.map((income) => ({
      id: income.id,
      type: "income" as const,
      title: income.title,
      amount: income.amount,
      category: income.category,
      date: income.date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <div className="page-enter">
      <DashboardSnapshot
        userName={userName}
        monthLabel={format(today, "MMMM yyyy")}
        totalIncome={totalIncomeMonth}
        totalSpentMonth={totalSpentMonth}
        netBalance={netBalance}
        dailyAverage={dailyAverage}
        savingsRate={boundedSavingsRate}
        topCategory={topCategory}
        action={
          <div className="flex items-center gap-2">
            <AddExpenseDialog />
            <AddIncomeDialog />
          </div>
        }
      />

      <div className="space-y-6">
        <SummaryCards
          totalSpentToday={totalSpentToday}
          totalSpentMonth={totalSpentMonth}
          totalIncome={totalIncomeMonth}
          netBalance={netBalance}
          monthOverMonthChange={monthOverMonthChange}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartsClient dailyData={dailyData} categoryData={categoryData} />
          {activeLoans.length > 0 && (
            <LoanDashboardWidget loans={activeLoans} monthlyIncome={totalIncomeMonth} />
          )}
        </div>

        <RecentTransactions transactions={allTransactions} />
      </div>
    </div>
  );
}
