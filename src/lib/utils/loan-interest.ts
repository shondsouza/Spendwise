import type { MoneyTaken, TakenRepayment } from '@/types/money.types';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export type CalcResult = {
  outstanding: number;
  totalInterestAccrued: number;
  phase: 'simple' | 'compound' | 'none';
  phaseLabel: string;
};

function toDate(input: string | Date) {
  return input instanceof Date ? input : new Date(input);
}

export function calculateLoanBalance(
  entry: MoneyTaken,
  repayments: TakenRepayment[] = [],
  asOfDate?: Date
): CalcResult {
  const asOf = asOfDate ? toDate(asOfDate) : new Date();

  const principal = Number(entry.amount || 0);
  if (!entry.has_interest) {
    const totalPaid = (repayments || []).reduce((s, r) => s + Number(r.amount), 0);
    const outstanding = Math.max(0, principal - totalPaid);
    return {
      outstanding: Number(outstanding.toFixed(2)),
      totalInterestAccrued: 0,
      phase: 'none',
      phaseLabel: 'No interest',
    };
  }

  const simpleRate = Number(entry.simple_interest_rate ?? 0) / 100;
  const simpleYears = Number(entry.simple_interest_years ?? 0);
  const compoundRate = Number(entry.compound_interest_rate ?? 0) / 100;
  const freq = Number(entry.compounding_frequency ?? 1);
  const totalTenure = Number(entry.total_tenure_years ?? 0);

  const startDate = toDate(entry.taken_date);
  const simpleEndDate = new Date(startDate.getTime() + simpleYears * MS_PER_YEAR);
  const tenureEndDate = new Date(startDate.getTime() + totalTenure * MS_PER_YEAR);
  const capDate = asOf < tenureEndDate ? asOf : tenureEndDate;

  // Sort repayments ascending
  const reps = (repayments || [])
    .map((r) => ({ ...r, paid_date: r.paid_date }))
    .sort((a, b) => new Date(a.paid_date).getTime() - new Date(b.paid_date).getTime());

  let balance = principal;
  let totalInterest = 0;

  // Apply repayments before start as prepayments
  const preReps = reps.filter((r) => new Date(r.paid_date) < startDate);
  if (preReps.length > 0) {
    const preSum = preReps.reduce((s, r) => s + Number(r.amount), 0);
    balance = Math.max(0, balance - preSum);
  }

  // Build event dates: start, repayments, simple end, cap
  const eventDates = new Set<number>();
  eventDates.add(startDate.getTime());
  eventDates.add(capDate.getTime());
  eventDates.add(simpleEndDate.getTime());
  eventDates.add(tenureEndDate.getTime());
  reps.forEach((r) => {
    const t = new Date(r.paid_date).getTime();
    if (t >= startDate.getTime() && t <= capDate.getTime()) eventDates.add(t);
  });

  const sortedDates = Array.from(eventDates).sort((a, b) => a - b);

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const t0 = new Date(sortedDates[i]);
    const t1 = new Date(sortedDates[i + 1]);
    if (t1 <= t0) continue;

    // Determine phase at t0
    const inSimple = t0.getTime() < simpleEndDate.getTime();
    const intervalEnd = new Date(Math.min(t1.getTime(), simpleEndDate.getTime()));

    if (inSimple) {
      // simple interest up to either t1 or simpleEndDate
      const endForSimple = intervalEnd.getTime() > t0.getTime() ? intervalEnd : t0;
      const years = (endForSimple.getTime() - t0.getTime()) / MS_PER_YEAR;
      if (years > 0 && simpleRate > 0 && balance > 0) {
        const interest = balance * simpleRate * years;
        balance += interest;
        totalInterest += interest;
      }
    } else {
      // compound for the interval [t0, t1)
      const years = (t1.getTime() - t0.getTime()) / MS_PER_YEAR;
      if (years > 0 && compoundRate > 0 && balance > 0) {
        const periods = years * freq;
        const newBalance = balance * Math.pow(1 + compoundRate / freq, periods);
        const interest = newBalance - balance;
        balance = newBalance;
        totalInterest += interest;
      }
    }

    // Apply repayments that happen exactly at t1
    const repsAtT1 = reps.filter((r) => new Date(r.paid_date).getTime() === t1.getTime());
    if (repsAtT1.length > 0) {
      for (const r of repsAtT1) {
        const amt = Number(r.amount);
        balance = Math.max(0, balance - amt);
      }
    }
  }

  // Round
  const outstanding = Number(balance.toFixed(2));

  // Determine phase and label at asOf
  let phase: CalcResult['phase'] = 'none';
  let phaseLabel = 'No interest';

  if (asOf <= simpleEndDate) {
    phase = 'simple';
    const yrsLeft = (simpleEndDate.getTime() - asOf.getTime()) / MS_PER_YEAR;
    phaseLabel = `Simple Interest — ${yrsLeft.toFixed(1)} yrs left in this phase`;
  } else if (asOf > simpleEndDate && asOf <= tenureEndDate) {
    phase = 'compound';
    const sinceCompound = (asOf.getTime() - simpleEndDate.getTime()) / MS_PER_YEAR;
    const compoundTotal = totalTenure - simpleYears;
    const yearNum = Math.min(Math.max(Math.floor(sinceCompound) + 1, 1), Math.max(compoundTotal, 1));
    phaseLabel = `Compound Interest — Year ${yearNum} of ${compoundTotal}`;
  } else {
    phase = 'none';
    phaseLabel = 'Tenure ended';
    if (outstanding > 0) phaseLabel = 'Tenure ended — Overdue';
  }

  return {
    outstanding,
    totalInterestAccrued: Number(totalInterest.toFixed(2)),
    phase,
    phaseLabel,
  };
}
