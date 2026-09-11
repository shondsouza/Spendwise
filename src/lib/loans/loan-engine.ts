/**
 * Unified Loan Calculation Engine
 *
 * Single source of truth for all loan-related calculations.
 * Handles:
 * - Simple Interest (for moratorium periods)
 * - Compound Interest
 * - EMI (Equated Monthly Installment)
 * - Amortization schedules
 * - Loan health scoring
 *
 * All calculations use Decimal.js for precision with financial data.
 */

import Decimal from "decimal.js-light";

// Configure Decimal for financial calculations
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

export interface AmortizationEntry {
  month: number;
  date: Date;
  beginningBalance: Decimal;
  emiPayment: Decimal;
  principalPaid: Decimal;
  interestPaid: Decimal;
  endingBalance: Decimal;
}

export interface LoanHealthMetrics {
  score: number; // 0-100
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  daysOverdue: number;
  paymentHistory: number; // percentage of on-time payments
  utilizationRate: number; // outstanding / principal
  recommendation: string;
}

export interface LoanProjection {
  totalInterestAccrued: Decimal;
  totalAmountDue: Decimal;
  remainingTenure: number;
  earlyPayoffDate?: Date;
  projectedCompletionDate: Date;
}

export class LoanCalculationEngine {
  /**
   * Calculate EMI (Equated Monthly Installment)
   *
   * Formula: EMI = P * [r(1+r)^n] / [(1+r)^n - 1]
   * Where:
   * - P = Principal amount
   * - r = Monthly interest rate (annual rate / 12 / 100)
   * - n = Number of months
   */
  static calculateEMI(
    principal: number | Decimal,
    annualRate: number | Decimal,
    tenureMonths: number
  ): Decimal {
    const P = new Decimal(principal);
    const r = new Decimal(annualRate).div(12).div(100);
    const n = new Decimal(tenureMonths);

    if (r.isZero()) {
      // If no interest, simple division
      return P.div(n);
    }

    const numerator = r.mul(r.plus(1).pow(n));
    const denominator = r.plus(1).pow(n).minus(1);

    return P.mul(numerator).div(denominator);
  }

  /**
   * Calculate Simple Interest
   *
   * Formula: SI = (P * R * T) / 100
   * Where:
   * - P = Principal
   * - R = Annual rate
   * - T = Time in years
   */
  static calculateSimpleInterest(
    principal: number | Decimal,
    annualRate: number | Decimal,
    years: number | Decimal
  ): Decimal {
    const P = new Decimal(principal);
    const R = new Decimal(annualRate);
    const T = new Decimal(years);

    return P.mul(R).mul(T).div(100);
  }

  /**
   * Calculate Compound Interest
   *
   * Formula: A = P(1 + r/n)^(nt)
   * Interest = A - P
   */
  static calculateCompoundInterest(
    principal: number | Decimal,
    annualRate: number | Decimal,
    years: number | Decimal,
    compoundingPeriodsPerYear: number = 12 // monthly
  ): Decimal {
    const P = new Decimal(principal);
    const r = new Decimal(annualRate).div(100);
    const t = new Decimal(years);
    const n = new Decimal(compoundingPeriodsPerYear);

    const amount = P.mul(r.div(n).plus(1).pow(n.mul(t)));
    return amount.minus(P);
  }

