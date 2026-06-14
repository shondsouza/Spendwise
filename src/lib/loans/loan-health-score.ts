// ============================================================
// LOAN HEALTH SCORE ENGINE
// Produces a 0–100 score for a user's overall loan portfolio.
//
// Factors (weights):
//   1. No overdue payments              (25)
//   2. Debt-to-income ratio             (25)
//   3. Repayment progress               (20)
//   4. Prepayment / early-payment       (15)
//   5. Remaining tenure manageability   (15)
// ============================================================

import { parseISO, isAfter } from 'date-fns';
import type { UserLoan, LoanPayment, LoanHealthScore, LoanHealthFactor } from '@/types/loan.types';
import { calculateEMI } from './emi-calculator';
import { getEducationLoanPhase } from './education-loan-calculator';

export function computeLoanHealthScore(
  loans: UserLoan[],
  allPayments: Record<string, LoanPayment[]>,
  monthlyIncome: number,
): LoanHealthScore {
  const activeLoans = loans.filter((l) => l.status === 'active');

  if (activeLoans.length === 0) {
    return {
      score: 100,
      grade: 'A',
      label: 'No Active Loans',
      color: 'var(--apple-green)',
      factors: [],
      suggestions: ['You have no active debt. Excellent financial health!'],
    };
  }

  // ── Factor 1: Overdue Payments (25 pts) ──────────────────
  const today = new Date();
  let overdueCount = 0;

  for (const loan of activeLoans) {
    if (loan.loan_type !== 'education' && loan.interest_type !== 'hybrid') {
      if (loan.emi_start_date && isAfter(today, parseISO(loan.emi_start_date))) {
        const payments = allPayments[loan.id] ?? [];
        const expectedEmiMonths = Math.floor(
          (today.getTime() - parseISO(loan.emi_start_date).getTime()) / (30.44 * 24 * 3600 * 1000),
        );
        const emiPayments = payments.filter((p) => p.payment_type === 'emi').length;
        if (expectedEmiMonths - emiPayments > 1) {
          overdueCount++;
        }
      }
    }
  }

  const overdueScore = overdueCount === 0 ? 100 : Math.max(0, 100 - overdueCount * 30);
  const overdueFactor: LoanHealthFactor = {
    label: 'Payment Regularity',
    score: overdueScore,
    weight: 0.25,
    detail: overdueCount === 0
      ? 'No overdue payments detected'
      : `${overdueCount} loan${overdueCount > 1 ? 's' : ''} may have missed payments`,
  };

  // ── Factor 2: Debt-to-Income Ratio (25 pts) ──────────────
  let totalMonthlyEMI = 0;
  for (const loan of activeLoans) {
    if (loan.loan_type === 'education' || loan.interest_type === 'hybrid') {
      const phase = getEducationLoanPhase(loan);
      if (phase.phase === 'repayment') {
        totalMonthlyEMI += Number(loan.emi_amount) || calculateEMI(
          phase.outstandingAtEmiStart,
          Number(loan.ci_rate ?? loan.interest_rate),
          Number(loan.loan_tenure_months ?? 120),
        );
      }
    } else {
      totalMonthlyEMI += Number(loan.emi_amount) || calculateEMI(
        Number(loan.current_outstanding),
        Number(loan.interest_rate),
        Number(loan.loan_tenure_months ?? 120),
      );
    }
  }

  const dti = monthlyIncome > 0 ? (totalMonthlyEMI / monthlyIncome) * 100 : 50;
  const dtiScore = dti <= 20 ? 100 : dti <= 30 ? 80 : dti <= 40 ? 55 : dti <= 50 ? 30 : 10;
  const dtiFactor: LoanHealthFactor = {
    label: 'Debt-to-Income Ratio',
    score: dtiScore,
    weight: 0.25,
    detail: monthlyIncome > 0
      ? `EMIs consume ${dti.toFixed(1)}% of monthly income`
      : 'Add income data for accurate DTI',
  };

  // ── Factor 3: Repayment Progress (20 pts) ────────────────
  let totalProgressScore = 0;
  let repaymentLoans = 0;

  for (const loan of activeLoans) {
    const paidPrincipal = Number(loan.total_principal_paid ?? 0);
    const principal = Number(loan.original_principal);
    if (principal > 0 && loan.loan_type !== 'education' && loan.interest_type !== 'hybrid') {
      totalProgressScore += Math.min(100, (paidPrincipal / principal) * 100);
      repaymentLoans++;
    }
  }

  const progressScore = repaymentLoans > 0
    ? totalProgressScore / repaymentLoans
    : 70; // Education loans in moratorium get neutral score

  const progressFactor: LoanHealthFactor = {
    label: 'Repayment Progress',
    score: progressScore,
    weight: 0.20,
    detail: repaymentLoans > 0
      ? `Average ${progressScore.toFixed(0)}% principal repaid`
      : 'Loans in moratorium — repayment not yet started',
  };

  // ── Factor 4: Prepayment Activity (15 pts) ───────────────
  let hasPrepayments = false;
  for (const payments of Object.values(allPayments)) {
    if (payments.some((p) => p.payment_type === 'prepayment' || p.payment_type === 'lump_sum')) {
      hasPrepayments = true;
      break;
    }
  }

  const totalPayments = Object.values(allPayments).reduce((sum, ps) => sum + ps.length, 0);
  const prepayments = Object.values(allPayments)
    .flat()
    .filter((p) => p.payment_type === 'prepayment' || p.payment_type === 'lump_sum').length;

  const prepaymentRatio = totalPayments > 0 ? prepayments / totalPayments : 0;
  const prepaymentScore = hasPrepayments ? Math.min(100, 50 + prepaymentRatio * 200) : 40;
  const prepaymentFactor: LoanHealthFactor = {
    label: 'Prepayment Activity',
    score: prepaymentScore,
    weight: 0.15,
    detail: hasPrepayments
      ? `${prepayments} prepayment${prepayments > 1 ? 's' : ''} recorded`
      : 'No prepayments yet — consider making one to save interest',
  };

  // ── Factor 5: Remaining Tenure (15 pts) ──────────────────
  let totalWeightedTenureScore = 0;
  let tenureCount = 0;

  for (const loan of activeLoans) {
    if (loan.loan_tenure_months && loan.emi_start_date) {
      const elapsed = Math.max(0,
        Math.floor((today.getTime() - parseISO(loan.emi_start_date).getTime()) / (30.44 * 24 * 3600 * 1000)),
      );
      const remaining = Math.max(0, loan.loan_tenure_months - elapsed);
      const remainingYears = remaining / 12;
      const tenureScore = remainingYears <= 5 ? 100 : remainingYears <= 10 ? 70 : remainingYears <= 20 ? 40 : 20;
      totalWeightedTenureScore += tenureScore;
      tenureCount++;
    }
  }

  const tenureScore = tenureCount > 0 ? totalWeightedTenureScore / tenureCount : 50;
  const tenureFactor: LoanHealthFactor = {
    label: 'Tenure Manageability',
    score: tenureScore,
    weight: 0.15,
    detail: tenureScore >= 70
      ? 'Loan tenure is manageable'
      : 'Long tenure — consider increasing EMI to reduce it',
  };

  // ── Final Score ───────────────────────────────────────────
  const factors = [overdueFactor, dtiFactor, progressFactor, prepaymentFactor, tenureFactor];
  const rawScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const score = Math.round(rawScore);

  const grade: LoanHealthScore['grade'] =
    score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';

  const labelMap = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Needs Attention', F: 'Critical' };
  const colorMap = {
    A: 'var(--apple-green)',
    B: 'var(--apple-blue)',
    C: 'var(--apple-orange)',
    D: 'var(--apple-red)',
    F: 'var(--apple-red)',
  };

  // ── Suggestions ──────────────────────────────────────────
  const suggestions: string[] = [];

  if (overdueCount > 0) {
    suggestions.push('Set up auto-debit to avoid missing EMI payments.');
  }

  if (dti > 30 && monthlyIncome > 0) {
    suggestions.push(
      `Your EMIs use ${dti.toFixed(0)}% of your income. Aim to keep this below 30% for financial stability.`,
    );
  }

  if (!hasPrepayments && totalPayments > 6) {
    const anyLoan = activeLoans[0];
    if (anyLoan?.emi_amount) {
      const extra = Math.round(Number(anyLoan.emi_amount) * 0.2);
      suggestions.push(
        `Paying ₹${extra.toLocaleString('en-IN')} extra monthly could significantly reduce your total interest.`,
      );
    }
  }

  if (tenureScore < 50) {
    suggestions.push('Increasing your EMI by ₹2,000/month or 10% annually can shorten your debt timeline by years.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Your loan management is on track. Consider prepayments when you have surplus funds.');
  }

  return { score, grade, label: labelMap[grade], color: colorMap[grade], factors, suggestions };
}
