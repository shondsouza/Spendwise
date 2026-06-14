'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createLoanSchema, updateLoanSchema, addPaymentSchema } from '@/lib/validations/loan.schema';
import type { UserLoan, LoanPayment, LoanSnapshot } from '@/types/loan.types';
import { computeMoratoriumEndDate, calculateMoratoriumOutstanding } from '@/lib/loans/education-loan-calculator';
import { calculateEMI, splitPayment } from '@/lib/loans/emi-calculator';
import { format, parseISO } from 'date-fns';

// ────────────────────────────────────────────────────────────
// READ
// ────────────────────────────────────────────────────────────

export async function getLoans(): Promise<{ data: UserLoan[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('user_loans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as UserLoan[], error: null };
}

export async function getLoanById(id: string): Promise<{ data: UserLoan | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('user_loans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as UserLoan, error: null };
}

// ────────────────────────────────────────────────────────────
// CREATE
// ────────────────────────────────────────────────────────────

export async function createLoan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const raw = Object.fromEntries(formData);
  // Disbursements come in as JSON string
  if (typeof raw.disbursements === 'string' && raw.disbursements.startsWith('[')) {
    try {
      raw.disbursements = JSON.parse(raw.disbursements);
    } catch {
      raw.disbursements = [];
    }
  }
  const parsed = createLoanSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const d = parsed.data;

  // ── Step 1: Compute moratorium end date ──────────────────
  let moratoriumEndDate = d.moratorium_end_date || null;
  if (!moratoriumEndDate && d.moratorium_course_end) {
    const computed = computeMoratoriumEndDate(
      d.moratorium_course_end,
      d.grace_period_months ?? 6,
    );
    moratoriumEndDate = format(computed, 'yyyy-MM-dd');
  }

  // ── Step 2: Compute outstanding ──────────────────────────
  //
  // Rules (in priority order):
  //
  // A. User explicitly supplied current_outstanding (from a bank statement):
  //    → Store it as-is with outstanding_as_of_date = today (or user-supplied date).
  //    → The engine will project this forward to moratorium_end when needed.
  //    → Do NOT overwrite with a re-derived value.
  //
  // B. Education/hybrid loan with disbursements:
  //    → Store original_principal as current_outstanding (live value).
  //    → The engine will compute the correct per-tranche SI at display time.
  //    → outstanding_as_of_date = null (means: derive dynamically).
  //
  // C. Non-education loan: current_outstanding = original_principal.
  //
  // We intentionally do NOT pre-compute and store the moratorium-end projection
  // as current_outstanding anymore — that was the root cause of the ₹721,281 bug.

  let currentOutstanding: number;
  let outstandingAsOfDate: string | null = null;
  let accruedInterest = 0;

  const isEduLoan = d.interest_type === 'hybrid' || d.loan_type === 'education';

  if (isEduLoan) {
    if (d.current_outstanding !== undefined && d.current_outstanding > 0) {
      // User supplied a bank-statement value — trust it
      currentOutstanding = d.current_outstanding;
      outstandingAsOfDate = d.outstanding_as_of_date || new Date().toISOString().split('T')[0];
      accruedInterest = Math.max(0, currentOutstanding - d.original_principal);
    } else {
      // No user-supplied value — store original principal.
      // The engine will compute live SI from disbursements at display time.
      currentOutstanding = d.original_principal;
      outstandingAsOfDate = null; // signals: derive dynamically
      accruedInterest = 0;
    }
  } else {
    // Non-education loan
    currentOutstanding = d.current_outstanding !== undefined && d.current_outstanding > 0
      ? d.current_outstanding
      : d.original_principal;
    outstandingAsOfDate = d.outstanding_as_of_date || null;
    accruedInterest = Math.max(0, currentOutstanding - d.original_principal);
  }

  // ── Step 3: Auto-calculate EMI if not provided ───────────
  // For education loans the EMI base is outstandingAtMoratoriumEnd (computed by
  // the engine at display time). Here we just store what the user provided or
  // a rough estimate — the engine will refine it.
  let emiAmount = d.emi_amount ?? null;
  if (!emiAmount && d.loan_tenure_months && d.loan_tenure_months > 0 && moratoriumEndDate) {
    const rate = d.ci_rate ?? d.interest_rate;
    if (rate > 0 && isEduLoan) {
      // Build a temporary loan-like object to compute the correct EMI base
      const siRate = d.moratorium_si_rate ?? d.interest_rate;
      let emiBase: number;

      if (currentOutstanding > d.original_principal && outstandingAsOfDate) {
        // Project user-supplied outstanding to moratorium end
        const { differenceInDays: diff } = await import('date-fns');
        const asOf = new Date(outstandingAsOfDate);
        const morEnd = new Date(moratoriumEndDate);
        const days = Math.max(0, diff(morEnd, asOf));
        emiBase = currentOutstanding * (1 + (siRate / 100) * (days / 365.25));
      } else if (d.disbursements && d.disbursements.length > 0) {
        emiBase = calculateMoratoriumOutstanding(
          d.original_principal,
          d.loan_start_date,
          moratoriumEndDate,
          siRate,
          d.disbursements,
        );
      } else {
        emiBase = calculateMoratoriumOutstanding(
          d.original_principal,
          d.loan_start_date,
          moratoriumEndDate,
          siRate,
        );
      }

      emiAmount = calculateEMI(emiBase, rate, d.loan_tenure_months);
    } else if (rate > 0) {
      emiAmount = calculateEMI(currentOutstanding, rate, d.loan_tenure_months);
    } else {
      emiAmount = currentOutstanding / d.loan_tenure_months;
    }
  }

  const insertPayload = {
    user_id: user.id,
    loan_name: d.loan_name,
    lender_name: d.lender_name,
    loan_type: d.loan_type,
    original_principal: d.original_principal,
    current_outstanding: currentOutstanding,
    outstanding_as_of_date: outstandingAsOfDate,
    accrued_interest: accruedInterest,
    total_interest_paid: 0,
    total_principal_paid: 0,
    interest_type: d.interest_type,
    interest_rate: d.interest_rate,
    loan_start_date: d.loan_start_date,
    loan_end_date: d.loan_end_date || null,
    moratorium_course_start: d.moratorium_course_start || null,
    moratorium_course_end: d.moratorium_course_end || null,
    grace_period_months: d.grace_period_months ?? null,
    moratorium_si_rate: d.moratorium_si_rate ?? null,
    moratorium_end_date: moratoriumEndDate,
    emi_start_date: d.emi_start_date || null,
    emi_amount: emiAmount,
    bank_emi_amount: d.bank_emi_amount || null,
    loan_tenure_months: d.loan_tenure_months ?? null,
    ci_rate: d.ci_rate ?? null,
    compounding_frequency: d.compounding_frequency ?? 'monthly',
    status: 'active',
    notes: d.notes || null,
    disbursements: d.disbursements && d.disbursements.length > 0 ? d.disbursements : null,
  };

  const { data, error } = await supabase
    .from('user_loans')
    .insert(insertPayload)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath('/dashboard/loan');
  revalidatePath('/dashboard');
  return { data: data as UserLoan, error: null };
}

// ────────────────────────────────────────────────────────────
// UPDATE
// ────────────────────────────────────────────────────────────

export async function updateLoan(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const raw = { ...Object.fromEntries(formData), id };
  // Handle disbursements JSON
  if (typeof (raw as any).disbursements === 'string' && (raw as any).disbursements.startsWith('[')) {
    try {
      (raw as any).disbursements = JSON.parse((raw as any).disbursements);
    } catch {
      (raw as any).disbursements = [];
    }
  }
  const parsed = updateLoanSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const d = parsed.data;

  // Recompute moratorium end date if course end changed
  let moratoriumEndDate = d.moratorium_end_date || undefined;
  if (!moratoriumEndDate && d.moratorium_course_end) {
    const computed = computeMoratoriumEndDate(d.moratorium_course_end, d.grace_period_months ?? 6);
    moratoriumEndDate = format(computed, 'yyyy-MM-dd');
  }

  // Recompute outstanding and EMI if principal/rate/tenure changed
  let updates: Record<string, unknown> = { ...d, moratorium_end_date: moratoriumEndDate };
  delete updates['id'];

  // Recalculate current_outstanding for education loans if moratorium changed
  if (
    (d.interest_type === 'hybrid' || d.loan_type === 'education') &&
    moratoriumEndDate &&
    d.loan_start_date &&
    d.original_principal
  ) {
    const siRate = d.moratorium_si_rate ?? d.interest_rate ?? 0;
    const outstanding = calculateMoratoriumOutstanding(
      Number(d.original_principal),
      d.loan_start_date,
      moratoriumEndDate,
      Number(siRate),
    );
    updates.current_outstanding = outstanding;
    updates.accrued_interest = Math.max(0, outstanding - Number(d.original_principal));

    // Recalculate EMI with new base
    if (d.loan_tenure_months && d.loan_tenure_months > 0 && !d.emi_amount) {
      const ciRate = d.ci_rate ?? d.interest_rate ?? 0;
      updates.emi_amount = calculateEMI(outstanding, Number(ciRate), d.loan_tenure_months);
    }
  }

  const { id: _id, ...updateData } = updates as { id: string } & Record<string, unknown>;

  const { data, error } = await supabase
    .from('user_loans')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath('/dashboard/loan');
  revalidatePath('/dashboard');
  return { data: data as UserLoan, error: null };
}

// ────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────

export async function deleteLoan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('user_loans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/loan');
  revalidatePath('/dashboard');
  revalidatePath('/expenses');
  return { success: true, error: null };
}

// ────────────────────────────────────────────────────────────
// PAYMENTS
// ────────────────────────────────────────────────────────────

export async function getLoanPayments(loanId: string): Promise<{ data: LoanPayment[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', loanId)
    .eq('user_id', user.id)
    .order('payment_date', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: data as LoanPayment[], error: null };
}

export async function addLoanPayment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const raw = Object.fromEntries(formData);
  const parsed = addPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const d = parsed.data;

  // Fetch current loan state
  const { data: loan } = await supabase
    .from('user_loans')
    .select('*')
    .eq('id', d.loan_id)
    .eq('user_id', user.id)
    .single();

  if (!loan) return { data: null, error: 'Loan not found' };

  const currentOutstanding = Number(loan.current_outstanding ?? 0);
  const isHybridOrEdu = loan.interest_type === 'hybrid' || loan.loan_type === 'education';

  // Determine if loan is in moratorium phase
  let isInMoratorium = false;
  if (isHybridOrEdu && loan.moratorium_end_date) {
    const paymentDate = parseISO(d.payment_date);
    const morEnd = parseISO(loan.moratorium_end_date);
    isInMoratorium = paymentDate < morEnd;
  }

  // Rate to use for payment splitting
  const rate = isInMoratorium
    ? Number(loan.moratorium_si_rate ?? loan.interest_rate ?? 0)
    : Number(loan.ci_rate ?? loan.interest_rate ?? 0);

  // Split payment into principal + interest components
  const { principal, interest } = splitPayment(
    d.amount,
    currentOutstanding,
    rate,
    isInMoratorium,
  );

  // During moratorium, paying interest does NOT reduce principal
  // During repayment, each payment reduces the outstanding balance
  const newOutstanding = isInMoratorium
    ? currentOutstanding  // moratorium: no principal reduction
    : Math.max(0, currentOutstanding - principal);

  const newTotalInterestPaid = Number(loan.total_interest_paid ?? 0) + interest;
  const newTotalPrincipalPaid = Number(loan.total_principal_paid ?? 0) + principal;

  // Insert payment record
  const { data: payment, error: payErr } = await supabase
    .from('loan_payments')
    .insert({
      loan_id: d.loan_id,
      user_id: user.id,
      payment_date: d.payment_date,
      amount: d.amount,
      payment_type: d.payment_type,
      principal_component: principal,
      interest_component: interest,
      balance_after: newOutstanding,
      note: d.note || null,
    })
    .select()
    .single();

  if (payErr) return { data: null, error: payErr.message };

  // Update loan totals
  const { error: updateErr } = await supabase
    .from('user_loans')
    .update({
      current_outstanding: newOutstanding,
      total_interest_paid: newTotalInterestPaid,
      total_principal_paid: newTotalPrincipalPaid,
      status: newOutstanding <= 0 ? 'closed' : 'active',
    })
    .eq('id', d.loan_id)
    .eq('user_id', user.id);

  if (updateErr) return { data: null, error: updateErr.message };

  // Sync to Expenses for budget tracking
  await supabase.from('expenses').insert({
    user_id: user.id,
    title: `Loan Payment: ${loan.loan_name}`,
    amount: d.amount,
    category: 'Debt Repayment',
    date: d.payment_date,
    payment_method: 'bank_transfer',
    notes: `loan_payment_id:${payment.id}`,
  });

  revalidatePath('/dashboard/loan');
  revalidatePath('/dashboard');
  revalidatePath('/expenses');
  return { data: payment as LoanPayment, error: null };
}

export async function deleteLoanPayment(paymentId: string, loanId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Fetch payment details first
  const { data: payment } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .single();

  if (!payment) return { success: false, error: 'Payment not found' };

  // Reverse the payment on the loan
  const { data: loan } = await supabase
    .from('user_loans')
    .select('*')
    .eq('id', loanId)
    .eq('user_id', user.id)
    .single();

  if (loan) {
    const restoredOutstanding = Number(loan.current_outstanding) + Number(payment.principal_component);
    await supabase
      .from('user_loans')
      .update({
        current_outstanding: restoredOutstanding,
        total_interest_paid: Math.max(0, Number(loan.total_interest_paid) - Number(payment.interest_component)),
        total_principal_paid: Math.max(0, Number(loan.total_principal_paid) - Number(payment.principal_component)),
        status: restoredOutstanding > 0 ? 'active' : 'closed',
      })
      .eq('id', loanId)
      .eq('user_id', user.id);
  }

  // Delete associated expense if it exists
  await supabase
    .from('expenses')
    .delete()
    .eq('user_id', user.id)
    .like('notes', `%loan_payment_id:${paymentId}%`);

  const { error } = await supabase
    .from('loan_payments')
    .delete()
    .eq('id', paymentId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/loan');
  return { success: true, error: null };
}

// ────────────────────────────────────────────────────────────
// SNAPSHOTS (for charts)
// ────────────────────────────────────────────────────────────

export async function getLoanSnapshots(loanId: string): Promise<{ data: LoanSnapshot[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('loan_snapshots')
    .select('*')
    .eq('loan_id', loanId)
    .eq('user_id', user.id)
    .order('snapshot_date', { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: data as LoanSnapshot[], error: null };
}

// ────────────────────────────────────────────────────────────
// BATCH: Get all payments for multiple loans
// ────────────────────────────────────────────────────────────

export async function getAllLoanPayments(): Promise<{ data: Record<string, LoanPayment[]> | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('user_id', user.id)
    .order('payment_date', { ascending: true });

  if (error) return { data: null, error: error.message };

  // Group by loan_id
  const grouped: Record<string, LoanPayment[]> = {};
  for (const payment of (data as LoanPayment[])) {
    if (!grouped[payment.loan_id]) grouped[payment.loan_id] = [];
    grouped[payment.loan_id].push(payment);
  }

  return { data: grouped, error: null };
}
