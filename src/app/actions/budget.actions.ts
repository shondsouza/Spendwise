"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations/expense.schema";
import {
  buildCategoryAliasMap,
  getBudgetCategoryKey,
  getCanonicalCategory,
} from "@/lib/utils/category-aliases";

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

function monthDateRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { start, end };
}

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

  const payload = {
    ...parsed.data,
    category: getBudgetCategoryKey(parsed.data.category),
  };

  const { data, error } = await supabase
    .from("budgets")
    .insert({ ...payload, user_id: user.id })
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

  const payload = {
    ...parsed.data,
    category: getBudgetCategoryKey(parsed.data.category),
  };

  const { data, error } = await supabase
    .from("budgets")
    .update(payload)
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

  const [{ data, error }, { data: categoryOverrides }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, user_id, category, amount, month, year, created_at")
      .eq("user_id", user.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("category")
      .range(0, 49),
    supabase
      .from("categories")
      .select("name, default_key")
      .eq("user_id", user.id)
      .eq("is_deleted", false),
  ]);

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data?.length) {
    return { data: [] as BudgetWithSpending[], error: null };
  }

  const aliasMap = buildCategoryAliasMap(categoryOverrides ?? []);

  // Query only the date span covered by the returned budgets, then calculate
  // spending by matching category aliases and calendar month.
  const oldestBudget = data.reduce((oldest, budget) =>
    budget.year < oldest.year || (budget.year === oldest.year && budget.month < oldest.month)
      ? budget
      : oldest
  );
  const newestBudget = data.reduce((newest, budget) =>
    budget.year > newest.year || (budget.year === newest.year && budget.month > newest.month)
      ? budget
      : newest
  );
  const { start: rangeStart } = monthDateRange(oldestBudget.year, oldestBudget.month);
  const { end: rangeEnd } = monthDateRange(newestBudget.year, newestBudget.month);

  const { data: expenses, error: expenseError } = await supabase
    .from("expenses")
    .select("amount, category, date")
    .eq("user_id", user.id)
    .gte("date", rangeStart)
    .lte("date", rangeEnd);

  if (expenseError) {
    return { data: null, error: expenseError.message };
  }

  // Aggregate spent by period using a canonical alias key so "food" / "Food"
  // (and renamed defaults) all count toward the same budget.
  const spendingByPeriod = new Map<string, number>();
  for (const expense of expenses ?? []) {
    if (!expense.date || !expense.category) continue;

    const [yearStr, monthStr] = expense.date.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) continue;

    const amount = Number(expense.amount) || 0;
    const canonical = getCanonicalCategory(expense.category, aliasMap);
    const key = `${canonical}:${year}:${month}`;
    spendingByPeriod.set(key, (spendingByPeriod.get(key) ?? 0) + amount);
  }

  const budgetsWithSpending: BudgetWithSpending[] = data.map((budget) => {
    const month = Number(budget.month);
    const year = Number(budget.year);
    const canonical = getCanonicalCategory(budget.category, aliasMap);
    const spent = spendingByPeriod.get(`${canonical}:${year}:${month}`) ?? 0;

    return {
      ...budget,
      amount: Number(budget.amount) || 0,
      month,
      year,
      spent,
    };
  });

  return { data: budgetsWithSpending, error: null };
}
