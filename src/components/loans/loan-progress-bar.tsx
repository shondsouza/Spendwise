'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface LoanProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const colorMap = {
  blue: 'from-[var(--apple-blue)] to-[#5ac8fa]',
  green: 'from-[var(--apple-green)] to-[#30d158]',
  orange: 'from-[var(--apple-orange)] to-[#ffd60a]',
  red: 'from-[var(--apple-red)] to-[#ff6961]',
  purple: 'from-[var(--apple-purple)] to-[#bf5af2]',
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function LoanProgressBar({
  percent,
  className,
  showLabel = false,
  color = 'blue',
  size = 'md',
  label,
}: LoanProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const gradient = colorMap[color];
  const height = sizeMap[size];

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
            {label || 'Repaid'}
          </span>
          <span className="text-[12px] font-bold text-[var(--text-primary)]">
            {clamped.toFixed(1)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]',
          height,
        )}
      >
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
            gradient,
          )}
          style={{ width: `${clamped}%` }}
        />
        {/* Shine overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </div>
  );
}
