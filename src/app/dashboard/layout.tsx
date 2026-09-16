import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./dashboard-shell";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (!user.is_anonymous && !user.email_confirmed_at)) {
    redirect("/auth/login");
  }

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    (user.is_anonymous ? "Guest" : undefined) ||
    "User";

  return (
    <DashboardShell userName={userName} isGuest={!!user.is_anonymous}>
      {children}
    </DashboardShell>
  );
}
