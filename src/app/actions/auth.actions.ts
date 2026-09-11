"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  return { data: user, error: null };
}

export async function resetGuestData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!user.is_anonymous) {
    return { success: false, error: "This action is only available for guest sessions" };
  }

  const tables = [
    "given_repayments",
    "taken_repayments",
    "loan_payments",
    "loan_snapshots",
    "recurring_payments",
    "expenses",
    "income",
    "budgets",
    "categories",
    "loans",
    "borrowed",
    "savings_goals",
    "money_given",
    "money_taken",
    "user_loans",
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, error: null };
}
