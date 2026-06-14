// ============================================================
// LOAN PROJECTION ENGINE — Scenario Simulator
// Supports:
//   1. Fixed extra monthly payment
//   2. Yearly step-up payment
//   3. One-time prepayment (with Reduce Tenure or Reduce EMI option)
// ============================================================

import { addMonths, parseISO, format } from 'date-fns';
import type {
  UserLoan,
  LoanProjection,
  SimulatorInputs,
  EMIScheduleRow,
} from '@/types/loan.types';
import { calculateEMI } from './emi-calculator';
import { educationLoanOutstandingAtEmiStart } from './loan-calculator';

// ────────────────────────────────────────────────────────────
// Internal simulation helpers
// ────────────────────────────────────────────────────────────

interface SimRow {
  month: number;
  date: string;
  openingBalance: number;
  payment: number;
  principalComponent: number;
  interestComponent: number;
  closingBalance: number;
  cumulativeInterest: number;
}

function simulateSchedule(
  principal: number,
  annualRatePercent: number,
  startDate: Date,
  monthlyPaymentFn: (month: number, balance: number) => number,
  maxMonths = 600,
): SimRow[] {
  const monthlyRate = annualRatePercent / 12 / 100;
  const rows: SimRow[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  let month = 0;

  while (balance > 0.5 && month < maxMonths) {
    const interestComponent = balance * monthlyRate;
    const payment = Math.min(monthlyPaymentFn(month, balance), balance + interestComponent);
    const principalComponent = Math.max(0, payment - interestComponent);
    const closingBalance = Math.max(0, balance - principalComponent);
    cumulativeInterest += interestComponent;

    rows.push({
      month: month + 1,
      date: format(addMonths(startDate, month), 'yyyy-MM-dd'),
      openingBalance: Math.round(balance * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
    });

    balance = closingBalance;
    month++;
  }

  return rows;
}

function toEMIScheduleRows(rows: SimRow[]): EMIScheduleRow[] {
  return rows.map((r) => ({
    month: r.month,
    date: r.date,
    openingBalance: r.openingBalance,
    emi: r.payment,
    principalComponent: r.principalComponent,
    interestComponent: r.interestComponent,
    closingBalance: r.closingBalance,
    totalInterestPaid: r.cumulativeInterest,
  }));
}

function getBasePrincipal(loan: UserLoan): number {
  if (loan.interest_type === 'hybrid' || loan.loan_type === 'education') {
    return educationLoanOutstandingAtEmiStart(loan);
  }
  return Math.max(0, Number(loan.current_outstanding ?? loan.original_principal));
}

function getRate(loan: UserLoan): number {
  if (loan.interest_type === 'hybrid' || loan.loan_type === 'education') {
    return Number(loan.ci_rate ?? loan.interest_rate);
  }
  return Number(loan.interest_rate);
}

function getStartDate(loan: UserLoan): Date {
  const dateStr = loan.emi_start_date ?? loan.loan_start_date;
  return parseISO(dateStr);
}

function buildProjection(
  scenarioLabel: string,
  principal: number,
  baseRows: SimRow[],
  newRows: SimRow[],
): LoanProjection {
  const baseInterest = baseRows.at(-1)?.cumulativeInterest ?? 0;
  const newInterest = newRows.at(-1)?.cumulativeInterest ?? 0;

  return {
    scenarioLabel,
    originalPayoffDate: baseRows.at(-1)?.date ?? '',
    newPayoffDate: newRows.at(-1)?.date ?? '',
    monthsSaved: Math.max(0, baseRows.length - newRows.length),
    totalInterestOriginal: Math.round(baseInterest * 100) / 100,
    totalInterestNew: Math.round(newInterest * 100) / 100,
    interestSaved: Math.round((baseInterest - newInterest) * 100) / 100,
    totalRepaymentOriginal: Math.round((principal + baseInterest) * 100) / 100,
    totalRepaymentNew: Math.round((principal + newInterest) * 100) / 100,
    amountSaved: Math.round((baseInterest - newInterest) * 100) / 100,
    scheduleRows: toEMIScheduleRows(newRows),
    baseScheduleRows: toEMIScheduleRows(baseRows),
  };
}

// ────────────────────────────────────────────────────────────
// Baseline simulation
// ────────────────────────────────────────────────────────────

export function runBaselineSimulation(loan: UserLoan): SimRow[] {
  const principal = getBasePrincipal(loan);
  const rate = getRate(loan);
  const emi = Number(loan.emi_amount ?? calculateEMI(principal, rate, loan.loan_tenure_months ?? 240));
  const startDate = getStartDate(loan);
  return simulateSchedule(principal, rate, startDate, () => emi);
}

// ────────────────────────────────────────────────────────────
// Scenario 1: Fixed extra monthly payment
// ────────────────────────────────────────────────────────────

export function simulateFixedIncrease(
  loan: UserLoan,
  extraMonthlyAmount: number,
): LoanProjection {
  const principal = getBasePrincipal(loan);
  const rate = getRate(loan);
  const baseEmi = Number(loan.emi_amount ?? calculateEMI(principal, rate, loan.loan_tenure_months ?? 240));
  const newEmi = baseEmi + extraMonthlyAmount;
  const startDate = getStartDate(loan);

  const baseRows = simulateSchedule(principal, rate, startDate, () => baseEmi);
  const newRows = simulateSchedule(principal, rate, startDate, () => newEmi);

  return buildProjection(
    `Extra ₹${extraMonthlyAmount.toLocaleString('en-IN')}/month`,
    principal,
    baseRows,
    newRows,
  );
}

// ────────────────────────────────────────────────────────────
// Scenario 2: Yearly step-up
// ────────────────────────────────────────────────────────────

export function simulateYearlyStepUp(
  loan: UserLoan,
  yearlyStepUpAmount: number,
): LoanProjection {
  const principal = getBasePrincipal(loan);
  const rate = getRate(loan);
  const baseEmi = Number(loan.emi_amount ?? calculateEMI(principal, rate, loan.loan_tenure_months ?? 240));
  const startDate = getStartDate(loan);

  const baseRows = simulateSchedule(principal, rate, startDate, () => baseEmi);
  const newRows = simulateSchedule(
    principal,
    rate,
    startDate,
    (month) => baseEmi + Math.floor(month / 12) * yearlyStepUpAmount,
  );

  return buildProjection(
    `+₹${yearlyStepUpAmount.toLocaleString('en-IN')} step-up/year`,
    principal,
    baseRows,
    newRows,
  );
}

// ────────────────────────────────────────────────────────────
// Scenario 3a: Prepayment → Reduce Tenure (EMI stays same)
// ────────────────────────────────────────────────────────────

export function simulatePrepaymentReduceTenure(
  loan: UserLoan,
  prepaymentAmount: number,
  prepaymentAtMonth: number = 1,
): LoanProjection {
  const principal = getBasePrincipal(loan);
  const rate = getRate(loan);
  const baseEmi = Number(loan.emi_amount ?? calculateEMI(principal, rate, loan.loan_tenure_months ?? 240));
  const startDate = getStartDate(loan);

  const baseRows = simulateSchedule(principal, rate, startDate, () => baseEmi);
  const newRows = simulateSchedule(principal, rate, startDate, (month) => {
    return month === prepaymentAtMonth - 1
      ? baseEmi + prepaymentAmount
      : baseEmi;
  });

  return buildProjection(
    `₹${prepaymentAmount.toLocaleString('en-IN')} prepayment (reduce tenure)`,
    principal,
    baseRows,
    newRows,
  );
}

// ────────────────────────────────────────────────────────────
// Scenario 3b: Prepayment → Reduce EMI (tenure stays same)
// ────────────────────────────────────────────────────────────

export function simulatePrepaymentReduceEMI(
  loan: UserLoan,
  prepaymentAmount: number,
  prepaymentAtMonth: number = 1,
): LoanProjection {
  const principal = getBasePrincipal(loan);
  const rate = getRate(loan);
  const baseEmi = Number(loan.emi_amount ?? calculateEMI(principal, rate, loan.loan_tenure_months ?? 240));
  const tenureMonths = loan.loan_tenure_months ?? 240;
  const startDate = getStartDate(loan);
  const monthlyRate = rate / 12 / 100;

  const baseRows = simulateSchedule(principal, rate, startDate, () => baseEmi);

  // Compute the balance just after the prepayment month
  let balanceAfterPrepayment = principal;
  for (let m = 0; m < prepaymentAtMonth; m++) {
    const interest = balanceAfterPrepayment * monthlyRate;
    balanceAfterPrepayment = Math.max(0, balanceAfterPrepayment - (baseEmi - interest));
  }
  balanceAfterPrepayment = Math.max(0, balanceAfterPrepayment - prepaymentAmount);

  const remainingMonths = tenureMonths - prepaymentAtMonth;
  const newEmi = remainingMonths > 0
    ? calculateEMI(balanceAfterPrepayment, rate, remainingMonths)
    : 0;

  const newRows = simulateSchedule(principal, rate, startDate, (month) => {
    if (month < prepaymentAtMonth - 1) return baseEmi;
    if (month === prepaymentAtMonth - 1) return baseEmi + prepaymentAmount;
    return newEmi;
  });

  const baseInterest = baseRows.at(-1)?.cumulativeInterest ?? 0;
  const newInterest = newRows.at(-1)?.cumulativeInterest ?? 0;

  return {
    scenarioLabel: `₹${prepaymentAmount.toLocaleString('en-IN')} prepayment → New EMI ₹${Math.round(newEmi).toLocaleString('en-IN')}`,
    originalPayoffDate: baseRows.at(-1)?.date ?? '',
    newPayoffDate: newRows.at(-1)?.date ?? '',
    monthsSaved: Math.max(0, baseRows.length - newRows.length),
    totalInterestOriginal: Math.round(baseInterest * 100) / 100,
    totalInterestNew: Math.round(newInterest * 100) / 100,
    interestSaved: Math.round((baseInterest - newInterest) * 100) / 100,
    totalRepaymentOriginal: Math.round((principal + baseInterest) * 100) / 100,
    totalRepaymentNew: Math.round((principal + newInterest) * 100) / 100,
    amountSaved: Math.round((baseInterest - newInterest) * 100) / 100,
    scheduleRows: toEMIScheduleRows(newRows),
    baseScheduleRows: toEMIScheduleRows(baseRows),
  };
}

// ────────────────────────────────────────────────────────────
// Master dispatcher
// ────────────────────────────────────────────────────────────

export function runSimulation(loan: UserLoan, inputs: SimulatorInputs): LoanProjection | null {
  switch (inputs.scenarioType) {
    case 'fixed_increase':
      return simulateFixedIncrease(loan, inputs.fixedExtraMonthly ?? 0);
    case 'yearly_stepup':
      return simulateYearlyStepUp(loan, inputs.yearlyStepUpAmount ?? 0);
    case 'one_time_prepayment':
      return inputs.reduceTenure !== false
        ? simulatePrepaymentReduceTenure(loan, inputs.prepaymentAmount ?? 0, inputs.prepaymentAtMonth ?? 1)
        : simulatePrepaymentReduceEMI(loan, inputs.prepaymentAmount ?? 0, inputs.prepaymentAtMonth ?? 1);
    default:
      return null;
  }
}
