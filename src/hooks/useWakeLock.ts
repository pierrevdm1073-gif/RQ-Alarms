import { useEffect, useRef } from 'react';

export function useWakeLock(isActive: boolean = true) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isActive) {
        try {
          // @ts-ignore
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          
          wakeLockRef.current.addEventListener('release', () => {
            if (mounted && isActive) {
              // Automatically try to re-acquire on release if still active
              // Some browsers release it on tab switch, so we listen to visibility change below
            }
          });
        } catch (err) {
          console.warn('Wake Lock error:', err);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };

    if (isActive) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(console.warn);
      wakeLockRef.current = null;
    }

    return () => {
      mounted = false;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.warn);
        wakeLockRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);
}
