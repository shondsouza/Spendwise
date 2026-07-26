"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { getBudgets, deleteBudget } from "@/app/actions/budget.actions";
import { Budget } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AmountDisplay } from "@/components/shared/amount-display";
import { CreateBudgetDialog } from "@/components/budgets/create-budget-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PieChart } from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Array<Budget & { spent: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const result = await getBudgets();
      if (result.data) {
        setBudgets(result.data);
      }
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      try {
        const result = await deleteBudget(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Budget deleted!");
          setBudgets(budgets.filter((b) => b.id !== id));
        }
      } catch {
        toast.error("Failed to delete budget");
      }
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="🎯 Budgets"
        description="Set spending limits for different categories"
        action={<CreateBudgetDialog onSuccess={fetchBudgets} />}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="apple-card h-48 animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No budgets set"
          description="Create a budget to track your spending limits"
          action={{
            label: "Create Budget",
            onClick: () => fetchBudgets(),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const spent = Number(budget.spent) || 0;
            const limit = Number(budget.amount) || 0;
            const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;
            const progressWidth = Math.min(percentageUsed, 100);
            const remaining = limit - spent;
            const isOverBudget = remaining < 0;
            const progressColor = isOverBudget
              ? "var(--apple-red)"
              : percentageUsed >= 80
                ? "var(--apple-orange)"
                : "var(--apple-green)";

            return (
            <Card key={budget.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[17px]">{budget.category}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(budget.id)}
                    className="h-8 w-8 text-[var(--apple-red)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  {MONTH_NAMES[budget.month - 1]} {budget.year}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-[13px]">
                    <span className="font-medium text-[var(--text-secondary)]">Budget Limit</span>
                    <AmountDisplay amount={budget.amount} />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressWidth}%`, background: progressColor }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-medium text-[var(--text-secondary)]">
                      <AmountDisplay amount={spent} className="text-[11px] font-semibold text-[var(--text-primary)]" /> spent
                    </span>
                    <span className={isOverBudget ? "font-semibold text-[var(--apple-red)]" : "font-semibold text-[var(--apple-green)]"}>
                      {isOverBudget ? "Over by " : "Remaining "}
                      <AmountDisplay amount={Math.abs(remaining)} className="text-[11px] font-semibold" />
                    </span>
                  </div>
                  <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold ${isOverBudget ? "text-[var(--apple-red)]" : "text-[var(--text-tertiary)]"}`}>
                    {isOverBudget ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-[var(--apple-green)]" />}
                    {Math.round(percentageUsed)}% used{isOverBudget ? " — budget exceeded" : ""}
                  </div>
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)]">
                  One monthly budget per category
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
