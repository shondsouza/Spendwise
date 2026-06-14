// ============================================================
// EDUCATION LOAN CALCULATOR
// Handles the two-phase loan lifecycle:
//   Phase 1 — Moratorium: Simple Interest accrues (not paid)
//   Phase 2 — Repayment:  Compound Interest + EMI (reducing balance)
//
// KEY FORMULA CORRECTNESS:
//   outstanding_at_emi_start = P × (1 + r_si × (days / 365.25))
//   where days = moratorium_end_date − loan_start_date
//
//   EMI = outstanding_at_emi_start × [r(1+r)^n] / [(1+r)^n − 1]
//   where r = ci_rate / 12 / 100, n = loan_tenure_months
// ============================================================

import {
  differenceInDays,
  differenceInMonths,
  addMonths,
  parseISO,
  format,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';
import type { UserLoan, EMIScheduleRow, LoanPhase, Disbursement } from '@/types/loan.types';
import { calculateEMI } from './emi-calculator';

// ────────────────────────────────────────────────────────────
// Core Moratorium Calculations
// ────────────────────────────────────────────────────────────

/**
 * Calculates the outstanding balance at ANY point during the moratorium.
 *
 * Formula: P_out = P × (1 + r_si × (days / 365.25))
 * where:
 *   P     = original principal
 *   r_si  = annual simple interest rate (decimal, e.g. 0.10 for 10%)
 *   days  = days from loan_start to the target date
 *
 * @param originalPrincipal  - Original disbursed amount
 * @param loanStartDate      - Date loan was disbursed
 * @param targetDate         - Date to compute outstanding for
 * @param annualSiRate       - SI rate as percentage (e.g. 10 for 10%)
 * @param disbursements      - Optional array of disbursement tranches
 */
export function calculateMoratoriumOutstanding(
  originalPrincipal: number,
  loanStartDate: string | Date,
  targetDate: string | Date,
  annualSiRate: number,
  disbursements?: Disbursement[] | null,
): number {
  const start = typeof loanStartDate === 'string' ? parseISO(loanStartDate) : loanStartDate;
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;

  const rate = annualSiRate / 100;

  // If there are specific disbursements, calculate SI per tranche
  if (disbursements && disbursements.length > 0) {
    let totalOutstanding = 0;
    for (const d of disbursements) {
      const dDate = parseISO(d.date);
      if (isAfter(dDate, target)) continue; // ignore future disbursements

      const days = Math.max(0, differenceInDays(target, dDate));
      const years = days / 365.25;
      totalOutstanding += d.amount * (1 + rate * years);
    }
    return Math.round(totalOutstanding * 100) / 100;
  }

  // Fallback to original day 1 principal calculation
  const days = differenceInDays(target, start);
  if (days <= 0) return originalPrincipal;

  const years = days / 365.25;
  const outstanding = originalPrincipal * (1 + rate * years);
  return Math.round(outstanding * 100) / 100;
}

/**
 * Computes the moratorium end date:
 *   moratorium_end = course_end + grace_period_months
 */
export function computeMoratoriumEndDate(
  courseEndDate: string | Date,
  gracePeriodMonths: number,
): Date {
  const end = typeof courseEndDate === 'string' ? parseISO(courseEndDate) : courseEndDate;
  return addMonths(end, gracePeriodMonths);
}

/**
 * Returns the outstanding balance at the moratorium end date.
 * This is the principal base used for EMI calculation.
 *
 * Priority order:
 *   1. If user has supplied current_outstanding AND it is greater than original_principal
 *      (meaning interest has already capitalized into it — it came from a bank statement),
 *      project it forward from outstanding_as_of_date (or today if not set) to
 *      moratorium_end_date using SI.
 *   2. If disbursements are provided, calculate SI per tranche from each
 *      disbursement date to moratorium_end_date.
 *   3. Fallback: SI on original_principal from loan_start_date to moratorium_end_date.
 *
 * NOTE: We must NEVER use emi_start_date as the SI target.
 *   The moratorium ends at moratorium_end_date. After that, no more SI accrues —
 *   the outstanding is frozen and becomes the EMI base for compound interest.
 */
export function outstandingAtMoratoriumEnd(loan: UserLoan): number {
  const principal = Number(loan.original_principal);
  const siRate = Number(loan.moratorium_si_rate ?? loan.interest_rate);

  if (!loan.moratorium_end_date || !loan.loan_start_date) {
    return principal;
  }

  const morEndDate = parseISO(loan.moratorium_end_date);
  const today = new Date();

  // ── Priority 1: User-supplied current_outstanding is authoritative ──────
  //
  // We treat current_outstanding as a real bank-statement value when either:
  //   a) outstanding_as_of_date is explicitly set (user manually verified), OR
  //   b) current_outstanding > original_principal (SI has already accrued into it —
  //      this value must have come from the bank, not been auto-calculated)
  //
  // In both cases we project it forward from the snapshot date to moratorium end.
  const rawOutstanding = loan.current_outstanding ? Number(loan.current_outstanding) : 0;
  const hasUserOutstanding =
    rawOutstanding > 0 &&
    (loan.outstanding_as_of_date != null || rawOutstanding > principal);

  if (hasUserOutstanding) {
    // Determine the "as of" date for the snapshot.
    // Use outstanding_as_of_date if set, otherwise assume "today".
    const snapshotDate = loan.outstanding_as_of_date
      ? parseISO(loan.outstanding_as_of_date)
      : today;

    // If the snapshot date is already past moratorium end, the value IS the EMI base.
    if (!isBefore(snapshotDate, morEndDate)) {
      return rawOutstanding;
    }

    // Project forward from snapshot date to moratorium end using SI.
    const days = Math.max(0, differenceInDays(morEndDate, snapshotDate));
    const years = days / 365.25;
    const projected = rawOutstanding * (1 + (siRate / 100) * years);
    return Math.round(projected * 100) / 100;
  }

  // ── Priority 2: Disbursement-based per-tranche SI to moratorium_end ──────
  if (loan.disbursements && loan.disbursements.length > 0) {
    return calculateMoratoriumOutstanding(
      principal,
      loan.loan_start_date,
      loan.moratorium_end_date,
      siRate,
      loan.disbursements,
    );
  }

  // ── Priority 3: Single-tranche SI from loan_start to moratorium_end ──────
  return calculateMoratoriumOutstanding(
    principal,
    loan.loan_start_date,
    loan.moratorium_end_date,
    siRate,
  );
}

// ────────────────────────────────────────────────────────────
// Phase Detection
// ────────────────────────────────────────────────────────────

export interface EducationLoanPhaseResult {
  phase: LoanPhase;
  moratoriumEndDate: Date | null;
  emiStartDate: Date | null;
  /** Outstanding at moratorium end — the EMI base (fixed) */
  outstandingAtEmiStart: number;
  /** Current outstanding today (accounts for actual payments in repayment) */
  currentOutstanding: number;
  /** Interest accrued since disbursement */
  accruedInterest: number;
  phaseLabel: string;
  daysInMoratorium: number;
  daysMoratoriumElapsed: number;
  moratoriumProgressPercent: number;
}

/**
 * Returns the current state of an education loan given today's date.
 * Correctly separates:
 *   - outstandingAtEmiStart: what the EMI is computed from (fixed at moratorium end)
 *   - currentOutstanding: what remains to be paid today
 */
export function getEducationLoanPhase(
  loan: UserLoan,
  asOf: Date = new Date(),
): EducationLoanPhaseResult {
  const moratoriumEnd = loan.moratorium_end_date ? parseISO(loan.moratorium_end_date) : null;
  const emiStart = loan.emi_start_date ? parseISO(loan.emi_start_date) : null;
  const principal = Number(loan.original_principal);
  const siRate = Number(loan.moratorium_si_rate ?? loan.interest_rate);
  const paidPrincipal = Number(loan.total_principal_paid ?? 0);

  // The EMI base: outstanding at moratorium end (fixed, never changes)
  const outstandingAtEmiStart = outstandingAtMoratoriumEnd(loan);

  const accruedInterestAtMorEnd = outstandingAtEmiStart - principal;

  // Moratorium progress metrics
  let daysInMoratorium = 0;
  let daysMoratoriumElapsed = 0;
  let moratoriumProgressPercent = 0;
  if (moratoriumEnd && loan.loan_start_date) {
    const loanStart = parseISO(loan.loan_start_date);
    daysInMoratorium = differenceInDays(moratoriumEnd, loanStart);
    daysMoratoriumElapsed = Math.min(
      Math.max(0, differenceInDays(asOf, loanStart)),
      daysInMoratorium,
    );
    moratoriumProgressPercent = daysInMoratorium > 0
      ? Math.min(100, (daysMoratoriumElapsed / daysInMoratorium) * 100)
      : 0;
  }

  // ── PHASE: During moratorium (asOf < moratoriumEnd) ──────
  if (moratoriumEnd && isBefore(asOf, moratoriumEnd)) {
    // Current outstanding today:
    //
    // If current_outstanding > original_principal, the value already reflects
    // accrued SI (it came from a bank statement). Project it forward to asOf
    // using SI from the known snapshot date.
    //
    // Otherwise fall back to computing from disbursements / original principal.
    let currentOutstanding: number;

    const rawOutstanding = loan.current_outstanding ? Number(loan.current_outstanding) : 0;
    const hasUserOutstanding =
      rawOutstanding > 0 &&
      (loan.outstanding_as_of_date != null || rawOutstanding > principal);

    if (hasUserOutstanding) {
      const snapshotDate = loan.outstanding_as_of_date
        ? parseISO(loan.outstanding_as_of_date)
        : asOf; // treat the value as valid right now — no further projection needed

      if (!isAfter(asOf, snapshotDate)) {
        // asOf is at or before the snapshot — just use the snapshot value directly
        currentOutstanding = rawOutstanding;
      } else {
        // Project from snapshot date forward to asOf using SI
        const days = Math.max(0, differenceInDays(asOf, snapshotDate));
        const years = days / 365.25;
        currentOutstanding = Math.round(
          rawOutstanding * (1 + (siRate / 100) * years) * 100,
        ) / 100;
      }
    } else {
      currentOutstanding = calculateMoratoriumOutstanding(
        principal,
        loan.loan_start_date,
        asOf,
        siRate,
        loan.disbursements,
      );
    }

    const daysLeft = differenceInDays(moratoriumEnd, asOf);
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));

    return {
      phase: 'moratorium',
      moratoriumEndDate: moratoriumEnd,
      emiStartDate: emiStart,
      outstandingAtEmiStart,
      currentOutstanding,
      accruedInterest: currentOutstanding - principal,
      phaseLabel: `Moratorium — ${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} left · SI @ ${siRate}%`,
      daysInMoratorium,
      daysMoratoriumElapsed,
      moratoriumProgressPercent,
    };
  }

  // ── PHASE: After moratorium, before EMI starts ────────────
  if (moratoriumEnd && emiStart && isBefore(asOf, emiStart)) {
    const daysLeft = differenceInDays(emiStart, asOf);
    return {
      phase: 'moratorium',
      moratoriumEndDate: moratoriumEnd,
      emiStartDate: emiStart,
      outstandingAtEmiStart,
      currentOutstanding: outstandingAtEmiStart,
      accruedInterest: accruedInterestAtMorEnd,
      phaseLabel: `EMI starts in ${Math.ceil(daysLeft / 30)} month${Math.ceil(daysLeft / 30) !== 1 ? 's' : ''} · Outstanding ₹${outstandingAtEmiStart.toLocaleString('en-IN')}`,
      daysInMoratorium,
      daysMoratoriumElapsed: daysInMoratorium,
      moratoriumProgressPercent: 100,
    };
  }

  // ── PHASE: During repayment (asOf >= emiStart) ────────────
  if (emiStart && (isAfter(asOf, emiStart) || isEqual(asOf, emiStart))) {
    const tenureMonths = loan.loan_tenure_months ?? 240;
    const ciRate = Number(loan.ci_rate ?? loan.interest_rate);
    const completedMonths = differenceInMonths(asOf, emiStart);

    // Current outstanding = EMI-base minus what has been paid as principal
    const currentOutstanding = Math.max(0, Number(loan.current_outstanding ?? (outstandingAtEmiStart - paidPrincipal)));
    const yearNo = Math.min(Math.ceil((completedMonths + 1) / 12), Math.ceil(tenureMonths / 12));
    const totalYears = Math.ceil(tenureMonths / 12);

    return {
      phase: 'repayment',
      moratoriumEndDate: moratoriumEnd,
      emiStartDate: emiStart,
      outstandingAtEmiStart,
      currentOutstanding,
      accruedInterest: accruedInterestAtMorEnd,
      phaseLabel: `Repayment — Year ${yearNo} of ${totalYears} · CI @ ${ciRate}%`,
      daysInMoratorium,
      daysMoratoriumElapsed: daysInMoratorium,
      moratoriumProgressPercent: 100,
    };
  }

  // ── PHASE: Completed ─────────────────────────────────────
  return {
    phase: 'completed',
    moratoriumEndDate: moratoriumEnd,
    emiStartDate: emiStart,
    outstandingAtEmiStart,
    currentOutstanding: 0,
    accruedInterest: accruedInterestAtMorEnd,
    phaseLabel: 'Loan completed 🎉',
    daysInMoratorium,
    daysMoratoriumElapsed: daysInMoratorium,
    moratoriumProgressPercent: 100,
  };
}

