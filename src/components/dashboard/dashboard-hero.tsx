import React from "react";
import { format } from "date-fns";
import { TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { AmountDisplay } from "@/components/shared/amount-display";
import { formatCurrency } from "@/lib/utils/currency";
import { EXPENSE_CATEGORIES } from "@/lib/constants/config";

interface DashboardHeroProps {
  displayName: string;
  netBalance: number;
  totalIncome: number;
  totalSpent: number;
  monthOverMonthChange: number;
  savingsRate: number;
  topCategory?: { name: string; value: number };
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getCategoryEmoji(category: string): string {
  const found = EXPENSE_CATEGORIES.find(
    (item) => item.value === category || item.label === category
  );
  return found?.emoji ?? "📊";
}

export function DashboardHero({
  displayName,
  netBalance,
  totalIncome,
  totalSpent,
  monthOverMonthChange,
  savingsRate,
  topCategory,
}: DashboardHeroProps) {
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const monthLabel = format(now, "MMMM yyyy");
  const changeIsDown = monthOverMonthChange > 0;
  const changeAbs = Math.abs(monthOverMonthChange);
  const boundedSavingsRate = Math.max(-100, Math.min(100, savingsRate));
  const balanceVariant = netBalance >= 0 ? "success" : "danger";

  return (
    <section className="dashboard-hero relative overflow-hidden rounded-[32px] border border-[var(--glass-border)] p-5 sm:p-6">
      <div className="relative z-[1] flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[var(--text-tertiary)]">
            {monthLabel}
          </p>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.8px] text-[var(--text-primary)] sm:text-[32px]">
            {greeting}, {displayName}
          </h1>

          <div className="mt-4">
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">
              Net balance this month
            </p>
            <div className="mt-1 text-[36px] font-extrabold tabular-nums tracking-[-1px] sm:text-[42px]">
              <AmountDisplay amount={netBalance} variant={balanceVariant} />
            </div>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--apple-green)]">
                {formatCurrency(totalIncome)}
              </span>{" "}
              in ·{" "}
              <span className="font-semibold text-[var(--apple-red)]">
                {formatCurrency(totalSpent)}
              </span>{" "}
              out
            </p>
          </div>
        </div>

      </div>

      <div className="relative z-[1] mt-5 flex flex-wrap gap-2">
        {changeAbs > 0 && (
          <div className="hero-stat-pill">
            {changeIsDown ? (
              <TrendingDown className="h-3.5 w-3.5 text-[var(--apple-green)]" strokeWidth={2.5} />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-[var(--apple-red)]" strokeWidth={2.5} />
            )}
            <span>
              Spending {changeIsDown ? "down" : "up"}{" "}
              <strong className={changeIsDown ? "text-[var(--apple-green)]" : "text-[var(--apple-red)]"}>
                {changeAbs.toFixed(1)}%
              </strong>{" "}
              vs last month
            </span>
          </div>
        )}

        <div className="hero-stat-pill">
          <Sparkles className="h-3.5 w-3.5 text-[var(--apple-blue)]" strokeWidth={2.5} />
          <span>
            Savings rate{" "}
            <strong
              className={
                boundedSavingsRate >= 0 ? "text-[var(--apple-green)]" : "text-[var(--apple-red)]"
              }
            >
              {Math.round(boundedSavingsRate)}%
            </strong>
          </span>
        </div>

        {topCategory && topCategory.value > 0 && (
          <div className="hero-stat-pill">
            <span aria-hidden="true">{getCategoryEmoji(topCategory.name)}</span>
            <span>
              Top spend: <strong>{topCategory.name}</strong> · {formatCurrency(topCategory.value)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
