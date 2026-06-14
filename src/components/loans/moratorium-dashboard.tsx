'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import type { UserLoan } from '@/types/loan.types';
import { getEducationLoanPhase } from '@/lib/loans/education-loan-calculator';
import { LoanProgressBar } from './loan-progress-bar';

interface MoratoriumDashboardProps {
  loans: UserLoan[];
  className?: string;
}

export function MoratoriumDashboard({ loans, className }: MoratoriumDashboardProps) {
  // Find all education/hybrid loans that are in moratorium or pre-EMI phase
  const moratoriumLoans = loans.filter((l) => {
    if (l.status !== 'active') return false;
    if (l.loan_type !== 'education' && l.interest_type !== 'hybrid') return false;
    const phase = getEducationLoanPhase(l);
    return phase.phase === 'moratorium';
  });

  if (moratoriumLoans.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {moratoriumLoans.map((loan) => {
        const phase = getEducationLoanPhase(loan);

        return (
          <MoratoriumCard key={loan.id} loan={loan} phase={phase} />
        );
      })}
    </div>
  );
}

function MoratoriumCard({
  loan,
  phase,
}: {
  loan: UserLoan;
  phase: ReturnType<typeof getEducationLoanPhase>;
}) {
  return (
    <div className="apple-card overflow-hidden">
      {/* Orange accent top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--apple-orange)] to-[var(--apple-yellow,#FF9500)]" />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⏳</span>
              <h3 className="text-[15px] font-bold text-[var(--text-primary)]">{loan.loan_name}</h3>
              <span className="rounded-full bg-[rgba(255,149,0,0.15)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--apple-orange)]">
                Moratorium Active
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{loan.lender_name}</p>
          </div>
        </div>

        {/* Moratorium Progress */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">
              Moratorium Progress
            </span>
            <span className="text-[12px] font-bold text-[var(--apple-orange)]">
              {Math.round(phase.moratoriumProgressPercent)}% elapsed
            </span>
          </div>
          <LoanProgressBar
            percent={phase.moratoriumProgressPercent}
            color="orange"
            size="md"
          />
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MoratoriumStat
            icon={<Clock className="h-3.5 w-3.5 text-[var(--apple-orange)]" />}
            label="Time Remaining"
            value={
              phase.moratoriumEndDate
                ? formatTimeRemaining(new Date(), phase.moratoriumEndDate)
                : '—'
            }
            highlight
          />

          <MoratoriumStat
            icon={<Calendar className="h-3.5 w-3.5 text-[var(--apple-blue)]" />}
            label="Moratorium Ends"
            value={
              phase.moratoriumEndDate
                ? formatDate(phase.moratoriumEndDate, 'dd MMM yyyy')
                : '—'
            }
          />

          <MoratoriumStat
            icon={<AlertCircle className="h-3.5 w-3.5 text-[var(--apple-red)]" />}
            label="Current Outstanding"
            value={formatCurrency(phase.currentOutstanding)}
            sub={loan.outstanding_as_of_date
              ? `as of ${formatDate(loan.outstanding_as_of_date, 'dd MMM yy')}`
              : 'as of today'}
            valueClassName="text-[var(--apple-red)]"
          />

          <MoratoriumStat
            icon={<TrendingUp className="h-3.5 w-3.5 text-[var(--apple-orange)]" />}
            label="Projected at EMI Start"
            value={formatCurrency(phase.outstandingAtEmiStart)}
            sub="your repayment base"
            valueClassName="text-[var(--apple-orange)]"
          />
        </div>

        {/* SI Accrual info */}
        <div className="mt-4 rounded-xl bg-[rgba(255,149,0,0.06)] px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--apple-orange)]" />
            <div className="space-y-1">
              <p className="text-[12px] font-medium text-[var(--apple-orange)]">
                Interest accruing at {loan.moratorium_si_rate ?? loan.interest_rate}% SI p.a.
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Outstanding has grown by{' '}
                <span className="font-semibold text-[var(--apple-orange)]">
                  {formatCurrency(phase.currentOutstanding - Number(loan.original_principal))}
                </span>{' '}
                since disbursement.{' '}
                {phase.outstandingAtEmiStart > phase.currentOutstanding && (
                  <>
                    It will reach{' '}
                    <span className="font-semibold">
                      {formatCurrency(phase.outstandingAtEmiStart)}
                    </span>{' '}
                    by EMI start — that becomes your repayment base.
                  </>
                )}
              </p>
              {loan.emi_amount && (
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Your EMI of{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatCurrency(Number(loan.emi_amount))}/month
                  </span>{' '}
                  begins{' '}
                  {loan.emi_start_date
                    ? `on ${formatDate(loan.emi_start_date, 'dd MMM yyyy')}`
                    : 'after moratorium ends'}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Disbursements */}
        {loan.disbursements && loan.disbursements.length > 1 && (
          <div className="mt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
              Disbursements
            </p>
            <div className="flex flex-wrap gap-2">
              {loan.disbursements.map((d, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-[rgba(0,122,255,0.08)] px-3 py-1.5 text-center"
                >
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {formatDate(d.date, 'MMM yyyy')}
                    {d.description && ` · ${d.description}`}
                  </p>
                  <p className="text-[13px] font-bold text-[var(--apple-blue)]">
                    {formatCurrency(d.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MoratoriumStat({
  icon,
  label,
  value,
  sub,
  valueClassName,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl p-3',
        highlight ? 'bg-[rgba(255,149,0,0.08)]' : 'bg-[rgba(120,120,128,0.06)]',
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-[0.3px] text-[var(--text-tertiary)]">
          {label}
        </p>
      </div>
      <p className={cn('text-[14px] font-bold leading-tight text-[var(--text-primary)]', valueClassName)}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{sub}</p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatTimeRemaining(from: Date, to: Date): string {
  const totalMs = to.getTime() - from.getTime();
  if (totalMs <= 0) return 'Ending soon';
  const totalMonths = Math.floor(totalMs / (30.44 * 24 * 3600 * 1000));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
  return parts.join(' ') || '< 1 Month';
}
