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
import { Banknote } from "lucide-react";
import { addGivenRepayment, addTakenRepayment } from "@/app/actions/money.actions";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/currency";

interface AddRepaymentDialogProps {
  type: "given" | "taken";
  parentId: string;
  personName: string;
  remaining: number;
  onSuccess?: () => void;
}

export function AddRepaymentDialog({
  type,
  parentId,
  personName,
  remaining,
  onSuccess,
}: AddRepaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("amount", formData.amount);
      fd.append("note", formData.note);

      if (type === "given") {
        fd.append("given_id", parentId);
        fd.append("received_date", formData.date);
        const result = await addGivenRepayment(fd);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Repayment recorded!");
          resetAndClose();
          onSuccess?.();
        }
      } else {
        fd.append("taken_id", parentId);
        fd.append("paid_date", formData.date);
        const result = await addTakenRepayment(fd);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Payment recorded!");
          resetAndClose();
          onSuccess?.();
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setFormData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    });
  };

  const title = type === "given" ? "Record Repayment Received" : "Record Payment Made";
  const description =
    type === "given"
      ? `${personName} paid you back`
      : `You paid ${personName} back`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-[13px]">
          <Banknote className="h-3.5 w-3.5" />
          {type === "given" ? "Received" : "Paid"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl bg-[rgba(120,120,128,0.08)] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
              Remaining Balance
            </p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
              {formatCurrency(remaining)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rep_amount">Amount (₹)</Label>
              <Input
                id="rep_amount"
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
              <Label htmlFor="rep_date">
                {type === "given" ? "Received On" : "Paid On"}
              </Label>
              <Input
                id="rep_date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rep_note">Note (Optional)</Label>
            <Textarea
              id="rep_note"
              placeholder="Add a note..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={loading}
              className="h-16"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
