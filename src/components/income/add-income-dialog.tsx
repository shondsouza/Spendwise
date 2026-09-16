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
import { Pencil, Plus } from "lucide-react";
import { INCOME_CATEGORIES } from "@/lib/constants/config";
import { addIncome, updateIncome } from "@/app/actions/income.actions";
import { getCategories } from "@/app/actions/category.actions";
import { toast } from "sonner";
import { Category, Income } from "@/types";
import { useGuestData } from "@/lib/guest-data";

interface AddIncomeDialogProps {
  onSuccess?: () => void;
  income?: Income;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

const emptyForm = {
  title: "",
  amount: "",
  category: "",
  date: new Date().toISOString().split("T")[0],
  source: "",
  notes: "",
};

export function AddIncomeDialog({ onSuccess, income, trigger, onClose }: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const isEditing = !!income;
  const [formData, setFormData] = useState(emptyForm);
  const guestData = useGuestData();
  const isGuest = guestData.isGuest;

  useEffect(() => {
    if (income) {
      setOpen(true);
    }
  }, [income]);

  useEffect(() => {
    if (open) {
      setFormData({
        title: income?.title || "",
        amount: income?.amount.toString() || "",
        category: income?.category || "",
        date: income?.date || new Date().toISOString().split("T")[0],
        source: income?.source || "",
        notes: income?.notes || "",
      });
    }
  }, [open, income]);

  // Fetch custom categories when dialog opens
  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          if (isGuest) {
            setCustomCategories(guestData.categories.filter((cat) => cat.type === "income" || cat.type === "both"));
            return;
          }
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

      const result = isGuest
        ? {
            data: guestData.saveIncome(
              {
                title: formData.title,
                amount: Number(formData.amount),
                category: formData.category,
                date: formData.date,
                source: formData.source,
                notes: formData.notes,
              },
              isEditing ? income!.id : undefined
            ),
            error: null,
          }
        : isEditing
          ? await updateIncome(income!.id, formDataObj)
          : await addIncome(formDataObj);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Income updated successfully!" : "Income added successfully!");
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
        {trigger ?? (
          <Button className="gap-2">
            {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEditing ? "Edit Income" : "Add Income"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Income" : "Add New Income"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your income details" : "Record your income and stay updated"}
          </DialogDescription>
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
              {loading ? "Saving..." : isEditing ? "Update Income" : "Save Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
