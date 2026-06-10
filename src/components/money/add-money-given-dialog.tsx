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
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { addMoneyGiven } from "@/app/actions/money.actions";
import { toast } from "sonner";

interface AddMoneyGivenDialogProps {
  onSuccess?: () => void;
}

export function AddMoneyGivenDialog({ onSuccess }: AddMoneyGivenDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    person_name: "",
    amount: "",
    given_date: new Date().toISOString().split("T")[0],
    reason: "",
    expected_return: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("person_name", formData.person_name);
      fd.append("amount", formData.amount);
      fd.append("given_date", formData.given_date);
      fd.append("reason", formData.reason);
      fd.append("expected_return", formData.expected_return);

      const result = await addMoneyGiven(fd);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Entry added successfully!");
        setOpen(false);
        setFormData({
          person_name: "",
          amount: "",
          given_date: new Date().toISOString().split("T")[0],
          reason: "",
          expected_return: "",
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
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🤝 Money Lent</DialogTitle>
          <DialogDescription>Record money you gave to someone</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person_name">Person Name</Label>
            <Input
              id="person_name"
              placeholder="e.g., John"
              value={formData.person_name}
              onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
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
              <Label htmlFor="given_date">Date Given</Label>
              <Input
                id="given_date"
                type="date"
                value={formData.given_date}
                onChange={(e) => setFormData({ ...formData, given_date: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_return">Expected Return Date (Optional)</Label>
            <Input
              id="expected_return"
              type="date"
              value={formData.expected_return}
              onChange={(e) => setFormData({ ...formData, expected_return: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why did you lend the money?"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
