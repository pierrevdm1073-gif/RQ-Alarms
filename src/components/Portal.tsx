import React from 'react';
import { useNavigate } from 'react-router';
import Logo from './Logo';
import { Shield, Truck, ChevronRight, Laptop, Smartphone, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rq-gold/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <header className="p-8 relative z-10">
        <Logo size="lg" className="invert brightness-200" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-4xl w-full text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-4"
          >
            RQ <span className="text-rq-gold">OPERATIONS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto"
          >
            Secure, real-time dispatch and fleet management system. 
            Choose your authorized interface to continue.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Dispatch Section (Runs in Chrome) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin')}
            className="group relative bg-[#141414] border border-slate-800 rounded-3xl p-8 text-left transition-all hover:border-rq-gold/50 hover:bg-[#1A1A1A] cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-rq-gold/10 text-rq-gold rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield size={32} />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs font-mono font-medium">
                <Laptop size={13} className="text-rq-gold" />
                Runs in Chrome
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-between">
              <span>Dispatch Workstation</span>
              <ChevronRight className="text-slate-600 group-hover:text-rq-gold group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Control room console, alarm monitoring, real-time fleet map, AI shift summaries, and dispatcher controls.
            </p>
            <div className="text-[11px] text-rq-gold/90 font-mono flex items-center gap-1.5">
              <span>✓ Sized for Google Chrome desktop workstations</span>
            </div>
          </motion.button>

          {/* Driver Terminal (Only runs on Android) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/driver')}
            className="group relative bg-[#141414] border border-slate-800 rounded-3xl p-8 text-left transition-all hover:border-emerald-500/50 hover:bg-[#1A1A1A] cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Truck size={32} />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 rounded-full text-xs font-mono font-medium">
                <Smartphone size={13} />
                Android Only
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-between">
              <span>Driver Terminal (MDT)</span>
              <ChevronRight className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Tactical mobile-first interface for field responders with live GPS telemetry, navigation, and offline tile caching.
            </p>
            <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1.5">
              <span>✓ Restricted to Android mobile devices</span>
            </div>
          </motion.button>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-600 text-xs tracking-widest uppercase font-mono">
        © 2024 RQ Operations • Chrome Dispatch & Android MDT Network
      </footer>
    </div>
  );
}

