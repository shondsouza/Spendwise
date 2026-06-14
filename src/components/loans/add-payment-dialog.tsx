'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, isBefore } from 'date-fns';
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

import { toast } from 'sonner';
import { addLoanPayment } from '@/app/actions/loan.actions';
import { formatCurrency } from '@/lib/utils/currency';
import { splitPayment } from '@/lib/loans/emi-calculator';
import { cn } from '@/lib/utils/cn';
import type { UserLoan, PaymentType } from '@/types/loan.types';
import { PAYMENT_TYPE_LABELS } from '@/types/loan.types';
import { Info, Building2, RotateCcw } from 'lucide-react';
import { useDraftPersist } from '@/hooks/use-draft-persist';

interface AddPaymentDialogProps {
  loan: UserLoan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PaymentDraft {
  amount: string;
  paymentDate: string;
  paymentType: PaymentType;
  note: string;
}

export function AddPaymentDialog({ loan, open, onOpenChange, onSuccess }: AddPaymentDialogProps) {
  const draftKey = `financify:payment-draft:${loan.id}`;
  const { hasDraft, restoreDraft, clearDraft, saveDraft } =
    useDraftPersist<PaymentDraft>(draftKey);

  const defaultAmount = loan.emi_amount ? String(Math.round(Number(loan.emi_amount))) : '';

  const [submitting, setSubmitting] = useState(false);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentType, setPaymentType] = useState<PaymentType>('emi');
  const [note, setNote] = useState('');
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Show restore banner when dialog opens and a draft exists
  useEffect(() => {
    if (open && hasDraft) {
      setShowDraftBanner(true);
    }
  }, [open, hasDraft]);

  // Auto-save draft on change (debounced inside the hook)
  useEffect(() => {
    if (open) {
      saveDraft({ amount, paymentDate, paymentType, note });
    }
  }, [open, amount, paymentDate, paymentType, note, saveDraft]);

  const handleRestoreDraft = () => {
    const saved = restoreDraft();
    if (!saved) return;
    setAmount(saved.amount ?? defaultAmount);
    setPaymentDate(saved.paymentDate ?? format(new Date(), 'yyyy-MM-dd'));
    setPaymentType(saved.paymentType ?? 'emi');
    setNote(saved.note ?? '');
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
  };

  // Determine if the selected payment date falls in moratorium
  const isInMoratorium = (() => {
    if (!loan.moratorium_end_date) return false;
    try {
      return isBefore(parseISO(paymentDate), parseISO(loan.moratorium_end_date));
    } catch { return false; }
  })();

  const currentOutstanding = Number(loan.current_outstanding ?? 0);
  const rate = isInMoratorium
    ? Number(loan.moratorium_si_rate ?? loan.interest_rate ?? 0)
    : Number(loan.ci_rate ?? loan.interest_rate ?? 0);

  // Live P/I split preview
  const amountNum = Number(amount) || 0;
  const split = amountNum > 0
    ? splitPayment(amountNum, currentOutstanding, rate, isInMoratorium)
    : { principal: 0, interest: 0 };

  // Auto-set payment type for moratorium phase
  useEffect(() => {
    if (isInMoratorium) {
      setPaymentType('interest');
    } else {
      setPaymentType('emi');
    }
  }, [isInMoratorium]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('loan_id', loan.id);
    fd.append('payment_date', paymentDate);
    fd.append('amount', String(amountNum));
    fd.append('payment_type', paymentType);
    if (note) fd.append('note', note);

    const result = await addLoanPayment(fd);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Payment recorded successfully');
    clearDraft();
    setAmount(defaultAmount);
    setNote('');
    onOpenChange(false);
    onSuccess?.();
  };

