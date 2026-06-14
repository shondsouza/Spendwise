// ============================================================
// LOAN MANAGEMENT — TypeScript Types & Enums
// ============================================================

export type LoanType = 'education' | 'personal' | 'home' | 'vehicle' | 'custom';

export type InterestType = 'simple' | 'compound' | 'hybrid';

export type PaymentType = 'emi' | 'interest' | 'prepayment' | 'lump_sum';

export type CompoundingFrequency = 'monthly' | 'quarterly' | 'yearly';

export type LoanStatus = 'active' | 'closed' | 'defaulted';

export type LoanPhase = 'moratorium' | 'repayment' | 'completed' | 'not_started';

export interface Disbursement {
  id?: string;
  date: string;
  amount: number;
  description?: string;
}

// ────────────────────────────────────────────────────────────
// Core DB Records
// ────────────────────────────────────────────────────────────

export interface UserLoan {
  id: string;
  user_id: string;

  // Basic
  loan_name: string;
  lender_name: string;
  loan_type: LoanType;

  // Principal tracking
  original_principal: number;
  current_outstanding: number;
  outstanding_as_of_date: string | null; // date when current_outstanding was last manually set
  accrued_interest: number;
  total_interest_paid: number;
  total_principal_paid: number;
  bank_emi_amount: number | null; // Bank-stated EMI (may differ from calculated)

  // Interest config
  interest_type: InterestType;
  interest_rate: number; // annual %

  // Dates
  loan_start_date: string; // ISO date
  loan_end_date: string | null;

  // Moratorium (education / hybrid)
  moratorium_course_start: string | null;
  moratorium_course_end: string | null;
  grace_period_months: number | null;
  moratorium_si_rate: number | null;
  moratorium_end_date: string | null;

  // Repayment / EMI
  emi_start_date: string | null;
  emi_amount: number | null;
  loan_tenure_months: number | null;
  ci_rate: number | null;
  compounding_frequency: CompoundingFrequency | null;

  // Meta
  status: LoanStatus;
  notes: string | null;
  disbursements: Disbursement[] | null;
  created_at: string;
  updated_at: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  user_id: string;

  payment_date: string;
  amount: number;
  payment_type: PaymentType;

  principal_component: number;
  interest_component: number;
  balance_after: number;

  note: string | null;
  created_at: string;
}

export interface LoanSnapshot {
  id: string;
  loan_id: string;
  user_id: string;

  snapshot_date: string;
  outstanding_balance: number;
  total_interest_paid: number;
  total_principal_paid: number;

  created_at: string;
}

// ────────────────────────────────────────────────────────────
// Computed / Derived Types
// ────────────────────────────────────────────────────────────

export interface LoanBalance {
  originalPrincipal: number;
  currentOutstanding: number;
  accruedInterest: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  remainingBalance: number;
  repaymentPercent: number; // 0–100
  phase: LoanPhase;
  phaseLabel: string;
  nextEmiDate: string | null;
  nextEmiAmount: number | null;
  estimatedPayoffDate: string | null;
  remainingTenureMonths: number | null;
  // Phase 4 additions
  projectedOutstandingAtEmiStart: number | null;
  moratoriumTimeRemaining: string | null; // e.g. "1 Year 3 Months"
  // Phase 5 additions
  calculatedEmi: number | null;
  emiDifferencePercent: number | null;
}

export interface EMIScheduleRow {
  month: number;
  date: string;
  openingBalance: number;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  closingBalance: number;
  totalInterestPaid: number;
  isPaid?: boolean;
  paymentId?: string;
}

// ────────────────────────────────────────────────────────────
// Scenario Simulator
// ────────────────────────────────────────────────────────────

export type ScenarioType = 'fixed_increase' | 'yearly_stepup' | 'one_time_prepayment';

export interface SimulatorInputs {
  scenarioType: ScenarioType;
  fixedExtraMonthly?: number;    // for fixed_increase
  yearlyStepUpAmount?: number;   // for yearly_stepup
  prepaymentAmount?: number;     // for one_time_prepayment
  prepaymentDate?: string;       // for one_time_prepayment
  prepaymentAtMonth?: number;    // which EMI month to apply prepayment
  reduceTenure?: boolean;        // true = reduce tenure, false = reduce EMI
}

