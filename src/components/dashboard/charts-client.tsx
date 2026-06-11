"use client";

import React from "react";
import dynamic from "next/dynamic";

const SpendingChart = dynamic(
  () => import("@/components/dashboard/spending-chart").then((mod) => mod.SpendingChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] rounded-3xl bg-[var(--bg-secondary)] animate-pulse" />,
  }
);

const CategoryBreakdownChart = dynamic(
  () => import("@/components/dashboard/expense-category-chart").then((mod) => mod.CategoryBreakdownChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] rounded-3xl bg-[var(--bg-secondary)] animate-pulse" />,
  }
);

export default function ChartsClient({
  dailyData,
  categoryData,
}: {
  dailyData: { day: number; amount: number }[];
  categoryData: { name: string; value: number }[];
}) {
  return (
    <>
      <SpendingChart data={dailyData} />
      <CategoryBreakdownChart data={categoryData} />
    </>
  );
}
