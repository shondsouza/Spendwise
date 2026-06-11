import { MoneyTaken, TakenRepayment } from "@/types/money.types";

export function calculateLoanBalance(
  entry: MoneyTaken,
  repayments: TakenRepayment[],
  asOf: Date = new Date()
) {
  if (!entry.has_interest) {
    const totalPaid = repayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      outstanding: entry.amount - totalPaid,
      totalInterestAccrued: 0,
      phase: "none",
      phaseLabel: "No interest",
    };
  }

  const takenDate = new Date(entry.taken_date);
  const simpleInterestEndDate = new Date(takenDate);
  simpleInterestEndDate.setFullYear(
    takenDate.getFullYear() + entry.simple_interest_years!
  );

  const totalTenureEndDate = new Date(takenDate);
  totalTenureEndDate.setFullYear(
    takenDate.getFullYear() + entry.total_tenure_years!
  );

  let balance = entry.amount;
  let totalInterestAccrued = 0;
  let phase: "simple" | "compound" | "none" = "simple";
  let phaseLabel = "";

  const sortedRepayments = [...repayments].sort(
    (a, b) => new Date(a.paid_date).getTime() - new Date(b.paid_date).getTime()
  );

  let currentDate = new Date(takenDate);

  // Simple Interest Phase
  while (currentDate < simpleInterestEndDate && currentDate < asOf) {
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(currentDate.getFullYear() + 1);
    const endOfPhase = nextYear > simpleInterestEndDate ? simpleInterestEndDate : nextYear;

    const simpleInterest = (balance * entry.simple_interest_rate!) / 100;
    totalInterestAccrued += simpleInterest;
    balance += simpleInterest;

    sortedRepayments.forEach((p) => {
      const paidDate = new Date(p.paid_date);
      if (paidDate >= currentDate && paidDate < endOfPhase) {
        balance -= p.amount;
      }
    });

    currentDate = endOfPhase;
  }

  // Compound Interest Phase
  if (currentDate >= simpleInterestEndDate) {
    phase = "compound";
    while (currentDate < totalTenureEndDate && currentDate < asOf) {
      const nextCompoundingDate = new Date(currentDate);
      const months = 12 / entry.compounding_frequency!;
      nextCompoundingDate.setMonth(currentDate.getMonth() + months);

      const compoundInterest = balance * (entry.compound_interest_rate! / 100 / entry.compounding_frequency!);
      totalInterestAccrued += compoundInterest;
      balance += compoundInterest;

      sortedRepayments.forEach((p) => {
        const paidDate = new Date(p.paid_date);
        if (paidDate >= currentDate && paidDate < nextCompoundingDate) {
          balance -= p.amount;
        }
      });

      currentDate = nextCompoundingDate;
    }
  }

  const yearsIntoTenure = (asOf.getTime() - takenDate.getTime()) / (1000 * 3600 * 24 * 365.25);

  if (phase === "simple") {
    const yearsLeft = entry.simple_interest_years! - yearsIntoTenure;
    phaseLabel = `Simple Interest - ${yearsLeft.toFixed(1)} yrs left in this phase`;
  } else {
    const yearOfCompound = Math.floor(yearsIntoTenure - entry.simple_interest_years!) + 1;
    phaseLabel = `Compound Interest - Year ${yearOfCompound} of ${entry.total_tenure_years! - entry.simple_interest_years!}`;
  }
  
  if (currentDate >= totalTenureEndDate) {
    phaseLabel = "Tenure complete";
  }

  return {
    outstanding: Math.max(0, balance),
    totalInterestAccrued,
    phase,
    phaseLabel,
  };
}
