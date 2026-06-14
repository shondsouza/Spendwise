'use client';

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Flag, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import type { UserLoan, DebtFreeScenario } from '@/types/loan.types';
import { calculateEMI } from '@/lib/loans/emi-calculator';

import { getEducationLoanPhase } from '@/lib/loans/education-loan-calculator';

interface DebtFreedomWidgetProps {
  loans: UserLoan[];
  className?: string;
}

// ────────────────────────────────────────────────────────────
// Core simulation helper (same logic as loan-projection-engine
// but simplified for the debt freedom widget)
// ────────────────────────────────────────────────────────────

function simulatePayoff(
  principal: number,
  annualRate: number,
  startDate: Date,
  monthlyPaymentFn: (month: number) => number,
  maxMonths = 600,
): { payoffDate: Date; totalInterest: number; months: number } {
  const r = annualRate / 12 / 100;
  let balance = principal;
  let cumInterest = 0;
  let month = 0;

  while (balance > 0.5 && month < maxMonths) {
    const interest = balance * r;
    const payment = Math.min(monthlyPaymentFn(month), balance + interest);
    const principalPaid = Math.max(0, payment - interest);
    balance = Math.max(0, balance - principalPaid);
    cumInterest += interest;
    month++;
  }

  const payoffDate = new Date(startDate);
  payoffDate.setMonth(payoffDate.getMonth() + month);

  return {
    payoffDate,
    totalInterest: Math.round(cumInterest * 100) / 100,
    months: month,
  };
}

function getLoanRepaymentConfig(loan: UserLoan): {
  principal: number;
  rate: number;
  startDate: Date;
  baseEmi: number;
  label: string;
} | null {
  const isEdu = loan.loan_type === 'education' || loan.interest_type === 'hybrid';
  const startDateStr = loan.emi_start_date ?? loan.loan_start_date;

  if (!startDateStr) return null;

  if (isEdu) {
    const phase = getEducationLoanPhase(loan);

    if (phase.phase === 'moratorium') {
      // ── Education loan in moratorium ─────────────────────────
      // Use:
      //   principal = outstandingAtEmiStart (the correct projected value)
      //   EMI       = bank_emi_amount if available, else calculate from projected principal
      //   startDate = emi_start_date (when repayment actually begins)
      const emiStart = phase.emiStartDate ?? parseISO(startDateStr);
      const principal = phase.outstandingAtEmiStart;
      const rate = Number(loan.ci_rate ?? loan.interest_rate);

      // Prefer bank EMI — it's what the user actually pays
      const baseEmi = loan.bank_emi_amount
        ? Number(loan.bank_emi_amount)
        : Number(loan.emi_amount) || calculateEMI(principal, rate, loan.loan_tenure_months ?? 240);

      return {
        principal,
        rate,
        startDate: emiStart,
        baseEmi,
        label: `Projected base: ${formatCurrency(principal)} from ${format(emiStart, 'MMM yyyy')}`,
      };
    }
  }

  // ── Non-moratorium loans: use actual current outstanding ─────
  // current_outstanding is the real bank balance right now — always use this.
  const principal = Math.max(0, Number(loan.current_outstanding ?? loan.original_principal));
  if (principal <= 0) return null;

  const rate = isEdu
    ? Number(loan.ci_rate ?? loan.interest_rate)
    : Number(loan.interest_rate);

  // Prefer bank EMI, then emi_amount, then calculate
  const baseEmi = loan.bank_emi_amount
    ? Number(loan.bank_emi_amount)
    : Number(loan.emi_amount) || calculateEMI(principal, rate, loan.loan_tenure_months ?? 240);

  return {
    principal,
    rate,
    startDate: parseISO(startDateStr),
    baseEmi,
    label: `Current outstanding: ${formatCurrency(principal)}`,
  };
}

