"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/expense.schema";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    emoji: formData.get("emoji"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { data, error: null };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    emoji: formData.get("emoji"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data: existingCategory, error: existingError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existingCategory) {
    return { data: null, error: existingError?.message || "Category not found" };
  }

  const { data, error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      emoji: parsed.data.emoji,
      color: parsed.data.color,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase
    .from("expenses")
    .update({ category: parsed.data.name })
    .eq("user_id", user.id)
    .eq("category", existingCategory.name);

  await supabase
    .from("income")
    .update({ category: parsed.data.name })
    .eq("user_id", user.id)
    .eq("category", existingCategory.name);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { data, error: null };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { data: null, error: null };
}

export async function getCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    return { data: [], error: error.message };
  }

  return { data, error: null };
}

export async function getCategoryWithTransactions(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  // Get category
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (categoryError) {
    return { data: null, error: categoryError.message };
  }

  // Get expenses for this category
  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", category.name)
    .order("date", { ascending: false });

  if (expensesError) {
    return { data: null, error: expensesError.message };
  }

  // Get income for this category
  const { data: income, error: incomeError } = await supabase
    .from("income")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", category.name)
    .order("date", { ascending: false });

  if (incomeError) {
    return { data: null, error: incomeError.message };
  }

  return {
    data: {
      category,
      expenses: expenses || [],
      income: income || [],
    },
    error: null,
  };
}
