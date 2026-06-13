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
  const tooltipStyle = {
    background: "var(--glass-bg)",
    backdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "20px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    color: "var(--text-primary)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="col-span-1 flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle>💡 Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center pt-6">
        <div className="relative h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.06))" }}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={tooltipStyle} 
                formatter={(value: number) => [formatCurrency(value), "Spent"]}
                itemStyle={{ color: "var(--text-primary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Total</span>
            <span className="text-[18px] font-bold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
        
        {/* Custom Legend */}
        <div className="mt-4 w-full grid grid-cols-2 gap-x-2 gap-y-3 px-2">
          {data.slice(0, 6).map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              <span className="truncate text-[13px] text-[var(--text-secondary)] font-medium">
                {entry.name}
              </span>
            </div>
          ))}
          {data.length > 6 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[var(--text-tertiary)]" />
              <span className="truncate text-[13px] text-[var(--text-secondary)] font-medium">
                +{data.length - 6} more
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
