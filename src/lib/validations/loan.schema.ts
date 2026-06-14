// ============================================================
// LOAN VALIDATION SCHEMAS — Zod
// ============================================================

import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');
const positiveNumber = z.coerce.number().positive('Must be a positive number');
const nonNegNumber = z.coerce.number().min(0, 'Must be 0 or greater');

// ────────────────────────────────────────────────────────────
// Create Loan
// ────────────────────────────────────────────────────────────

export const createLoanSchemaBase = z.object({
  loan_name: z.string().min(1, 'Loan name is required').max(120),
  lender_name: z.string().min(1, 'Lender name is required').max(120),
  loan_type: z.enum(['education', 'personal', 'home', 'vehicle', 'custom']),
  original_principal: positiveNumber,
  current_outstanding: nonNegNumber.optional(),
  interest_type: z.enum(['simple', 'compound', 'hybrid']),
  interest_rate: z.coerce.number().min(0).max(100, 'Rate must be ≤ 100%'),
  loan_start_date: dateString,
  loan_end_date: dateString.optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),

  // Moratorium (required for hybrid / education)
  moratorium_course_start: dateString.optional().or(z.literal('')),
  moratorium_course_end: dateString.optional().or(z.literal('')),
  grace_period_months: z.coerce.number().min(0).max(60).optional(),
  moratorium_si_rate: z.coerce.number().min(0).max(100).optional(),
  moratorium_end_date: dateString.optional().or(z.literal('')),

  // Repayment / EMI
  emi_start_date: dateString.optional().or(z.literal('')),
  emi_amount: z.coerce.number().min(0).optional(),
  bank_emi_amount: z.coerce.number().min(0).optional(),
  loan_tenure_months: z.coerce.number().min(1, 'Tenure must be at least 1 month').max(600).optional(),
  ci_rate: z.coerce.number().min(0).max(100).optional(),
  compounding_frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  outstanding_as_of_date: dateString.optional().or(z.literal('')),
  disbursements: z.array(z.object({
    id: z.string().optional(),
    date: dateString,
    amount: positiveNumber,
    description: z.string().max(120).optional().or(z.literal('')),
  })).optional().default([]),
});

export const createLoanSchema = createLoanSchemaBase
  // Course end required for education/hybrid loans
  .refine(
    (data) => {
      if (data.interest_type === 'hybrid' || data.loan_type === 'education') {
        return !!data.moratorium_course_end;
      }
      return true;
    },
    { message: 'Course end date is required for education/hybrid loans', path: ['moratorium_course_end'] },
  )
  // SI rate should be provided for education loans (soft warning — default to interest_rate)
  .refine(
    (data) => {
      if ((data.interest_type === 'hybrid' || data.loan_type === 'education') && !data.moratorium_si_rate) {
        return data.interest_rate > 0; // at least have a fallback rate
      }
      return true;
    },
    { message: 'Please provide an interest rate for the moratorium period', path: ['moratorium_si_rate'] },
  )
  // EMI start must be after loan start
  .refine(
    (data) => {
      if (data.emi_start_date && data.loan_start_date) {
        return data.emi_start_date >= data.loan_start_date;
      }
      return true;
    },
    { message: 'EMI start date must be after loan start date', path: ['emi_start_date'] },
  )
  // EMI start must be on or after moratorium end
  .refine(
    (data) => {
      if (data.emi_start_date && data.moratorium_end_date) {
        return data.emi_start_date >= data.moratorium_end_date;
      }
      return true;
    },
    { message: 'EMI start date must be on or after moratorium end date', path: ['emi_start_date'] },
  )
  // Tenure is required when loan type needs EMI calculation
  .refine(
    (data) => {
      // For compound/hybrid loans without an explicit EMI amount, tenure is needed
      if (data.interest_type !== 'simple' && !data.emi_amount) {
        return !!data.loan_tenure_months && data.loan_tenure_months >= 1;
      }
      return true;
    },
    { message: 'Loan tenure (months) is required to calculate EMI', path: ['loan_tenure_months'] },
  );

export type CreateLoanInput = z.infer<typeof createLoanSchema>;

// ────────────────────────────────────────────────────────────
// Update Loan
// ────────────────────────────────────────────────────────────

export const updateLoanSchema = createLoanSchemaBase.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['active', 'closed', 'defaulted']).optional(),
  current_outstanding: nonNegNumber.optional(),
  outstanding_as_of_date: dateString.optional().or(z.literal('')),
  accrued_interest: nonNegNumber.optional(),
  total_interest_paid: nonNegNumber.optional(),
  total_principal_paid: nonNegNumber.optional(),
  bank_emi_amount: z.coerce.number().min(0).optional(),
  disbursements: z.array(z.object({
    id: z.string().optional(),
    date: dateString,
    amount: positiveNumber,
    description: z.string().max(120).optional().or(z.literal('')),
  })).optional(),
});

export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;

// ────────────────────────────────────────────────────────────
// Add Payment
// ────────────────────────────────────────────────────────────

export const addPaymentSchema = z.object({
  loan_id: z.string().uuid('Invalid loan ID'),
  payment_date: dateString,
  amount: positiveNumber,
  payment_type: z.enum(['emi', 'interest', 'prepayment', 'lump_sum']),
  note: z.string().max(300).optional().or(z.literal('')),
});

export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
