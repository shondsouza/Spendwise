"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const MINIMUM_DISPLAY_TIME = 900;
const FALLBACK_DISPLAY_TIME = 1800;

export function PwaLaunchSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const isMobile = window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches;

    if (!isStandalone || !isMobile) {
      return;
    }

    const startedAt = Date.now();
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const closeSplash = () => {
      const elapsed = Date.now() - startedAt;
      const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsed);

      leaveTimer = setTimeout(() => setIsLeaving(true), remainingTime);
    };

    setIsVisible(true);

    if (document.readyState === "complete") {
      closeSplash();
    } else {
      window.addEventListener("load", closeSplash, { once: true });
    }

    fallbackTimer = setTimeout(closeSplash, FALLBACK_DISPLAY_TIME);

    return () => {
      window.removeEventListener("load", closeSplash);
      if (leaveTimer) clearTimeout(leaveTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`pwa-launch-splash${isLeaving ? " pwa-launch-splash--leaving" : ""}`}
      aria-label="Loading SpendWise"
      role="status"
    >
      <div className="pwa-launch-splash__content">
        <div className="pwa-launch-splash__logo-wrap">
          <Image
            className="pwa-launch-splash__logo"
            src="/logo/desktop.png"
            alt=""
            width={96}
            height={96}
            priority
          />
        </div>
        <span className="pwa-launch-splash__wordmark">SpendWise</span>
        <span className="sr-only">Loading SpendWise</span>
      </div>
    </div>
  );
}
