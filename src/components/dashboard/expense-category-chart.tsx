"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";

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
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const hasData = sortedData.length > 0 && sortedData.some((item) => item.value > 0);
  const chartData = hasData ? sortedData : [{ name: "No data", value: 1 }];
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

  const total = sortedData.reduce((sum, item) => sum + item.value, 0);
  const topCategory = sortedData[0];
  const topCategoryShare = total > 0 && topCategory ? Math.round((topCategory.value / total) * 100) : 0;

  return (
    <Card className="col-span-1 flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-[17px] font-bold tracking-[-0.3px]">Spending by Category</CardTitle>
        <p className="text-[13px] text-[var(--text-secondary)]">
          {hasData
            ? `${topCategory.name} is your largest category · ${topCategoryShare}% of spend`
            : "Categories will appear after your first expense"}
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center pt-6">
        <div className="relative h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={hasData ? COLORS[index % COLORS.length] : "rgba(120,120,128,0.18)"}
                    style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.06))" }}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={tooltipStyle} 
                formatter={(value: number) => [hasData ? formatCurrency(value) : formatCurrency(0), "Spent"]}
                itemStyle={{ color: "var(--text-primary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">Total</span>
            <span className="text-[19px] font-extrabold text-[var(--text-primary)] tabular-nums tracking-[-0.5px]">
              {formatCurrency(hasData ? total : 0)}
            </span>
          </div>
        </div>
        
        {/* Custom Legend */}
        <div className="mt-4 w-full grid grid-cols-2 gap-x-2 gap-y-3 px-2">
          {hasData ? sortedData.slice(0, 6).map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              <span className="truncate text-[13px] text-[var(--text-secondary)] font-medium">
                {entry.name}
              </span>
            </div>
          )) : (
            <div className="col-span-2 rounded-2xl border border-dashed border-[var(--separator)] px-4 py-3 text-center text-[13px] font-medium text-[var(--text-secondary)]">
              Add a transaction to unlock category insights
            </div>
          )}
          {hasData && sortedData.length > 6 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[var(--text-tertiary)]" />
              <span className="truncate text-[13px] text-[var(--text-secondary)] font-medium">
                +{sortedData.length - 6} more
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
