"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { MobileDashboard } from "./mobile-dashboard";
import { SummaryCards } from "./summary-cards";
import { RecentTransactions } from "./recent-transactions";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { ArrowUpRight, Plus } from "lucide-react";
import { useGuestData } from "@/lib/guest-data";

export function GuestDashboard({ displayName = "Guest" }: { displayName?: string }) {
  const { expenses, income } = useGuestData();
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const monthExpenses = expenses.filter((item) => {
    const date = new Date(item.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  const monthIncome = income.filter((item) => {
    const date = new Date(item.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  const totalSpent = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalIncome = monthIncome.reduce((sum, item) => sum + Number(item.amount), 0);
  const categoryData = Object.values(monthExpenses.reduce<Record<string, { name: string; value: number }>>((result, item) => {
    result[item.category] ??= { name: item.category, value: 0 };
    result[item.category].value += Number(item.amount);
    return result;
  }, {}));
  const transactions = useMemo(() => [
    ...expenses.map((item) => ({ id: item.id, type: "expense" as const, title: item.title, amount: item.amount, category: item.category, date: item.date })),
    ...income.map((item) => ({ id: item.id, type: "income" as const, title: item.title, amount: item.amount, category: item.category, date: item.date })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10), [expenses, income]);

  return (
    <div className="page-enter space-y-8">
      <MobileDashboard netBalance={totalIncome - totalSpent} totalIncome={totalIncome} totalSpent={totalSpent} monthOverMonthChange={0} categoryData={categoryData} transactions={transactions} />
      <div className="desktop-dashboard hidden space-y-8 md:block">
        <header className="desktop-dashboard-header">
          <div>
            <p className="desktop-dashboard-date">{format(today, "EEEE, MMMM d")}</p>
            <h1>Good to see you, {displayName.split(" ")[0]}</h1>
            <p>Here&apos;s your financial pulse for this month.</p>
          </div>
          <div className="desktop-dashboard-actions">
            <AddIncomeDialog trigger={<button type="button" className="desktop-secondary-action"><ArrowUpRight className="h-4 w-4" />Add income</button>} />
            <AddExpenseDialog trigger={<button type="button" className="desktop-primary-action"><Plus className="h-4 w-4" />Add expense</button>} />
          </div>
        </header>
        <SummaryCards totalSpentToday={monthExpenses.filter((item) => item.date === format(today, "yyyy-MM-dd")).reduce((sum, item) => sum + Number(item.amount), 0)} totalSpentMonth={totalSpent} totalIncome={totalIncome} netBalance={totalIncome - totalSpent} monthOverMonthChange={0} categoryData={categoryData} />
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}
