import { createBrowserClient } from "@supabase/ssr";
import { createFallbackClient, hasSupabaseConfig } from "./fallback-client";

export function createClient() {
  if (!hasSupabaseConfig()) {
    return createFallbackClient() as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
