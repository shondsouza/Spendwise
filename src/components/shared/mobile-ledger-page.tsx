"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateShort } from "@/lib/utils/date";

export interface MobileLedgerEntry {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  detail?: string;
}

interface MobileLedgerPageProps {
  title: "Income" | "Expenses";
  entries: MobileLedgerEntry[];
  addAction: React.ReactNode;
  onDelete: (id: string) => void;
  onEdit?: (entry: MobileLedgerEntry) => void;
  loading?: boolean;
}

export function MobileLedgerPage({ title, entries, addAction, onDelete, onEdit, loading }: MobileLedgerPageProps) {
  const router = useRouter();
  const isIncome = title === "Income";
  const [range, setRange] = useState<"Week" | "Month" | "Year">("Week");
  const periodEntries = useMemo(() => {
    const now = new Date();
    const start = new Date(now);

    if (range === "Week") start.setDate(now.getDate() - 6);
    if (range === "Month") start.setDate(1);
    if (range === "Year") start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);

    return entries.filter((entry) => {
      const date = new Date(`${entry.date}T00:00:00`);
      return !Number.isNaN(date.getTime()) && date >= start && date <= now;
    });
  }, [entries, range]);
  const total = periodEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

  return (
    <div className="mobile-ledger-page md:hidden">
      <header className="mobile-ledger-header">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="mobile-ledger-back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1>{title}</h1>
        <span className={`mobile-ledger-header-icon ${isIncome ? "income" : "expense"}`}>
          {isIncome ? <ArrowDown className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
        </span>
      </header>

      <div className="mobile-ledger-range" role="tablist" aria-label="Time range">
        {(["Week", "Month", "Year"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={range === option ? "active" : undefined}
            role="tab"
            aria-selected={range === option}
            onClick={() => setRange(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <section className={`mobile-ledger-total ${isIncome ? "income" : "expense"}`}>
        <div className="mobile-ledger-total-heading">
          <p>Total {title}</p>
          <span>{periodEntries.length ? `${periodEntries.length} entries` : "No entries"}</span>
        </div>
        <strong>{isIncome ? "+" : "-"}{formatCurrency(total)}</strong>
        <small>{isIncome ? "Money received this period" : "Money spent this period"}</small>
      </section>

      <div className="mobile-ledger-list-heading">
        <h2>Recent Transactions</h2>
        {addAction || <button type="button" className="mobile-ledger-add"><Plus className="h-4 w-4" /> Add</button>}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="mobile-ledger-skeleton" />)}
        </div>
      ) : periodEntries.length ? (
        <div className="mobile-ledger-entries">
          {periodEntries.map((entry) => (
            <article className="mobile-ledger-entry" key={entry.id}>
              <span className={`mobile-ledger-entry-icon ${isIncome ? "income" : "expense"}`}>
                {isIncome ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <h3>{entry.title}</h3>
                <p>{entry.category} · {formatDateShort(entry.date)}{entry.detail ? ` · ${entry.detail}` : ""}</p>
              </div>
              <div className="mobile-ledger-entry-actions">
                <strong className={isIncome ? "income" : "expense"}>{isIncome ? "+" : "-"}{formatCurrency(entry.amount)}</strong>
                <div>
                  {onEdit && <button type="button" aria-label={`Edit ${entry.title}`} onClick={() => onEdit(entry)}><Pencil className="h-3 w-3" /></button>}
                  <button type="button" aria-label={`Delete ${entry.title}`} onClick={() => onDelete(entry.id)}><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mobile-ledger-empty">
          <Wallet className="h-6 w-6" />
          <p>No {title.toLowerCase()} entries for this {range.toLowerCase()}</p>
          <span>Try another time range or add a new entry.</span>
        </div>
      )}
    </div>
  );
}
