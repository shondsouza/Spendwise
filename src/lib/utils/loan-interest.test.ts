import { calculateLoanBalance } from './loan-interest';
import type { MoneyTaken, TakenRepayment } from '../../types/money.types';

function approxEqual(a: number, b: number, eps = 0.5) {
  return Math.abs(a - b) <= eps;
}

function run() {
  console.log('Running loan-interest tests...');

  // No interest
  const noInterest = calculateLoanBalance(
    {
      id: '1',
      user_id: 'u',
      person_name: 'A',
      amount: 1000,
      taken_date: '2022-01-01',
      reason: null,
      due_date: null,
      status: 'Pending',
      created_at: new Date().toISOString(),
    } as Partial<MoneyTaken>,
    [{ id: 'r1', taken_id: '1', user_id: 'u', amount: 200, paid_date: '2022-06-01', note: null, created_at: new Date().toISOString() }] as Partial<TakenRepayment>[]
  );
  console.assert(noInterest.outstanding === 800, 'No interest outstanding should be 800');

  // Simple interest only period (2 years simple at 10%) no repayments
  const simpleOnly = calculateLoanBalance(
    {
      id: '2',
      user_id: 'u',
      person_name: 'B',
      amount: 1000,
      taken_date: '2020-01-01',
      reason: null,
      due_date: null,
      status: 'Pending',
      created_at: new Date().toISOString(),
      has_interest: true,
      simple_interest_rate: 10,
      simple_interest_years: 2,
      compound_interest_rate: 0,
      compounding_frequency: 1,
      total_tenure_years: 2,
    } as Partial<MoneyTaken>,
    [],
    new Date('2021-01-01')
  );
  // 1 year of simple interest at 10% on 1000 = 100 interest => outstanding 1100
  console.assert(approxEqual(simpleOnly.outstanding, 1100, 0.1), 'Simple interest outstanding approx 1100');

  // Transition to compound: 1 year simple then 2 years compound
  const mix = calculateLoanBalance(
    {
      id: '3',
      user_id: 'u',
      person_name: 'C',
      amount: 1000,
      taken_date: '2020-01-01',
      has_interest: true,
      simple_interest_rate: 5,
      simple_interest_years: 1,
      compound_interest_rate: 10,
      compounding_frequency: 1,
      total_tenure_years: 3,
      reason: null,
      due_date: null,
      status: 'Pending',
      created_at: new Date().toISOString(),
    } as Partial<MoneyTaken>,
    [],
    new Date('2022-01-01')
  );
  // After 1 year simple at 5% => 1050. Then 1 year compound at 10% => 1155
  console.assert(approxEqual(mix.outstanding, 1155, 1), `Mixed phases outstanding approx 1155 got ${mix.outstanding}`);

  // Repayment during simple phase
  const repSimple = calculateLoanBalance(
    {
      id: '4',
      user_id: 'u',
      person_name: 'D',
      amount: 1000,
      taken_date: '2020-01-01',
      has_interest: true,
      simple_interest_rate: 10,
      simple_interest_years: 2,
      compound_interest_rate: 0,
      compounding_frequency: 1,
      total_tenure_years: 2,
      reason: null,
      due_date: null,
      status: 'Pending',
      created_at: new Date().toISOString(),
    } as Partial<MoneyTaken>,
    [{ id: 'p1', taken_id: '4', user_id: 'u', amount: 500, paid_date: '2020-06-01', note: null, created_at: new Date().toISOString() }] as Partial<TakenRepayment>[],
    new Date('2021-01-01')
  );
  // First half-year interest on 1000 at 10% = 50 => balance 1050 then repayment 500 -> 550 then 6 months interest on 550 at 10% = 27.5 => ~577.5
  console.assert(approxEqual(repSimple.outstanding, 577.5, 2), `Repayment during simple approx 577.5 got ${repSimple.outstanding}`);

  // Fully repaid
  const repFull = calculateLoanBalance(
    {
      id: '5',
      user_id: 'u',
      person_name: 'E',
      amount: 500,
      taken_date: '2020-01-01',
      has_interest: false,
      reason: null,
      due_date: null,
      status: 'Repaid',
      created_at: new Date().toISOString(),
    } as Partial<MoneyTaken>,
    [{ id: 'r1', taken_id: '5', user_id: 'u', amount: 500, paid_date: '2020-02-01', note: null, created_at: new Date().toISOString() }] as Partial<TakenRepayment>[]
  );
  console.assert(repFull.outstanding === 0, 'Fully repaid outstanding 0');

  console.log('loan-interest tests completed');
}

if (require.main === module) run();

export { run };
