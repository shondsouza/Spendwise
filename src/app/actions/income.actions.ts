"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { incomeSchema } from "@/lib/validations/expense.schema";

export async function addIncome(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = incomeSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    date: formData.get("date"),
    source: formData.get("source"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data, error } = await supabase
    .from("income")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id, user_id, title, amount, category, date, notes, source, created_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
  return { data, error: null };
}

export async function updateIncome(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = incomeSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    date: formData.get("date"),
    source: formData.get("source"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data, error } = await supabase
    .from("income")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, title, amount, category, date, notes, source, created_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
  return { data, error: null };
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("income").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
  return { success: true, error: null };
}

export async function getIncome(
  limit = 20,
  offset = 0,
  filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized", count: 0 };
  }

  const pageSize = Math.min(Math.max(limit, 1), 20);

  let query = supabase
    .from("income")
    .select("id, user_id, title, amount, category, date, notes, source, created_at", {
      count: "exact",
    })
    .eq("user_id", user.id);

  if (filters?.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("date", filters.endDate);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.minAmount !== undefined) {
    query = query.gte("amount", filters.minAmount);
  }
  if (filters?.maxAmount !== undefined) {
    query = query.lte("amount", filters.maxAmount);
  }

  const { data, error, count } = await query
    .order("date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return { data: null, error: error.message, count: 0 };
  }

  return { data, error: null, count: count || 0 };
}
