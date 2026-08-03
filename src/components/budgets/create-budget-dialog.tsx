"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, RefreshCw } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/constants/config";
import { addBudget } from "@/app/actions/budget.actions";
import { getCategories } from "@/app/actions/category.actions";
import { toast } from "sonner";
import { Category } from "@/types";

interface CreateBudgetDialogProps {
  onSuccess?: () => void;
}

export function CreateBudgetDialog({ onSuccess }: CreateBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    repeatsMonthly: true,
  });

  useEffect(() => {
    if (!open) return;

    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        if (result.data) {
          setCustomCategories(
            result.data.filter(
              (cat) =>
                !cat.is_deleted &&
                (cat.type === "expense" || cat.type === "both") &&
                !cat.default_key
            )
          );
        }
      } catch {
        // Fall back to default categories only
      }
    };

    fetchCategories();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("category", formData.category);
      formDataObj.append("amount", formData.amount);
      formDataObj.append("repeats_monthly", formData.repeatsMonthly ? "true" : "false");

      const result = await addBudget(formDataObj);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          formData.repeatsMonthly
            ? "Repeating monthly budget set!"
            : "This-month budget set!"
        );
        setOpen(false);
        setFormData({ category: "", amount: "", repeatsMonthly: true });
        onSuccess?.();
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Monthly Budget</DialogTitle>
          <DialogDescription>
            Choose a category and limit for {monthLabel}. Turn on repeat to reset remaining every
            month.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category" disabled={loading}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {customCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                      Custom
                    </div>
                    {customCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.emoji} {cat.name}
                      </SelectItem>
                    ))}
                    <div className="my-1 h-px bg-[var(--separator)]" />
                  </>
                )}
                <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  Default
                </div>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Limit (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 5000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              disabled={loading}
            />
            <p className="text-[12px] text-[var(--text-tertiary)]">
              Example: Food ₹5,000. Spend ₹1,000 → ₹4,000 remaining.
            </p>
          </div>

          <label
            htmlFor="repeats-monthly"
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--separator)] bg-[rgba(120,120,128,0.06)] p-3.5"
          >
            <Checkbox
              id="repeats-monthly"
              checked={formData.repeatsMonthly}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, repeatsMonthly: checked === true })
              }
              disabled={loading}
              className="mt-0.5"
            />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--text-primary)]">
                <RefreshCw className="h-3.5 w-3.5 text-[var(--apple-blue)]" />
                Repeat every month
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {formData.repeatsMonthly
                  ? "Limit carries to next month and remaining resets automatically."
                  : "Applies to this month only. It will not continue next month."}
              </p>
            </div>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.category}>
              {loading ? "Saving..." : "Save Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
