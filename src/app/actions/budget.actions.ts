"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations/expense.schema";

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

  revalidatePath("/budgets");
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

  revalidatePath("/budgets");
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

  revalidatePath("/budgets");
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

  return { data, error: null };
}
