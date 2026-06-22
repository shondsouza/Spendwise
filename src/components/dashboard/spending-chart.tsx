"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";

interface SpendingChartProps {
  data: Array<{
    day: number;
    amount: number;
  }>;
}

export function SpendingChart({ data }: SpendingChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const hasData = total > 0;
  const tooltipStyle = {
    background: "var(--glass-bg)",
    backdropFilter: "blur(24px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    color: "var(--text-primary)",
    fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "13px",
    fontWeight: "600",
    padding: "10px 14px",
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-[17px] font-bold tracking-[-0.3px]">Daily Spending</CardTitle>
        <p className="text-[13px] text-[var(--text-secondary)]">
          {hasData ? `${formatCurrency(total)} spent this month` : "No expenses recorded this month"}
        </p>
      </CardHeader>
      <CardContent className="relative">
        {!hasData && (
          <div className="absolute inset-x-6 top-10 z-10 rounded-2xl border border-dashed border-[var(--separator)] bg-[rgba(120,120,128,0.06)] px-4 py-5 text-center">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Your spending trend will appear here</p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Add an expense to start seeing daily movement.</p>
          </div>
        )}
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--apple-blue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--apple-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "'Inter', ui-sans-serif", fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "'Inter', ui-sans-serif", fontWeight: 500 }}
              tickFormatter={(value) => `₹${value}`}
              dx={-10}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "var(--apple-blue)", strokeWidth: 1, strokeDasharray: "4 4" }}
              formatter={(value: number) => [formatCurrency(value), "Spent"]}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--apple-blue)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAmount)"
              activeDot={{ r: 6, fill: "var(--apple-blue)", stroke: "var(--bg-primary)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