  /**
   * Generate full amortization schedule
   */
  static generateAmortizationSchedule(
    principal: number | Decimal,
    annualRate: number | Decimal,
    tenureMonths: number,
    startDate: Date = new Date()
  ): AmortizationEntry[] {
    const emi = this.calculateEMI(principal, annualRate, tenureMonths);
    const monthlyRate = new Decimal(annualRate).div(12).div(100);
    const schedule: AmortizationEntry[] = [];

    let balance = new Decimal(principal);
    let currentDate = new Date(startDate);

    for (let month = 1; month <= tenureMonths; month++) {
      const beginningBalance = balance;
      const interestPayment = balance.mul(monthlyRate);
      const principalPayment = emi.minus(interestPayment);
      const endingBalance = balance.minus(principalPayment);

      schedule.push({
        month,
        date: new Date(currentDate),
        beginningBalance,
        emiPayment: emi,
        principalPaid: principalPayment,
        interestPaid: interestPayment,
        endingBalance: endingBalance.isNegative() ? new Decimal(0) : endingBalance,
      });

      balance = endingBalance.isNegative() ? new Decimal(0) : endingBalance;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return schedule;
  }

  /**
   * Calculate interest accrued between two dates
   */
  static calculateAccruedInterest(
    outstandingBalance: number | Decimal,
    annualRate: number | Decimal,
    startDate: Date,
    endDate: Date
  ): Decimal {
    const balance = new Decimal(outstandingBalance);
    const dailyRate = new Decimal(annualRate).div(365).div(100);
    const daysElapsed = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return balance.mul(dailyRate).mul(daysElapsed);
  }

  /**
   * Calculate remaining balance after specific payment
   */
  static calculateRemainingBalance(
    originalPrincipal: number | Decimal,
    annualRate: number | Decimal,
    totalMonths: number,
    monthsElapsed: number
  ): Decimal {
    const schedule = this.generateAmortizationSchedule(originalPrincipal, annualRate, totalMonths);

    if (monthsElapsed >= schedule.length) {
      return new Decimal(0);
    }

    return schedule[monthsElapsed].endingBalance;
  }

  /**
   * Calculate tenure remaining (in months)
   */
  static calculateRemainingTenure(
    outstandingBalance: number | Decimal,
    emi: number | Decimal,
    annualRate: number | Decimal
  ): number {
    const balance = new Decimal(outstandingBalance);
    const payment = new Decimal(emi);
    const monthlyRate = new Decimal(annualRate).div(12).div(100);

    if (payment.lessThanOrEqualTo(balance.mul(monthlyRate))) {
      return -1; // EMI insufficient to cover interest
    }

    // Using logarithm formula for tenure calculation
    // n = -log(1 - (r * P / EMI)) / log(1 + r)
    const rateComponent = new Decimal(1).minus(monthlyRate.mul(balance).div(payment));

    if (rateComponent.isNegative() || rateComponent.isZero()) {
      return -1;
    }

    const numerator = rateComponent.ln().negated();
    const denominator = new Decimal(1).plus(monthlyRate).ln();

    return Math.ceil(numerator.div(denominator).toNumber());
  }

  /**
   * Calculate health score for a loan
   */
  static calculateHealthScore(loanData: {
    daysOverdue: number;
    onTimePaymentPercentage: number;
    outstandingBalance: number | Decimal;
    totalPrincipal: number | Decimal;
    monthsRemaining: number;
  }): LoanHealthMetrics {
    let score = 100;
    let status: "excellent" | "good" | "fair" | "poor" | "critical" = "excellent";
    let recommendation = "Keep up the great work!";

    const {
      daysOverdue,
      onTimePaymentPercentage,
      outstandingBalance,
      totalPrincipal,
    } = loanData;

    // Deduct points for overdue payments
    if (daysOverdue > 0 && daysOverdue <= 30) score -= 10;
    else if (daysOverdue > 30 && daysOverdue <= 90) score -= 25;
    else if (daysOverdue > 90) score -= 40;

    // Deduct points for payment history
    if (onTimePaymentPercentage < 100) score -= (100 - onTimePaymentPercentage) * 0.3;

    // Calculate utilization rate
    const utilizationRate = new Decimal(outstandingBalance)
      .div(new Decimal(totalPrincipal))
      .times(100)
      .toNumber();

    // Deduct points for high utilization
    if (utilizationRate > 80) score -= 15;
    else if (utilizationRate > 50) score -= 5;

    // Determine status
    if (score >= 90) {
      status = "excellent";
      recommendation = "Excellent! Your loan is in great shape.";
    } else if (score >= 75) {
      status = "good";
      recommendation = "Good progress. Keep making timely payments.";
    } else if (score >= 60) {
      status = "fair";
      recommendation = "Your loan needs attention. Try to catch up on payments.";
    } else if (score >= 40) {
      status = "poor";
      recommendation = "Consider prioritizing this loan repayment.";
    } else {
      status = "critical";
      recommendation = "URGENT: Contact your lender to discuss payment options.";
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      status,
      daysOverdue,
      paymentHistory: onTimePaymentPercentage,
      utilizationRate,
      recommendation,
    };
  }

  /**
   * Project loan payoff date and total interest
   */
  static projectLoanPayoff(
    outstandingBalance: number | Decimal,
    monthlyPayment: number | Decimal,
    annualRate: number | Decimal,
    currentDate: Date = new Date()
  ): LoanProjection {
    let balance = new Decimal(outstandingBalance);
    const payment = new Decimal(monthlyPayment);
    const monthlyRate = new Decimal(annualRate).div(12).div(100);

    let monthCount = 0;
    let totalInterest = new Decimal(0);
    const maxMonths = 1200; // Safety limit (100 years)

    while (balance.greaterThan(0) && monthCount < maxMonths) {
      const interestCharge = balance.mul(monthlyRate);
      const principalPayment = payment.minus(interestCharge);

      if (principalPayment.lessThanOrEqualTo(0)) {
        // Payment doesn't cover interest
        return {
          totalInterestAccrued: totalInterest,
          totalAmountDue: balance.plus(totalInterest),
          remainingTenure: -1,
          projectedCompletionDate: new Date(currentDate),
          earlyPayoffDate: undefined,
        };
      }

      totalInterest = totalInterest.plus(interestCharge);
      balance = balance.minus(principalPayment);
      monthCount++;
    }

    const projectedDate = new Date(currentDate);
    projectedDate.setMonth(projectedDate.getMonth() + monthCount);

    return {
      totalInterestAccrued: totalInterest,
      totalAmountDue: totalInterest,
      remainingTenure: monthCount,
      projectedCompletionDate: projectedDate,
      earlyPayoffDate: monthCount < maxMonths ? projectedDate : undefined,
    };
  }
}

export default LoanCalculationEngine;
