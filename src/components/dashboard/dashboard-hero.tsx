import React from "react";
import { Bell, TrendingDown, TrendingUp } from "lucide-react";
import { AmountDisplay } from "@/components/shared/amount-display";
import { formatCurrency } from "@/lib/utils/currency";

interface DashboardHeroProps {
  displayName: string;
  netBalance: number;
  totalIncome: number;
  totalSpent: number;
  monthOverMonthChange: number;
  topCategory?: { name: string; value: number };
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero({
  displayName,
  netBalance,
  totalIncome,
  totalSpent,
  monthOverMonthChange,
  topCategory,
}: DashboardHeroProps) {
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const balanceVariant = netBalance >= 0 ? "success" : "danger";
  const changePositive = monthOverMonthChange >= 0;
  const categoryLabel = topCategory
    ? `${topCategory.name} · ${formatCurrency(topCategory.value)}`
    : "No top category yet";

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[var(--separator)] bg-white/95 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--text-tertiary)]">
            SpendWise
          </p>
          <p className="mt-2 text-[15px] font-semibold text-[var(--text-primary)]">
            {greeting}, {displayName}
          </p>
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-3xl border border-[var(--separator)] bg-white text-[var(--text-primary)] shadow-sm">
          <Bell className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 rounded-[32px] border border-[var(--separator)] bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--text-tertiary)]">
          Total balance
        </p>
        <div className="mt-3 text-[36px] font-extrabold tracking-[-0.88px] text-[var(--text-primary)] sm:text-[44px]">
          <AmountDisplay amount={netBalance} variant={balanceVariant} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--separator)] bg-[rgba(15,23,42,0.02)] px-3 py-3 text-[13px] font-semibold text-[var(--text-primary)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(52,199,89,0.12)] px-2 py-1 text-[var(--apple-green)]">
            <TrendingUp className="h-4 w-4" />
            {changePositive ? "+" : ""}{monthOverMonthChange.toFixed(1)}%
          </span>
          <span className="text-[12px] text-[var(--text-secondary)]">{categoryLabel}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--separator)] bg-white p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">Income</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-[rgba(59,130,246,0.18)] text-[var(--apple-blue)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">{formatCurrency(totalIncome)}</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Incoming this month</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--separator)] bg-white p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">Expenses</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-[rgba(255,59,48,0.18)] text-[var(--apple-red)]">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)]">-{formatCurrency(totalSpent)}</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Spent this month</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
