"use client";

import React, { useState, useEffect } from "react";
import { getIncome, deleteIncome } from "@/app/actions/income.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Income } from "@/types";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AmountDisplay } from "@/components/shared/amount-display";
import { CategoryBadge } from "@/components/shared/category-badge";
import { formatDate, formatDateShort } from "@/lib/utils/date";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { INCOME_CATEGORIES } from "@/lib/constants/config";

function getCategoryEmoji(category: string): string {
  const found = INCOME_CATEGORIES.find((c) => c.value === category || c.label === category);
  return found?.emoji || "💰";
}

function getCategoryColor(category: string): string {
  const found = INCOME_CATEGORIES.find((c) => c.value === category || c.label === category);
  return found?.color || "#34c759";
}

export default function IncomePage() {
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const result = await getIncome(100);
      if (result.data) {
        setIncomeList(result.data);
      }
    } catch {
      toast.error("Failed to load income");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this income entry?")) {
      try {
        const result = await deleteIncome(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Income deleted successfully!");
          setIncomeList(incomeList.filter((e) => e.id !== id));
        }
      } catch {
        toast.error("Failed to delete income");
      }
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="💰 Income"
        description="Track and manage all your income sources"
        action={<AddIncomeDialog onSuccess={fetchIncome} />}
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-[rgba(120,120,128,0.12)]" />
          ))}
        </div>
      ) : incomeList.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No income entries yet"
          description="Start tracking your income sources"
          action={{
            label: "Add Income",
            onClick: () => fetchIncome(),
          }}
        />
      ) : (
        <div className="apple-card overflow-hidden">
          {/* Mobile: card rows */}
          <div className="md:hidden divide-y divide-[var(--separator)]">
            {incomeList.map((income) => {
              const emoji = getCategoryEmoji(income.category);
              const color = getCategoryColor(income.category);
              return (
                <div key={income.id} className="tx-card">
                  <div className="tx-card-icon" style={{ background: `${color}18` }}>
                    <span>{emoji}</span>
                  </div>
                  <div className="tx-card-body">
                    <div className="tx-card-title">{income.title}</div>
                    <div className="tx-card-sub">
                      {income.category} · {formatDateShort(income.date)}{income.source ? ` · ${income.source}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <AmountDisplay amount={income.amount} variant="success" className="text-[15px] font-bold" />
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(255,59,48,0.1)] text-[var(--apple-red)] transition-all active:scale-90"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeList.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="text-[13px] text-[var(--text-tertiary)]">
                      {formatDate(income.date, "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{income.title}</TableCell>
                    <TableCell>
                      <CategoryBadge category={income.category} type="income" />
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-secondary)]">
                      {income.source || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountDisplay amount={income.amount} variant="success" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(income.id)}
                        className="h-8 w-8 text-[var(--apple-red)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
