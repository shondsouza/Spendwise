'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createLoan } from '@/app/actions/loan.actions';
import { createLoanSchema, type CreateLoanInput } from '@/lib/validations/loan.schema';
import type { LoanType, InterestType } from '@/types/loan.types';
import { LOAN_TYPE_CONFIG } from '@/types/loan.types';
import { calculateEMI } from '@/lib/loans/emi-calculator';
import { calculateMoratoriumOutstanding, computeMoratoriumEndDate } from '@/lib/loans/education-loan-calculator';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { Info, ChevronRight, ChevronLeft, Sparkles, PlusCircle, Trash2, RotateCcw } from 'lucide-react';
import { useDraftPersist } from '@/hooks/use-draft-persist';

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: 'Basic Information',
  2: 'Interest & Dates',
  3: 'Education Moratorium',
};

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddLoanDialog({ open, onOpenChange, onSuccess }: AddLoanDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Live preview state
  const [previewEmi, setPreviewEmi] = useState<number | null>(null);
  const [previewOutstanding, setPreviewOutstanding] = useState<number | null>(null);

  // Draft persistence
  const { hasDraft, restoreDraft, clearDraft, saveDraft } =
    useDraftPersist<CreateLoanInput>('financify:add-loan-draft');
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const form = useForm<CreateLoanInput>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      loan_type: 'personal',
      interest_type: 'compound',
      compounding_frequency: 'monthly',
      grace_period_months: 6,
      loan_start_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const { register, watch, setValue, formState: { errors }, handleSubmit, reset } = form;

  // Show restore banner when dialog opens and a draft exists
  useEffect(() => {
    if (open && hasDraft) {
      setShowDraftBanner(true);
    }
  }, [open, hasDraft]);

  // Auto-save on every value change
  const watchedValues = watch();
  useEffect(() => {
    if (open) {
      saveDraft(watchedValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(watchedValues)]);

  const handleRestoreDraft = () => {
    const saved = restoreDraft();
    if (!saved) return;
    // Reset form with the saved values
    reset(saved);
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
  };

  const loanType = watch('loan_type') as LoanType;
  const interestType = watch('interest_type') as InterestType;
  const isEducation = loanType === 'education' || interestType === 'hybrid';
  const totalSteps: Step = isEducation ? 3 : 2;

  // Live EMI preview calculation
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

  const onSubmit = async (values: CreateLoanInput) => {
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (k === 'disbursements') {
        fd.append(k, JSON.stringify(v ?? []));
      } else if (v !== undefined && v !== null && v !== '') {
        fd.append(k, String(v));
      }
    });

    const result = await createLoan(fd);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${values.loan_name}" loan added!`);
    clearDraft();
    reset();
    setStep(1);
    setPreviewEmi(null);
    setPreviewOutstanding(null);
    setShowDraftBanner(false);
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
    // Don't clear the draft on close — user may have closed accidentally
    reset();
    setStep(1);
    setPreviewEmi(null);
    setPreviewOutstanding(null);
    setShowDraftBanner(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-0 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-[var(--separator)] px-6 pb-4 pt-6">
          <DialogTitle className="text-[17px] font-semibold text-[var(--text-primary)]">
            Add New Loan
          </DialogTitle>
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

          {/* Draft restore banner */}
          {showDraftBanner && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[rgba(255,149,0,0.10)] px-3 py-2.5">
              <RotateCcw className="h-3.5 w-3.5 flex-shrink-0 text-[var(--apple-orange)]" />
              <p className="flex-1 text-[12px] font-medium text-[var(--apple-orange)]">
                You have an unsaved draft. Restore it?
              </p>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="rounded-lg bg-[var(--apple-orange)] px-2.5 py-1 text-[11px] font-bold text-white"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-[11px] font-semibold text-[var(--apple-orange)] underline underline-offset-2"
              >
                Discard
              </button>
            </div>
          )}
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
                  <Input
                    placeholder="e.g. SBI Education Loan"
                    {...register('loan_name')}
                    className="input-apple"
                  />
                </FormField>

                <FormField label="Lender / Bank" error={errors.lender_name?.message}>
                  <Input
                    placeholder="e.g. State Bank of India"
                    {...register('lender_name')}
                    className="input-apple"
                  />
                </FormField>
              </div>

              <FormField label="Original Principal Amount (₹)" error={errors.original_principal?.message}>
                <Input
                  type="number"
                  placeholder="480000"
                  min={1}
                  step={100}
                  {...register('original_principal')}
                />
              </FormField>

              <FormField label="Current Outstanding (₹) — Optional" error={(errors as any).current_outstanding?.message}>
                <Input
                  type="number"
                  placeholder="e.g. 524050 — leave blank if unknown"
                  min={0}
                  step={100}
                  {...register('current_outstanding')}
                />
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  Enter the amount from your latest bank statement for accurate projections.
                </p>
              </FormField>

              <FormField label="Outstanding As Of (date from statement)" error={(errors as any).outstanding_as_of_date?.message}>
                <Input
                  type="date"
                  {...register('outstanding_as_of_date')}
                />
              </FormField>

              <FormField label="Loan Start Date" error={errors.loan_start_date?.message}>
                <Input type="date" {...register('loan_start_date')} />
              </FormField>

              <FormField label="Notes (Optional)" error={errors.notes?.message}>
                <Input placeholder="Any notes about this loan" {...register('notes')} />
              </FormField>

              {/* ── Disbursements (Education / Custom loans) ── */}
              {(loanType === 'education' || loanType === 'custom') && (
                <DisbursementsField form={form} />
              )}
            </div>
          )}

          {/* ── STEP 2: Interest & Repayment ─────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Interest Type */}
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
                        {t === 'hybrid' ? 'Hybrid (SI→CI)' : `${t.charAt(0).toUpperCase()}${t.slice(1)} Interest`}
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
                    defaultValue="monthly"
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

              {isEducation && (
                <FormField label="EMI Start Date" error={errors.emi_start_date?.message}>
                  <Input type="date" {...register('emi_start_date')} />
                </FormField>
              )}

              {!isEducation && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="EMI Start Date" error={errors.emi_start_date?.message}>
                    <Input type="date" {...register('emi_start_date')} />
                  </FormField>
                  <FormField label="Calculated / Agreed EMI (₹)" error={errors.emi_amount?.message}>
                    <Input
                      type="number"
                      placeholder="Auto-calculated"
                      step="0.01"
                      {...register('emi_amount')}
                    />
                  </FormField>
                </div>
              )}

              {/* Bank EMI field — for reconciliation */}
              <FormField label="Bank-Stated EMI (₹) — Optional" error={(errors as any).bank_emi_amount?.message}>
                <Input
                  type="number"
                  placeholder="Enter if different from above (e.g. from your loan statement)"
                  step="0.01"
                  {...register('bank_emi_amount')}
                />
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  If your bank quotes a different EMI, enter it here to track the difference.
                </p>
              </FormField>

              {/* EMI Preview */}
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
                    During the moratorium, Simple Interest accrues but is not paid.
                    After the moratorium ends, the total becomes your EMI base (CI).
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

              {/* Live preview box */}
              {previewOutstanding && (
                <div className="rounded-xl border border-[var(--glass-border)] bg-[rgba(0,122,255,0.06)] p-4 space-y-3">
                  <p className="text-[12px] font-semibold text-[var(--apple-blue)] uppercase tracking-[0.4px]">
                    📊 Live Calculation Preview
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
                        <p className="text-[11px] text-[var(--text-tertiary)]">Estimated EMI</p>
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
            </div>
          )}

          {/* ── Navigation ────────────────────────────────────── */}
          <div className="mt-6 flex items-center gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                className="gap-1.5 rounded-full"
              >
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
                {submitting ? 'Saving...' : 'Add Loan'}
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

