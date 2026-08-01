"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/use-haptic";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
};

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { haptic } = useHaptic();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      return;
    }

    const updateDeviceType = () => {
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      setIsDesktop(!isTouchDevice && window.innerWidth >= 768);
    };

    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (localStorage.getItem("pwa-prompt-dismissed") !== "true") {
        setIsVisible(true);
      }
    };

    const handleInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("resize", updateDeviceType);
    };
  }, []);

  const handleInstall = async () => {
    haptic("success");
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    haptic("light");
    setIsVisible(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] px-3 py-3 sm:px-4 md:px-6"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 shadow-lg backdrop-blur-2xl md:items-start md:p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--apple-blue)] text-white shadow-sm">
          {isDesktop ? <Monitor className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
            {isDesktop ? "Install SpendWise on your desktop" : "Add to Home Screen"}
          </p>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {isDesktop
              ? "Pin it to your taskbar or Start menu for quicker access."
              : "For a faster, full-screen native experience."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleInstall}
            className="h-8 rounded-full bg-[var(--apple-blue)] px-4 text-[12px] font-semibold text-white hover:bg-[var(--apple-blue)] active:scale-95"
          >
            Install
          </Button>
          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(120,120,128,0.08)] active:scale-95"
          >
            <X className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
