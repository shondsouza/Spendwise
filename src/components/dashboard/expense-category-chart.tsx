"use client";

import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryBreakdownChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = [
  "#007aff",
  "#34c759",
  "#ff9500",
  "#ff3b30",
  "#af52de",
  "#ff2d55",
  "#5ac8fa",
  "#ffcc00",
  "#5856d6",
  "#ff6b35",
];

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const tooltipStyle = {
    background: "var(--glass-bg)",
    backdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "20px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    color: "var(--text-primary)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>💡 Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              iconType="circle"
              wrapperStyle={{ color: "var(--text-secondary)", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
