import React, { useState, useEffect } from 'react';
import { detectDevice, DeviceDiagnostics } from '../utils/device';
import { Smartphone, ShieldAlert, QrCode, Copy, Check, Terminal, ExternalLink, ArrowRight, Laptop, Sparkles } from 'lucide-react';
import Logo from './Logo';

interface AndroidGateProps {
  children: React.ReactNode;
}

export default function AndroidGate({ children }: AndroidGateProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceDiagnostics | null>(null);
  const [simulatedAndroid, setSimulatedAndroid] = useState<boolean>(() => {
    return localStorage.getItem('rq_android_simulator_mode') === 'true';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDeviceInfo(detectDevice());
  }, []);

  const toggleSimulation = () => {
    const nextVal = !simulatedAndroid;
    setSimulatedAndroid(nextVal);
    localStorage.setItem('rq_android_simulator_mode', nextVal ? 'true' : 'false');
  };

  const handleCopyLink = () => {
    const url = window.location.origin + '/driver';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // If loading diagnostics
  if (!deviceInfo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-mono tracking-wider">Verifying Hardware & OS Profile...</span>
        </div>
      </div>
    );
  }

  // If running on a genuine Android device OR simulated mode is active
  if (deviceInfo.isAndroid || simulatedAndroid) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        {/* Floating Simulation Badge for Testers/Developers on non-Android */}
        {!deviceInfo.isAndroid && simulatedAndroid && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 backdrop-blur-md text-slate-950 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-xl border border-amber-300">
            <Smartphone size={13} className="stroke-[2.5]" />
            <span>Simulating Android MDT</span>
            <button
              onClick={toggleSimulation}
              className="ml-2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold hover:bg-black transition-colors"
            >
              Exit
            </button>
          </div>
        )}

        {children}
      </div>
    );
  }

  // Non-Android Block Screen / MDT Gate
  const driverUrl = typeof window !== 'undefined' ? `${window.location.origin}/driver` : '';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(driverUrl)}&bgcolor=141414&color=10b981&margin=2`;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-x-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header Branding & Security Icon */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <Logo size="sm" className="invert brightness-200" />
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-mono font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Android OS Only
          </div>
        </div>

        {/* Warning / Restriction Notice */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Android MDT Terminal Required
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Tactical field response console is restricted to authorized Android mobile devices.
              </p>
            </div>
          </div>
        </div>

        {/* Hardware & Diagnostics Comparison Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3 font-mono text-xs">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
            <Terminal size={13} />
            <span>Environment Diagnostics</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-1">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">Detected OS</span>
              <span className="text-amber-400 font-bold text-sm truncate block mt-0.5">
                {deviceInfo.os}
              </span>
              <span className="text-slate-500 text-[10px] truncate block">{deviceInfo.browser}</span>
            </div>

            <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-emerald-500/80 text-[10px] block">Required Platform</span>
              <span className="text-emerald-400 font-bold text-sm block mt-0.5">
                Android 10+
              </span>
              <span className="text-emerald-500/70 text-[10px] block">MDT Vehicle Mount</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Required Sensors:</span>
            <span className="text-slate-300 font-bold">GPS Telemetry • Push Daemon • Offline DB</span>
          </div>
        </div>

        {/* QR Code Quick Scan for Mobile Android */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 mb-6 text-center flex flex-col sm:flex-row items-center gap-5">
          <div className="bg-white p-2.5 rounded-2xl shadow-lg shrink-0 border-2 border-emerald-500/40">
            <img 
              src={qrApiUrl} 
              alt="Scan QR code with Android" 
              className="w-32 h-32 rounded-lg"
              loading="lazy"
            />
          </div>

          <div className="text-left space-y-2 flex-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <QrCode size={18} />
              <span>Scan with Android Device</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan this QR code using your Android camera or Chrome browser to launch the Driver Terminal instantly on your vehicle mount.
            </p>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Link Copied!' : 'Copy Terminal URL'}</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Simulator Bypass */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <a
            href="/admin"
            className="w-full sm:w-auto text-xs text-slate-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-800/60 transition-colors text-center font-medium flex items-center justify-center gap-2"
          >
            <Laptop size={14} /> Go to Chrome Dispatch
          </a>

          {/* Tester / Developer Simulation Mode Toggle */}
          <button
            onClick={toggleSimulation}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Enable simulated Android terminal for testing in desktop browser"
          >
            <Sparkles size={14} />
            <span>Simulate Android MDT</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <footer className="mt-8 text-center text-slate-600 text-xs tracking-widest uppercase font-mono">
        RQ Tactical Systems • Field Response Device Authorization
      </footer>
    </div>
  );
}
