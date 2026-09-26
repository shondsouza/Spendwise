"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import React, { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  loadPreferences,
  preferencesFromMetadata,
  updatePreferences,
} from "@/lib/preferences";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    loadPreferences();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.is_anonymous) return;
      updatePreferences(preferencesFromMetadata(user.user_metadata));
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
