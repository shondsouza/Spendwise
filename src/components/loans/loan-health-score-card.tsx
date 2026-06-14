'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { UserLoan, LoanPayment } from '@/types/loan.types';
import { computeLoanHealthScore } from '@/lib/loans/loan-health-score';

interface LoanHealthScoreCardProps {
  loans: UserLoan[];
  allPayments: Record<string, LoanPayment[]>;
  monthlyIncome: number;
  className?: string;
}

export function LoanHealthScoreCard({
  loans,
  allPayments,
  monthlyIncome,
  className,
}: LoanHealthScoreCardProps) {
  const [showFactors, setShowFactors] = useState(false);
  const health = computeLoanHealthScore(loans, allPayments, monthlyIncome);

  // SVG arc for the score gauge
  const RADIUS = 52;
  const CIRCUMFERENCE = Math.PI * RADIUS; // half circle
  const progress = (health.score / 100) * CIRCUMFERENCE;

  const gradeColors: Record<string, string> = {
    A: 'var(--apple-green)',
    B: 'var(--apple-blue)',
    C: 'var(--apple-orange)',
    D: 'var(--apple-red)',
    F: 'var(--apple-red)',
  };

  const color = gradeColors[health.grade] ?? 'var(--apple-blue)';

  return (
    <div className={cn('apple-card overflow-hidden', className)}>
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(0,122,255,0.12)]">
            <Shield className="h-4.5 w-4.5 text-[var(--apple-blue)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Loan Health Score</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">Portfolio assessment</p>
          </div>
        </div>

        {/* Gauge + score */}
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <svg width="120" height="68" viewBox="0 0 120 68">
              {/* Background arc */}
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="rgba(120,120,128,0.15)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Score arc — drawn as a dashed trick using stroke-dasharray */}
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              {/* Score number */}
              <text
                x="60"
                y="58"
                textAnchor="middle"
                fontSize="22"
                fontWeight="bold"
                fill="var(--text-primary)"
              >
                {health.score}
              </text>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="text-[28px] font-black tracking-[-1px]"
                style={{ color }}
              >
                {health.grade}
              </span>
              <span className="text-[16px] font-bold text-[var(--text-primary)]">
                {health.label}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {health.suggestions.slice(0, 2).map((s, i) => (
                <p key={i} className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  {s}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Factors toggle */}
        {health.factors.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowFactors((p) => !p)}
              className="flex w-full items-center justify-between rounded-xl bg-[rgba(120,120,128,0.06)] px-3 py-2.5 text-left transition-colors hover:bg-[rgba(120,120,128,0.10)]"
            >
              <span className="text-[12px] font-semibold text-[var(--text-secondary)]">
                Score Breakdown
              </span>
              {showFactors ? (
                <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
              )}
            </button>

            {showFactors && (
              <div className="mt-2 space-y-2">
                {health.factors.map((f) => (
                  <FactorBar key={f.label} factor={f} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FactorBar({ factor }: { factor: { label: string; score: number; weight: number; detail: string } }) {
  const color =
    factor.score >= 75 ? 'var(--apple-green)'
    : factor.score >= 50 ? 'var(--apple-blue)'
    : factor.score >= 30 ? 'var(--apple-orange)'
    : 'var(--apple-red)';

  return (
    <div className="rounded-xl bg-[rgba(120,120,128,0.04)] px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold text-[var(--text-primary)]">{factor.label}</span>
        <span className="text-[12px] font-bold" style={{ color }}>
          {Math.round(factor.score)}/100
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${factor.score}%`, background: color }}
        />
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{factor.detail}</p>
    </div>
  );
}
