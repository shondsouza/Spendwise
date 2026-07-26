"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations/expense.schema";

type BudgetWithSpending = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  spent: number;
};

export async function addBudget(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = budgetSchema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    month: formData.get("month"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id, user_id, category, amount, month, year, created_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard");
  return { data, error: null };
}

export async function updateBudget(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = budgetSchema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    month: formData.get("month"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data, error } = await supabase
    .from("budgets")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, category, amount, month, year, created_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard");
  return { data, error: null };
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard");
  return { success: true, error: null };
}

export async function getBudgets() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("id, user_id, category, amount, month, year, created_at")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("category")
    .range(0, 19);

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data?.length) {
    return { data: [] as BudgetWithSpending[], error: null };
  }

  // Query only the date span covered by the returned budgets, then calculate
  // spending by the matching category and calendar month. This keeps historical
  // budgets accurate instead of comparing every budget to the current month.
  const oldestBudget = data.reduce((oldest, budget) =>
    budget.year < oldest.year || (budget.year === oldest.year && budget.month < oldest.month)
      ? budget
      : oldest,
  );
  const newestBudget = data.reduce((newest, budget) =>
    budget.year > newest.year || (budget.year === newest.year && budget.month > newest.month)
      ? budget
      : newest,
  );
  const rangeStart = `${oldestBudget.year}-${String(oldestBudget.month).padStart(2, "0")}-01`;
  const rangeEnd = new Date(Date.UTC(newestBudget.year, newestBudget.month, 0))
    .toISOString()
    .slice(0, 10);

  const { data: expenses, error: expenseError } = await supabase
    .from("expenses")
    .select("amount, category, date")
    .eq("user_id", user.id)
    .gte("date", rangeStart)
    .lte("date", rangeEnd);

  if (expenseError) {
    return { data: null, error: expenseError.message };
  }

  const spendingByBudget = new Map<string, number>();
  for (const expense of expenses ?? []) {
    const [year, month] = expense.date.split("-");
    const key = `${expense.category}:${year}:${Number(month)}`;
    spendingByBudget.set(key, (spendingByBudget.get(key) ?? 0) + Number(expense.amount ?? 0));
  }

  const budgetsWithSpending: BudgetWithSpending[] = data.map((budget) => ({
    ...budget,
    amount: Number(budget.amount),
    spent: spendingByBudget.get(`${budget.category}:${budget.year}:${budget.month}`) ?? 0,
  }));

  return { data: budgetsWithSpending, error: null };
}
