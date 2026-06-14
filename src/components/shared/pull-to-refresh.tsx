'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const controls = useAnimation();
  const router = useRouter();
  
  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull to refresh if we are at the very top of the page
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;
    
    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    if (diff > 0) {
      // Add resistance
      const pullAmount = Math.min(diff * 0.4, MAX_PULL);
      setPullY(pullAmount);
      
      // Prevent default scrolling when pulling down
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(THRESHOLD); // Hold at threshold while refreshing
      
      try {
        // Trigger actual refresh
        router.refresh();
        // Artificial delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setIsRefreshing(false);
        setPullY(0);
      }
    } else {
      // Spring back to top if threshold not met
      setPullY(0);
    }
  };

  useEffect(() => {
    controls.start({ y: pullY, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
  }, [pullY, controls]);

  return (
    <div 
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 top-0 flex justify-center items-end pb-4"
        style={{ height: `${MAX_PULL}px`, transform: `translateY(-${MAX_PULL}px)` }}
      >
        <motion.div
          animate={{
            rotate: isRefreshing ? 360 : (pullY / THRESHOLD) * 180,
            opacity: pullY > 10 ? 1 : 0
          }}
          transition={{
            rotate: isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }
          }}
          className="rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] p-2 shadow-sm backdrop-blur-xl"
        >
          <RefreshCw className="h-5 w-5 text-[var(--text-secondary)]" />
        </motion.div>
      </div>

      {/* Content wrapper */}
      <motion.div animate={controls}>
        {children}
      </motion.div>
    </div>
  );
}
