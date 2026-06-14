import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { PageHeader } from "@/components/shared/page-header";
import { format, startOfDay, endOfMonth, subMonths } from "date-fns";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import ChartsClient from "@/components/dashboard/charts-client";
import { LoanDashboardWidget } from "@/components/loans/loan-dashboard-widget";
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

  // Previous month dates
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
    // Fetch active loans for the dashboard widget
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

  // Calculate totals
  const totalSpentToday = todayExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalSpentMonth = monthExpenseSummary.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );
  const totalSpentPrevMonth = prevMonthExpenses.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );
  const totalIncomeMonth = monthIncome.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const netBalance = totalIncomeMonth - totalSpentMonth;

  // Month-over-month change percentage (positive = spending went down = good)
  let monthOverMonthChange = 0;
  if (totalSpentPrevMonth > 0) {
    monthOverMonthChange = ((totalSpentPrevMonth - totalSpentMonth) / totalSpentPrevMonth) * 100;
  } else if (totalSpentMonth > 0) {
    monthOverMonthChange = -100; // spending went from 0 to something = 100% increase
  }

  // Generate daily spending data for chart
  const dailyData = Array.from(
    { length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() },
    (_, i) => {
      const day = i + 1;
      const dayString = format(new Date(today.getFullYear(), today.getMonth(), day), "yyyy-MM-dd");
      const dayExpenses = monthExpenses.filter((exp) => exp.date === dayString);
      const amount = dayExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      return { day, amount };
    }
  );

  // Generate category breakdown data
  const categoryData = monthExpenseSummary.map((item) => ({
    name: item.category,
    value: Number(item.total) || 0,
  }));

  // Combine and sort recent transactions
  const allTransactions = [
    ...recentExpenses.map((exp) => ({
      id: exp.id,
      type: "expense" as const,
      title: exp.title,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
    })),
    ...recentIncome.map((inc) => ({
      id: inc.id,
      type: "income" as const,
      title: inc.title,
      amount: inc.amount,
      category: inc.category,
      date: inc.date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="page-enter">
      <PageHeader
        title="📊 Dashboard"
        description="Welcome back! Here's your financial overview."
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
          <ChartsClient
            dailyData={dailyData}
            categoryData={categoryData.length > 0 ? categoryData : [{ name: "No data", value: 1 }]}
          />
          {activeLoans.length > 0 && (
            <LoanDashboardWidget
              loans={activeLoans}
              monthlyIncome={totalIncomeMonth}
            />
          )}
        </div>

        <RecentTransactions transactions={allTransactions} />
      </div>
    </div>
  );
}
