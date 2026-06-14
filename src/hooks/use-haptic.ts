'use client';

import { useCallback } from 'react';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Custom hook to trigger haptic feedback (vibration) on supported devices.
 * Uses the navigator.vibrate API. Safe to call on iOS (it will just be ignored).
 */
export function useHaptic() {
  const trigger = useCallback((type: HapticFeedbackType = 'medium') => {
    if (typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
        case 'success':
          navigator.vibrate([10, 50, 20]);
          break;
        case 'warning':
          navigator.vibrate([20, 50, 10]);
          break;
        case 'error':
          navigator.vibrate([30, 50, 30, 50, 30]);
          break;
        default:
          navigator.vibrate(20);
      }
    } catch (err) {
      // Ignore vibration errors
      console.warn('Haptic feedback failed:', err);
    }
  }, []);

  return { haptic: trigger };
}
