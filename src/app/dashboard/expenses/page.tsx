"use client";

import React, { useState, useEffect } from "react";
import { getExpenses, deleteExpense } from "@/app/actions/expense.actions";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Expense } from "@/types";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Wallet } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const result = await getExpenses(100);
      if (result.data) {
        setExpenses(result.data);
      }
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        const result = await deleteExpense(id);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Expense deleted successfully!");
          setExpenses(expenses.filter((e) => e.id !== id));
        }
      } catch {
        toast.error("Failed to delete expense");
      }
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="💳 Expenses"
        description="Track and manage all your expenses"
        action={<AddExpenseDialog onSuccess={fetchExpenses} />}
      />

      {/* Edit dialog - renders when editingExpense is set */}
      {editingExpense && (
        <AddExpenseDialog
          expense={editingExpense}
          onSuccess={() => {
            fetchExpenses();
            setEditingExpense(null);
          }}
          onClose={() => setEditingExpense(null)}
          trigger={<span className="hidden" />}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[rgba(120,120,128,0.12)]" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses yet"
          description="Start tracking your expenses to see them here"
          action={{
            label: "Add Expense",
            onClick: () => fetchExpenses(),
          }}
        />
      ) : (
        <ExpenseTable
          expenses={expenses}
          onEdit={(expense) => setEditingExpense(expense)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
