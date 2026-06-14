// ============================================================
// GENERAL LOAN CALCULATOR
// Master dispatcher for all loan types: simple, compound, hybrid
// ============================================================

import { parseISO, format, addMonths, differenceInMonths } from 'date-fns';
import type { UserLoan, LoanBalance, EMIScheduleRow, LoanPhase } from '@/types/loan.types';
import {
  calculateEMI,
  generateAmortizationTable,
  nextEmiDate,
  remainingMonths,
} from './emi-calculator';
import {
  getEducationLoanPhase,
  generateEducationLoanSchedule,
  outstandingAtMoratoriumEnd,
} from './education-loan-calculator';

// ────────────────────────────────────────────────────────────
// Master Balance Computer
// ────────────────────────────────────────────────────────────

/**
 * Master function to compute the full balance state of any loan.
 * Returns a LoanBalance object used by all UI components.
 */
export function computeLoanBalance(
  loan: UserLoan,
  asOf: Date = new Date(),
): LoanBalance {
  const original = Number(loan.original_principal);
  const paidPrincipal = Number(loan.total_principal_paid ?? 0);
  const paidInterest = Number(loan.total_interest_paid ?? 0);

  // ── Education Loan (Hybrid: SI → CI) ─────────────────────
  if (loan.interest_type === 'hybrid' || loan.loan_type === 'education') {
    const eduPhase = getEducationLoanPhase(loan, asOf);

    // Use stored current_outstanding if available and in repayment;
    // otherwise use computed value from phase analysis
    const outstanding = loan.interest_type === 'hybrid' || loan.loan_type === 'education'
      ? eduPhase.currentOutstanding
      : Math.max(0, original - paidPrincipal);

    const repaymentPercent = computeRepaymentPercent(
      eduPhase.outstandingAtEmiStart,
      paidPrincipal,
    );
    const payoffDate = computePayoffDate(loan);

    return {
      originalPrincipal: original,
      currentOutstanding: outstanding,
      accruedInterest: Number(loan.accrued_interest ?? eduPhase.accruedInterest),
      totalInterestPaid: paidInterest,
      totalPrincipalPaid: paidPrincipal,
      remainingBalance: outstanding,
      repaymentPercent,
      phase: eduPhase.phase as LoanPhase,
      phaseLabel: eduPhase.phaseLabel,
      nextEmiDate: nextEmiDate(loan, asOf),
      nextEmiAmount: loan.emi_amount ? Number(loan.emi_amount) : null,
      estimatedPayoffDate: payoffDate,
      remainingTenureMonths: remainingMonths(loan, asOf),
      projectedOutstandingAtEmiStart: eduPhase.outstandingAtEmiStart,
      moratoriumTimeRemaining: eduPhase.phase === 'moratorium' && eduPhase.moratoriumEndDate
        ? formatTimeRemaining(asOf, eduPhase.moratoriumEndDate)
        : null,
      calculatedEmi: loan.loan_tenure_months
        ? calculateEMI(eduPhase.outstandingAtEmiStart, Number(loan.ci_rate ?? loan.interest_rate), loan.loan_tenure_months)
        : null,
      emiDifferencePercent: computeEmiDiff(
        loan.loan_tenure_months
          ? calculateEMI(eduPhase.outstandingAtEmiStart, Number(loan.ci_rate ?? loan.interest_rate), loan.loan_tenure_months)
          : null,
        loan.bank_emi_amount ? Number(loan.bank_emi_amount) : null,
      ),
    };
  }

  // ── Simple Interest ───────────────────────────────────────
  if (loan.interest_type === 'simple') {
    const outstanding = Math.max(0, Number(loan.current_outstanding ?? (original - paidPrincipal)));
    const tenureYears = (loan.loan_tenure_months ?? 240) / 12;
    const totalInterestFull = original * (Number(loan.interest_rate) / 100) * tenureYears;
    const accruedInterest = Math.max(0, totalInterestFull - paidInterest);
    const phase: LoanPhase = loan.emi_start_date
      ? (asOf >= parseISO(loan.emi_start_date) ? 'repayment' : 'not_started')
      : 'repayment';
    const calcEmi = loan.loan_tenure_months
      ? calculateEMI(outstanding, Number(loan.interest_rate), loan.loan_tenure_months)
      : null;

    return {
      originalPrincipal: original,
      currentOutstanding: outstanding,
      accruedInterest,
      totalInterestPaid: paidInterest,
      totalPrincipalPaid: paidPrincipal,
      remainingBalance: outstanding,
      repaymentPercent: computeRepaymentPercent(original, paidPrincipal),
      phase,
      phaseLabel: `Simple Interest @ ${loan.interest_rate}% p.a.`,
      nextEmiDate: nextEmiDate(loan, asOf),
      nextEmiAmount: loan.emi_amount ? Number(loan.emi_amount) : null,
      estimatedPayoffDate: computePayoffDate(loan),
      remainingTenureMonths: remainingMonths(loan, asOf),
      projectedOutstandingAtEmiStart: null,
      moratoriumTimeRemaining: null,
      calculatedEmi: calcEmi,
      emiDifferencePercent: computeEmiDiff(calcEmi, loan.bank_emi_amount ? Number(loan.bank_emi_amount) : null),
    };
  }

  // ── Compound Interest (standard loan) ────────────────────
  const outstanding = Math.max(0, Number(loan.current_outstanding ?? (original - paidPrincipal)));
  const phase: LoanPhase = loan.emi_start_date
    ? (asOf >= parseISO(loan.emi_start_date) ? 'repayment' : 'not_started')
    : 'repayment';

  const freq = loan.compounding_frequency ?? 'monthly';
  const freqLabel = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }[freq];
  const calcEmiCI = loan.loan_tenure_months
    ? calculateEMI(outstanding, Number(loan.interest_rate), loan.loan_tenure_months)
    : null;

  return {
    originalPrincipal: original,
    currentOutstanding: outstanding,
    accruedInterest: Number(loan.accrued_interest ?? 0),
    totalInterestPaid: paidInterest,
    totalPrincipalPaid: paidPrincipal,
    remainingBalance: outstanding,
    repaymentPercent: computeRepaymentPercent(original, paidPrincipal),
    phase,
    phaseLabel: `Compound Interest @ ${loan.interest_rate}% p.a. (${freqLabel})`,
    nextEmiDate: nextEmiDate(loan, asOf),
    nextEmiAmount: loan.emi_amount ? Number(loan.emi_amount) : null,
    estimatedPayoffDate: computePayoffDate(loan),
    remainingTenureMonths: remainingMonths(loan, asOf),
    projectedOutstandingAtEmiStart: null,
    moratoriumTimeRemaining: null,
    calculatedEmi: calcEmiCI,
    emiDifferencePercent: computeEmiDiff(calcEmiCI, loan.bank_emi_amount ? Number(loan.bank_emi_amount) : null),
  };
}

