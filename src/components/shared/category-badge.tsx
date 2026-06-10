import React from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";

interface CategoryBadgeProps {
  category: string;
  type?: "expense" | "income";
  showIcon?: boolean;
}

export function CategoryBadge({ category, type = "expense", showIcon = true }: CategoryBadgeProps) {
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categoryData = categories.find((c) => c.value === category);

  if (!categoryData) {
    return <span className="text-[13px] text-[var(--text-secondary)]">{category}</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-[rgba(120,120,128,0.10)] px-2.5 py-1 text-[13px] font-medium text-[var(--text-primary)]"
      )}
    >
      {showIcon && <span className="text-base leading-none">{categoryData.emoji}</span>}
      {categoryData.label}
    </span>
  );
}
