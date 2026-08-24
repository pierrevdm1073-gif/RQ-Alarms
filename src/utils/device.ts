/**
 * Device and Browser detection utilities for RQ Security Dispatch & MDT System
 */

export interface DeviceDiagnostics {
  os: string;
  browser: string;
  isAndroid: boolean;
  isChrome: boolean;
  isMobile: boolean;
  screenResolution: string;
}

export function detectDevice(): DeviceDiagnostics {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      os: 'Unknown',
      browser: 'Unknown',
      isAndroid: false,
      isChrome: false,
      isMobile: false,
      screenResolution: 'Unknown',
    };
  }

  const ua = navigator.userAgent || '';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Detect OS
  if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS (Apple)';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Check modern client hints if available
  const userAgentData = (navigator as any).userAgentData;
  if (userAgentData?.platform) {
    if (/Android/i.test(userAgentData.platform)) {
      os = 'Android';
    }
  }

  // Detect Browser
  const isEdge = /Edg|Edge/i.test(ua);
  const isOpera = /OPR|Opera/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !isEdge && !isOpera;

  if (isEdge) browser = 'Microsoft Edge';
  else if (isOpera) browser = 'Opera';
  else if (isFirefox) browser = 'Mozilla Firefox';
  else if (isSafari) browser = 'Safari';
  else if (isChrome) browser = 'Google Chrome';
  else browser = 'Chromium-based Browser';

  const isAndroid = os === 'Android' || /Android/i.test(ua);
  const isMobile = isAndroid || /iPhone|iPad|iPod|Mobile/i.test(ua);
  const screenResolution = `${window.screen?.width || window.innerWidth} × ${window.screen?.height || window.innerHeight}`;

  return {
    os,
    browser,
    isAndroid,
    isChrome,
    isMobile,
    screenResolution,
  };
}

export function isAndroid(): boolean {
  return detectDevice().isAndroid;
}

export function isChromeBrowser(): boolean {
  return detectDevice().isChrome;
}
