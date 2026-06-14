'use client';

import React from 'react';
import { Info, AlertCircle, CheckCircle2, TrendingDown, Zap, Clock } from 'lucide-react';
import type { UserLoan } from '@/types/loan.types';
import { getEducationLoanPhase } from '@/lib/loans/education-loan-calculator';
import { calculateEMI } from '@/lib/loans/emi-calculator';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';

interface LoanHealthInsightsProps {
  loans: UserLoan[];
  monthlyIncome: number;
}

type InsightType = 'info' | 'warning' | 'success' | 'tip';

interface Insight {
  text: string;
  type: InsightType;
  icon: React.ElementType;
}

const insightStyles: Record<InsightType, { bg: string; text: string; iconColor: string }> = {
  warning: {
    bg: 'bg-[rgba(255,59,48,0.06)]',
    text: 'text-[var(--apple-red)]',
    iconColor: 'text-[var(--apple-red)]',
  },
  success: {
    bg: 'bg-[rgba(52,199,89,0.06)]',
    text: 'text-[var(--apple-green)]',
    iconColor: 'text-[var(--apple-green)]',
  },
  info: {
    bg: 'bg-[rgba(0,122,255,0.06)]',
    text: 'text-[var(--apple-blue)]',
    iconColor: 'text-[var(--apple-blue)]',
  },
  tip: {
    bg: 'bg-[rgba(175,82,222,0.06)]',
    text: 'text-[var(--apple-purple)]',
    iconColor: 'text-[var(--apple-purple)]',
  },
};

