import React from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, PiggyBank, ReceiptText, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

interface DashboardSnapshotProps {
  userName: string;
  monthLabel: string;
  totalIncome: number;
  totalSpentMonth: number;
  netBalance: number;
  dailyAverage: number;
  savingsRate: number;
  topCategory?: {
    name: string;
    value: number;
  };
  action?: React.ReactNode;
}

function MetricPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger" | "info";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3.5 py-3 sm:px-4",
        tone === "success" && "border-[rgba(52,199,89,0.18)] bg-[rgba(52,199,89,0.08)]",
        tone === "danger" && "border-[rgba(255,59,48,0.16)] bg-[rgba(255,59,48,0.07)]",
        tone === "info" && "border-[rgba(0,122,255,0.16)] bg-[rgba(0,122,255,0.07)]",
        tone === "neutral" && "border-[var(--separator)] bg-[rgba(120,120,128,0.07)]"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 truncate text-[15px] font-bold tabular-nums tracking-[-0.2px] text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

export function DashboardSnapshot({
  userName,
  monthLabel,
  totalIncome,
  totalSpentMonth,
  netBalance,
  dailyAverage,
  savingsRate,
  topCategory,
  action,
}: DashboardSnapshotProps) {
  const isPositive = netBalance >= 0;
  const firstName = userName.split(" ")[0] || "there";

  return (
    <section className="dashboard-hero mb-6 overflow-hidden rounded-[28px] border border-[var(--glass-border)] p-4 sm:p-6">
      <div className="relative z-10 grid gap-5 lg:grid-cols-[1.35fr_0.85fr] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--separator)] bg-[rgba(255,255,255,0.44)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] dark:bg-[rgba(255,255,255,0.06)]">
                <CalendarDays className="h-3.5 w-3.5 text-[var(--apple-blue)]" />
                <span>{monthLabel}</span>
              </div>
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.8px] text-[var(--text-primary)] sm:text-[34px]">
                Welcome back, {firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)] sm:text-[15px]">
                Your month is {isPositive ? "running with a positive balance" : "spending ahead of income"}.
                Here is the money signal worth watching today.
              </p>
            </div>
            {action && <div className="dashboard-hero-actions flex shrink-0 items-center gap-2">{action}</div>}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricPill label="Income" value={formatCurrency(totalIncome)} tone="success" />
            <MetricPill label="Spent" value={formatCurrency(totalSpentMonth)} tone="danger" />
            <MetricPill
              label={isPositive ? "Available" : "Over by"}
              value={formatCurrency(Math.abs(netBalance))}
              tone={isPositive ? "info" : "danger"}
            />
          </div>
        </div>

        <div className="rounded-[22px] border border-[var(--separator)] bg-[rgba(255,255,255,0.52)] p-4 shadow-sm dark:bg-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
                Monthly pulse
              </p>
              <p className="mt-1 text-[24px] font-extrabold tracking-[-0.7px] text-[var(--text-primary)]">
                {Math.round(savingsRate)}%
              </p>
            </div>
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                isPositive ? "bg-[rgba(52,199,89,0.12)] text-[var(--apple-green)]" : "bg-[rgba(255,59,48,0.10)] text-[var(--apple-red)]"
              )}
            >
              {isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[rgba(120,120,128,0.08)] px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <PiggyBank className="h-4 w-4 text-[var(--apple-green)]" />
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Savings rate</span>
              </div>
              <span className="text-[14px] font-bold text-[var(--text-primary)]">{Math.round(savingsRate)}%</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[rgba(120,120,128,0.08)] px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <ReceiptText className="h-4 w-4 text-[var(--apple-orange)]" />
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Daily average</span>
              </div>
              <span className="text-[14px] font-bold text-[var(--text-primary)]">{formatCurrency(dailyAverage)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[rgba(120,120,128,0.08)] px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-[var(--apple-purple)]" />
                <span className="truncate text-[13px] font-semibold text-[var(--text-secondary)]">Top category</span>
              </div>
              <span className="max-w-[45%] truncate text-right text-[14px] font-bold text-[var(--text-primary)]">
                {topCategory ? topCategory.name : "No spend yet"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
