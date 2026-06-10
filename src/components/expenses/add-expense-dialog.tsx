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
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants/config";
import { addExpense, updateExpense } from "@/app/actions/expense.actions";
import { getCategories } from "@/app/actions/category.actions";
import { toast } from "sonner";
import { Expense, Category } from "@/types";

interface AddExpenseDialogProps {
  onSuccess?: () => void;
  expense?: Expense;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

const emptyForm = {
  title: "",
  amount: "",
  category: "",
  date: new Date().toISOString().split("T")[0],
  payment_method: "",
  notes: "",
};

export function AddExpenseDialog({ onSuccess, expense, trigger, onClose }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const isEditing = !!expense;
  const [formData, setFormData] = useState(emptyForm);

  // Fetch custom categories when dialog opens
  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          const result = await getCategories();
          if (result.data) {
            setCustomCategories(result.data.filter(cat => cat.type === "expense" || cat.type === "both"));
          }
        } catch {
          // Ignore errors, just use default categories
        }
      };
      fetchCategories();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setFormData({
        title: expense?.title || "",
        amount: expense?.amount.toString() || "",
        category: expense?.category || "",
        date: expense?.date || new Date().toISOString().split("T")[0],
        payment_method: expense?.payment_method || "",
        notes: expense?.notes || "",
      });
    }
  }, [open, expense]);

  // Auto-open when expense is provided (edit mode)
  useEffect(() => {
    if (expense) {
      setOpen(true);
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title);
      formDataObj.append("amount", formData.amount);
      formDataObj.append("category", formData.category);
      formDataObj.append("date", formData.date);
      formDataObj.append("payment_method", formData.payment_method);
      formDataObj.append("notes", formData.notes);

      const result = isEditing
        ? await updateExpense(expense!.id, formDataObj)
        : await addExpense(formDataObj);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Expense updated!" : "Expense added successfully!");
        setOpen(false);
        setFormData(emptyForm);
        onSuccess?.();
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your expense"
              : "Track your spending and stay on top of your finances"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              placeholder="e.g., Coffee at Starbucks"
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
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger id="payment_method" disabled={loading}>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {loading ? "Saving..." : isEditing ? "Update Expense" : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