// ────────────────────────────────────────────────────────────
// Schedule Generator
// ────────────────────────────────────────────────────────────

/**
 * Generates the amortization schedule for any loan type.
 */
export function generateLoanSchedule(
  loan: UserLoan,
  payments: Array<{ payment_date: string; principal_component: number; interest_component: number }> = [],
): EMIScheduleRow[] {
  if (loan.interest_type === 'hybrid' || loan.loan_type === 'education') {
    return generateEducationLoanSchedule(loan, payments);
  }

  const startDate = loan.emi_start_date ?? loan.loan_start_date;
  const tenureMonths = loan.loan_tenure_months ?? 240;
  const rate = Number(loan.ci_rate ?? loan.interest_rate);
  const principal = Number(loan.current_outstanding ?? loan.original_principal);

  return generateAmortizationTable(principal, rate, tenureMonths, startDate, payments);
}

// ────────────────────────────────────────────────────────────
// EMI Suggestion
// ────────────────────────────────────────────────────────────

/**
 * Calculates what the EMI should be for a given loan configuration.
 */
export function suggestEMI(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
): number {
  return calculateEMI(principal, annualRatePercent, tenureMonths);
}

/**
 * Calculates outstanding at moratorium end for an education loan.
 * This is the principal base used for EMI calculations.
 */
export function educationLoanOutstandingAtEmiStart(loan: UserLoan): number {
  return outstandingAtMoratoriumEnd(loan);
}

// ────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────

/**
 * Computes repayment percent based on principal paid vs the repayment base.
 * For education loans, repayment base is outstandingAtEmiStart, not original principal.
 */
function computeRepaymentPercent(base: number, paidPrincipal: number): number {
  if (base <= 0) return 0;
  return Math.min(100, Math.max(0, (paidPrincipal / base) * 100));
}

function computePayoffDate(loan: UserLoan): string | null {
  if (!loan.emi_start_date || !loan.loan_tenure_months) return null;
  const emiStart = parseISO(loan.emi_start_date);
  const payoff = addMonths(emiStart, loan.loan_tenure_months);
  return format(payoff, 'yyyy-MM-dd');
}

// ────────────────────────────────────────────────────────────
// EMI Difference Helper
// ────────────────────────────────────────────────────────────

/**
 * Computes the percentage difference between bank-stated EMI and calculated EMI.
 * Returns null if either value is missing.
 * Positive value means bank EMI is higher than calculated.
 */
function computeEmiDiff(calculatedEmi: number | null, bankEmi: number | null): number | null {
  if (!calculatedEmi || !bankEmi || calculatedEmi <= 0) return null;
  return Math.round(((bankEmi - calculatedEmi) / calculatedEmi) * 1000) / 10;
}

// ────────────────────────────────────────────────────────────
// Moratorium Time Remaining Helper
// ────────────────────────────────────────────────────────────

/**
 * Returns a human-friendly string like "1 Year 3 Months" for time remaining.
 */
function formatTimeRemaining(from: Date, to: Date): string {
  const totalMonths = differenceInMonths(to, from);
  if (totalMonths <= 0) return 'Ending soon';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
  return parts.join(' ') || 'Less than a month';
}