export interface LoanProjection {
  scenarioLabel: string;
  originalPayoffDate: string;
  newPayoffDate: string;
  monthsSaved: number;
  totalInterestOriginal: number;
  totalInterestNew: number;
  interestSaved: number;
  totalRepaymentOriginal: number;
  totalRepaymentNew: number;
  amountSaved: number;
  scheduleRows: EMIScheduleRow[];
  baseScheduleRows?: EMIScheduleRow[];  // Original (baseline) schedule for comparison
}

// ────────────────────────────────────────────────────────────
// Loan Health Score
// ────────────────────────────────────────────────────────────

export interface LoanHealthScore {
  score: number;           // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;           // e.g. "Good"
  color: string;           // CSS var
  factors: LoanHealthFactor[];
  suggestions: string[];
}

export interface LoanHealthFactor {
  label: string;
  score: number;           // 0–100 contribution
  weight: number;          // 0–1 weight
  detail: string;
}

// ────────────────────────────────────────────────────────────
// Debt Freedom Scenarios
// ────────────────────────────────────────────────────────────

export interface DebtFreeScenario {
  label: string;
  description: string;
  payoffDate: string;
  monthsSaved: number;
  interestSaved: number;
  monthlyPayment: number;
}

// ────────────────────────────────────────────────────────────
// Form Types
// ────────────────────────────────────────────────────────────

export interface CreateLoanFormData {
  loan_name: string;
  lender_name: string;
  loan_type: LoanType;
  original_principal: number;
  current_outstanding?: number;
  interest_type: InterestType;
  interest_rate: number;
  loan_start_date: string;
  loan_end_date?: string;
  notes?: string;

  // Moratorium fields (education / hybrid)
  moratorium_course_start?: string;
  moratorium_course_end?: string;
  grace_period_months?: number;
  moratorium_si_rate?: number;

  // Repayment fields
  emi_start_date?: string;
  emi_amount?: number;
  loan_tenure_months?: number;
  ci_rate?: number;
  compounding_frequency?: CompoundingFrequency;
  disbursements?: Disbursement[];
}

export interface AddPaymentFormData {
  loan_id: string;
  payment_date: string;
  amount: number;
  payment_type: PaymentType;
  note?: string;
}

// ────────────────────────────────────────────────────────────
// Loan Type Display Config
// ────────────────────────────────────────────────────────────

export interface LoanTypeConfig {
  type: LoanType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

export const LOAN_TYPE_CONFIG: Record<LoanType, LoanTypeConfig> = {
  education: {
    type: 'education',
    label: 'Education Loan',
    emoji: '🎓',
    color: 'var(--apple-blue)',
    bgColor: 'rgba(0,122,255,0.12)',
    description: 'With moratorium period support',
  },
  personal: {
    type: 'personal',
    label: 'Personal Loan',
    emoji: '👤',
    color: 'var(--apple-purple)',
    bgColor: 'rgba(175,82,222,0.12)',
    description: 'General purpose loan',
  },
  home: {
    type: 'home',
    label: 'Home Loan',
    emoji: '🏠',
    color: 'var(--apple-green)',
    bgColor: 'rgba(52,199,89,0.12)',
    description: 'Housing finance',
  },
  vehicle: {
    type: 'vehicle',
    label: 'Vehicle Loan',
    emoji: '🚗',
    color: 'var(--apple-orange)',
    bgColor: 'rgba(255,149,0,0.12)',
    description: 'Car / bike finance',
  },
  custom: {
    type: 'custom',
    label: 'Custom Loan',
    emoji: '📋',
    color: 'var(--text-secondary)',
    bgColor: 'rgba(120,120,128,0.12)',
    description: 'Other loan type',
  },
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  emi: 'EMI Payment',
  interest: 'Interest Payment',
  prepayment: 'Prepayment',
  lump_sum: 'Lump Sum',
};

export const COMPOUNDING_FREQ_VALUES: Record<CompoundingFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};
