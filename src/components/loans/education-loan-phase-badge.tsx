'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { LoanPhase } from '@/types/loan.types';

interface EducationLoanPhaseBadgeProps {
  phase: LoanPhase;
  phaseLabel: string;
  className?: string;
}

const phaseStyles: Record<LoanPhase, { bg: string; text: string; dot: string; icon: string }> = {
  moratorium: {
    bg: 'bg-[rgba(255,149,0,0.12)]',
    text: 'text-[var(--apple-orange)]',
    dot: 'bg-[var(--apple-orange)]',
    icon: '⏳',
  },
  repayment: {
    bg: 'bg-[rgba(0,122,255,0.12)]',
    text: 'text-[var(--apple-blue)]',
    dot: 'bg-[var(--apple-blue)]',
    icon: '💳',
  },
  completed: {
    bg: 'bg-[rgba(52,199,89,0.12)]',
    text: 'text-[var(--apple-green)]',
    dot: 'bg-[var(--apple-green)]',
    icon: '✅',
  },
  not_started: {
    bg: 'bg-[rgba(120,120,128,0.10)]',
    text: 'text-[var(--text-secondary)]',
    dot: 'bg-[var(--text-tertiary)]',
    icon: '🕐',
  },
};

export function EducationLoanPhaseBadge({ phase, phaseLabel, className }: EducationLoanPhaseBadgeProps) {
  const style = phaseStyles[phase] ?? phaseStyles.not_started;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        style.bg,
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full',
          style.dot,
          phase === 'moratorium' && 'animate-pulse',
        )}
      />
      <span className={cn('text-[11px] font-semibold tracking-[0.2px]', style.text)}>
        {style.icon} {phaseLabel}
      </span>
    </div>
  );
}
