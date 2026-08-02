"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { getCategories, deleteCategory } from "@/app/actions/category.actions";
import { Category } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
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
}

export default function CategoriesPage() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await getCategories();
      if (result.data) {
        setCustomCategories(result.data);
      }
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

  // Combine default and custom categories
  const allCategories: DisplayCategory[] = [
    ...EXPENSE_CATEGORIES.map((cat) => ({
      id: `expense-default-${cat.value}`,
      routeId: `default::expense::${cat.value}`,
      name: cat.label,
      type: "expense" as const,
      emoji: cat.emoji,
      color: cat.color,
      isCustom: false,
    })),
    ...INCOME_CATEGORIES.map((cat) => ({
      id: `income-default-${cat.value}`,
      routeId: `default::income::${cat.value}`,
      name: cat.label,
      type: "income" as const,
      emoji: cat.emoji,
      color: cat.color,
      isCustom: false,
    })),
    ...customCategories.map((cat) => ({
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
  onEditSuccess,
}: {
  category: DisplayCategory;
  onDelete?: (id: string) => void;
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
          {category.isCustom && (
            <div className="flex items-center gap-1">
              <CreateCategoryDialog
                initialCategory={category}
                onSuccess={onEditSuccess}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--apple-blue)]">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(category.id)}
                  className="h-8 w-8 text-[var(--apple-red)]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
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
