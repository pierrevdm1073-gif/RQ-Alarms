import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isLocked: boolean;
  request: () => Promise<boolean>;
  release: () => Promise<boolean>;
  toggle: () => Promise<boolean>;
  error: Error | null;
}

/**
 * Custom React hook for the Screen Wake Lock API.
 * Keeps the screen awake during active dispatches, navigation, and duty operations.
 * Automatically handles re-acquisition on tab visibility changes and user interactions.
 */
export function useWakeLock(isActive: boolean = true): UseWakeLockReturn {
  const isSupported = typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const wakeLockSentinelRef = useRef<any>(null);
  const shouldBeActiveRef = useRef<boolean>(isActive);

  useEffect(() => {
    shouldBeActiveRef.current = isActive;
  }, [isActive]);

  const request = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    // Already locked and not released
    if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
      setIsLocked(true);
      return true;
    }

    try {
      // @ts-ignore
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinelRef.current = sentinel;
      setIsLocked(true);
      setError(null);

      sentinel.addEventListener('release', () => {
        setIsLocked(false);
        wakeLockSentinelRef.current = null;
        
        // Re-acquire if still requested, document is visible, and component is mounted
        if (
          shouldBeActiveRef.current && 
          typeof document !== 'undefined' && 
          document.visibilityState === 'visible'
        ) {
          // Add a minor debounce before re-requesting to avoid browser race conditions
          setTimeout(() => {
            if (shouldBeActiveRef.current && !wakeLockSentinelRef.current) {
              request().catch(() => {});
            }
          }, 250);
        }
      });

      return true;
    } catch (err: any) {
      // NotAllowedError is common if called before user gesture or permissions policy
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        console.warn('Screen Wake Lock request failed:', err);
      }
      setIsLocked(false);
      setError(err);
      return false;
    }
  }, [isSupported]);

  const release = useCallback(async (): Promise<boolean> => {
    if (!wakeLockSentinelRef.current) {
      setIsLocked(false);
      return true;
    }

    try {
      await wakeLockSentinelRef.current.release();
      wakeLockSentinelRef.current = null;
      setIsLocked(false);
      return true;
    } catch (err: any) {
      console.warn('Screen Wake Lock release failed:', err);
      setIsLocked(false);
      setError(err);
      return false;
    }
  }, []);

  const toggle = useCallback(async (): Promise<boolean> => {
    if (isLocked) {
      const released = await release();
      return !released;
    } else {
      return await request();
    }
  }, [isLocked, request, release]);

  // Handle visibility changes and automatic activation based on isActive
  useEffect(() => {
    if (!isSupported) return;

    let isMounted = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldBeActiveRef.current) {
        request().catch(() => {});
      }
    };

    // User interaction listener to acquire if blocked initially by browser autoplay/gesture policy
    const handleUserInteraction = () => {
      if (shouldBeActiveRef.current && !wakeLockSentinelRef.current && isMounted) {
        request().catch(() => {});
      }
    };

    if (isActive) {
      request().catch(() => {});
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('click', handleUserInteraction, { passive: true });
      window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    } else {
      release().catch(() => {});
    }

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
    };
  }, [isActive, isSupported, request, release]);

  return {
    isSupported,
    isLocked,
    request,
    release,
    toggle,
    error,
  };
}
