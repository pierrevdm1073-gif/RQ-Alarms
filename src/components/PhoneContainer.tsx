import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';
import { isAndroid } from '../utils/device';

interface PhoneContainerProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  isSimulatedOnly?: boolean; // If true, always holds the phone chassis size even on wider monitors
}

export default function PhoneContainer({ children, title, className = '', isSimulatedOnly = false }: PhoneContainerProps) {
  const [timeStr, setTimeStr] = useState('12:00');
  const [isRealAndroid, setIsRealAndroid] = useState(false);

  useEffect(() => {
    setIsRealAndroid(isAndroid());
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // If on a real Android device and not forcing simulation frame, render 100% full screen
  if (isRealAndroid && !isSimulatedOnly) {
    return (
      <div className={`w-full min-h-[100dvh] h-[100dvh] bg-slate-50 flex flex-col overflow-y-auto overflow-x-hidden ${className}`}>
        {children}
      </div>
    );
  }

  // Responsive device container wrapper (Android MDT Mockup for desktop/simulated testing):
  const frameClasses = isSimulatedOnly
    ? `relative w-full max-w-[412px] h-[860px] bg-slate-50 border-[10px] border-slate-900 rounded-[44px] shadow-2xl overflow-hidden flex flex-col ring-4 ring-slate-800/20 mx-auto aspect-[412/860]`
    : `relative w-full md:max-w-[412px] md:h-[860px] bg-slate-50 md:border-[10px] md:border-slate-900 md:rounded-[44px] md:shadow-2xl overflow-hidden flex flex-col md:ring-4 md:ring-slate-800/20 md:mx-auto md:aspect-[412/860] min-h-[100dvh] md:min-h-0`;

  return (
    <div className={`flex flex-col items-center justify-center ${isSimulatedOnly ? '' : 'min-h-screen bg-slate-950/90 py-3 sm:py-6 px-2 sm:px-4'}`}>
      <div className={frameClasses}>
        {/* Android Punch Hole Camera (Top Center) */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 rounded-full z-50 flex items-center justify-center pointer-events-none ring-1 ring-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900/80"></div>
        </div>

        {/* Android System Status Bar */}
        <div className="bg-slate-900 text-slate-200 px-5 pt-2 pb-1.5 flex justify-between items-center text-[11px] font-mono tracking-tight select-none border-b border-slate-800 shrink-0 z-40">
          <span className="font-bold text-[12px] text-emerald-400">{timeStr}</span>
          
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-1 py-0.2 rounded border border-emerald-800">5G MDT</span>
            <Signal size={12} className="stroke-[2.5] text-emerald-400" />
            <Wifi size={12} className="stroke-[2.5]" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-bold">98%</span>
              <Battery size={14} className="stroke-[2] text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Display Viewport */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 relative flex flex-col scrollbar-thin ${className}`}>
          {children}
        </div>

        {/* Android System Gesture Bar */}
        <div className="flex justify-center items-center bg-slate-900 py-2 shrink-0 z-40 border-t border-slate-800">
          <div className="w-24 h-1 bg-slate-600 rounded-full opacity-80"></div>
        </div>
      </div>

      {title && (
        <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-slate-400 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{title} (Android MDT)</span>
        </div>
      )}
    </div>
  );
}

