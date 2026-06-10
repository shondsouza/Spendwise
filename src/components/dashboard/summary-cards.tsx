import React from "react";
import { AmountDisplay } from "@/components/shared/amount-display";

interface SummaryCardsProps {
  totalSpentToday: number;
  totalSpentMonth: number;
  totalIncome: number;
  netBalance: number;
  monthOverMonthChange: number;
}

const summaryItems = [
  {
    emoji: "💳",
    label: "Today's Spending",
    variant: "danger" as const,
  },
  {
    emoji: "📅",
    label: "This Month",
    variant: "danger" as const,
  },
  {
    emoji: "💰",
    label: "Total Income",
    variant: "success" as const,
  },
  {
    emoji: "🎯",
    label: "Net Balance",
    variant: "default" as const,
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
    <div className="page-enter grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item, index) => (
        <div key={item.label} className="apple-card">
          <div className="flex min-w-0 flex-col gap-3 p-6">
            <span className="text-2xl leading-none">{item.emoji}</span>
            <p className="truncate text-[13px] font-medium text-[var(--text-secondary)]">
              {item.label}
            </p>
            <div className="text-[28px] font-semibold tabular-nums">
              <AmountDisplay amount={amounts[index]} variant={item.variant} />
            </div>
            {index === 1 && changeAbs > 0 && (
              <p
                className={`text-[13px] font-medium ${
                  changeIsDown
                    ? "text-[var(--apple-green)]"
                    : "text-[var(--apple-red)]"
                }`}
              >
                {changeIsDown ? "↓" : "↑"} {changeAbs.toFixed(1)}% vs last month
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
