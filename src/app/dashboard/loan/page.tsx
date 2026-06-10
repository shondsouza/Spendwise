"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AmountDisplay } from "@/components/shared/amount-display";
import { AddMoneyTakenDialog } from "@/components/money/add-money-taken-dialog";
import { AddRepaymentDialog } from "@/components/money/add-repayment-dialog";
import { getMoneyTaken, getTakenRepayments, deleteMoneyTaken } from "@/app/actions/money.actions";
import { formatDate } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { Landmark, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MoneyTaken, TakenRepayment } from "@/types/money.types";

export default function LoanPage() {
  const [entries, setEntries] = useState<MoneyTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [repayments, setRepayments] = useState<Record<string, TakenRepayment[]>>({});

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const result = await getMoneyTaken(100);
      if (result.data) {
        setEntries(result.data);
      }
    } catch {
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);

    if (!repayments[id]) {
      const result = await getTakenRepayments(id);
      if (result.data) {
        setRepayments({ ...repayments, [id]: result.data });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this entry? Repayments will also be deleted.")) {
      const result = await deleteMoneyTaken(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Entry deleted");
        setEntries(entries.filter((e) => e.id !== id));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Repaid":
        return "bg-[rgba(52,199,89,0.12)] text-[var(--apple-green)]";
      case "Partially Repaid":
        return "bg-[rgba(255,149,0,0.12)] text-[var(--apple-orange)]";
      default:
        return "bg-[rgba(120,120,128,0.12)] text-[var(--text-secondary)]";
    }
  };

  const getRemaining = (entry: MoneyTaken, reps: TakenRepayment[] | undefined) => {
    const totalPaid = reps?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
    return Number(entry.amount) - totalPaid;
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="🏦 Loan"
        description="Track money you've borrowed from others"
        action={<AddMoneyTakenDialog onSuccess={fetchEntries} />}
      />

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[rgba(120,120,128,0.12)]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No loans yet"
          description="Track money you've borrowed from people"
          action={{ label: "Refresh", onClick: fetchEntries }}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const reps = repayments[entry.id];
            const remaining = getRemaining(entry, reps);
            const isExpanded = expandedId === entry.id;

            return (
              <div key={entry.id} className="apple-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[17px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
                          {entry.person_name}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.5px] ${getStatusColor(entry.status)}`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      {entry.reason && (
                        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                          {entry.reason}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-[13px] text-[var(--text-tertiary)]">
                          {formatDate(entry.taken_date, "dd MMM yyyy")}
                        </span>
                        {entry.due_date && (
                          <span className="text-[13px] text-[var(--text-tertiary)]">
                            Due: {formatDate(entry.due_date, "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <AmountDisplay amount={Number(entry.amount)} variant="danger" />
                      {remaining > 0 && (
                        <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
                          Remaining: {formatCurrency(remaining)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {remaining > 0 && (
                      <AddRepaymentDialog
                        type="taken"
                        parentId={entry.id}
                        personName={entry.person_name}
                        remaining={remaining}
                        onSuccess={() => {
                          fetchEntries();
                          setRepayments({});
                        }}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-[13px] text-[var(--text-secondary)]"
                      onClick={() => toggleExpand(entry.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      {reps?.length ?? 0} payments
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                      className="ml-auto h-8 w-8 text-[var(--apple-red)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && reps && (
                  <div
                    className="border-t border-[var(--separator)] bg-[rgba(120,120,128,0.04)] px-5 py-3"
                  >
                    {reps.length === 0 ? (
                      <p className="py-3 text-center text-[13px] text-[var(--text-tertiary)]">
                        No payments made yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {reps.map((rep) => (
                          <div
                            key={rep.id}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div>
                              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                                {formatDate(rep.paid_date, "dd MMM yyyy")}
                              </p>
                              {rep.note && (
                                <p className="text-[11px] text-[var(--text-tertiary)]">
                                  {rep.note}
                                </p>
                              )}
                            </div>
                            <AmountDisplay
                              amount={Number(rep.amount)}
                              variant="success"
                              className="text-[13px]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
