'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Pencil,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { LoanProgressBar } from './loan-progress-bar';
import { EducationLoanPhaseBadge } from './education-loan-phase-badge';
import type { UserLoan, LoanPayment } from '@/types/loan.types';
import { LOAN_TYPE_CONFIG, PAYMENT_TYPE_LABELS } from '@/types/loan.types';
import { computeLoanBalance } from '@/lib/loans/loan-calculator';
import { getEducationLoanPhase } from '@/lib/loans/education-loan-calculator';
import { toast } from 'sonner';
import { deleteLoan } from '@/app/actions/loan.actions';


interface LoanCardProps {
  loan: UserLoan;
  payments?: LoanPayment[];

  onDeleted?: () => void;
  onEditClick?: (loan: UserLoan) => void;
  onAddPaymentClick?: (loan: UserLoan) => void;
  onViewDetailClick?: (loan: UserLoan) => void;
}

export function LoanCard({
  loan,
  payments = [],

  onDeleted,
  onEditClick,
  onAddPaymentClick,
  onViewDetailClick,
}: LoanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const balance = computeLoanBalance(loan);
  const config = LOAN_TYPE_CONFIG[loan.loan_type];
  const isEducation = loan.loan_type === 'education' || loan.interest_type === 'hybrid';

  // EMI reconciliation
  const emiDiff = balance.emiDifferencePercent;
  const showEmiWarning = emiDiff !== null && Math.abs(emiDiff) > 10 && loan.bank_emi_amount;

  // For education loans in moratorium: show time-based progress (not repayment progress)
  const eduPhase = isEducation ? getEducationLoanPhase(loan) : null;
  const displayPercent = isEducation && balance.phase === 'moratorium'
    ? (eduPhase?.moratoriumProgressPercent ?? 0)
    : balance.repaymentPercent;

  const progressColor =
    balance.phase === 'moratorium'
      ? 'orange'
      : balance.repaymentPercent >= 75
        ? 'green'
        : balance.repaymentPercent >= 40
          ? 'blue'
          : 'orange';

  const handleDelete = async () => {
    if (!confirm(`Delete "${loan.loan_name}"? All payment history will also be deleted.`)) return;
    setDeleting(true);
    const result = await deleteLoan(loan.id);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Loan deleted');
      onDeleted?.();
    }
  };

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, 5);

  return (
    <div
      className={cn(
        'apple-card overflow-hidden transition-all duration-300',
        loan.status === 'closed' && 'opacity-70',
      )}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }}
      />

      <div className="p-5">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* Loan type icon */}
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ backgroundColor: config.bgColor }}
            >
              {config.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[17px] font-semibold tracking-[-0.2px] text-[var(--text-primary)] truncate">
                  {loan.loan_name}
                </h3>
                {loan.status === 'closed' && (
                  <span className="rounded-full bg-[rgba(52,199,89,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--apple-green)]">
                    Closed
                  </span>
                )}
                {loan.status === 'defaulted' && (
                  <span className="rounded-full bg-[rgba(255,59,48,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--apple-red)]">
                    Defaulted
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">{loan.lender_name}</p>
              <span
                className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {config.label}
              </span>
            </div>
          </div>

          {/* Outstanding amount */}
          <div className="flex-shrink-0 text-right">
            <p className="text-[22px] font-bold tracking-[-0.5px] text-[var(--apple-red)]">
              {formatCurrency(balance.currentOutstanding)}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Outstanding</p>
          </div>
        </div>

        {/* ── Phase Badge (education) ─────────────────────────── */}
        {isEducation && (
          <div className="mt-3">
            <EducationLoanPhaseBadge phase={balance.phase} phaseLabel={balance.phaseLabel} />
          </div>
        )}

        {/* ── Stats Grid ──────────────────────────────────────── */}
        {isEducation && balance.phase === 'moratorium' ? (
          /* Education loan in moratorium — show all 5 values */
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <StatItem
                label="Original Principal"
                value={formatCurrency(balance.originalPrincipal)}
              />
              <StatItem
                label="Current Outstanding"
                value={formatCurrency(balance.currentOutstanding)}
                valueClassName="text-[var(--apple-red)]"
              />
              <StatItem
                label="Accrued Interest"
                value={formatCurrency(balance.accruedInterest)}
                valueClassName="text-[var(--apple-orange)]"
              />
            </div>
            {/* Projected @ EMI Start — full-width highlighted row */}
            <div className="flex items-center justify-between rounded-xl bg-[rgba(255,149,0,0.07)] px-3 py-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[var(--apple-orange)]">
                  Projected Outstanding at EMI Start
                </p>
                <p className="text-[15px] font-bold text-[var(--apple-orange)]">
                  {eduPhase?.outstandingAtEmiStart
                    ? formatCurrency(eduPhase.outstandingAtEmiStart)
                    : '—'}
                </p>
              </div>
              {loan.bank_emi_amount && (
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4px] text-[var(--apple-blue)]">
                    Bank EMI
                  </p>
                  <p className="text-[15px] font-bold text-[var(--apple-blue)]">
                    {formatCurrency(Number(loan.bank_emi_amount))}/mo
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* All other loan types — standard 4-stat grid */
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <StatItem
              label="Original Principal"
              value={formatCurrency(balance.originalPrincipal)}
            />
            <StatItem
              label="Interest Accrued"
              value={formatCurrency(balance.accruedInterest)}
              valueClassName="text-[var(--apple-orange)]"
            />
            <StatItem
              label="Interest Paid"
              value={formatCurrency(balance.totalInterestPaid)}
              valueClassName="text-[var(--apple-blue)]"
            />
            <StatItem
              label="Principal Repaid"
              value={formatCurrency(balance.totalPrincipalPaid)}
              valueClassName="text-[var(--apple-green)]"
            />
          </div>
        )}

        {/* ── EMI Info ─────────────────────────────────────────── */}
        {(balance.nextEmiDate || balance.nextEmiAmount) && (
          <div className="mt-3 flex items-center gap-4 rounded-xl bg-[rgba(0,122,255,0.06)] px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[var(--apple-blue)]" />
              <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                {balance.phase === 'moratorium' ? 'EMI Starts:' : 'Next EMI:'}
              </span>
              <span className="text-[12px] font-bold text-[var(--text-primary)]">
                {balance.nextEmiDate
                  ? formatDate(balance.nextEmiDate, 'dd MMM yyyy')
                  : '—'}
              </span>
            </div>
            {balance.nextEmiAmount && (
              <div className="ml-auto flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--apple-green)]" />
                <span className="text-[13px] font-bold text-[var(--apple-green)]">
                  {formatCurrency(balance.nextEmiAmount)}/mo
                </span>
              </div>
            )}
            {balance.remainingTenureMonths !== null && balance.remainingTenureMonths > 0 && (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {balance.remainingTenureMonths} months left
              </span>
            )}
          </div>
        )}

        {/* ── EMI Reconciliation Warning (Phase 5) ─────────────── */}
        {showEmiWarning && balance.calculatedEmi && (
          <div className="mt-2 rounded-xl bg-[rgba(255,149,0,0.07)] px-3 py-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--apple-orange)]" />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Calculated EMI: <strong className="text-[var(--text-primary)]">{formatCurrency(balance.calculatedEmi)}</strong>
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Bank EMI: <strong className="text-[var(--apple-orange)]">{formatCurrency(Number(loan.bank_emi_amount))}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-[var(--apple-orange)]">
                    {emiDiff! > 0 ? '+' : ''}{emiDiff!.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                  This difference may reflect interest capitalization or bank-specific repayment structures.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Progress Bar ─────────────────────────────────────── */}
        <div className="mt-4">
          <LoanProgressBar
            percent={displayPercent}
            color={progressColor as 'blue' | 'green' | 'orange'}
            showLabel
            size="md"
            label={
              balance.phase === 'moratorium'
                ? `Moratorium ${Math.round(displayPercent)}% elapsed`
                : `${Math.round(displayPercent)}% repaid`
            }
          />
        </div>

        {/* ── Action Buttons ────────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {loan.status === 'active' && (
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-full bg-[var(--apple-blue)] text-[12px] font-semibold text-white hover:bg-[#0071f0]"
              onClick={() => onAddPaymentClick?.(loan)}
            >
              <Plus className="h-3.5 w-3.5" /> Payment
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-[12px] text-[var(--text-secondary)]"
            onClick={() => onViewDetailClick?.(loan)}
          >
            <ArrowUpRight className="h-3.5 w-3.5" /> Schedule
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-[12px] text-[var(--text-secondary)]"
            onClick={() => onEditClick?.(loan)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full text-[12px] text-[var(--text-secondary)]"
              onClick={() => setExpanded((p) => !p)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {payments.length} payment{payments.length !== 1 ? 's' : ''}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--apple-red)]"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Expanded Payment History ──────────────────────────── */}
      {expanded && (
        <div className="border-t border-[var(--separator)] bg-[rgba(120,120,128,0.03)] px-5 py-3">
          {recentPayments.length === 0 ? (
            <p className="py-2 text-center text-[13px] text-[var(--text-tertiary)]">
              No payments recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {formatDate(p.payment_date, 'dd MMM yyyy')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {PAYMENT_TYPE_LABELS[p.payment_type]}
                      </span>
                      {p.principal_component > 0 && (
                        <span className="text-[11px] text-[var(--apple-green)]">
                          P: {formatCurrency(p.principal_component)}
                        </span>
                      )}
                      {p.interest_component > 0 && (
                        <span className="text-[11px] text-[var(--apple-orange)]">
                          I: {formatCurrency(p.interest_component)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-[var(--apple-green)]">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
              {payments.length > 5 && (
                <p className="text-center text-[11px] text-[var(--text-tertiary)]">
                  + {payments.length - 5} more — View Schedule for all
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className={cn('mt-0.5 text-[14px] font-bold tracking-[-0.2px] text-[var(--text-primary)]', valueClassName)}>
        {value}
      </p>
    </div>
  );
}
