'use client';

import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptic } from '@/hooks/use-haptic';

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
};

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { haptic } = useHaptic();

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ((window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (isStandalone) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user previously dismissed
      if (localStorage.getItem('pwa-prompt-dismissed') !== 'true') {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    haptic('success');
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    haptic('light');
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top px-4 py-3 sm:hidden" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 shadow-lg backdrop-blur-2xl">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--apple-blue)] text-white shadow-sm">
          <Download className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Add to Home Screen</p>
          <p className="text-[12px] text-[var(--text-secondary)]">For a faster, full-screen native experience.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleInstall}
            className="h-8 rounded-full bg-[var(--apple-blue)] px-4 text-[12px] font-semibold text-white hover:bg-[var(--apple-blue)] active:scale-95"
          >
            Add
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
