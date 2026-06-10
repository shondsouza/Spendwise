"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <Image
              src={mounted ? (isDark ? "/spendwise-light.png" : "/spendwise-dark.png") : "/spendwise-dark.png"}
              alt="SpendWise"
              width={48}
              height={48}
              className="rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            SpendWise
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