export function DebtFreedomWidget({ loans, className }: DebtFreedomWidgetProps) {
  const activeLoans = loans.filter((l) => l.status === 'active');

  // We work with the single highest-outstanding loan for focused scenarios,
  // plus an aggregate "all loans" baseline.
  const scenarios = useMemo<DebtFreeScenario[]>(() => {
    if (activeLoans.length === 0) return [];

    // Pick the highest-outstanding loan for individual scenarios
    const targetLoan = [...activeLoans].sort(
      (a, b) => Number(b.current_outstanding) - Number(a.current_outstanding),
    )[0];

    const cfg = getLoanRepaymentConfig(targetLoan);
    if (!cfg) return [];

    const { principal, rate, startDate, baseEmi } = cfg;

    // Scenario 0: Baseline — current EMI
    const base = simulatePayoff(principal, rate, startDate, () => baseEmi);

    // Scenario 1: Extra ₹5000/month
    const extra5k = simulatePayoff(principal, rate, startDate, () => baseEmi + 5000);

    // Scenario 2: Extra ₹10000/month
    const extra10k = simulatePayoff(principal, rate, startDate, () => baseEmi + 10000);

    // Scenario 3: Yearly step-up ₹2000
    const stepUp = simulatePayoff(principal, rate, startDate, (m) => baseEmi + Math.floor(m / 12) * 2000);

    const result: DebtFreeScenario[] = [
      {
        label: 'Current Plan',
        description: `${formatCurrency(baseEmi)}/month`,
        payoffDate: format(base.payoffDate, 'yyyy'),
        monthsSaved: 0,
        interestSaved: 0,
        monthlyPayment: baseEmi,
      },
      {
        label: `+₹5,000/month`,
        description: 'Pay an extra ₹5,000 each month',
        payoffDate: format(extra5k.payoffDate, 'yyyy'),
        monthsSaved: base.months - extra5k.months,
        interestSaved: base.totalInterest - extra5k.totalInterest,
        monthlyPayment: baseEmi + 5000,
      },
      {
        label: `+₹10,000/month`,
        description: 'Pay an extra ₹10,000 each month',
        payoffDate: format(extra10k.payoffDate, 'yyyy'),
        monthsSaved: base.months - extra10k.months,
        interestSaved: base.totalInterest - extra10k.totalInterest,
        monthlyPayment: baseEmi + 10000,
      },
      {
        label: '₹2,000 step-up yearly',
        description: 'Increase EMI by ₹2,000 every year',
        payoffDate: format(stepUp.payoffDate, 'yyyy'),
        monthsSaved: base.months - stepUp.months,
        interestSaved: base.totalInterest - stepUp.totalInterest,
        monthlyPayment: baseEmi + 2000,
      },
    ].filter((s) => s.monthsSaved >= 0);

    return result;
  }, [activeLoans]);

  if (activeLoans.length === 0 || scenarios.length === 0) return null;

  const targetLoanName = [...activeLoans].sort(
    (a, b) => Number(b.current_outstanding) - Number(a.current_outstanding),
  )[0]?.loan_name ?? 'Your Loan';


  const bestScenario = scenarios.reduce((best, s) =>
    s.interestSaved > best.interestSaved ? s : best, scenarios[0]);

  return (
    <div className={cn('apple-card overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b border-[var(--separator)] bg-gradient-to-br from-[rgba(52,199,89,0.08)] to-[rgba(0,122,255,0.06)] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(52,199,89,0.15)]">
            <Flag className="h-4.5 w-4.5 text-[var(--apple-green)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Debt Freedom Planner</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">{targetLoanName}</p>
          </div>
        </div>

        {/* Basis chip — shows exactly what principal + EMI the planner is using */}
        {(() => {
          const targetLoan = [...activeLoans].sort(
            (a, b) => Number(b.current_outstanding) - Number(a.current_outstanding),
          )[0];
          const cfg = targetLoan ? getLoanRepaymentConfig(targetLoan) : null;
          if (!cfg) return null;
          return (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[rgba(52,199,89,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[var(--apple-green)]">
                Base ₹{Math.round(cfg.principal).toLocaleString('en-IN')}
              </span>
              <span className="rounded-full bg-[rgba(0,122,255,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[var(--apple-blue)]">
                EMI ₹{Math.round(cfg.baseEmi).toLocaleString('en-IN')}/mo
              </span>
              {targetLoan.bank_emi_amount && (
                <span className="text-[10px] text-[var(--text-tertiary)]">using bank EMI</span>
              )}
            </div>
          );
        })()}

        {/* Best scenario callout */}
        {bestScenario.interestSaved > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[rgba(52,199,89,0.12)] px-3 py-2">
            <Zap className="h-4 w-4 flex-shrink-0 text-[var(--apple-green)]" />
            <p className="text-[12px] font-medium text-[var(--apple-green)]">
              "{bestScenario.label}" saves{' '}
              <span className="font-bold">{formatCurrency(bestScenario.interestSaved)}</span> in interest and
              gets you debt-free {Math.round(bestScenario.monthsSaved / 12)} year
              {bestScenario.monthsSaved >= 24 ? 's' : ''} earlier.
            </p>
          </div>
        )}
      </div>

      {/* Scenarios */}
      <div className="divide-y divide-[var(--separator)]">
        {scenarios.map((s, i) => {
          const isBase = i === 0;
          const yearsSaved = Math.floor(s.monthsSaved / 12);
          const remMonths = s.monthsSaved % 12;
          // Progress bar: how much sooner vs the longest scenario
          const maxMonths = scenarios.reduce((m, x) => Math.max(m, x.monthsSaved), 1);
          const barPct = isBase ? 0 : Math.min(100, (s.monthsSaved / (maxMonths || 1)) * 100);

          return (
            <div
              key={s.label}
              className={cn(
                'px-5 py-3.5 transition-colors',
                !isBase && 'hover:bg-[rgba(52,199,89,0.03)]',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{
                    background: isBase ? 'rgba(120,120,128,0.1)' : 'rgba(52,199,89,0.12)',
                    color: isBase ? 'var(--text-tertiary)' : 'var(--apple-green)',
                  }}
                >
                  {isBase ? '—' : i}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{s.label}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{s.description}</p>
                  {!isBase && barPct > 0 && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
                      <div
                        className="h-full rounded-full bg-[var(--apple-green)] transition-all duration-700"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-[17px] font-black tracking-[-0.5px] text-[var(--text-primary)]">{s.payoffDate}</p>
                  {s.monthsSaved > 0 && (
                    <p className="text-[11px] font-semibold text-[var(--apple-green)]">
                      {yearsSaved > 0 ? `${yearsSaved}y ` : ''}
                      {remMonths > 0 ? `${remMonths}m ` : ''}
                      earlier
                    </p>
                  )}
                  {s.interestSaved > 0 && (
                    <p className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                      saves {formatCurrency(s.interestSaved)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--separator)] px-5 py-3 text-center">
        <p className="text-[11px] text-[var(--text-tertiary)]">
          Projections based on current outstanding and fixed interest rate. Actual results may vary.
        </p>
      </div>
    </div>
  );
}
