"use client";

import React, { useState, useEffect } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";

interface CategoryBadgeProps {
  category: string;
  type?: "expense" | "income";
  showIcon?: boolean;
}

export function CategoryBadge({ category, type = "expense", showIcon = true }: CategoryBadgeProps) {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCustomCategories() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id);

        setCustomCategories(data || []);
      } catch (error) {
        console.error("Error fetching custom categories:", error);
      }
    }

    fetchCustomCategories();
  }, []);

  // Check default categories first
  const defaultCategories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const defaultCategory = defaultCategories.find((c) => c.value === category);

  // Then check custom categories
  const customCategory = customCategories.find((c) => c.name === category);

  const categoryData = defaultCategory || customCategory;

  if (!categoryData) {
    return <span className="text-[13px] text-[var(--text-secondary)]">{category}</span>;
  }

  const label = "label" in categoryData ? categoryData.label : categoryData.name;
  const emoji = "emoji" in categoryData ? categoryData.emoji : "📁";
  const bgColor = "color" in categoryData ? `${categoryData.color}20` : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[13px] font-medium text-[var(--text-primary)]",
        bgColor ? "" : "bg-[rgba(120,120,128,0.10)]"
      )}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {showIcon && <span className="text-base leading-none">{emoji}</span>}
      {label}
    </span>
  );
}
