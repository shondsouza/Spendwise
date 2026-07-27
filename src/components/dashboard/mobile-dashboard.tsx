import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight, ReceiptText, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateShort } from "@/lib/utils/date";

type Transaction = {
  id: string;
  type: "expense" | "income";
  title: string;
  amount: number;
  category: string;
  date: string;
};

interface MobileDashboardProps {
  netBalance: number;
  totalIncome: number;
  totalSpent: number;
  monthOverMonthChange: number;
  categoryData: { name: string; value: number }[];
  transactions: Transaction[];
}

const categoryColors = ["#4a90e2", "#8b82eb", "#f7255c", "#36b98b"];

export function MobileDashboard({
  netBalance,
  totalIncome,
  totalSpent,
  monthOverMonthChange,
  categoryData,
  transactions,
}: MobileDashboardProps) {
  const topCategories = [...categoryData].sort((a, b) => b.value - a.value).slice(0, 3);
  const categoryTotal = topCategories.reduce((total, category) => total + category.value, 0);
  const improvement = monthOverMonthChange > 0;
  const hasComparison = monthOverMonthChange !== 0;

  return (
    <div className="mobile-dashboard md:hidden">
      <header className="mobile-dashboard-header">
        <p className="mobile-dashboard-kicker">SpendWise</p>
      </header>

      <section className="mobile-balance-card">
        <span className="mobile-card-menu" aria-hidden="true">•••</span>
        <p className="mobile-overline">Total balance</p>
        <p className="mobile-balance-amount">{formatCurrency(netBalance)}</p>
        <div className={`mobile-trend-pill ${improvement ? "is-positive" : "is-negative"}`}>
          {improvement ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
          <span>
            {hasComparison
              ? `${Math.abs(monthOverMonthChange).toFixed(1)}% ${improvement ? "less" : "more"} than last month`
              : "Start tracking this month"}
          </span>
        </div>
      </section>

      <section className="mobile-stat-grid" aria-label="Monthly totals">
        <div className="mobile-stat-card income">
          <span className="mobile-stat-icon"><ArrowDown className="h-5 w-5" /></span>
          <p>Income</p>
          <strong>+{formatCurrency(totalIncome)}</strong>
        </div>
        <div className="mobile-stat-card expense">
          <span className="mobile-stat-icon"><ArrowUp className="h-5 w-5" /></span>
          <p>Expenses</p>
          <strong>-{formatCurrency(totalSpent)}</strong>
        </div>
      </section>

      <section className="mobile-glass-card mobile-spending-card">
        <div className="mobile-section-heading">
          <h2>Spending</h2>
          <Link href="/dashboard/analytics">See all <ChevronRight className="h-4 w-4" /></Link>
        </div>
        {topCategories.length > 0 ? (
          <>
            <div className="mobile-spending-bar" aria-label="Spending by category">
              {topCategories.map((category, index) => (
                <span
                  key={category.name}
                  style={{
                    width: `${(category.value / categoryTotal) * 100}%`,
                    backgroundColor: categoryColors[index],
                  }}
                />
              ))}
            </div>
            <div className="mt-4 space-y-0.5">
              {topCategories.map((category, index) => {
                const percentage = categoryTotal ? Math.round((category.value / categoryTotal) * 100) : 0;
                return (
                  <div className="mobile-category-row" key={category.name}>
                    <span className="mobile-category-dot" style={{ backgroundColor: categoryColors[index] }} />
                    <span>{category.name}</span>
                    <strong>{percentage}%</strong>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="mobile-empty-copy">Your spending categories will appear here.</p>
        )}
      </section>

      <section className="mobile-glass-card mobile-transactions-card">
        <div className="mobile-section-heading">
          <h2>Recent transactions</h2>
          <Link href="/dashboard/expenses">See all <ChevronRight className="h-4 w-4" /></Link>
        </div>
        {transactions.length > 0 ? (
          <div className="mt-2 divide-y divide-[var(--separator)]">
            {transactions.slice(0, 3).map((transaction) => {
              const isIncome = transaction.type === "income";
              return (
                <div className="mobile-transaction" key={transaction.id}>
                  <span className={`mobile-transaction-icon ${isIncome ? "income" : "expense"}`}>
                    {isIncome ? <ArrowDown className="h-5 w-5" /> : <ReceiptText className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>{transaction.title}</p>
                    <span>{transaction.category} · {formatDateShort(transaction.date)}</span>
                  </div>
                  <strong className={isIncome ? "text-[var(--apple-green)]" : "text-[var(--text-primary)]"}>
                    {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </strong>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mobile-empty-copy">No transactions yet. Add an expense or income entry to get started.</p>
        )}
      </section>
    </div>
  );
}
