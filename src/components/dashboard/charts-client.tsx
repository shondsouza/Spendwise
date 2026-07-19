"use client";

import React from "react";
import dynamic from "next/dynamic";

const SpendingChart = dynamic(
  () => import("@/components/dashboard/spending-chart").then((mod) => mod.SpendingChart),
  {
    ssr: false,
    loading: () => <div className="h-[380px] rounded-3xl skeleton" />,
  }
);

const CategoryBreakdownChart = dynamic(
  () =>
    import("@/components/dashboard/expense-category-chart").then(
      (mod) => mod.CategoryBreakdownChart
    ),
  {
    ssr: false,
    loading: () => <div className="h-[380px] rounded-3xl skeleton" />,
  }
);

interface ChartsClientProps {
  dailyData: { day: number; amount: number }[];
  categoryData: { name: string; value: number }[];
  sidebar?: React.ReactNode;
}

export default function ChartsClient({ dailyData, categoryData, sidebar }: ChartsClientProps) {
  return (
    <div className="grid gap-6 lg:col-span-3 lg:grid-cols-3">
      <SpendingChart data={dailyData} />
      <div className="flex flex-col gap-6">
        <CategoryBreakdownChart data={categoryData} />
        {sidebar}
      </div>
    </div>
  );
}
