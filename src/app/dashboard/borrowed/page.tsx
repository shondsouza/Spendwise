"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AmountDisplay } from "@/components/shared/amount-display";
import { AddMoneyTakenDialog } from "@/components/money/add-money-taken-dialog";
import { EditMoneyTakenDialog } from "@/components/money/edit-money-taken-dialog";
import { AddRepaymentDialog } from "@/components/money/add-repayment-dialog";
import { getMoneyTaken, getTakenRepayments, deleteMoneyTaken } from "@/app/actions/money.actions";
import { useGuestData } from "@/lib/guest-data";
import type { MoneyTaken, TakenRepayment } from "@/types/money.types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";
import { HandCoins, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function BorrowedPage() {
  const [entries, setEntries] = useState<MoneyTaken[]>([]);
  const [repayments, setRepayments] = useState<Record<string, TakenRepayment[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const guestData = useGuestData();

  const refresh = async () => {
    setLoading(true);
    if (guestData.isGuest) {
      setEntries(guestData.moneyTaken);
      const map: Record<string, TakenRepayment[]> = {};
      guestData.moneyTaken.forEach((entry) => {
        map[entry.id] = guestData.takenRepayments.filter((repayment) => repayment.taken_id === entry.id);
      });
      setRepayments(map);
      setLoading(false);
      return;
    }
    const result = await getMoneyTaken(100);
    if (result.data) setEntries(result.data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [guestData.isGuest, guestData.moneyTaken, guestData.takenRepayments]);

  const toggle = async (id: string) => {
    setExpanded(expanded === id ? null : id);
    if (expanded === id || repayments[id]) return;
    if (!guestData.isGuest) {
      const result = await getTakenRepayments(id);
      if (result.data) setRepayments((previous) => ({ ...previous, [id]: result.data! }));
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this borrowed-money entry?")) return;
    const result = guestData.isGuest ? (guestData.deleteMoneyTaken(id), { error: null }) : await deleteMoneyTaken(id);
    if (result.error) toast.error(result.error);
    else { toast.success("Entry deleted"); refresh(); }
  };

  return (
    <div className="page-enter">
      <PageHeader title="🏦 Borrowed" description="Track money you borrowed from others" action={<AddMoneyTakenDialog onSuccess={refresh} />} />
      {loading ? <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-[rgba(120,120,128,0.12)]" />)}</div> : entries.length === 0 ? (
        <EmptyState icon={HandCoins} title="No borrowed money yet" description="Track money you need to repay" />
      ) : <div className="space-y-3">
        {entries.map((entry) => {
          const reps = repayments[entry.id] ?? [];
          const paid = reps.reduce((sum, item) => sum + Number(item.amount), 0);
          const remaining = Number(entry.amount) - paid;
          return <div key={entry.id} className="apple-card overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div><h3 className="text-[17px] font-semibold text-[var(--text-primary)]">{entry.person_name}</h3><p className="mt-1 text-[13px] text-[var(--text-secondary)]">{entry.reason || "Borrowed money"} · {formatDate(entry.taken_date, "dd MMM yyyy")}</p>{entry.due_date && <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Due: {formatDate(entry.due_date, "dd MMM yyyy")}</p>}</div>
                <AmountDisplay amount={Number(entry.amount)} variant="danger" />
              </div>
              <p className="mt-2 text-[12px] text-[var(--text-secondary)]">Remaining: ₹{Math.max(0, remaining).toFixed(2)}</p>
              <div className="mt-4 flex items-center gap-2">
                {remaining > 0 && <AddRepaymentDialog type="taken" parentId={entry.id} personName={entry.person_name} remaining={remaining} onSuccess={refresh} />}
                <EditMoneyTakenDialog entry={entry} onSuccess={refresh} />
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toggle(entry.id)}>{expanded === entry.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} {reps.length} payments</Button>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-[var(--apple-red)]" onClick={() => remove(entry.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            {expanded === entry.id && <div className="border-t border-[var(--separator)] px-5 py-3">{reps.length ? reps.map((repayment) => <div key={repayment.id} className="flex justify-between py-1 text-[13px]"><span>{formatDate(repayment.paid_date, "dd MMM yyyy")}</span><AmountDisplay amount={Number(repayment.amount)} variant="success" className="text-[13px]" /></div>) : <p className="text-center text-[13px] text-[var(--text-tertiary)]">No payments yet</p>}</div>}
          </div>;
        })}
      </div>}
    </div>
  );
}
