"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  getCategories,
  getUsedCategoryNames,
  deleteCategory,
  deleteDefaultCategory,
} from "@/app/actions/category.actions";
import { Category } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/config";

interface DisplayCategory {
  id: string;
  routeId: string;
  name: string;
  type: "expense" | "income" | "both";
  emoji: string;
  color: string;
  isCustom: boolean;
  defaultKey?: string;
}

export default function CategoriesPage() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [usedCategoryNames, setUsedCategoryNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [categoriesResult, usedCategoriesResult] = await Promise.all([
        getCategories(),
        getUsedCategoryNames(),
      ]);

      if (categoriesResult.data) setCustomCategories(categoriesResult.data);
      if (usedCategoriesResult.data) setUsedCategoryNames(usedCategoriesResult.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        const result = await deleteCategory(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Category deleted!");
          setCustomCategories(customCategories.filter((c) => c.id !== id));
        }
      } catch {
        toast.error("Failed to delete category");
      }
    }
  };

  const usedNames = new Set(usedCategoryNames);
  const isUsed = (name: string, alternateName?: string) =>
    usedNames.has(name) || (alternateName ? usedNames.has(alternateName) : false);
  const isDefaultVisible = (defaultKey: string) =>
    !customCategories.some((item) => item.default_key === defaultKey && item.is_deleted);

  // Combine only categories that have at least one income or expense.
  const allCategories: DisplayCategory[] = [
    ...EXPENSE_CATEGORIES.filter((cat) => isUsed(cat.value, cat.label) && isDefaultVisible(`expense:${cat.value}`)).map((cat) => ({
      id: `expense-default-${cat.value}`,
      routeId: `default::expense::${cat.value}`,
      name: customCategories.find((item) => item.default_key === `expense:${cat.value}`)?.name ?? cat.label,
      type: customCategories.find((item) => item.default_key === `expense:${cat.value}`)?.type ?? ("expense" as const),
      emoji: customCategories.find((item) => item.default_key === `expense:${cat.value}`)?.emoji ?? cat.emoji,
      color: customCategories.find((item) => item.default_key === `expense:${cat.value}`)?.color ?? cat.color,
      isCustom: false,
      defaultKey: `expense:${cat.value}`,
    })),
    ...INCOME_CATEGORIES.filter((cat) => isUsed(cat.value, cat.label) && isDefaultVisible(`income:${cat.value}`)).map((cat) => ({
      id: `income-default-${cat.value}`,
      routeId: `default::income::${cat.value}`,
      name: customCategories.find((item) => item.default_key === `income:${cat.value}`)?.name ?? cat.label,
      type: customCategories.find((item) => item.default_key === `income:${cat.value}`)?.type ?? ("income" as const),
      emoji: customCategories.find((item) => item.default_key === `income:${cat.value}`)?.emoji ?? cat.emoji,
      color: customCategories.find((item) => item.default_key === `income:${cat.value}`)?.color ?? cat.color,
      isCustom: false,
      defaultKey: `income:${cat.value}`,
    })),
    ...customCategories.filter((cat) => isUsed(cat.name) && !cat.default_key).map((cat) => ({
      id: cat.id,
      routeId: `custom::${cat.id}`,
      name: cat.name,
      type: cat.type,
      emoji: cat.emoji,
      color: cat.color,
      isCustom: true,
    })),
  ];

  // Group categories by type
  const expenseCategories = allCategories.filter((c) => c.type === "expense" || c.type === "both");
  const incomeCategories = allCategories.filter((c) => c.type === "income" || c.type === "both");
  const bothCategories = allCategories.filter((c) => c.type === "both");

  return (
    <div className="page-enter">
      <PageHeader
        title="📂 Categories"
        description="Manage your categories for expenses and income"
        action={<CreateCategoryDialog onSuccess={fetchCategories} />}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="apple-card h-36 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Expense Categories */}
          <div className="mb-8">
            <h2 className="text-[1.25rem] font-semibold mb-4 text-[var(--text-primary)]">
              💳 Expense Categories
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expenseCategories
                .filter((c) => c.type === "expense" || c.type === "both")
                .map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onDelete={category.isCustom ? handleDelete : undefined}
                    onDefaultDelete={category.defaultKey ? async () => {
                      if (!confirm("Remove this category?")) return;
                      const result = await deleteDefaultCategory(category.defaultKey!);
                      if (result.error) toast.error(result.error);
                      else { toast.success("Category removed!"); fetchCategories(); }
                    } : undefined}
                    onEditSuccess={fetchCategories}
                  />
                ))}
            </div>
          </div>

          {/* Income Categories */}
          <div className="mb-8">
            <h2 className="text-[1.25rem] font-semibold mb-4 text-[var(--text-primary)]">
              💰 Income Categories
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incomeCategories
                .filter((c) => c.type === "income")
                .map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onDelete={category.isCustom ? handleDelete : undefined}
                    onDefaultDelete={category.defaultKey ? async () => {
                      if (!confirm("Remove this category?")) return;
                      const result = await deleteDefaultCategory(category.defaultKey!);
                      if (result.error) toast.error(result.error);
                      else { toast.success("Category removed!"); fetchCategories(); }
                    } : undefined}
                    onEditSuccess={fetchCategories}
                  />
                ))}
            </div>
          </div>

          {/* Both Categories */}
          {bothCategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[1.25rem] font-semibold mb-4 text-[var(--text-primary)]">
                📊 Both (Expense & Income) Categories
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bothCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onDelete={category.isCustom ? handleDelete : undefined}
                    onDefaultDelete={category.defaultKey ? async () => {
                      if (!confirm("Remove this category?")) return;
                      const result = await deleteDefaultCategory(category.defaultKey!);
                      if (result.error) toast.error(result.error);
                      else { toast.success("Category removed!"); fetchCategories(); }
                    } : undefined}
                    onEditSuccess={fetchCategories}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryCard({
  category,
  onDelete,
  onDefaultDelete,
  onEditSuccess,
}: {
  category: DisplayCategory;
  onDelete?: (id: string) => void;
  onDefaultDelete?: () => void;
  onEditSuccess?: () => void;
}) {
  return (
    <Card className="relative group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.emoji}
            </span>
            <div>
              <CardTitle className="text-[17px]">{category.name}</CardTitle>
              <p className="text-[13px] text-[var(--text-secondary)] capitalize">{category.type}</p>
            </div>
          </div>
          {(category.isCustom || category.defaultKey) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Category actions</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40 p-1">
                <CreateCategoryDialog
                  initialCategory={category}
                  defaultKey={category.defaultKey}
                  onSuccess={onEditSuccess}
                  trigger={
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  }
                />
                {(onDelete || onDefaultDelete) && (
                  <Button
                    variant="ghost"
                    onClick={() => onDefaultDelete ? onDefaultDelete() : onDelete?.(category.id)}
                    className="w-full justify-start gap-2 text-[var(--apple-red)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Link href={`/dashboard/categories/${encodeURIComponent(category.routeId)}`}>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <ExternalLink className="h-4 w-4" />
            View Transactions
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
