"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendingChartProps {
  data: Array<{
    day: number;
    amount: number;
  }>;
}

export function SpendingChart({ data }: SpendingChartProps) {
  const tooltipStyle = {
    background: "var(--glass-bg)",
    backdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "20px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    color: "var(--text-primary)",
    fontFamily: "SF Pro Text, system-ui, sans-serif",
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>📊 Daily Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid stroke="var(--separator)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="day"
              stroke="var(--text-tertiary)"
              tickLine={false}
            />
            <YAxis axisLine={false} stroke="var(--text-tertiary)" tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,122,255,0.06)" }} />
            <Bar dataKey="amount" fill="#007aff" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
