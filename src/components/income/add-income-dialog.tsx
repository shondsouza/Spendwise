"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { INCOME_CATEGORIES } from "@/lib/constants/config";
import { addIncome } from "@/app/actions/income.actions";
import { getCategories } from "@/app/actions/category.actions";
import { toast } from "sonner";
import { Category } from "@/types";

interface AddIncomeDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddIncomeDialog({ onSuccess, trigger }: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    source: "",
    notes: "",
  });

  // Fetch custom categories when dialog opens
  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          const result = await getCategories();
          if (result.data) {
            setCustomCategories(result.data.filter(cat => cat.type === "income" || cat.type === "both"));
          }
        } catch {
          // Ignore errors, just use default categories
        }
      };
      fetchCategories();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title);
      formDataObj.append("amount", formData.amount);
      formDataObj.append("category", formData.category);
      formDataObj.append("date", formData.date);
      formDataObj.append("source", formData.source);
      formDataObj.append("notes", formData.notes);

      const result = await addIncome(formDataObj);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Income added successfully!");
        setOpen(false);
        setFormData({
          title: "",
          amount: "",
          category: "",
          date: new Date().toISOString().split("T")[0],
          source: "",
          notes: "",
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
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Income</DialogTitle>
          <DialogDescription>Record your income and stay updated</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              placeholder="e.g., Monthly Salary"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

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
                {INCOME_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source (Optional)</Label>
            <Input
              id="source"
              placeholder="e.g., Your Company Name"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={loading}
              className="h-20"
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
