'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import type { UserLoan } from '@/types/loan.types';
import { computeLoanBalance } from '@/lib/loans/loan-calculator';
import { getEducationLoanPhase } from '@/lib/loans/education-loan-calculator';
import { calculateEMI } from '@/lib/loans/emi-calculator';

interface LoanDashboardWidgetProps {
  loans: UserLoan[];
  monthlyIncome?: number;
  className?: string;
}

export function LoanDashboardWidget({ loans, monthlyIncome = 0, className }: LoanDashboardWidgetProps) {
  const activeLoans = loans.filter((l) => l.status === 'active');
  if (activeLoans.length === 0) return null;

  // Compute aggregate stats
  let totalOutstanding = 0;
  let totalMonthlyEMI = 0;
  const upcomingEmis: { loan: UserLoan; amount: number; date: string }[] = [];

  for (const loan of activeLoans) {
    const balance = computeLoanBalance(loan);
    totalOutstanding += balance.currentOutstanding;

    // EMI for non-moratorium loans
    if (loan.loan_type === 'education' || loan.interest_type === 'hybrid') {
      const phase = getEducationLoanPhase(loan);
      if (phase.phase === 'repayment') {
        const emi = Number(loan.emi_amount) || calculateEMI(
          phase.outstandingAtEmiStart,
          Number(loan.ci_rate ?? loan.interest_rate),
          Number(loan.loan_tenure_months ?? 120),
        );
        totalMonthlyEMI += emi;
        if (balance.nextEmiDate) {
          upcomingEmis.push({ loan, amount: emi, date: balance.nextEmiDate });
        }
      }
    } else {
      const emi = Number(loan.emi_amount) || calculateEMI(
        balance.currentOutstanding,
        Number(loan.interest_rate),
        Number(loan.loan_tenure_months ?? 120),
      );
      totalMonthlyEMI += emi;
      if (balance.nextEmiDate) {
        upcomingEmis.push({ loan, amount: emi, date: balance.nextEmiDate });
      }
    }
  }

  // Sort upcoming EMIs by date
  upcomingEmis.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextThreeEmis = upcomingEmis.slice(0, 3);

  const dti = monthlyIncome > 0 ? (totalMonthlyEMI / monthlyIncome) * 100 : 0;
  const dtiColor = dti > 40 ? 'var(--apple-red)' : dti > 30 ? 'var(--apple-orange)' : 'var(--apple-green)';

  return (
    <div className={cn('apple-card overflow-hidden', className)}>
      {/* Gradient top accent */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, var(--apple-red), var(--apple-orange))' }}
      />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(255,59,48,0.12)]">
            <CreditCard className="h-4 w-4 text-[var(--apple-red)]" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold tracking-[-0.3px] text-[var(--text-primary)]">Loan Commitments</h3>
            <p className="text-[11px] text-[var(--text-secondary)] tracking-[-0.1px]">
              {activeLoans.length} active loan{activeLoans.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/loan"
          className="flex items-center gap-1 text-[12px] font-semibold text-[var(--apple-blue)] hover:opacity-80 transition-opacity"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-5 space-y-4">
        {/* Key metrics row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[rgba(255,59,48,0.07)] border border-[rgba(255,59,48,0.10)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
              Total Outstanding
            </p>
            <p className="mt-1.5 text-[18px] font-extrabold tracking-[-0.5px] text-[var(--apple-red)] tabular-nums">
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
          <div className="rounded-2xl bg-[rgba(0,122,255,0.07)] border border-[rgba(0,122,255,0.10)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
              Monthly EMI
            </p>
            <p className="mt-1.5 text-[18px] font-extrabold tracking-[-0.5px] text-[var(--apple-blue)] tabular-nums">
              {formatCurrency(totalMonthlyEMI)}
            </p>
          </div>
        </div>

        {/* DTI indicator */}
        {monthlyIncome > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-[rgba(120,120,128,0.06)] px-3 py-2.5">
            <TrendingUp className="h-4 w-4 flex-shrink-0" style={{ color: dtiColor }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[var(--text-secondary)]">Debt-to-Income Ratio</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.15)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, dti)}%`, background: dtiColor }}
                />
              </div>
            </div>
            <span className="text-[13px] font-bold" style={{ color: dtiColor }}>
              {dti.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Upcoming EMIs */}
        {nextThreeEmis.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
              Upcoming EMIs
            </p>
            <div className="space-y-2">
              {nextThreeEmis.map(({ loan, amount, date }) => (
                <div key={loan.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                        {loan.loan_name}
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {formatDate(date, 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[13px] font-bold text-[var(--apple-blue)]">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
