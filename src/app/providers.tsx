"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import React from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
