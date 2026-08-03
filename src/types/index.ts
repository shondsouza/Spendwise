export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  payment_method: string;
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  source?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  repeats_monthly?: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "expense" | "income" | "both";
  emoji: string;
  color: string;
  created_at: string;
  default_key?: string | null;
  is_deleted?: boolean;
}
