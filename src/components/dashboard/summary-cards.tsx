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
    accentColor: "var(--apple-red)",
    gradient: "var(--gradient-red)",
    bg: "rgba(255,59,48,0.06)",
    iconBg: "rgba(255,59,48,0.12)",
  },
  {
    label: "This Month",
    icon: TrendingDown,
    variant: "danger" as const,
    accentColor: "var(--apple-orange)",
    gradient: "var(--gradient-orange)",
    bg: "rgba(255,149,0,0.06)",
    iconBg: "rgba(255,149,0,0.12)",
  },
  {
    label: "Total Income",
    icon: TrendingUp,
    variant: "success" as const,
    accentColor: "var(--apple-green)",
    gradient: "var(--gradient-green)",
    bg: "rgba(52,199,89,0.06)",
    iconBg: "rgba(52,199,89,0.12)",
  },
  {
    label: "Net Balance",
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
              className="stat-card w-[210px] flex-shrink-0"
              style={{ background: item.bg }}
            >
              {/* Gradient top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[20px]"
                style={{ background: item.gradient }}
              />
              {/* Left accent */}
              <div
                className="stat-card-accent"
                style={{ background: item.gradient }}
              />
              <div className="flex flex-col gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: item.iconBg }}
                >
                  <Icon className="h-5 w-5" style={{ color: item.accentColor }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)] mb-1.5">
                    {item.label}
                  </p>
                  <div className="text-[22px] font-extrabold tabular-nums tracking-[-0.6px] leading-tight">
                    <AmountDisplay amount={amounts[index]} variant={item.variant} />
                  </div>
                  {index === 1 && changeAbs > 0 && (
                    <p className={`text-[11px] font-semibold mt-1.5 ${changeIsDown ? "text-[var(--apple-green)]" : "text-[var(--apple-red)]"}`}>
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
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="apple-card relative overflow-hidden"
            >
              {/* Gradient top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-[20px]"
                style={{ background: item.gradient }}
              />
              <div className="flex flex-col gap-4 p-5 pt-6">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: item.iconBg }}
                  >
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
                      {changeIsDown ? "↓" : "↑"} {changeAbs.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)] mb-1.5">
                    {item.label}
                  </p>
                  <div className="text-[26px] font-extrabold tabular-nums tracking-[-0.8px] leading-tight">
                    <AmountDisplay amount={amounts[index]} variant={item.variant} />
                  </div>
                  {index === 1 && changeAbs > 0 && (
                    <p className={`text-[12px] font-medium mt-1.5 ${changeIsDown ? "text-[var(--apple-green)]" : "text-[var(--apple-red)]"}`}>
                      {changeIsDown ? "Spending down" : "Spending up"} vs last month
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
