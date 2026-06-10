"use client";

import React, { useState } from "react";
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
import { createCategory } from "@/app/actions/category.actions";
import { toast } from "sonner";

interface CreateCategoryDialogProps {
  onSuccess?: () => void;
}

const EMOJI_OPTIONS = [
  "📁",
  "🍔",
  "🚗",
  "🛍️",
  "🎬",
  "💊",
  "⚡",
  "📚",
  "✈️",
  "💆",
  "🏠",
  "🎮",
  "☕",
  "🎁",
  "📱",
  "💼",
  "🧾",
  "📈",
  "🏦",
  "💸",
  "🤝",
];

const COLOR_OPTIONS = [
  "#ff9500",
  "#007aff",
  "#af52de",
  "#ff2d55",
  "#ff3b30",
  "#ffcc00",
  "#5856d6",
  "#5ac8fa",
  "#34c759",
  "#6e6e73",
];

export function CreateCategoryDialog({ onSuccess }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "both",
    emoji: "📁",
    color: "#6e6e73",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("type", formData.type);
      formDataObj.append("emoji", formData.emoji);
      formDataObj.append("color", formData.color);

      const result = await createCategory(formDataObj);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Category created successfully!");
        setOpen(false);
        setFormData({
          name: "",
          type: "both",
          emoji: "📁",
          color: "#6e6e73",
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
          Create Category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>Create a custom category for your expenses and income</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g. Travel, Groceries"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Category Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as "expense" | "income" | "both" })
              }
            >
              <SelectTrigger id="type" disabled={loading}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both (Expense & Income)</SelectItem>
                <SelectItem value="expense">Expense Only</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-all ${
                    formData.emoji === emoji
                      ? "border-[var(--apple-blue)] bg-[rgba(0,122,255,0.12)]"
                      : "border-[var(--separator)] hover:border-[var(--apple-blue)]"
                  }`}
                  disabled={loading}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    formData.color === color ? "border-[var(--text-primary)] ring-2 ring-offset-2" : "border-[var(--separator)]"
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                />
              ))}
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
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
