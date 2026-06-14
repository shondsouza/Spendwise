// ============================================================
// EMI CALCULATOR — Core Financial Math
// ============================================================

import {
  addMonths,
  parseISO,
  format,
  differenceInMonths,
} from 'date-fns';
import type { EMIScheduleRow, UserLoan } from '@/types/loan.types';
import { COMPOUNDING_FREQ_VALUES } from '@/types/loan.types';

/**
 * Calculates the EMI (Equated Monthly Installment) using the standard formula:
 *
 *   EMI = P × [r(1+r)^n] / [(1+r)^n − 1]
 *
 * where:
 *   P = principal
 *   r = monthly interest rate (annual_rate / 12 / 100)
 *   n = tenure in months
 *
 * Example: P=5,24,050, annual=10%, n=240
 *   r = 10/12/100 = 0.008333
 *   EMI = 5,24,050 × [0.008333 × (1.008333)^240] / [(1.008333)^240 − 1]
 *       ≈ ₹5,049
 */
export function calculateEMI(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePercent === 0) return Math.round((principal / tenureMonths) * 100) / 100;

  const r = annualRatePercent / 12 / 100;
  const n = tenureMonths;
  const factor = Math.pow(1 + r, n);
  const emi = principal * (r * factor) / (factor - 1);

  return Math.round(emi * 100) / 100;
}

/**
 * Calculates the total amount payable for a simple interest loan:
 *   Total = P × (1 + r × t)
 */
export function calculateSimpleInterestTotal(
  principal: number,
  annualRatePercent: number,
  tenureYears: number,
): { interest: number; total: number } {
  const interest = principal * (annualRatePercent / 100) * tenureYears;
  return {
    interest: Math.round(interest * 100) / 100,
    total: Math.round((principal + interest) * 100) / 100,
  };
}

/**
 * Calculates compound interest outstanding:
 *   Total = P × (1 + r/n)^(n×t)
 */
export function calculateCompoundInterestTotal(
  principal: number,
  annualRatePercent: number,
  tenureYears: number,
  frequency: 'monthly' | 'quarterly' | 'yearly' = 'monthly',
): { interest: number; total: number } {
  const n = COMPOUNDING_FREQ_VALUES[frequency];
  const r = annualRatePercent / 100;
  const total = principal * Math.pow(1 + r / n, n * tenureYears);
  const interest = total - principal;
  return {
    interest: Math.round(interest * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Generates a full month-by-month amortization schedule using the reducing balance method.
 * Marks rows as paid if a matching payment exists for that month.
 *
 * @param principal       - Opening principal amount
 * @param annualRate      - Annual interest rate as percentage
 * @param tenureMonths    - Total loan tenure in months
 * @param startDate       - EMI start date
 * @param payments        - Recorded payments array (for marking rows as paid)
 */
export function generateAmortizationTable(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
  startDate: string | Date,
  payments: Array<{ payment_date: string; principal_component: number; interest_component: number }> = [],
): EMIScheduleRow[] {
  const emi = calculateEMI(principal, annualRatePercent, tenureMonths);
  const monthlyRate = annualRatePercent / 12 / 100;
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;

  // Index payments by month offset from start
  const paymentsByMonth: Record<number, true> = {};
  payments.forEach((p) => {
    const payDate = parseISO(p.payment_date);
    const monthIdx = differenceInMonths(payDate, start);
    if (monthIdx >= 0 && monthIdx < tenureMonths) {
      paymentsByMonth[monthIdx] = true;
    }
  });

  const rows: EMIScheduleRow[] = [];
  let balance = principal;
  let cumulativeInterest = 0;

  for (let m = 0; m < tenureMonths; m++) {
    const rowDate = addMonths(start, m);
    const openingBalance = balance;
    const interestComponent = openingBalance * monthlyRate;
    const principalComponent = Math.min(emi - interestComponent, openingBalance);
    const closingBalance = Math.max(0, openingBalance - principalComponent);
    cumulativeInterest += interestComponent;

    rows.push({
      month: m + 1,
      date: format(rowDate, 'yyyy-MM-dd'),
      openingBalance: Math.round(openingBalance * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      totalInterestPaid: Math.round(cumulativeInterest * 100) / 100,
      isPaid: !!paymentsByMonth[m],
    });

    balance = closingBalance;
    if (balance < 0.5) break;
  }

  return rows;
}

/**
 * Calculates the effective principal for a given loan at today's date.
 */
export function getEffectivePrincipal(loan: UserLoan): number {
  const principal = Number(loan.original_principal);
  const paidPrincipal = Number(loan.total_principal_paid ?? 0);
  return Math.max(0, Number(loan.current_outstanding ?? (principal - paidPrincipal)));
}

/**
 * Calculates how many months remain in the loan repayment phase.
 */
export function remainingMonths(loan: UserLoan, asOf: Date = new Date()): number {
  if (!loan.emi_start_date || !loan.loan_tenure_months) return 0;
  const emiStart = parseISO(loan.emi_start_date);
  if (asOf < emiStart) return loan.loan_tenure_months;
  const elapsed = differenceInMonths(asOf, emiStart);
  return Math.max(0, loan.loan_tenure_months - elapsed);
}

/**
 * Calculates the next EMI due date from today.
 */
export function nextEmiDate(loan: UserLoan, asOf: Date = new Date()): string | null {
  if (!loan.emi_start_date) return null;
  const emiStart = parseISO(loan.emi_start_date);
  if (asOf < emiStart) return format(emiStart, 'yyyy-MM-dd');

  const elapsed = differenceInMonths(asOf, emiStart);
  const next = addMonths(emiStart, elapsed + 1);
  return format(next, 'yyyy-MM-dd');
}

/**
 * Splits a payment into principal and interest components
 * based on current outstanding and monthly rate.
 * For moratorium-phase payments, all goes to interest.
 */
export function splitPayment(
  paymentAmount: number,
  outstandingBalance: number,
  annualRatePercent: number,
  isInMoratorium = false,
): { principal: number; interest: number } {
  if (isInMoratorium) {
    // During moratorium, payment is pure interest
    const monthlyRate = annualRatePercent / 12 / 100;
    const monthlyInterest = outstandingBalance * monthlyRate;
    const interest = Math.min(paymentAmount, monthlyInterest);
    return {
      principal: 0,
      interest: Math.round(interest * 100) / 100,
    };
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const interestDue = outstandingBalance * monthlyRate;
  const interest = Math.min(paymentAmount, interestDue);
  const principal = Math.max(0, paymentAmount - interest);
  return {
    principal: Math.round(principal * 100) / 100,
    interest: Math.round(interest * 100) / 100,
  };
}
