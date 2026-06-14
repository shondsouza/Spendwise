'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { updateLoan } from '@/app/actions/loan.actions';
import { updateLoanSchema, type UpdateLoanInput } from '@/lib/validations/loan.schema';
import type { UserLoan, LoanType, InterestType } from '@/types/loan.types';
import { LOAN_TYPE_CONFIG } from '@/types/loan.types';
import { calculateEMI } from '@/lib/loans/emi-calculator';
import { calculateMoratoriumOutstanding, computeMoratoriumEndDate } from '@/lib/loans/education-loan-calculator';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { Info, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

type Step = 1 | 2 | 3;

interface EditLoanDialogProps {
  loan: UserLoan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditLoanDialog({ loan, open, onOpenChange, onSuccess }: EditLoanDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [previewEmi, setPreviewEmi] = useState<number | null>(null);
  const [previewOutstanding, setPreviewOutstanding] = useState<number | null>(null);

  const form = useForm<UpdateLoanInput>({
    resolver: zodResolver(updateLoanSchema),
    defaultValues: {
      id: loan.id,
      loan_name: loan.loan_name,
      lender_name: loan.lender_name,
      loan_type: loan.loan_type,
      original_principal: Number(loan.original_principal),
      current_outstanding: Number(loan.current_outstanding),
      interest_type: loan.interest_type,
      interest_rate: Number(loan.interest_rate),
      loan_start_date: loan.loan_start_date,
      loan_end_date: loan.loan_end_date ?? '',
      notes: loan.notes ?? '',
      moratorium_course_start: loan.moratorium_course_start ?? '',
      moratorium_course_end: loan.moratorium_course_end ?? '',
      grace_period_months: loan.grace_period_months ?? 6,
      moratorium_si_rate: Number(loan.moratorium_si_rate ?? loan.interest_rate),
      moratorium_end_date: loan.moratorium_end_date ?? '',
      emi_start_date: loan.emi_start_date ?? '',
      emi_amount: loan.emi_amount ? Number(loan.emi_amount) : undefined,
      loan_tenure_months: loan.loan_tenure_months ?? undefined,
      ci_rate: loan.ci_rate ? Number(loan.ci_rate) : undefined,
      compounding_frequency: loan.compounding_frequency ?? 'monthly',
      status: loan.status,
    },
  });

  const { register, watch, setValue, formState: { errors }, handleSubmit } = form;

  const loanType = watch('loan_type') as LoanType;
  const interestType = watch('interest_type') as InterestType;
  const isEducation = loanType === 'education' || interestType === 'hybrid';
  const totalSteps: Step = isEducation ? 3 : 2;

  const updatePreview = useCallback(() => {
    const principal = Number(watch('original_principal'));
    const tenure = Number(watch('loan_tenure_months'));
    const rate = Number(watch('ci_rate') ?? watch('interest_rate'));
    const courseEnd = watch('moratorium_course_end');
    const graceMonths = Number(watch('grace_period_months') ?? 6);
    const siRate = Number(watch('moratorium_si_rate') ?? watch('interest_rate'));
    const loanStart = watch('loan_start_date');

    if (isEducation && courseEnd && principal && loanStart) {
      const morEnd = computeMoratoriumEndDate(courseEnd, graceMonths);
      const outstanding = calculateMoratoriumOutstanding(principal, loanStart, morEnd, siRate);
      setPreviewOutstanding(outstanding);
      if (tenure && rate) {
        setPreviewEmi(calculateEMI(outstanding, rate, tenure));
      }
    } else if (principal && tenure && rate) {
      setPreviewOutstanding(null);
      setPreviewEmi(calculateEMI(principal, rate, tenure));
    }
  }, [watch, isEducation]);

  const onSubmit = async (values: UpdateLoanInput) => {
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        fd.append(k, String(v));
      }
    });

    const result = await updateLoan(loan.id, fd);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${values.loan_name}" updated!`);
    setStep(1);
    onOpenChange(false);
    onSuccess?.();
  };

  const nextStep = () => {
    if (step < totalSteps) setStep((s) => (s + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleClose = () => {
    setStep(1);
    onOpenChange(false);
  };

  const STEP_LABELS: Record<Step, string> = {
    1: 'Basic Information',
    2: 'Interest & Repayment',
    3: 'Moratorium Details',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-0 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-[var(--separator)] px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-base"
              style={{ backgroundColor: LOAN_TYPE_CONFIG[loan.loan_type].bgColor }}
            >
              {LOAN_TYPE_CONFIG[loan.loan_type].emoji}
            </div>
            <DialogTitle className="text-[17px] font-semibold text-[var(--text-primary)]">
              Edit Loan
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-[var(--text-secondary)]">
            {STEP_LABELS[step]}
          </DialogDescription>

          {/* Step indicator */}
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <React.Fragment key={s}>
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200',
                    s <= step
                      ? 'bg-[var(--apple-blue)] text-white'
                      : 'bg-[rgba(120,120,128,0.15)] text-[var(--text-tertiary)]',
                  )}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < totalSteps && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 rounded-full transition-all duration-300',
                      s < step ? 'bg-[var(--apple-blue)]' : 'bg-[rgba(120,120,128,0.15)]',
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
          {/* ── STEP 1: Basic Information ─────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Loan Type Selector */}
              <div>
                <Label className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]">
                  Loan Type
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.keys(LOAN_TYPE_CONFIG) as LoanType[]).map((type) => {
                    const cfg = LOAN_TYPE_CONFIG[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setValue('loan_type', type);
                          if (type === 'education') {
                            setValue('interest_type', 'hybrid');
                          }
                        }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all duration-150',
                          loanType === type
                            ? 'border-[var(--apple-blue)] bg-[rgba(0,122,255,0.08)]'
                            : 'border-transparent bg-[rgba(120,120,128,0.06)] hover:bg-[rgba(120,120,128,0.10)]',
                        )}
                      >
                        <span className="text-2xl">{cfg.emoji}</span>
                        <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                          {cfg.label.replace(' Loan', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Loan Name" error={errors.loan_name?.message}>
                  <Input placeholder="e.g. SBI Education Loan" {...register('loan_name')} className="input-apple" />
                </FormField>
                <FormField label="Lender / Bank" error={errors.lender_name?.message}>
                  <Input placeholder="e.g. State Bank of India" {...register('lender_name')} className="input-apple" />
                </FormField>
              </div>

              <FormField label="Original Principal Amount (₹)" error={errors.original_principal?.message}>
                <Input type="number" placeholder="480000" min={1} step={100} {...register('original_principal')} />
              </FormField>

              <FormField label="Current Outstanding (₹ — optional override)" error={errors.current_outstanding?.message}>
                <Input type="number" placeholder="Auto-calculated" min={0} step={100} {...register('current_outstanding')} />
              </FormField>

              <FormField label="Loan Start Date" error={errors.loan_start_date?.message}>
                <Input type="date" {...register('loan_start_date')} />
              </FormField>

              <FormField label="Status" error={errors.status?.message}>
                <Select
                  defaultValue={loan.status}
                  onValueChange={(v) => setValue('status', v as 'active' | 'closed' | 'defaulted')}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="defaulted">Defaulted</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Notes (Optional)" error={errors.notes?.message}>
                <Input placeholder="Any notes about this loan" {...register('notes')} />
              </FormField>
            </div>
          )}

          {/* ── STEP 2: Interest & Repayment ──────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {!isEducation && (
                <FormField label="Interest Type" error={errors.interest_type?.message}>
                  <div className="grid grid-cols-3 gap-2">
                    {(['simple', 'compound', 'hybrid'] as InterestType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setValue('interest_type', t)}
                        className={cn(
                          'rounded-xl border-2 py-2.5 text-[12px] font-semibold capitalize transition-all',
                          interestType === t
                            ? 'border-[var(--apple-blue)] bg-[rgba(0,122,255,0.08)] text-[var(--apple-blue)]'
                            : 'border-transparent bg-[rgba(120,120,128,0.08)] text-[var(--text-secondary)]',
                        )}
                      >
                        {t === 'hybrid' ? 'Hybrid (SI→CI)' : `${t.charAt(0).toUpperCase()}${t.slice(1)}`}
                      </button>
                    ))}
                  </div>
                </FormField>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label={isEducation ? 'SI Rate (Moratorium) %' : 'Interest Rate % p.a.'}
                  error={errors.interest_rate?.message}
                >
                  <Input
                    type="number"
                    placeholder="10"
                    step="0.01"
                    min={0}
                    max={100}
                    {...register('interest_rate')}
                    onChange={(e) => { register('interest_rate').onChange(e); updatePreview(); }}
                  />
                </FormField>

                {isEducation && (
                  <FormField label="CI Rate (Repayment) % p.a." error={errors.ci_rate?.message}>
                    <Input
                      type="number"
                      placeholder="10"
                      step="0.01"
                      min={0}
                      max={100}
                      {...register('ci_rate')}
                      onChange={(e) => { register('ci_rate').onChange(e); updatePreview(); }}
                    />
                  </FormField>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Loan Tenure (months)" error={errors.loan_tenure_months?.message}>
                  <Input
                    type="number"
                    placeholder="240"
                    min={1}
                    max={600}
                    {...register('loan_tenure_months')}
                    onChange={(e) => { register('loan_tenure_months').onChange(e); updatePreview(); }}
                  />
                </FormField>

                <FormField label="Compounding Frequency" error={errors.compounding_frequency?.message}>
                  <Select
                    defaultValue={loan.compounding_frequency ?? 'monthly'}
                    onValueChange={(v) => setValue('compounding_frequency', v as 'monthly' | 'quarterly' | 'yearly')}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="EMI Start Date" error={errors.emi_start_date?.message}>
                  <Input type="date" {...register('emi_start_date')} />
                </FormField>
                <FormField label="EMI Amount (₹)" error={errors.emi_amount?.message}>
                  <Input
                    type="number"
                    placeholder={previewEmi ? String(Math.round(previewEmi)) : 'Auto-calculated'}
                    step="0.01"
                    {...register('emi_amount')}
                  />
                </FormField>
              </div>

              {previewEmi && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl bg-[rgba(52,199,89,0.08)] px-4 py-3">
                    <Sparkles className="h-4 w-4 text-[var(--apple-green)]" />
                    <div>
                      <p className="text-[12px] text-[var(--text-secondary)]">Calculated EMI</p>
                      <p className="text-[17px] font-bold text-[var(--apple-green)]">
                        {formatCurrency(previewEmi)}<span className="text-[12px] font-normal">/month</span>
                      </p>
                    </div>
                  </div>
                  {watch('emi_amount') && Number(watch('emi_amount')) > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-[rgba(0,122,255,0.08)] px-4 py-3">
                      <Sparkles className="h-4 w-4 text-[var(--apple-blue)]" />
                      <div>
                        <p className="text-[12px] text-[var(--text-secondary)]">Bank EMI (User Provided)</p>
                        <p className="text-[17px] font-bold text-[var(--apple-blue)]">
                          {formatCurrency(Number(watch('emi_amount')))}<span className="text-[12px] font-normal">/month</span>
                        </p>
                      </div>
                    </div>
                  )}
                  {watch('emi_amount') && Number(watch('emi_amount')) > 0 && Math.abs(Number(watch('emi_amount')) - previewEmi) / previewEmi > 0.1 && (
                    <div className="rounded-xl bg-[rgba(255,59,48,0.08)] px-4 py-3">
                      <p className="text-[12px] font-medium text-[var(--apple-red)]">
                        Warning: The Bank EMI you entered differs from the Calculated EMI by more than 10%. Please verify your principal, interest rate, and tenure.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Education Moratorium ──────────────────── */}
          {step === 3 && isEducation && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[rgba(255,149,0,0.08)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-[var(--apple-orange)]" />
                  <p className="text-[12px] font-medium text-[var(--apple-orange)]">
                    Simple Interest accrues during moratorium. After moratorium ends, the total outstanding becomes the EMI base (CI).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Course Start Date" error={errors.moratorium_course_start?.message}>
                  <Input type="date" {...register('moratorium_course_start')} />
                </FormField>
                <FormField label="Course End Date" error={errors.moratorium_course_end?.message}>
                  <Input
                    type="date"
                    {...register('moratorium_course_end')}
                    onChange={(e) => { register('moratorium_course_end').onChange(e); updatePreview(); }}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Grace Period (months)" error={errors.grace_period_months?.message}>
                  <Input
                    type="number"
                    placeholder="6"
                    min={0}
                    max={36}
                    {...register('grace_period_months')}
                    onChange={(e) => { register('grace_period_months').onChange(e); updatePreview(); }}
                  />
                </FormField>
                <FormField label="SI Rate During Moratorium %" error={errors.moratorium_si_rate?.message}>
                  <Input
                    type="number"
                    placeholder="10"
                    step="0.01"
                    min={0}
                    max={100}
                    {...register('moratorium_si_rate')}
                    onChange={(e) => { register('moratorium_si_rate').onChange(e); updatePreview(); }}
                  />
                </FormField>
              </div>

              {previewOutstanding && (
                <div className="rounded-xl border border-[var(--glass-border)] bg-[rgba(0,122,255,0.06)] p-4 space-y-3">
                  <p className="text-[12px] font-semibold text-[var(--apple-blue)] uppercase tracking-[0.4px]">
                    📊 Recalculated Preview
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-[var(--text-tertiary)]">Outstanding at EMI Start</p>
                      <p className="text-[16px] font-bold text-[var(--text-primary)]">
                        {formatCurrency(previewOutstanding)}
                      </p>
                    </div>
                    {previewEmi && (
                      <div>
                        <p className="text-[11px] text-[var(--text-tertiary)]">Calculated EMI</p>
                        <p className="text-[16px] font-bold text-[var(--apple-green)]">
                          {formatCurrency(previewEmi)}/mo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <FormField label="EMI Amount (₹ — leave blank to auto-calculate)" error={errors.emi_amount?.message}>
                <Input
                  type="number"
                  placeholder={previewEmi ? String(Math.round(previewEmi)) : 'Auto-calculated'}
                  step="0.01"
                  {...register('emi_amount')}
                />
              </FormField>

              {previewEmi && watch('emi_amount') && Number(watch('emi_amount')) > 0 && Math.abs(Number(watch('emi_amount')) - previewEmi) / previewEmi > 0.1 && (
                <div className="rounded-xl bg-[rgba(255,59,48,0.08)] px-4 py-3">
                  <p className="text-[12px] font-medium text-[var(--apple-red)]">
                    Warning: The Bank EMI you entered differs from the Calculated EMI by more than 10%. Please verify your principal, interest rate, and tenure.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center gap-3">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={prevStep} className="gap-1.5 rounded-full">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}

            <div className="flex-1" />

            {step < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="gap-1.5 rounded-full bg-[var(--apple-blue)] text-white hover:bg-[#0071f0]"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[var(--apple-blue)] text-white hover:bg-[#0071f0]"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-[11px] text-[var(--apple-red)]">{error}</p>}
    </div>
  );
}
