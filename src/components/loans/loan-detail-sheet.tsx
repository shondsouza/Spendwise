'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { AmortizationTable } from './amortization-table';
import { LoanProgressBar } from './loan-progress-bar';
import { EducationLoanPhaseBadge } from './education-loan-phase-badge';
import { computeLoanBalance } from '@/lib/loans/loan-calculator';
import { getEducationLoanPhase } from '@/lib/loans/education-loan-calculator';
import type { UserLoan, LoanPayment } from '@/types/loan.types';
import { LOAN_TYPE_CONFIG, PAYMENT_TYPE_LABELS } from '@/types/loan.types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteLoanPayment } from '@/app/actions/loan.actions';
import { toast } from 'sonner';

interface LoanDetailSheetProps {
  loan: UserLoan | null;
  payments: LoanPayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentDeleted?: () => void;
}

export function LoanDetailSheet({
  loan,
  payments,
  open,
  onOpenChange,
  onPaymentDeleted,
}: LoanDetailSheetProps) {
  if (!loan) return null;

  const balance = computeLoanBalance(loan);
  const config = LOAN_TYPE_CONFIG[loan.loan_type];
  const isEducation = loan.loan_type === 'education' || loan.interest_type === 'hybrid';
  const eduPhase = isEducation ? getEducationLoanPhase(loan) : null;
  const showEduStats = isEducation && (balance.phase === 'moratorium' || eduPhase?.outstandingAtEmiStart);

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Delete this payment? The loan balance will be reversed.')) return;
    const result = await deleteLoanPayment(paymentId, loan.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Payment deleted');
      onPaymentDeleted?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-0 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-[var(--separator)] px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: config.bgColor }}
            >
              {config.emoji}
            </div>
            <div>
              <DialogTitle className="text-[18px] font-bold text-[var(--text-primary)]">
                {loan.loan_name}
              </DialogTitle>
              <p className="text-[13px] text-[var(--text-secondary)]">
                {loan.lender_name} · {config.label}
              </p>
            </div>
          </div>

          {isEducation && (
            <div className="mt-3">
              <EducationLoanPhaseBadge phase={balance.phase} phaseLabel={balance.phaseLabel} />
            </div>
          )}
        </DialogHeader>

        {/* Stats Overview */}
        {showEduStats ? (
          /* Education loan — show the 5 key values clearly */
          <div className="px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: 'Original Principal', value: formatCurrency(balance.originalPrincipal), color: '' },
                { label: 'Current Outstanding', value: formatCurrency(balance.currentOutstanding), color: 'text-[var(--apple-red)]' },
                { label: 'Accrued Interest', value: formatCurrency(balance.accruedInterest), color: 'text-[var(--apple-orange)]' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[rgba(120,120,128,0.06)] p-3">
                  <p className="text-[11px] text-[var(--text-tertiary)]">{s.label}</p>
                  <p className={`mt-0.5 text-[15px] font-bold ${s.color || 'text-[var(--text-primary)]'}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            {/* Projected @ EMI Start + Bank EMI — full-width highlighted strip */}
            <div className="flex items-center justify-between rounded-xl bg-[rgba(255,149,0,0.08)] px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--apple-orange)]">
                  Projected Outstanding at EMI Start
                </p>
                <p className="text-[18px] font-bold text-[var(--apple-orange)]">
                  {eduPhase?.outstandingAtEmiStart
                    ? formatCurrency(eduPhase.outstandingAtEmiStart)
                    : '—'}
                </p>
              </div>
              {loan.bank_emi_amount && (
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--apple-blue)]">
                    Bank EMI
                  </p>
                  <p className="text-[18px] font-bold text-[var(--apple-blue)]">
                    {formatCurrency(Number(loan.bank_emi_amount))}/mo
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Standard stats for non-education loans */
          <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-4">
            {[
              { label: 'Outstanding', value: formatCurrency(balance.currentOutstanding), color: 'text-[var(--apple-red)]' },
              { label: 'Original Principal', value: formatCurrency(balance.originalPrincipal), color: '' },
              { label: 'Interest Accrued', value: formatCurrency(balance.accruedInterest), color: 'text-[var(--apple-orange)]' },
              { label: 'Total Paid', value: formatCurrency(balance.totalInterestPaid + balance.totalPrincipalPaid), color: 'text-[var(--apple-green)]' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-[rgba(120,120,128,0.06)] p-3">
                <p className="text-[11px] text-[var(--text-tertiary)]">{s.label}</p>
                <p className={`mt-0.5 text-[15px] font-bold ${s.color || 'text-[var(--text-primary)]'}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="px-6 pb-3">
          <LoanProgressBar percent={balance.repaymentPercent} showLabel size="lg" />
        </div>

        {/* Tabs: Schedule / Payments */}
        <Tabs defaultValue="schedule" className="px-6 pb-6">
          <TabsList className="mb-4 h-9 w-full rounded-xl bg-[rgba(120,120,128,0.10)]">
            <TabsTrigger value="schedule" className="flex-1 rounded-lg text-[12px] font-semibold">
              Amortization Schedule
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 rounded-lg text-[12px] font-semibold">
              Payment History ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1 rounded-lg text-[12px] font-semibold">
              Loan Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <AmortizationTable loan={loan} payments={payments} />
          </TabsContent>

          <TabsContent value="payments">
            {payments.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[var(--text-tertiary)]">
                No payments recorded yet
              </div>
            ) : (
              <div className="space-y-2">
                {[...payments]
                  .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl bg-[rgba(120,120,128,0.05)] px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                            {formatDate(p.payment_date, 'dd MMM yyyy')}
                          </p>
                          <span className="rounded-full bg-[rgba(0,122,255,0.10)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.4px] text-[var(--apple-blue)]">
                            {PAYMENT_TYPE_LABELS[p.payment_type]}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-[11px]">
                          {p.principal_component > 0 && (
                            <span className="text-[var(--apple-green)]">
                              P: {formatCurrency(p.principal_component)}
                            </span>
                          )}
                          {p.interest_component > 0 && (
                            <span className="text-[var(--apple-orange)]">
                              I: {formatCurrency(p.interest_component)}
                            </span>
                          )}
                          {p.note && (
                            <span className="text-[var(--text-tertiary)]">{p.note}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-[16px] font-bold text-[var(--apple-green)]">
                        {formatCurrency(p.amount)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[var(--apple-red)] opacity-60 hover:opacity-100"
                        onClick={() => handleDeletePayment(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-3">
              {[
                { label: 'Loan Type', value: config.label },
                { label: 'Interest Type', value: loan.interest_type },
                { label: 'Interest Rate', value: `${loan.interest_rate}% p.a.` },
                { label: 'Start Date', value: loan.loan_start_date ? formatDate(loan.loan_start_date, 'dd MMM yyyy') : '—' },
                loan.emi_start_date && { label: 'EMI Start', value: formatDate(loan.emi_start_date, 'dd MMM yyyy') },
                loan.emi_amount && { label: 'Calculated EMI', value: formatCurrency(Number(loan.emi_amount)) },
                loan.bank_emi_amount && { label: 'Bank EMI', value: formatCurrency(Number(loan.bank_emi_amount)) },
                loan.loan_tenure_months && { label: 'Tenure', value: `${loan.loan_tenure_months} months (${Math.round(loan.loan_tenure_months / 12)} years)` },
                loan.moratorium_end_date && { label: 'Moratorium End', value: formatDate(loan.moratorium_end_date, 'dd MMM yyyy') },
                loan.moratorium_si_rate && { label: 'SI Rate (Moratorium)', value: `${loan.moratorium_si_rate}% p.a.` },
                loan.ci_rate && { label: 'CI Rate (Repayment)', value: `${loan.ci_rate}% p.a.` },
                loan.outstanding_as_of_date && {
                  label: 'Outstanding As Of',
                  value: formatDate(loan.outstanding_as_of_date, 'dd MMM yyyy'),
                },
                balance.estimatedPayoffDate && { label: 'Estimated Payoff', value: formatDate(balance.estimatedPayoffDate, 'dd MMM yyyy') },
                loan.notes && { label: 'Notes', value: loan.notes },
              ]
                .filter((item): item is { label: string; value: string } => Boolean(item))
                .map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-[rgba(120,120,128,0.05)] px-4 py-3">
                    <span className="text-[13px] text-[var(--text-secondary)]">{item.label}</span>
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{item.value}</span>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
