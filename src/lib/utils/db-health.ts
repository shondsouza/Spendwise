import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_FREE_TIER_BYTES = 500 * 1024 * 1024;
export const SUPABASE_STORAGE_WARNING_BYTES = 400 * 1024 * 1024;

export async function checkDatabaseSize(supabase: SupabaseClient): Promise<number | null> {
  const { data, error } = await supabase.rpc("get_db_size");

  if (error || typeof data !== "number") {
    return null;
  }

  return data;
}

export function formatDatabaseSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