  const handleClose = () => {
    // Keep draft alive on close — user may have closed accidentally
    setAmount(defaultAmount);
    setNote('');
    setShowDraftBanner(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-0 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="border-b border-[var(--separator)] px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--apple-blue)]" />
            <DialogTitle className="text-[17px] font-semibold text-[var(--text-primary)]">
              Record Payment
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-[var(--text-secondary)]">
            {loan.loan_name} · Outstanding: {formatCurrency(currentOutstanding)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Draft restore banner */}
          {showDraftBanner && (
            <div className="flex items-center gap-2 rounded-xl bg-[rgba(255,149,0,0.10)] px-3 py-2.5">
              <RotateCcw className="h-3.5 w-3.5 flex-shrink-0 text-[var(--apple-orange)]" />
              <p className="flex-1 text-[12px] font-medium text-[var(--apple-orange)]">
                Unsaved draft found. Restore it?
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

          {/* Moratorium phase notice */}
          {isInMoratorium && (
            <div className="flex items-start gap-2.5 rounded-xl bg-[rgba(255,149,0,0.08)] px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--apple-orange)]" />
              <div>
                <p className="text-[12px] font-semibold text-[var(--apple-orange)]">Moratorium Phase</p>
                <p className="mt-0.5 text-[11px] text-[var(--apple-orange)]/80">
                  This date falls during the moratorium period. Payment goes entirely to interest — it does not reduce the principal.
                </p>
              </div>
            </div>
          )}

          {/* Payment Date */}
          <div>
            <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              Payment Date
            </Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Amount — hero input */}
          <div>
            <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-bold text-[var(--text-tertiary)]">₹</span>
              <Input
                type="number"
                placeholder={loan.emi_amount ? String(Math.round(Number(loan.emi_amount))) : '0'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                step={1}
                className="pl-8 text-[20px] font-bold tabular-nums h-14"
              />
            </div>
            {loan.emi_amount && (
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(Number(loan.emi_amount))))}
                className="mt-1.5 text-[11px] font-semibold text-[var(--apple-blue)]"
              >
                Use scheduled EMI: {formatCurrency(Number(loan.emi_amount))} →
              </button>
            )}
          </div>

          {/* Live P/I Split Preview */}
          {amountNum > 0 && (
            <div className="rounded-xl bg-[rgba(120,120,128,0.05)] p-3.5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
                Payment Breakdown
              </p>
              {/* Visual split bar */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
                {split.principal > 0 && (
                  <div
                    className="h-full rounded-full bg-[var(--apple-green)] transition-all duration-500"
                    style={{ width: `${(split.principal / amountNum) * 100}%` }}
                  />
                )}
                {split.principal === 0 && (
                  <div className="h-full w-full rounded-full bg-[var(--apple-orange)]" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[rgba(52,199,89,0.08)] px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="h-2 w-2 rounded-full bg-[var(--apple-green)]" />
                    <p className="text-[10px] text-[var(--text-tertiary)]">Principal</p>
                  </div>
                  <p className="text-[15px] font-bold text-[var(--apple-green)] tabular-nums">
                    {formatCurrency(split.principal)}
                  </p>
                </div>
                <div className="rounded-lg bg-[rgba(255,149,0,0.08)] px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="h-2 w-2 rounded-full bg-[var(--apple-orange)]" />
                    <p className="text-[10px] text-[var(--text-tertiary)]">Interest</p>
                  </div>
                  <p className="text-[15px] font-bold text-[var(--apple-orange)] tabular-nums">
                    {formatCurrency(split.interest)}
                  </p>
                </div>
              </div>
              {split.principal > 0 && (
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Balance after payment: <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(Math.max(0, currentOutstanding - split.principal))}</span>
                </p>
              )}
            </div>
          )}

          {/* Payment Type */}
          <div>
            <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              Payment Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isInMoratorium && t !== 'interest'}
                  onClick={() => setPaymentType(t)}
                  className={cn(
                    'rounded-xl border-2 px-3 py-2 text-[12px] font-semibold transition-all',
                    paymentType === t
                      ? 'border-[var(--apple-blue)] bg-[rgba(0,122,255,0.08)] text-[var(--apple-blue)]'
                      : 'border-transparent bg-[rgba(120,120,128,0.08)] text-[var(--text-secondary)]',
                    isInMoratorium && t !== 'interest' && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {PAYMENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              Note (Optional)
            </Label>
            <Input
              placeholder="e.g. Paid via NEFT"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 rounded-full">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !amountNum}
              className="flex-1 rounded-full bg-[var(--apple-blue)] text-white hover:bg-[#0071f0]"
            >
              {submitting ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
