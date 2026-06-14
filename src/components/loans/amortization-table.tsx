'use client';

import React, { useMemo, useState } from 'react';
import { format as formatDate, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils/currency';
import type { UserLoan, LoanPayment } from '@/types/loan.types';
import { generateLoanSchedule } from '@/lib/loans/loan-calculator';
import { getEducationLoanPhase } from '@/lib/loans/education-loan-calculator';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, ChevronUp, Info, CheckCircle2 } from 'lucide-react';

interface AmortizationTableProps {
  loan: UserLoan;
  payments?: LoanPayment[];
  className?: string;
}

const PAGE_SIZE = 24;

export function AmortizationTable({ loan, payments = [], className }: AmortizationTableProps) {
  const [showAll, setShowAll] = useState(false);

  const schedule = useMemo(() => {
    const paymentData = payments.map((p) => ({
      payment_date: p.payment_date,
      principal_component: p.principal_component,
      interest_component: p.interest_component,
    }));
    return generateLoanSchedule(loan, paymentData);
  }, [loan, payments]);

  // For education loans, we want to show a special "Moratorium Phase" block
  const isEducation = loan.loan_type === 'education' || loan.interest_type === 'hybrid';
  const eduPhase = isEducation ? getEducationLoanPhase(loan) : null;

  const visible = showAll ? schedule : schedule.slice(0, PAGE_SIZE);
  const totalInterest = schedule.at(-1)?.totalInterestPaid ?? 0;
  
  // Base for total repayment
  let basePrincipal = Number(loan.original_principal);
  if (isEducation && eduPhase?.outstandingAtEmiStart) {
    basePrincipal = eduPhase.outstandingAtEmiStart;
  } else if (loan.current_outstanding) {
    // If not education and has current_outstanding without much history, use original for display
    basePrincipal = Number(loan.original_principal);
  }

  if (schedule.length === 0 && !isEducation) {
    return (
      <div className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">
        No schedule available. Please ensure loan tenure and interest rate are set.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 rounded-xl bg-[rgba(120,120,128,0.06)] p-3">
        <div className="text-center">
          <p className="text-[11px] text-[var(--text-tertiary)]">Total Months</p>
          <p className="text-[16px] font-bold text-[var(--text-primary)]">{schedule.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-[var(--text-tertiary)]">Total Repayment Interest</p>
          <p className="text-[16px] font-bold text-[var(--apple-red)]">{formatCurrency(totalInterest)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-[var(--text-tertiary)]">Total EMI Payments</p>
          <p className="text-[16px] font-bold text-[var(--apple-green)]">
            {formatCurrency(basePrincipal + totalInterest)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--separator)]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--separator)] bg-[rgba(120,120,128,0.06)]">
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-tertiary)]">#</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-tertiary)]">Date</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-tertiary)]">EMI</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--apple-green)]">Principal</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--apple-orange)]">Interest</th>
              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-tertiary)]">Balance</th>
            </tr>
          </thead>
          <tbody>
            {/* Moratorium Phase row for education loans */}
            {isEducation && eduPhase && eduPhase.daysInMoratorium > 0 && (
              <tr className="border-b border-[var(--separator)] bg-[rgba(255,149,0,0.04)]">
                <td className="px-3 py-3" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-[var(--apple-orange)]" />
                    <div>
                      <p className="font-semibold text-[var(--apple-orange)]">Moratorium Phase</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {loan.loan_start_date ? formatDate(parseISO(loan.loan_start_date), 'MMM yy') : ''} → {loan.moratorium_end_date ? formatDate(parseISO(loan.moratorium_end_date), 'MMM yy') : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-[var(--text-tertiary)]">—</td>
                <td className="px-3 py-3 text-right text-[var(--apple-green)]">
                  {formatCurrency(Number(loan.original_principal))} (Base)
                </td>
                <td className="px-3 py-3 text-right text-[var(--apple-orange)]">
                  +{formatCurrency(eduPhase.outstandingAtEmiStart - Number(loan.original_principal))} (SI)
                </td>
                <td className="px-3 py-3 text-right font-bold text-[var(--apple-orange)]">
                  {formatCurrency(eduPhase.outstandingAtEmiStart)}
                </td>
              </tr>
            )}

            {/* Repayment Schedule */}
            {visible.map((row, i) => {
              const isOdd = i % 2 === 0;
              return (
                <tr
                  key={row.month}
                  className={cn(
                    'border-b border-[var(--separator)] transition-colors',
                    isOdd ? 'bg-transparent' : 'bg-[rgba(120,120,128,0.025)]',
                    row.isPaid && 'bg-[rgba(52,199,89,0.05)]',
                  )}
                >
                  <td className="px-3 py-2 text-[var(--text-tertiary)] flex items-center gap-1.5">
                    {row.isPaid && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--apple-green)]" />}
                    {!row.isPaid && row.month}
                  </td>
                  <td className={cn("px-3 py-2", row.isPaid ? "text-[var(--apple-green)] font-medium" : "text-[var(--text-secondary)]")}>
                    {formatDate(parseISO(row.date), 'MMM yy')}
                  </td>
                  <td className={cn("px-3 py-2 text-right font-semibold", row.isPaid ? "text-[var(--apple-green)]" : "text-[var(--text-primary)]")}>
                    {formatCurrency(row.emi)}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--apple-green)]">
                    {formatCurrency(row.principalComponent)}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--apple-orange)]">
                    {formatCurrency(row.interestComponent)}
                  </td>
                  <td className={cn("px-3 py-2 text-right font-semibold", row.isPaid ? "text-[var(--apple-green)]" : "text-[var(--text-primary)]")}>
                    {formatCurrency(row.closingBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {schedule.length > PAGE_SIZE && (
        <button
          onClick={() => setShowAll((p) => !p)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-medium text-[var(--apple-blue)] transition-colors hover:bg-[rgba(0,122,255,0.06)]"
        >
          {showAll ? (
            <>Show less <ChevronUp className="h-3.5 w-3.5" /></>
          ) : (
            <>Show all {schedule.length} months <ChevronDown className="h-3.5 w-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
}