// ────────────────────────────────────────────────────────────
// Disbursements Sub-Component
// Lets users add multiple loan disbursement tranches.
// ────────────────────────────────────────────────────────────

function DisbursementsField({ form }: { form: ReturnType<typeof useForm<CreateLoanInput>> }) {
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'disbursements' as any,
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-[13px] font-medium text-[var(--text-secondary)]">
          Disbursements (Optional)
        </Label>
        <button
          type="button"
          onClick={() => (append as any)({ date: '', amount: '', description: '' })}
          className="flex items-center gap-1 text-[12px] font-semibold text-[var(--apple-blue)]"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add Tranche
        </button>
      </div>

      {fields.length === 0 && (
        <p className="mb-2 text-[11px] text-[var(--text-tertiary)]">
          If your loan was disbursed in multiple installments (e.g. semester-wise), add each tranche here for accurate interest calculation.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-2 rounded-xl bg-[rgba(0,122,255,0.05)] p-2.5">
            <div className="grid flex-1 grid-cols-3 gap-2">
              <Input
                type="date"
                {...register(`disbursements.${i}.date` as any)}
                placeholder="Date"
                className="text-[12px]"
              />
              <Input
                type="number"
                {...register(`disbursements.${i}.amount` as any)}
                placeholder="Amount (₹)"
                min={1}
                className="text-[12px]"
              />
              <Input
                {...register(`disbursements.${i}.description` as any)}
                placeholder="Sem 1, Sem 2…"
                className="text-[12px]"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="flex-shrink-0 text-[var(--apple-red)] opacity-70 hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