export function LoanHealthInsights({
  loans,
  monthlyIncome,
}: LoanHealthInsightsProps) {
  if (loans.length === 0) return null;

  const activeLoans = loans.filter((l) => l.status === 'active');
  const insights: Insight[] = [];

  // ── Compute Monthly EMI for active, non-moratorium loans ─
  let totalMonthlyEMI = 0;

  for (const loan of activeLoans) {
    if (loan.loan_type === 'education' || loan.interest_type === 'hybrid') {
      const phase = getEducationLoanPhase(loan);
      if (phase.phase === 'repayment') {
        const emi = Number(loan.emi_amount) || calculateEMI(
          phase.outstandingAtEmiStart,
          Number(loan.ci_rate ?? loan.interest_rate),
          Number(loan.loan_tenure_months ?? 120),
        );
        totalMonthlyEMI += emi;
      }
    } else {
      const emi = Number(loan.emi_amount) || calculateEMI(
        Number(loan.current_outstanding),
        Number(loan.interest_rate),
        Number(loan.loan_tenure_months ?? 120),
      );
      totalMonthlyEMI += emi;
    }
  }

  const dtiRatio = monthlyIncome > 0 ? (totalMonthlyEMI / monthlyIncome) * 100 : 0;

  // ── Insight 1: DTI Ratio ──────────────────────────────────
  if (monthlyIncome > 0 && totalMonthlyEMI > 0) {
    if (dtiRatio > 50) {
      insights.push({
        text: `Your EMIs consume ${dtiRatio.toFixed(1)}% of your monthly income. This is very high — consider consolidating or restructuring debt.`,
        type: 'warning',
        icon: AlertCircle,
      });
    } else if (dtiRatio > 30) {
      insights.push({
        text: `Your EMIs use ${dtiRatio.toFixed(1)}% of monthly income. Aim to keep this below 30% for healthy finances.`,
        type: 'info',
        icon: Info,
      });
    } else {
      insights.push({
        text: `Your Debt-to-Income ratio is a healthy ${dtiRatio.toFixed(1)}%. You have good financial flexibility.`,
        type: 'success',
        icon: CheckCircle2,
      });
    }
  }

  // ── Insight 2: Moratorium loans ───────────────────────────
  const moratoriumLoans = activeLoans.filter((l) => {
    if (l.loan_type === 'education' || l.interest_type === 'hybrid') {
      return getEducationLoanPhase(l).phase === 'moratorium';
    }
    return false;
  });

  for (const loan of moratoriumLoans) {
    const monthlySI = Number(loan.current_outstanding) * (Number(loan.moratorium_si_rate ?? loan.interest_rate) / 100 / 12);
    insights.push({
      text: `${loan.loan_name} is in moratorium. ₹${Math.round(monthlySI).toLocaleString('en-IN')} of interest is accruing each month. Consider paying this now to avoid it capitalizing.`,
      type: 'info',
      icon: Clock,
    });
  }

  // ── Insight 3: Prepayment opportunities ──────────────────
  const highInterestLoans = activeLoans
    .filter((l) => Number(l.interest_rate) > 10)
    .sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate));

  if (highInterestLoans.length > 0 && monthlyIncome > 0) {
    const loan = highInterestLoans[0];
    const extraPayment = Math.round(monthlyIncome * 0.05);
    const currentOutstanding = Number(loan.current_outstanding);
    const rate = Number(loan.ci_rate ?? loan.interest_rate);
    const tenure = Number(loan.loan_tenure_months ?? 120);
    const baseEmi = Number(loan.emi_amount) || calculateEMI(currentOutstanding, rate, tenure);
    const newEmi = baseEmi + extraPayment;

    // Rough interest saved estimate
    const r = rate / 12 / 100;
    const baseMonths = r > 0
      ? Math.log(baseEmi / (baseEmi - r * currentOutstanding)) / Math.log(1 + r)
      : tenure;
    const newMonths = r > 0
      ? Math.log(newEmi / (newEmi - r * currentOutstanding)) / Math.log(1 + r)
      : tenure;
    const monthsSaved = Math.max(0, Math.round(baseMonths - newMonths));
    const interestSaved = Math.round((baseMonths - newMonths) * baseEmi * 0.4);

    if (monthsSaved > 3 && interestSaved > 5000) {
      insights.push({
        text: `Paying ₹${extraPayment.toLocaleString('en-IN')} extra/month on ${loan.loan_name} (just 5% of income) could save ~${formatCurrency(interestSaved)} in interest.`,
        type: 'tip',
        icon: Zap,
      });
    }
  }

  // ── Insight 4: EMI as % of income ────────────────────────
  if (monthlyIncome > 0 && totalMonthlyEMI > 0 && dtiRatio > 0 && dtiRatio <= 30) {
    const annualStepUp = Math.round(totalMonthlyEMI * 0.1);
    insights.push({
      text: `Your EMI is only ${dtiRatio.toFixed(1)}% of income. Increasing it by 10% (₹${annualStepUp.toLocaleString('en-IN')}/year) could cut years off your loan tenure.`,
      type: 'tip',
      icon: TrendingDown,
    });
  }

  // ── Insight 5: Closed loans ───────────────────────────────
  const closedCount = loans.filter((l) => l.status === 'closed').length;
  if (closedCount > 0) {
    insights.push({
      text: `You've fully repaid ${closedCount} loan${closedCount > 1 ? 's' : ''}. Consider redirecting those payments toward an emergency fund or investments.`,
      type: 'success',
      icon: CheckCircle2,
    });
  }

  // ── Fallback ──────────────────────────────────────────────
  if (insights.length === 0) {
    insights.push({
      text: 'Your loan portfolio looks manageable. Keep making timely payments to maintain your financial health.',
      type: 'success',
      icon: CheckCircle2,
    });
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight, idx) => {
        const Icon = insight.icon;
        const style = insightStyles[insight.type];
        return (
          <div
            key={idx}
            className={cn(
              'flex items-start gap-3 rounded-2xl border border-transparent p-4 transition-all',
              style.bg,
            )}
          >
            <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', style.iconColor)} />
            <p className={cn('text-[13px] font-medium leading-relaxed', style.text)}>
              {insight.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
