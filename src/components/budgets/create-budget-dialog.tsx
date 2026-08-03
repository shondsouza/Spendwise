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
import { Plus } from "lucide-react";
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
  const today = new Date();

  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
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
      formDataObj.append("month", formData.month);
      formDataObj.append("year", formData.year);

      const result = await addBudget(formDataObj);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Budget created successfully!");
        setOpen(false);
        setFormData({
          category: "",
          amount: "",
          month: String(today.getMonth() + 1),
          year: String(today.getFullYear()),
        });
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
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>Set a spending limit for a category</DialogDescription>
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
            <Label htmlFor="amount">Budget Limit (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={formData.month}
                onValueChange={(value) => setFormData({ ...formData, month: value })}
              >
                <SelectTrigger id="month" disabled={loading}>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {new Date(2024, index, 1).toLocaleString("en-IN", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2100"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

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
              {loading ? "Creating..." : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
