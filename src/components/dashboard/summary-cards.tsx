import React from "react";
import { AmountDisplay } from "@/components/shared/amount-display";
import { formatCurrency } from "@/lib/utils/currency";
import { TrendingDown, TrendingUp, Wallet, Target } from "lucide-react";

interface SummaryCardsProps {
  totalSpentToday: number;
  totalSpentMonth: number;
  totalIncome: number;
  netBalance: number;
  monthOverMonthChange: number;
  categoryData: { name: string; value: number }[];
}

const summaryItems = [
  {
    label: "Today",
    detail: "Spent so far",
    icon: Wallet,
    variant: "danger" as const,
    accentColor: "var(--apple-red)",
    gradient: "var(--gradient-red)",
    bg: "rgba(255,59,48,0.06)",
    iconBg: "rgba(255,59,48,0.12)",
  },
  {
    label: "This Month",
    detail: "Total expenses",
    icon: TrendingDown,
    variant: "danger" as const,
    accentColor: "var(--apple-orange)",
    gradient: "var(--gradient-orange)",
    bg: "rgba(255,149,0,0.06)",
    iconBg: "rgba(255,149,0,0.12)",
  },
  {
    label: "Income",
    detail: "Month to date",
    icon: TrendingUp,
    variant: "success" as const,
    accentColor: "var(--apple-green)",
    gradient: "var(--gradient-green)",
    bg: "rgba(52,199,89,0.06)",
    iconBg: "rgba(52,199,89,0.12)",
  },
  {
    label: "Balance",
    detail: "Income minus spend",
    icon: Target,
    variant: "default" as const,
    accentColor: "var(--apple-blue)",
    gradient: "var(--gradient-blue)",
    bg: "rgba(0,122,255,0.06)",
    iconBg: "rgba(0,122,255,0.12)",
  },
];

export function SummaryCards({
  totalSpentToday,
  totalSpentMonth,
  totalIncome,
  netBalance,
  monthOverMonthChange,
}: SummaryCardsProps) {
  const amounts = [totalSpentToday, totalSpentMonth, totalIncome, netBalance];
  const variants = summaryItems.map((item, index) => {
    if (index === 3 && netBalance < 0) return "danger" as const;
    return item.variant;
  });
  const changeIsDown = monthOverMonthChange > 0;
  const changeAbs = Math.abs(monthOverMonthChange);
  const todayInsight = totalSpentToday > 0 ? "Tracking today’s flow" : "No spend logged yet — add one to start";
  const monthInsight = changeAbs > 0
    ? `${changeAbs.toFixed(1)}% ${changeIsDown ? "better" : "higher"} than last month`
    : "Your monthly trend is just getting started";
  const incomeInsight = totalIncome > 0 ? "Income is keeping pace" : "Add income to build a fuller picture";
  const balanceInsight = netBalance >= 0 ? "You’re still in the green" : "A small reset could help";
  const totalCategory = categoryData.reduce((sum, item) => sum + item.value, 0);
  const topCategories = [...categoryData].sort((a, b) => b.value - a.value).slice(0, 2);
  const accentClasses = [
    "bg-[rgba(59,130,246,0.9)]",
    "bg-[rgba(248,113,113,0.9)]",
  ];
  const insights = [todayInsight, monthInsight, incomeInsight, balanceInsight];

  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.4em] text-[var(--text-tertiary)]">
        Overview
      </h2>

      <div className="space-y-4 md:hidden">
        <div className="apple-card border border-[var(--separator)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">Spend overview</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Top categories this month</p>
            </div>
            <span className="rounded-full bg-[rgba(59,130,246,0.12)] px-3 py-1 text-[12px] font-semibold text-[var(--apple-blue)]">
              {topCategories.length} top
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {topCategories.length > 0 ? (
              topCategories.map((item, index) => {
                const width = totalCategory ? Math.min(100, (item.value / totalCategory) * 100) : 0;
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-[13px] font-semibold text-[var(--text-primary)]">
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(15,23,42,0.06)]">
                      <div
                        className={`h-full rounded-full ${accentClasses[index % accentClasses.length]}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[13px] text-[var(--text-secondary)]">No spending categories to show yet.</p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {summaryItems.slice(0, 2).map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="apple-card border border-[var(--separator)] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl" style={{ background: item.iconBg }}>
                    <Icon className="h-5 w-5" style={{ color: item.accentColor }} strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{item.detail}</span>
                </div>
                <div className="mt-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">{item.label}</p>
                  <p className="mt-2 text-[24px] font-extrabold text-[var(--text-primary)] tabular-nums">
                    <AmountDisplay amount={amounts[index]} variant={variants[index]} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="apple-card border border-[var(--separator)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: item.iconBg }}>
                  <Icon className="h-5 w-5" style={{ color: item.accentColor }} strokeWidth={2} />
                </div>
                {index === 1 && changeAbs > 0 && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${
                      changeIsDown
                        ? "bg-[rgba(52,199,89,0.12)] text-[var(--apple-green)]"
                        : "bg-[rgba(255,59,48,0.10)] text-[var(--apple-red)]"
                    }`}
                  >
                    {changeIsDown ? "Down" : "Up"} {changeAbs.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">{item.label}</p>
                <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{item.detail}</p>
                <div className="mt-3 text-[26px] font-extrabold tabular-nums text-[var(--text-primary)]">
                  <AmountDisplay amount={amounts[index]} variant={variants[index]} />
                </div>
                <p className="mt-2 text-[12px] font-medium leading-5 text-[var(--text-secondary)]">
                  {insights[index]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
