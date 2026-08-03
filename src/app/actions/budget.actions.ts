"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations/expense.schema";
import {
  buildCategoryAliasMap,
  getBudgetCategoryKey,
  getCanonicalCategory,
  getCategoryAliases,
} from "@/lib/utils/category-aliases";

type BudgetRow = {
  id: string;
  user_id: string;
  category: string;
  amount: number | string;
  month: number;
  year: number;
  created_at: string;
};

type BudgetWithSpending = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  spent: number;
  remaining: number;
};

function currentPeriod() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function monthDateRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { start, end };
}

function periodRank(year: number, month: number) {
  return year * 12 + month;
}

export async function addBudget(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const { month: currentMonth, year: currentYear } = currentPeriod();

  const parsed = budgetSchema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    month: formData.get("month") || currentMonth,
    year: formData.get("year") || currentYear,
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const category = getBudgetCategoryKey(parsed.data.category);
  const amount = parsed.data.amount;
  // Monthly budgets always apply to the current calendar month and renew next month.
  const month = currentMonth;
  const year = currentYear;

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        category,
        amount,
        month,
        year,
      },
      { onConflict: "user_id,category,month,year" }
    )
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

  const { month: currentMonth, year: currentYear } = currentPeriod();

  const parsed = budgetSchema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    month: formData.get("month") || currentMonth,
    year: formData.get("year") || currentYear,
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const payload = {
    category: getBudgetCategoryKey(parsed.data.category),
    amount: parsed.data.amount,
    month: currentMonth,
    year: currentYear,
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

  const { data: existing, error: existingError } = await supabase
    .from("budgets")
    .select("category")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  if (!existing) {
    return { success: false, error: "Budget not found" };
  }

  const { data: categoryOverrides } = await supabase
    .from("categories")
    .select("name, default_key")
    .eq("user_id", user.id)
    .eq("is_deleted", false);

  const aliasMap = buildCategoryAliasMap(categoryOverrides ?? []);
  const aliases = getCategoryAliases(existing.category, aliasMap);

  // Remove the recurring category budget entirely so it does not return next month.
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("user_id", user.id)
    .in("category", aliases);

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

  const { month: currentMonth, year: currentYear } = currentPeriod();
  const { start: rangeStart, end: rangeEnd } = monthDateRange(currentYear, currentMonth);

  const [{ data, error }, { data: categoryOverrides }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, user_id, category, amount, month, year, created_at")
      .eq("user_id", user.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("created_at", { ascending: false }),
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

  // One recurring monthly budget per category: use current-month row if present,
  // otherwise carry forward the latest limit from a previous month.
  const latestByCategory = new Map<string, BudgetRow>();
  for (const budget of data as BudgetRow[]) {
    const canonical = getCanonicalCategory(budget.category, aliasMap);
    const existing = latestByCategory.get(canonical);
    if (!existing) {
      latestByCategory.set(canonical, budget);
      continue;
    }

    const existingRank = periodRank(Number(existing.year), Number(existing.month));
    const nextRank = periodRank(Number(budget.year), Number(budget.month));
    if (nextRank > existingRank) {
      latestByCategory.set(canonical, budget);
    }
  }

  const carryForwardRows: Array<{
    user_id: string;
    category: string;
    amount: number;
    month: number;
    year: number;
  }> = [];

  for (const [canonical, budget] of latestByCategory.entries()) {
    const month = Number(budget.month);
    const year = Number(budget.year);
    if (month === currentMonth && year === currentYear) continue;

    carryForwardRows.push({
      user_id: user.id,
      category: canonical,
      amount: Number(budget.amount) || 0,
      month: currentMonth,
      year: currentYear,
    });
  }

  let activeBudgets = Array.from(latestByCategory.values());

  if (carryForwardRows.length > 0) {
    const { data: carried, error: carryError } = await supabase
      .from("budgets")
      .upsert(carryForwardRows, { onConflict: "user_id,category,month,year" })
      .select("id, user_id, category, amount, month, year, created_at");

    if (carryError) {
      return { data: null, error: carryError.message };
    }

    for (const budget of (carried as BudgetRow[] | null) ?? []) {
      const canonical = getCanonicalCategory(budget.category, aliasMap);
      latestByCategory.set(canonical, budget);
    }
    activeBudgets = Array.from(latestByCategory.values()).filter(
      (budget) =>
        Number(budget.month) === currentMonth && Number(budget.year) === currentYear
    );
  } else {
    activeBudgets = activeBudgets.filter(
      (budget) =>
        Number(budget.month) === currentMonth && Number(budget.year) === currentYear
    );
  }

  const { data: expenses, error: expenseError } = await supabase
    .from("expenses")
    .select("amount, category, date")
    .eq("user_id", user.id)
    .gte("date", rangeStart)
    .lte("date", rangeEnd);

  if (expenseError) {
    return { data: null, error: expenseError.message };
  }

  const spendingByCategory = new Map<string, number>();
  for (const expense of expenses ?? []) {
    if (!expense.date || !expense.category) continue;
    const amount = Number(expense.amount) || 0;
    const canonical = getCanonicalCategory(expense.category, aliasMap);
    spendingByCategory.set(canonical, (spendingByCategory.get(canonical) ?? 0) + amount);
  }

  const budgetsWithSpending: BudgetWithSpending[] = activeBudgets
    .map((budget) => {
      const canonical = getCanonicalCategory(budget.category, aliasMap);
      const amount = Number(budget.amount) || 0;
      const spent = spendingByCategory.get(canonical) ?? 0;
      return {
        id: budget.id,
        user_id: budget.user_id,
        category: canonical,
        amount,
        month: currentMonth,
        year: currentYear,
        created_at: budget.created_at,
        spent,
        remaining: amount - spent,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));

  return { data: budgetsWithSpending, error: null };
}
