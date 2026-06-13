import React from "react";
import { AmountDisplay } from "@/components/shared/amount-display";
import { TrendingDown, TrendingUp, Wallet, Target } from "lucide-react";

interface SummaryCardsProps {
  totalSpentToday: number;
  totalSpentMonth: number;
  totalIncome: number;
  netBalance: number;
  monthOverMonthChange: number;
}

const summaryItems = [
  {
    label: "Today's Spending",
    icon: Wallet,
    variant: "danger" as const,
    accent: "stat-card-danger",
    accentColor: "var(--apple-red)",
    bg: "rgba(255,59,48,0.07)",
  },
  {
    label: "This Month",
    icon: TrendingDown,
    variant: "danger" as const,
    accent: "stat-card-danger",
    accentColor: "var(--apple-orange)",
    bg: "rgba(255,149,0,0.07)",
  },
  {
    label: "Total Income",
    icon: TrendingUp,
    variant: "success" as const,
    accent: "stat-card-success",
    accentColor: "var(--apple-green)",
    bg: "rgba(52,199,89,0.07)",
  },
  {
    label: "Net Balance",
    icon: Target,
    variant: "default" as const,
    accent: "stat-card-blue",
    accentColor: "var(--apple-blue)",
    bg: "rgba(0,122,255,0.07)",
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
  const changeIsDown = monthOverMonthChange > 0;
  const changeAbs = Math.abs(monthOverMonthChange);

  return (
    <>
      {/* Mobile: horizontal snap scroll */}
      <div className="snap-scroll-x md:hidden -mx-4 px-4">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="stat-card w-[200px]"
              style={{ background: item.bg }}
            >
              {/* Accent bar */}
              <div
                className="stat-card-accent"
                style={{ background: item.accentColor }}
              />
              <div className="flex flex-col gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${item.accentColor}18` }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: item.accentColor }} />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                    {item.label}
                  </p>
                  <div className="text-[22px] font-bold tabular-nums">
                    <AmountDisplay amount={amounts[index]} variant={item.variant} />
                  </div>
                  {index === 1 && changeAbs > 0 && (
                    <p className={`text-[11px] font-semibold mt-1 ${changeIsDown ? "text-[var(--apple-green)]" : "text-[var(--apple-red)]"}`}>
                      {changeIsDown ? "↓" : "↑"} {changeAbs.toFixed(1)}% vs last month
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: 4-column grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="apple-card">
              <div className="flex min-w-0 flex-col gap-3 p-6">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${item.accentColor}18` }}
                >
                  <Icon className="h-5 w-5" style={{ color: item.accentColor }} />
                </div>
                <p className="truncate text-[13px] font-medium text-[var(--text-secondary)]">
                  {item.label}
                </p>
                <div className="text-[28px] font-semibold tabular-nums">
                  <AmountDisplay amount={amounts[index]} variant={item.variant} />
                </div>
                {index === 1 && changeAbs > 0 && (
                  <p className={`text-[13px] font-medium ${changeIsDown ? "text-[var(--apple-green)]" : "text-[var(--apple-red)]"}`}>
                    {changeIsDown ? "↓" : "↑"} {changeAbs.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
