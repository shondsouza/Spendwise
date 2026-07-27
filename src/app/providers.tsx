"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import React from "react";
import { PwaLaunchSplash } from "@/components/shared/pwa-launch-splash";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster position="top-right" />
      <PwaLaunchSplash />
    </ThemeProvider>
  );
}