// ────────────────────────────────────────────────────────────
// Amortization Schedule
// ────────────────────────────────────────────────────────────

/**
 * Generates the full amortization schedule for an education loan.
 * The repayment phase starts from outstandingAtMoratoriumEnd.
 * Marks rows as paid based on actual payment dates provided.
 */
export function generateEducationLoanSchedule(
  loan: UserLoan,
  payments: Array<{ payment_date: string; principal_component: number; interest_component: number }> = [],
): EMIScheduleRow[] {
  if (!loan.emi_start_date || !loan.loan_tenure_months) return [];

  const emiBase = outstandingAtMoratoriumEnd(loan);

  const ciRate = Number(loan.ci_rate ?? loan.interest_rate);
  const monthlyRate = ciRate / 100 / 12;
  const tenureMonths = loan.loan_tenure_months;
  const emi = Number(loan.emi_amount) || calculateEMI(emiBase, ciRate, tenureMonths);
  const emiStart = parseISO(loan.emi_start_date);

  // Index payments by month (0-indexed)
  const paymentsByMonth: Record<number, (typeof payments)[0]> = {};
  payments.forEach((p) => {
    const payDate = parseISO(p.payment_date);
    const monthIdx = differenceInMonths(payDate, emiStart);
    if (monthIdx >= 0 && monthIdx < tenureMonths) {
      paymentsByMonth[monthIdx] = p;
    }
  });

  const rows: EMIScheduleRow[] = [];
  let balance = emiBase;
  let cumulativeInterest = 0;

  for (let m = 0; m < tenureMonths; m++) {
    const rowDate = addMonths(emiStart, m);
    const openingBalance = balance;
    const interestComponent = openingBalance * monthlyRate;
    const principalComponent = Math.min(emi - interestComponent, openingBalance);
    const closingBalance = Math.max(0, openingBalance - principalComponent);
    cumulativeInterest += interestComponent;

    const payment = paymentsByMonth[m];

    rows.push({
      month: m + 1,
      date: format(rowDate, 'yyyy-MM-dd'),
      openingBalance: Math.round(openingBalance * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      totalInterestPaid: Math.round(cumulativeInterest * 100) / 100,
      isPaid: !!payment,
    });

    balance = closingBalance;
    if (balance < 0.5) break;
  }

  return rows;
}

/**
 * Calculates the outstanding balance at a specific repayment month,
 * optionally accounting for a prepayment at a given month.
 */
export function calculateRepaymentBalance(
  emiBase: number,
  ciRate: number,
  tenureMonths: number,
  monthsElapsed: number,
): number {
  const r = ciRate / 100 / 12;
  if (r === 0) return Math.max(0, emiBase - (emiBase / tenureMonths) * monthsElapsed);

  const emi = calculateEMI(emiBase, ciRate, tenureMonths);
  const factor = Math.pow(1 + r, monthsElapsed);
  const outstanding = emiBase * factor - emi * ((factor - 1) / r);
  return Math.max(0, Math.round(outstanding * 100) / 100);
}
