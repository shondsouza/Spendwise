"use client";

import React from "react";
import {
  LineChart,
  Line,
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

export function AnalyticsLineChart({ monthlyTrend }: AnalyticsLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>💡 Income vs Expenses (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="var(--text-tertiary)" />
            <YAxis axisLine={false} tickLine={false} stroke="var(--text-tertiary)" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 13 }} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#34c759"
              name="Income"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: "#34c759" }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ff3b30"
              name="Expenses"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: "#ff3b30" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
