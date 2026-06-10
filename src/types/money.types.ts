export interface MoneyGiven {
  id: string;
  user_id: string;
  person_name: string;
  amount: number;
  given_date: string;
  reason: string | null;
  expected_return: string | null;
  status: "Pending" | "Partially Returned" | "Returned";
  created_at: string;
  repayments?: GivenRepayment[];
  total_returned?: number;
  remaining?: number;
}

export interface GivenRepayment {
  id: string;
  given_id: string;
  user_id: string;
  amount: number;
  received_date: string;
  note: string | null;
  created_at: string;
}

export interface MoneyTaken {
  id: string;
  user_id: string;
  person_name: string;
  amount: number;
  taken_date: string;
  reason: string | null;
  due_date: string | null;
  status: "Pending" | "Partially Repaid" | "Repaid";
  created_at: string;
  repayments?: TakenRepayment[];
  total_paid?: number;
  remaining?: number;
}

export interface TakenRepayment {
  id: string;
  taken_id: string;
  user_id: string;
  amount: number;
  paid_date: string;
  note: string | null;
  created_at: string;
}
