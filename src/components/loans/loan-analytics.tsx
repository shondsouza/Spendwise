'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

import type { UserLoan, LoanPayment } from '@/types/loan.types';
import { generateLoanSchedule, computeLoanBalance } from '@/lib/loans/loan-calculator';
import { LOAN_TYPE_CONFIG } from '@/types/loan.types';
import { format, parseISO } from 'date-fns';
import { LoanHealthInsights } from './loan-health-insights';

interface LoanAnalyticsProps {
  loans: UserLoan[];
  allPayments: Record<string, LoanPayment[]>;
  monthlyIncome?: number;
}

const CHART_COLORS = [
  'var(--apple-blue)',
  'var(--apple-green)',
  'var(--apple-orange)',
  'var(--apple-purple)',
  'var(--apple-pink)',
];

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 shadow-lg backdrop-blur-xl">
      <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[12px] text-[var(--text-secondary)]">{p.name}:</span>
          <span className="text-[12px] font-bold text-[var(--text-primary)]">
            {typeof p.value === 'number' && p.name !== 'Progress %'
              ? formatCurrency(p.value)
              : `${p.value}%`}
          </span>
        </div>
      ))}
    </div>
  );
};

export function LoanAnalytics({ loans, allPayments, monthlyIncome = 0 }: LoanAnalyticsProps) {
  const activeLoans = loans.filter((l) => l.status === 'active');

  // ── Chart 1: Balance Over Time (projected) ────────────────
  const balanceData = useMemo(() => {
    if (activeLoans.length === 0) return [];
    const dataByMonth: Record<number, Record<string, number>> = {};

    for (const loan of activeLoans) {
      const schedule = generateLoanSchedule(loan, allPayments[loan.id] ?? []);
      schedule.forEach((row, idx) => {
        if (idx % 6 !== 0 && idx !== schedule.length - 1) return;
        if (!dataByMonth[idx]) dataByMonth[idx] = {};
        dataByMonth[idx][loan.loan_name] = row.closingBalance;
        dataByMonth[idx]['month'] = idx + 1;
      });
    }

    return Object.values(dataByMonth).slice(0, 51);
  }, [activeLoans, allPayments]);

  // ── Chart 2: Principal vs Interest Pie ────────────────────
  const pieData = useMemo(() => {
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalOutstanding = 0;

    for (const loan of loans) {
      totalPrincipalPaid += Number(loan.total_principal_paid ?? 0);
      totalInterestPaid += Number(loan.total_interest_paid ?? 0);
      totalOutstanding += Number(loan.current_outstanding ?? 0);
    }

    return [
      { name: 'Principal Repaid', value: totalPrincipalPaid, color: 'var(--apple-green)' },
      { name: 'Interest Paid', value: totalInterestPaid, color: 'var(--apple-orange)' },
      { name: 'Outstanding', value: totalOutstanding, color: 'var(--apple-red)' },
    ].filter((d) => d.value > 0);
  }, [loans]);

  // ── Chart 3: Payment History Bar Chart ───────────────────
  const paymentHistoryData = useMemo(() => {
    const byMonth: Record<string, { principal: number; interest: number; total: number; date: string }> = {};

    for (const payments of Object.values(allPayments)) {
      for (const p of payments) {
        const key = format(parseISO(p.payment_date), 'MMM yy');
        if (!byMonth[key]) byMonth[key] = { principal: 0, interest: 0, total: 0, date: p.payment_date };
        byMonth[key].principal += p.principal_component;
        byMonth[key].interest += p.interest_component;
        byMonth[key].total += p.amount;
      }
    }

    return Object.entries(byMonth)
      .sort(([, a], [, b]) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(([month, data]) => ({ month, ...data }))
      .slice(-12);
  }, [allPayments]);

  // ── Chart 4: Loan breakdown by type ───────────────────────
  const loanTypeData = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const loan of loans) {
      const cfg = LOAN_TYPE_CONFIG[loan.loan_type];
      byType[cfg.label] = (byType[cfg.label] ?? 0) + Number(loan.current_outstanding ?? 0);
    }
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [loans]);

  // ── Chart 5: Loan Progress % per loan ────────────────────
  const progressData = useMemo(() => {
    return loans.map((loan) => {
      const bal = computeLoanBalance(loan);
      return {
        name: loan.loan_name.length > 18 ? loan.loan_name.slice(0, 16) + '…' : loan.loan_name,
        'Progress %': Math.round(bal.repaymentPercent),
        remaining: 100 - Math.round(bal.repaymentPercent),
      };
    });
  }, [loans]);

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-[17px] font-semibold text-[var(--text-primary)]">No data yet</p>
        <p className="text-[13px] text-[var(--text-secondary)]">Add loans to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Insights */}
      <LoanHealthInsights
        loans={loans}
        allPayments={allPayments}
        monthlyIncome={monthlyIncome}
      />

      {/* Balance Over Time */}
      {balanceData.length > 0 && (
        <ChartCard title="Outstanding Balance Over Time" subtitle="Projected repayment trajectory (every 6 months)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,128,0.12)" />
              <XAxis
                dataKey="month"
                tickFormatter={(v) => `M${v}`}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {activeLoans.map((loan, i) => (
                <Line
                  key={loan.id}
                  type="monotone"
                  dataKey={loan.loan_name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Principal vs Interest Pie */}
        {pieData.length > 0 && (
          <ChartCard title="Loan Breakdown" subtitle="Principal vs Interest breakdown">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(20px)',
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Loan Progress % */}
        {progressData.length > 0 && (
          <ChartCard title="Repayment Progress" subtitle="% of principal repaid per loan">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={progressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,128,0.12)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  width={90}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, 'Progress']}
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                  }}
                />
                <ReferenceLine x={30} stroke="rgba(255,149,0,0.4)" strokeDasharray="4 4" />
                <ReferenceLine x={75} stroke="rgba(52,199,89,0.4)" strokeDasharray="4 4" />
                <Bar dataKey="Progress %" fill="var(--apple-blue)" radius={[0, 6, 6, 0]}>
                  {progressData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry['Progress %'] >= 75
                          ? 'var(--apple-green)'
                          : entry['Progress %'] >= 30
                          ? 'var(--apple-blue)'
                          : 'var(--apple-orange)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Payment History */}
      {paymentHistoryData.length > 0 && (
        <ChartCard title="Payment History" subtitle="Last 12 months — principal vs interest breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={paymentHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,128,0.12)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="principal" name="Principal" fill="var(--apple-green)" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="interest" name="Interest" fill="var(--apple-orange)" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Loan Type Breakdown */}
      {loanTypeData.length > 1 && (
        <ChartCard title="Outstanding by Loan Type" subtitle="Distribution across loan categories">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={loanTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,128,0.12)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={100} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="value" name="Outstanding" fill="var(--apple-blue)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="apple-card p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && (
          <p className="text-[12px] text-[var(--text-secondary)]">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
