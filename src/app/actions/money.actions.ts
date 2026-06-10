"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addMoneyGivenSchema,
  addGivenRepaymentSchema,
  addMoneyTakenSchema,
  addTakenRepaymentSchema,
} from "@/lib/validations/money.schema";

// ─── MONEY GIVEN (Lent) ─────────────────────────────────────────────

export async function getMoneyGiven(limit = 50, offset = 0) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized", count: 0 };
  }

  const { data, error, count } = await supabase
    .from("money_given")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("given_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: null, error: error.message, count: 0 };
  }

  return { data, error: null, count: count || 0 };
}

export async function addMoneyGiven(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = addMoneyGivenSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data, error } = await supabase
    .from("money_given")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/lent");
  revalidatePath("/dashboard");
  return { data, error: null };
}

export async function deleteMoneyGiven(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("money_given")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/lent");
  revalidatePath("/dashboard");
  return { success: true, error: null };
}

// ─── GIVEN REPAYMENTS ───────────────────────────────────────────────

export async function getGivenRepayments(givenId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("given_repayments")
    .select("*")
    .eq("given_id", givenId)
    .eq("user_id", user.id)
    .order("received_date", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function addGivenRepayment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = addGivenRepaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  // Guard: repayment cannot exceed remaining amount
  const { data: existing } = await supabase
    .from("money_given")
    .select("amount")
    .eq("id", parsed.data.given_id)
    .eq("user_id", user.id)
    .single();

  const { data: repayments } = await supabase
    .from("given_repayments")
    .select("amount")
    .eq("given_id", parsed.data.given_id);

  const totalRepaid = repayments?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const remaining = Number(existing?.amount ?? 0) - totalRepaid;

  if (parsed.data.amount > remaining) {
    return { data: null, error: `Amount exceeds remaining balance of ₹${remaining.toFixed(2)}` };
  }

  const { data, error } = await supabase
    .from("given_repayments")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/lent");
  revalidatePath("/dashboard");
  return { data, error: null };
}

// ─── MONEY TAKEN (Loan) ─────────────────────────────────────────────

export async function getMoneyTaken(limit = 50, offset = 0) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized", count: 0 };
  }

  const { data, error, count } = await supabase
    .from("money_taken")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("taken_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: null, error: error.message, count: 0 };
  }

  return { data, error: null, count: count || 0 };
}

export async function addMoneyTaken(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = addMoneyTakenSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { data, error } = await supabase
    .from("money_taken")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/loan");
  revalidatePath("/dashboard");
  return { data, error: null };
}

export async function deleteMoneyTaken(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("money_taken")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/loan");
  revalidatePath("/dashboard");
  return { success: true, error: null };
}

// ─── TAKEN REPAYMENTS ───────────────────────────────────────────────

export async function getTakenRepayments(takenId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("taken_repayments")
    .select("*")
    .eq("taken_id", takenId)
    .eq("user_id", user.id)
    .order("paid_date", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function addTakenRepayment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const parsed = addTakenRepaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  // Guard: repayment cannot exceed remaining amount
  const { data: existing } = await supabase
    .from("money_taken")
    .select("amount")
    .eq("id", parsed.data.taken_id)
    .eq("user_id", user.id)
    .single();

  const { data: repayments } = await supabase
    .from("taken_repayments")
    .select("amount")
    .eq("taken_id", parsed.data.taken_id);

  const totalPaid = repayments?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const remaining = Number(existing?.amount ?? 0) - totalPaid;

  if (parsed.data.amount > remaining) {
    return { data: null, error: `Amount exceeds remaining balance of ₹${remaining.toFixed(2)}` };
  }

  const { data, error } = await supabase
    .from("taken_repayments")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/loan");
  revalidatePath("/dashboard");
  return { data, error: null };
}
