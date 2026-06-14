'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { getLoans, getAllLoanPayments } from '@/app/actions/loan.actions';
import type { UserLoan, LoanPayment } from '@/types/loan.types';
import { Plus, BarChart3, Calculator, Shield, Landmark } from 'lucide-react';
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
    } catch (err) {
      toast.error('Failed to load loan data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchData();

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
          <LoanSummaryStrip loans={loans} />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="mb-5 overflow-x-auto">
              <TabsList className="h-10 w-full min-w-[360px] rounded-xl bg-[rgba(120,120,128,0.08)] p-1 sm:max-w-lg">
                <TabsTrigger value="loans" className="flex-1 rounded-lg text-[12px] font-semibold data-[state=active]:shadow-sm">
                  <Landmark className="mr-1.5 h-3.5 w-3.5" /> My Loans
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1 rounded-lg text-[12px] font-semibold data-[state=active]:shadow-sm">
                  <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Analytics
                </TabsTrigger>
                <TabsTrigger value="simulator" className="flex-1 rounded-lg text-[12px] font-semibold data-[state=active]:shadow-sm">
                  <Calculator className="mr-1.5 h-3.5 w-3.5" /> Simulator
                </TabsTrigger>
                <TabsTrigger value="health" className="flex-1 rounded-lg text-[12px] font-semibold data-[state=active]:shadow-sm">
                  <Shield className="mr-1.5 h-3.5 w-3.5" /> Health
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── MY LOANS TAB ─────────────────────────────────── */}
            <TabsContent value="loans" className="mt-0 space-y-5">
              {/* Moratorium Dashboard — only shown when active moratorium loans exist */}
              <MoratoriumDashboard loans={loans} />

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
