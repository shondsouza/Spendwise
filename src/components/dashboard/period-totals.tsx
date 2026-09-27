"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { AmountDisplay } from "@/components/shared/amount-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface PeriodAmount {
  period: string;
  expenses: number;
  income: number;
  categories: CategoryAmount[];
}

interface PeriodTotalsProps {
  months: PeriodAmount[];
  years: PeriodAmount[];
  allTime: Omit<PeriodAmount, "period">;
}

type PeriodType = "month" | "year" | "all";

export function PeriodTotals({ months, years, allTime }: PeriodTotalsProps) {
  const currentDate = new Date();
  const currentMonth = format(currentDate, "yyyy-MM");
  const currentYear = String(currentDate.getFullYear());
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const monthOptions = useMemo(() => {
    const options = new Set(months.map((item) => item.period));
    options.add(currentMonth);
    return [...options].sort((a, b) => b.localeCompare(a));
  }, [months, currentMonth]);
  const yearOptions = useMemo(() => {
    const options = new Set(years.map((item) => item.period));
    options.add(currentYear);
    return [...options].sort((a, b) => b.localeCompare(a));
  }, [years, currentYear]);

  const selectedTotals =
    periodType === "all"
      ? allTime
      : periodType === "month"
        ? months.find((item) => item.period === selectedMonth)
        : years.find((item) => item.period === selectedYear);
  const expenses = selectedTotals?.expenses ?? 0;
  const income = selectedTotals?.income ?? 0;
  const categories = selectedTotals?.categories ?? [];
  const balance = income - expenses;
  const selectedLabel =
    periodType === "all"
      ? "All time"
      : periodType === "month"
        ? format(new Date(`${selectedMonth}-01T00:00:00`), "MMMM yyyy")
        : selectedYear;

  return (
    <section aria-label="Expense and income totals">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
          Expense &amp; income
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={periodType}
            onValueChange={(value) => setPeriodType(value as PeriodType)}
          >
            <SelectTrigger aria-label="Choose totals period" className="sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          {periodType === "month" && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger aria-label="Choose month" className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(`${month}-01T00:00:00`), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {periodType === "year" && (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger aria-label="Choose year" className="sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <article className="apple-card border border-[var(--separator)] bg-white p-5 shadow-sm">
        <p className="text-[15px] font-semibold text-[var(--text-primary)]">{selectedLabel}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between gap-3 sm:block">
            <dt className="text-[13px] text-[var(--text-secondary)]">Expenses</dt>
            <dd className="mt-1">
              <AmountDisplay amount={expenses} variant="danger" className="text-[15px]" />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 sm:block">
            <dt className="text-[13px] text-[var(--text-secondary)]">Income</dt>
            <dd className="mt-1">
              <AmountDisplay amount={income} variant="success" className="text-[15px]" />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--separator)] pt-3 sm:block sm:border-t-0 sm:pt-0">
            <dt className="text-[13px] font-semibold text-[var(--text-primary)]">Balance</dt>
            <dd className="mt-1">
              <AmountDisplay
                amount={balance}
                variant={balance >= 0 ? "success" : "danger"}
                className="text-[16px]"
              />
            </dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-[var(--separator)] pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
              Expenses by category
            </h3>
            <span className="text-[12px] text-[var(--text-secondary)]">{selectedLabel}</span>
          </div>
          {categories.length > 0 ? (
            <ul className="divide-y divide-[var(--separator)]">
              {categories.map(({ category, amount }) => (
                <li key={category} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-[13px] text-[var(--text-secondary)]">{category}</span>
                  <AmountDisplay
                    amount={amount}
                    variant="danger"
                    className="text-[14px] font-semibold"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[var(--text-secondary)]">
              No expenses recorded for this period.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
