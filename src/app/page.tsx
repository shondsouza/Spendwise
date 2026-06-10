"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-4xl space-y-6 p-6">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-[rgba(120,120,128,0.12)]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="apple-card h-36 animate-pulse" />
          ))}
        </div>
        <div className="apple-card h-72 animate-pulse" />
      </div>
    </div>
  );
}
