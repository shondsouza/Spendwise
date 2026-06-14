"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-[56px] rounded-full skeleton" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative h-8 w-[56px] rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apple-blue)] focus-visible:ring-offset-2 active:scale-95 flex-shrink-0"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1c1c2e, #2d2d44)"
          : "linear-gradient(135deg, #87ceeb, #ffd700)",
        boxShadow: isDark
          ? "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      {/* Sliding pill */}
      <span
        className="absolute top-1 h-6 w-6 rounded-full transition-all duration-300 flex items-center justify-center text-[13px]"
        style={{
          left: isDark ? "calc(100% - 28px)" : "4px",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
