'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { getLoans, getAllLoanPayments } from '@/app/actions/loan.actions';
import type { UserLoan, LoanPayment } from '@/types/loan.types';
import { Plus, BarChart3, Calculator, Shield, Landmark, ArrowUpRight, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Components
import { LoanSummaryStrip } from '@/components/loans/loan-summary-strip';
import { LoanCard } from '@/components/loans/loan-card';
import { AddLoanDialog } from '@/components/loans/add-loan-dialog';
import { EditLoanDialog } from '@/components/loans/edit-loan-dialog';
import { AddPaymentDialog } from '@/components/loans/add-payment-dialog';
import { LoanDetailSheet } from '@/components/loans/loan-detail-sheet';
import { LoanAnalytics } from '@/components/loans/loan-analytics';
import { LoanSimulator } from '@/components/loans/loan-simulator';
import { MoratoriumDashboard } from '@/components/loans/moratorium-dashboard';
import { DebtFreedomWidget } from '@/components/loans/debt-freedom-widget';
import { LoanHealthScoreCard } from '@/components/loans/loan-health-score-card';
import { computeLoanBalance } from '@/lib/loans/loan-calculator';
import { formatCurrency } from '@/lib/utils/currency';

export default function LoanPage() {
  const [loans, setLoans] = useState<UserLoan[]>([]);
  const [allPayments, setAllPayments] = useState<Record<string, LoanPayment[]>>({});
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('loans');

  // Dialog State
  const [addLoanOpen, setAddLoanOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<UserLoan | null>(null);
  const [addPaymentLoan, setAddPaymentLoan] = useState<UserLoan | null>(null);
  const [detailLoan, setDetailLoan] = useState<UserLoan | null>(null);

  useEffect(() => {
    fetchData();
    const savedTab = localStorage.getItem('loanDashboardActiveTab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem('loanDashboardActiveTab', val);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansResult, paymentsResult] = await Promise.all([
        getLoans(),
        getAllLoanPayments(),
      ]);

      if (loansResult.data) setLoans(loansResult.data);
      if (paymentsResult.data) setAllPayments(paymentsResult.data);

      // Fetch this month's income for DTI and health score calculations
      const supabase = createClient();
      const today = new Date();
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      const { data: incomeData } = await supabase
        .from('income')
        .select('amount')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (incomeData) {
        const total = incomeData.reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
        setMonthlyIncome(total);
      }
    } catch {
      toast.error('Failed to load loan data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchData();
  const portfolio = useMemo(() => {
    const activeLoans = loans.filter((loan) => loan.status === 'active');

    return activeLoans.reduce(
      (summary, loan) => {
        summary.outstanding += computeLoanBalance(loan).currentOutstanding;
        summary.monthlyEmi += Number(loan.emi_amount ?? 0);
        return summary;
      },
      { activeLoans, outstanding: 0, monthlyEmi: 0 },
    );
  }, [loans]);

  return (
    <div className="page-enter space-y-6 pb-20">
      <PageHeader
        title="Loans"
        description="Manage bank loans, track EMIs, and simulate payoff scenarios"
        action={
          <Button
            onClick={() => setAddLoanOpen(true)}
            className="rounded-full bg-[var(--apple-blue)] font-semibold text-white hover:bg-[#0071f0] shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Loan
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-5">
          {/* Summary strip skeleton */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="skeleton h-[96px] rounded-2xl" />
            ))}
          </div>
          {/* Card skeletons */}
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--separator)] bg-[rgba(120,120,128,0.03)] py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[rgba(0,122,255,0.08)] text-4xl shadow-sm mb-5">
            🏦
          </div>
          <h3 className="text-[20px] font-bold tracking-[-0.3px] text-[var(--text-primary)]">
            No loans yet
          </h3>
          <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Add your first loan to track EMIs, monitor outstanding balances, and plan your debt freedom.
          </p>
          <Button
            onClick={() => setAddLoanOpen(true)}
            className="mt-6 rounded-full bg-[var(--apple-blue)] px-6 font-semibold text-white hover:bg-[#0071f0] shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add First Loan
          </Button>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[0_12px_32px_rgba(30,38,68,0.06)] sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[rgba(0,122,255,0.12)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-[rgba(175,82,222,0.08)] blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.7px] text-[var(--apple-blue)]">Loan portfolio</p>
                <h2 className="mt-1.5 text-[24px] font-extrabold tracking-[-0.7px] text-[var(--text-primary)] sm:text-[27px]">
                  {portfolio.activeLoans.length} active loan{portfolio.activeLoans.length !== 1 ? 's' : ''} under control
                </h2>
                <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
                  Keep payments current and use the tools below to plan your payoff.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[290px]">
                <div className="rounded-2xl border border-[rgba(255,59,48,0.12)] bg-[rgba(255,59,48,0.06)] px-3.5 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.45px] text-[var(--apple-red)]">Outstanding</span>
                  <p className="mt-1 truncate text-[17px] font-extrabold tracking-[-0.5px] text-[var(--text-primary)]" title={formatCurrency(portfolio.outstanding)}>{formatCurrency(portfolio.outstanding)}</p>
                </div>
                <div className="rounded-2xl border border-[rgba(0,122,255,0.12)] bg-[rgba(0,122,255,0.06)] px-3.5 py-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.45px] text-[var(--apple-blue)]"><CreditCard className="h-3 w-3" /> Monthly EMI</span>
                  <p className="mt-1 truncate text-[17px] font-extrabold tracking-[-0.5px] text-[var(--text-primary)]" title={formatCurrency(portfolio.monthlyEmi)}>{formatCurrency(portfolio.monthlyEmi)}</p>
                </div>
              </div>
            </div>
          </section>

          <LoanSummaryStrip loans={loans} />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="mb-5">
              <TabsList className="grid h-11 w-full grid-cols-4 rounded-2xl bg-[rgba(120,120,128,0.08)] p-1 sm:max-w-xl">
                <TabsTrigger value="loans" className="min-w-0 rounded-xl px-1.5 text-[11px] font-semibold data-[state=active]:shadow-sm sm:px-3 sm:text-[12px]">
                  <Landmark className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">My Loans</span><span className="sm:hidden">Loans</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="min-w-0 rounded-xl px-1.5 text-[11px] font-semibold data-[state=active]:shadow-sm sm:px-3 sm:text-[12px]">
                  <BarChart3 className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Analytics</span><span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="simulator" className="min-w-0 rounded-xl px-1.5 text-[11px] font-semibold data-[state=active]:shadow-sm sm:px-3 sm:text-[12px]">
                  <Calculator className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Simulator</span><span className="sm:hidden">Plan</span>
                </TabsTrigger>
                <TabsTrigger value="health" className="min-w-0 rounded-xl px-1.5 text-[11px] font-semibold data-[state=active]:shadow-sm sm:px-3 sm:text-[12px]">
                  <Shield className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Health</span><span className="sm:hidden">Health</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── MY LOANS TAB ─────────────────────────────────── */}
            <TabsContent value="loans" className="mt-0 space-y-5">
              {/* Moratorium Dashboard — only shown when active moratorium loans exist */}
              <MoratoriumDashboard loans={loans} />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[19px] font-bold tracking-[-0.4px] text-[var(--text-primary)]">Your loans</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">Select a loan to view its payment history and payoff plan.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAddLoanOpen(true)} className="hidden flex-none gap-1 rounded-full text-[var(--apple-blue)] sm:inline-flex">
                  Add another <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {loans.map((loan, index) => (
                  <div
                    key={loan.id}
                    className="card"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <LoanCard
                      loan={loan}
                      payments={allPayments[loan.id] || []}
                      onEditClick={setEditLoan}
                      onAddPaymentClick={setAddPaymentLoan}
                      onViewDetailClick={setDetailLoan}
                      onDeleted={handleRefresh}
                    />
                  </div>
                ))}
              </div>

              {/* Debt Freedom Widget */}
              <DebtFreedomWidget loans={loans} />
            </TabsContent>

            {/* ── ANALYTICS TAB ────────────────────────────────── */}
            <TabsContent value="analytics" className="mt-0">
              <LoanAnalytics
                loans={loans}
                allPayments={allPayments}
                monthlyIncome={monthlyIncome}
              />
            </TabsContent>

            {/* ── SIMULATOR TAB ────────────────────────────────── */}
            <TabsContent value="simulator" className="mt-0">
              <LoanSimulator loans={loans.filter((l) => l.status === 'active')} />
            </TabsContent>

            {/* ── HEALTH TAB ───────────────────────────────────── */}
            <TabsContent value="health" className="mt-0">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <LoanHealthScoreCard
                  loans={loans}
                  allPayments={allPayments}
                  monthlyIncome={monthlyIncome}
                />
                <div className="space-y-5">
                  <DebtFreedomWidget loans={loans} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Dialogs */}
      <AddLoanDialog
        open={addLoanOpen}
        onOpenChange={setAddLoanOpen}
        onSuccess={handleRefresh}
      />

      {editLoan && (
        <EditLoanDialog
          loan={editLoan}
          open={!!editLoan}
          onOpenChange={(open) => !open && setEditLoan(null)}
          onSuccess={handleRefresh}
        />
      )}

      {addPaymentLoan && (
        <AddPaymentDialog
          loan={addPaymentLoan}
          open={!!addPaymentLoan}
          onOpenChange={(open) => !open && setAddPaymentLoan(null)}
          onSuccess={handleRefresh}
        />
      )}

      {detailLoan && (
        <LoanDetailSheet
          loan={detailLoan}
          payments={allPayments[detailLoan.id] || []}
          open={!!detailLoan}
          onOpenChange={(open) => !open && setDetailLoan(null)}
          onPaymentDeleted={handleRefresh}
        />
      )}
    </div>
  );
}
