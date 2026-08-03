"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  getBudgets,
  deleteBudget,
  setBudgetRepeatsMonthly,
} from "@/app/actions/budget.actions";
import { Budget } from "@/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { AmountDisplay } from "@/components/shared/amount-display";
import { CreateBudgetDialog } from "@/components/budgets/create-budget-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PieChart } from "lucide-react";
import { getCategoryDisplayName } from "@/lib/utils/category-aliases";
import { Checkbox } from "@/components/ui/checkbox";

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

type BudgetCard = Budget & {
  spent: number;
  remaining?: number;
  repeats_monthly?: boolean;
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const now = new Date();
  const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const result = await getBudgets();
      if (result.data) {
        setBudgets(result.data);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this budget for this category?")) {
      try {
        const result = await deleteBudget(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Budget removed");
          setBudgets(budgets.filter((b) => b.id !== id));
        }
      } catch {
        toast.error("Failed to delete budget");
      }
    }
  };

  const handleToggleRepeat = async (budget: BudgetCard, repeatsMonthly: boolean) => {
    setTogglingId(budget.id);
    setBudgets((prev) =>
      prev.map((item) =>
        item.id === budget.id ? { ...item, repeats_monthly: repeatsMonthly } : item
      )
    );

    try {
      const result = await setBudgetRepeatsMonthly(budget.id, repeatsMonthly);
      if (result.error) {
        toast.error(result.error);
        setBudgets((prev) =>
          prev.map((item) =>
            item.id === budget.id
              ? { ...item, repeats_monthly: budget.repeats_monthly !== false }
              : item
          )
        );
      } else {
        toast.success(
          repeatsMonthly
            ? "Will repeat every month"
            : "This month only — won’t continue next month"
        );
      }
    } catch {
      toast.error("Failed to update repeat setting");
      setBudgets((prev) =>
        prev.map((item) =>
          item.id === budget.id
            ? { ...item, repeats_monthly: budget.repeats_monthly !== false }
            : item
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="🎯 Budgets"
        description={`Limits for ${currentMonthLabel}. Enable “Repeat every month” to reset remaining automatically.`}
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
          title="No monthly budgets yet"
          description="Set a category limit like Food ₹5,000. Turn on Repeat every month so it resets next month."
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
            const remaining =
              typeof budget.remaining === "number" ? budget.remaining : limit - spent;
            const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;
            const progressWidth = Math.min(percentageUsed, 100);
            const isOverBudget = remaining < 0;
            const repeatsMonthly = budget.repeats_monthly !== false;
            const progressColor = isOverBudget
              ? "var(--apple-red)"
              : percentageUsed >= 80
                ? "var(--apple-orange)"
                : "var(--apple-green)";

            return (
              <Card key={budget.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[17px]">
                      {getCategoryDisplayName(budget.category)}
                    </CardTitle>
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
                    This month · {MONTH_NAMES[budget.month - 1]} {budget.year}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Remaining</p>
                        <AmountDisplay
                          amount={Math.abs(remaining)}
                          variant={isOverBudget ? "danger" : "success"}
                          className="text-[22px]"
                        />
                        {isOverBudget && (
                          <p className="mt-1 text-[11px] font-semibold text-[var(--apple-red)]">
                            Over budget
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Monthly limit</p>
                        <AmountDisplay amount={limit} className="text-[15px]" />
                      </div>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressWidth}%`, background: progressColor }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-medium text-[var(--text-secondary)]">
                        <AmountDisplay
                          amount={spent}
                          className="text-[11px] font-semibold text-[var(--text-primary)]"
                        />{" "}
                        spent
                      </span>
                      <span className="font-semibold text-[var(--text-tertiary)]">
                        {Math.round(percentageUsed)}% used
                      </span>
                    </div>

                    <div
                      className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold ${
                        isOverBudget ? "text-[var(--apple-red)]" : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {isOverBudget ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--apple-green)]" />
                      )}
                      {isOverBudget
                        ? "Budget exceeded this month"
                        : repeatsMonthly
                          ? "Resets automatically next month"
                          : "This month only"}
                    </div>
                  </div>

                  <label
                    htmlFor={`repeat-${budget.id}`}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--separator)] bg-[rgba(120,120,128,0.05)] px-3 py-2.5"
                  >
                    <Checkbox
                      id={`repeat-${budget.id}`}
                      checked={repeatsMonthly}
                      disabled={togglingId === budget.id}
                      onCheckedChange={(checked) =>
                        handleToggleRepeat(budget, checked === true)
                      }
                    />
                    <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-[var(--text-primary)]">
                      <RefreshCw className="h-3.5 w-3.5 shrink-0 text-[var(--apple-blue)]" />
                      Repeat every month
                    </span>
                  </label>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
