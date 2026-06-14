'use client';

import React from 'react';
import { TrendingDown, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import type { UserLoan } from '@/types/loan.types';
import { computeLoanBalance } from '@/lib/loans/loan-calculator';

interface LoanSummaryStripProps {
  loans: UserLoan[];
  className?: string;
}

export function LoanSummaryStrip({ loans, className }: LoanSummaryStripProps) {
  const activeLoans = loans.filter((l) => l.status === 'active');
  const closedLoans = loans.filter((l) => l.status === 'closed');

  let totalOutstanding = 0;
  let totalMonthlyEMI = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (const loan of activeLoans) {
    const balance = computeLoanBalance(loan);
    totalOutstanding += balance.currentOutstanding;
    totalInterestPaid += balance.totalInterestPaid;
    totalPrincipalPaid += balance.totalPrincipalPaid;
    if (loan.emi_amount) totalMonthlyEMI += Number(loan.emi_amount);
  }

  const stats = [
    {
      label: 'Total Outstanding',
      value: formatCurrency(totalOutstanding),
      sub: `${activeLoans.length} active loan${activeLoans.length !== 1 ? 's' : ''}`,
      icon: AlertCircle,
      iconColor: 'text-[var(--apple-red)]',
      iconBg: 'bg-[rgba(255,59,48,0.12)]',
      accent: 'var(--apple-red)',
      valueCls: 'text-[var(--apple-red)]',
    },
    {
      label: 'Monthly EMI',
      value: formatCurrency(totalMonthlyEMI),
      sub: 'Combined EMI commitment',
      icon: CreditCard,
      iconColor: 'text-[var(--apple-blue)]',
      iconBg: 'bg-[rgba(0,122,255,0.12)]',
      accent: 'var(--apple-blue)',
      valueCls: 'text-[var(--apple-blue)]',
    },
    {
      label: 'Interest Paid',
      value: formatCurrency(totalInterestPaid),
      sub: 'Total cost of borrowing',
      icon: TrendingDown,
      iconColor: 'text-[var(--apple-orange)]',
      iconBg: 'bg-[rgba(255,149,0,0.12)]',
      accent: 'var(--apple-orange)',
      valueCls: 'text-[var(--apple-orange)]',
    },
    {
      label: 'Principal Repaid',
      value: formatCurrency(totalPrincipalPaid),
      sub: `${closedLoans.length} loan${closedLoans.length !== 1 ? 's' : ''} fully closed`,
      icon: CheckCircle,
      iconColor: 'text-[var(--apple-green)]',
      iconBg: 'bg-[rgba(52,199,89,0.12)]',
      accent: 'var(--apple-green)',
      valueCls: 'text-[var(--apple-green)]',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4 stagger-children', className)}>
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="apple-card relative overflow-hidden p-4 transition-all duration-200"
          >
            {/* Gradient top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[20px]"
              style={{ background: s.accent }}
            />
            {/* Ambient glow in corner */}
            <div
              className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.07]"
              style={{ background: s.accent }}
            />

            <div className="relative">
              <div className="mb-3 flex items-center gap-2.5">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', s.iconBg)}>
                  <Icon className={cn('h-4.5 w-4.5', s.iconColor)} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--text-tertiary)] leading-tight">
                  {s.label}
                </span>
              </div>

              <p className={cn(
                'text-[20px] font-extrabold tracking-[-0.6px] tabular-nums',
                s.valueCls,
              )}>
                {s.value}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)] tracking-[-0.1px]">{s.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
