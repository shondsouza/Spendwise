'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { UserLoan, LoanProjection, ScenarioType, SimulatorInputs } from '@/types/loan.types';
import { LOAN_TYPE_CONFIG } from '@/types/loan.types';
import { runSimulation } from '@/lib/loans/loan-projection-engine';
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
import { Sparkles, TrendingDown, Calendar, IndianRupee, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoanSimulatorProps {
  loans: UserLoan[];
}

type ScenarioOption = {
  type: ScenarioType;
  label: string;
  description: string;
  icon: string;
};

const SCENARIOS: ScenarioOption[] = [
  {
    type: 'fixed_increase',
    label: 'Pay Extra Monthly',
    description: 'Add a fixed amount to your EMI every month',
    icon: '💳',
  },
  {
    type: 'yearly_stepup',
    label: 'Yearly Step-Up',
    description: 'Increase EMI by a fixed amount every year',
    icon: '📈',
  },
  {
    type: 'one_time_prepayment',
    label: 'One-Time Prepayment',
    description: 'Make a lump-sum payment to reduce principal',
    icon: '💰',
  },
];

export function LoanSimulator({ loans }: LoanSimulatorProps) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id ?? '');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('fixed_increase');
  const [extraMonthly, setExtraMonthly] = useState<string>('5000');
  const [yearlyStepUp, setYearlyStepUp] = useState<string>('2000');
  const [prepaymentAmount, setPrepaymentAmount] = useState<string>('50000');
  const [prepaymentAtMonth, setPrepaymentAtMonth] = useState<string>('1');
  const [reduceTenure, setReduceTenure] = useState<boolean>(true);
  
  const [projection, setProjection] = useState<LoanProjection | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('loanSimulatorState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedLoanId && loans.some((l) => l.id === parsed.selectedLoanId)) {
          setSelectedLoanId(parsed.selectedLoanId);
        }
        if (parsed.selectedScenario) setSelectedScenario(parsed.selectedScenario);
        if (parsed.extraMonthly) setExtraMonthly(parsed.extraMonthly);
        if (parsed.yearlyStepUp) setYearlyStepUp(parsed.yearlyStepUp);
        if (parsed.prepaymentAmount) setPrepaymentAmount(parsed.prepaymentAmount);
        if (parsed.prepaymentAtMonth) setPrepaymentAtMonth(parsed.prepaymentAtMonth);
        if (parsed.reduceTenure !== undefined) setReduceTenure(parsed.reduceTenure);
      } catch {
        // ignore parse error
      }
    }
  }, [loans]);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('loanSimulatorState', JSON.stringify({
      selectedLoanId,
      selectedScenario,
      extraMonthly,
      yearlyStepUp,
      prepaymentAmount,
      prepaymentAtMonth,
      reduceTenure,
    }));
  }, [selectedLoanId, selectedScenario, extraMonthly, yearlyStepUp, prepaymentAmount, prepaymentAtMonth, reduceTenure]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);

  const handleSimulate = () => {
    if (!selectedLoan) return;

    const inputs: SimulatorInputs = {
      scenarioType: selectedScenario,
      fixedExtraMonthly: Number(extraMonthly),
      yearlyStepUpAmount: Number(yearlyStepUp),
      prepaymentAmount: Number(prepaymentAmount),
      prepaymentAtMonth: Number(prepaymentAtMonth) || 1,
      reduceTenure,
    };

    startTransition(() => {
      const result = runSimulation(selectedLoan, inputs);
      setProjection(result);
    });
  };

  // Build comparison chart data from projection
  const chartData = React.useMemo(() => {
    if (!projection) return [];
    
    // We want to combine base and new rows by month
    const combined: Record<number, { month: number; 'Base Balance': number; 'New Balance': number }> = {};
    
    projection.baseScheduleRows?.forEach((row, i) => {
      if (i % 6 === 0 || i === (projection.baseScheduleRows!.length - 1)) {
        combined[row.month] = {
          month: row.month,
          'Base Balance': row.closingBalance,
          'New Balance': 0 // will be overwritten if exists
        };
      }
    });

    projection.scheduleRows.forEach((row, i) => {
      if (i % 6 === 0 || i === (projection.scheduleRows.length - 1)) {
        if (!combined[row.month]) {
          combined[row.month] = {
            month: row.month,
            'Base Balance': 0,
            'New Balance': row.closingBalance
          };
        } else {
          combined[row.month]['New Balance'] = row.closingBalance;
        }
      }
    });

    return Object.values(combined).sort((a, b) => a.month - b.month);
  }, [projection]);

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🔮</div>
        <p className="text-[17px] font-semibold text-[var(--text-primary)]">No loans to simulate</p>
        <p className="text-[13px] text-[var(--text-secondary)]">Add a loan first</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="apple-card p-5 bg-gradient-to-br from-[rgba(0,122,255,0.08)] to-[rgba(175,82,222,0.08)]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-[var(--apple-purple)]" />
          <h3 className="text-[16px] font-bold text-[var(--text-primary)]">Scenario Simulator</h3>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Explore how different payment strategies can save you money and time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4">
          {/* Loan Selector */}
          <div>
            <Label className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]">
              Select Loan to Simulate
            </Label>
            <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {loans.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {LOAN_TYPE_CONFIG[l.loan_type].emoji} {l.loan_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loan quick stats */}
          {selectedLoan && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[rgba(120,120,128,0.06)] p-3">
              <div>
                <p className="text-[11px] text-[var(--text-tertiary)]">Outstanding</p>
                <p className="text-[14px] font-bold text-[var(--apple-red)]">
                  {formatCurrency(Number(selectedLoan.current_outstanding))}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-tertiary)]">EMI/month</p>
                <p className="text-[14px] font-bold text-[var(--apple-blue)]">
                  {selectedLoan.emi_amount ? formatCurrency(Number(selectedLoan.emi_amount)) : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Scenario Selector */}
          <div>
            <Label className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]">
              Scenario
            </Label>
            <div className="space-y-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => { setSelectedScenario(s.type); setProjection(null); }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                    selectedScenario === s.type
                      ? 'border-[var(--apple-blue)] bg-[rgba(0,122,255,0.06)]'
                      : 'border-transparent bg-[rgba(120,120,128,0.06)] hover:bg-[rgba(120,120,128,0.10)]',
                  )}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{s.label}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Inputs */}
          <div className="rounded-xl bg-[rgba(120,120,128,0.06)] p-4 space-y-3">
            {selectedScenario === 'fixed_increase' && (
              <div>
                <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                  Extra Monthly Payment (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={extraMonthly}
                  onChange={(e) => setExtraMonthly(e.target.value)}
                  min={1}
                />
                {selectedLoan?.emi_amount && (
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                    New EMI: {formatCurrency(Number(selectedLoan.emi_amount) + Number(extraMonthly || 0))}/month
                  </p>
                )}
              </div>
            )}

            {selectedScenario === 'yearly_stepup' && (
              <div>
                <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                  Annual Step-Up Amount (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="2000"
                  value={yearlyStepUp}
                  onChange={(e) => setYearlyStepUp(e.target.value)}
                  min={1}
                />
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  EMI increases by ₹{Number(yearlyStepUp || 0).toLocaleString('en-IN')} every year
                </p>
              </div>
            )}

            {selectedScenario === 'one_time_prepayment' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                      Prepayment Amount (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={prepaymentAmount}
                      onChange={(e) => setPrepaymentAmount(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                      At Month #
                    </Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={prepaymentAtMonth}
                      onChange={(e) => setPrepaymentAtMonth(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                    Benefit
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReduceTenure(true)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all',
                        reduceTenure
                          ? 'border-[var(--apple-blue)] bg-[rgba(0,122,255,0.08)] text-[var(--apple-blue)]'
                          : 'border-transparent bg-[rgba(120,120,128,0.08)] text-[var(--text-secondary)]',
                      )}
                    >
                      Reduce Tenure
                    </button>
                    <button
                      type="button"
                      onClick={() => setReduceTenure(false)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all',
                        !reduceTenure
                          ? 'border-[var(--apple-blue)] bg-[rgba(0,122,255,0.08)] text-[var(--apple-blue)]'
                          : 'border-transparent bg-[rgba(120,120,128,0.08)] text-[var(--text-secondary)]',
                      )}
                    >
                      Reduce EMI
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSimulate}
            disabled={isPending || !selectedLoan}
            className="w-full rounded-full bg-gradient-to-r from-[var(--apple-blue)] to-[var(--apple-purple)] text-white font-semibold hover:opacity-90"
          >
            {isPending ? 'Simulating...' : '✨ Run Simulation'}
          </Button>
        </div>

        {/* Results */}
        <div>
          {!projection ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl bg-[rgba(120,120,128,0.05)] text-center p-6">
              <div className="text-4xl mb-3">🔮</div>
              <p className="text-[14px] font-medium text-[var(--text-secondary)]">
                Configure a scenario and run the simulation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scenario label */}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[rgba(175,82,222,0.12)] px-3 py-1 text-[11px] font-bold text-[var(--apple-purple)]">
                  {projection.scenarioLabel}
                </span>
              </div>

              {/* Savings metrics */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SavingsCard
                  icon={<Calendar className="h-5 w-5 text-[var(--apple-blue)]" />}
                  label={reduceTenure !== false || selectedScenario !== 'one_time_prepayment' ? 'Months Saved' : 'Months Saved'}
                  value={`${projection.monthsSaved} months`}
                  sub={`~${(projection.monthsSaved / 12).toFixed(1)} years`}
                  color="blue"
                />
                <SavingsCard
                  icon={<TrendingDown className="h-5 w-5 text-[var(--apple-green)]" />}
                  label="Interest Saved"
                  value={formatCurrency(projection.interestSaved)}
                  sub="vs. original plan"
                  color="green"
                />
                <SavingsCard
                  icon={<IndianRupee className="h-5 w-5 text-[var(--apple-orange)]" />}
                  label="New Payoff"
                  value={projection.newPayoffDate ? formatDate(projection.newPayoffDate, 'MMM yy') : '—'}
                  sub={`Was ${projection.originalPayoffDate ? formatDate(projection.originalPayoffDate, 'MMM yy') : '—'}`}
                  color="orange"
                />
              </div>

              {/* Comparison Table */}
              <div className="apple-card overflow-hidden">
                <div className="border-b border-[var(--separator)] bg-[rgba(120,120,128,0.04)] px-4 py-2.5">
                  <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Comparison</p>
                </div>
                <div className="divide-y divide-[var(--separator)]">
                  {[
                    { label: 'Total Interest', original: projection.totalInterestOriginal, new: projection.totalInterestNew },
                    { label: 'Total Repayment', original: projection.totalRepaymentOriginal, new: projection.totalRepaymentNew },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-[var(--text-secondary)]">{row.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] text-[var(--text-tertiary)] line-through">
                          {formatCurrency(row.original)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />
                        <span className="text-[13px] font-bold text-[var(--apple-green)]">
                          {formatCurrency(row.new)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projected Balance Chart */}
              {chartData.length > 0 && (
                <div className="apple-card p-4">
                  <p className="mb-3 text-[13px] font-semibold text-[var(--text-secondary)]">
                    Projected Balance Comparison
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,128,0.12)" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(v) => `M${v}`}
                        tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                      />
                      <YAxis
                        tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                        tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                        width={50}
                      />
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{
                          background: 'var(--glass-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="Base Balance"
                        stroke="var(--text-tertiary)"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="New Balance"
                        stroke="var(--apple-purple)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SavingsCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'green' | 'orange';
}) {
  const colorMap = {
    blue: 'bg-[rgba(0,122,255,0.08)]',
    green: 'bg-[rgba(52,199,89,0.08)]',
    orange: 'bg-[rgba(255,149,0,0.08)]',
  };

  return (
    <div className={`rounded-xl p-3 ${colorMap[color]}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
      <p className="text-[15px] font-bold text-[var(--text-primary)] truncate">{value}</p>
      <p className="text-[10px] text-[var(--text-tertiary)]">{sub}</p>
    </div>
  );
}
