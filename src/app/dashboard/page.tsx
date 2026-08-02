import React from "react";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import ChartsClient from "@/components/dashboard/charts-client";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { ArrowUpRight, Plus } from "lucide-react";

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
  ]);

  const todayExpenses = todayExpensesData ?? [];
  const monthExpenses = monthExpensesData ?? [];
  const monthExpenseSummary = monthExpenseSummaryData ?? [];
  const prevMonthExpenses = prevMonthExpenseSummary ?? [];
  const monthIncome = monthIncomeData ?? [];
  const recentExpenses = recentExpensesData ?? [];
  const recentIncome = recentIncomeData ?? [];

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

  let monthOverMonthChange = 0;
  if (totalSpentPrevMonth > 0) {
    monthOverMonthChange = ((totalSpentPrevMonth - totalSpentMonth) / totalSpentPrevMonth) * 100;
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
  const firstName = user.user_metadata?.name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <div className="page-enter space-y-8">
      <MobileDashboard
        netBalance={netBalance}
        totalIncome={totalIncomeMonth}
        totalSpent={totalSpentMonth}
        monthOverMonthChange={monthOverMonthChange}
        categoryData={categoryData}
        transactions={allTransactions}
      />

      <div className="desktop-dashboard hidden space-y-8 md:block">
        <header className="desktop-dashboard-header">
          <div>
            <p className="desktop-dashboard-date">{format(today, "EEEE, MMMM d")}</p>
            <h1>Good to see you, {firstName}</h1>
            <p>Here&apos;s your financial pulse for this month.</p>
          </div>
          <div className="desktop-dashboard-actions">
            <AddIncomeDialog
              trigger={
                <button type="button" className="desktop-secondary-action">
                  <ArrowUpRight className="h-4 w-4" />
                  Add income
                </button>
              }
            />
            <AddExpenseDialog
              trigger={
                <button type="button" className="desktop-primary-action">
                  <Plus className="h-4 w-4" />
                  Add expense
                </button>
              }
            />
          </div>
        </header>

        <SummaryCards
          totalSpentToday={totalSpentToday}
          totalSpentMonth={totalSpentMonth}
          totalIncome={totalIncomeMonth}
          netBalance={netBalance}
          monthOverMonthChange={monthOverMonthChange}
          categoryData={categoryData}
        />

        <section className="desktop-analytics-section">
          <div className="desktop-section-title">
            <div>
              <p>Analytics</p>
              <h2>Spending insights</h2>
            </div>
            <span>This month</span>
          </div>
          <ChartsClient dailyData={dailyData} categoryData={categoryData} />
        </section>

        <section className="desktop-transactions-section">
          <RecentTransactions transactions={allTransactions} />
        </section>
      </div>
    </div>
  );
}
