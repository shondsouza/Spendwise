"use client";

import React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyTrendItem {
  month: string;
  expenses: number;
  income: number;
}

interface AnalyticsLineChartProps {
  monthlyTrend: MonthlyTrendItem[];
}

const tooltipStyle = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid var(--glass-border)",
  borderRadius: "20px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  color: "var(--text-primary)",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export function AnalyticsBarChart({ monthlyTrend }: AnalyticsLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>💡 Income vs Expenses (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid vertical={false} stroke="var(--separator)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="var(--text-tertiary)" />
            <YAxis axisLine={false} tickLine={false} stroke="var(--text-tertiary)" />
            <Tooltip shared={false} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 13 }} />
            <Bar
              dataKey="income"
              stroke="#1d4ed8"
              fill="#3b82f6"
              name="Income"
              radius={[5, 5, 0, 0]}
              activeBar={{ stroke: "#1e40af", strokeWidth: 2 }}
            />
            <Bar
              dataKey="expenses"
              stroke="#b91c1c"
              fill="#ef4444"
              name="Expenses"
              radius={[5, 5, 0, 0]}
              activeBar={{ stroke: "#991b1b", strokeWidth: 2 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
