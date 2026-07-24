'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Home, Flame, Zap, ShieldAlert, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-slate-100/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-500">
        
        {/* Animated Solar/Grid Outage Icon Group */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/5 rounded-full animate-ping duration-1000" />
          <div className="absolute inset-2 border-2 border-dashed border-teal-500/40 rounded-full animate-[spin_20s_linear_infinite]" />
          
          <div className="relative w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-9 h-9 text-amber-500 animate-[bounce_2s_infinite]" />
          </div>
          
          {/* Smaller floating icons */}
          <span className="absolute -top-1 -right-1 p-1 bg-teal-500/10 dark:bg-teal-500/20 text-teal-655 dark:text-teal-400 rounded-lg">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span className="absolute -bottom-1 -left-1 p-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg animate-pulse">
            <Flame className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Text Copy */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
            Error 404 • Lost Connection
          </div>
          <h1 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
            Grid Connection Lost
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold leading-relaxed max-w-sm mx-auto">
            The page you are looking for has disconnected from the SolarQuotePro grid. Let's reroute you to backup power.
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

        {/* Interactive Navigation Quick Links */}
        <div className="space-y-3">
          <Link href="/workspace" className="block w-full">
            <Button className="w-full h-11 bg-teal-650 hover:bg-teal-700 text-white font-extrabold rounded-xl transition-all shadow-md gap-2">
              <Home className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/estimator" className="block">
              <Button variant="outline" className="w-full h-10 text-[11px] font-extrabold rounded-xl border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                Savings Estimator
              </Button>
            </Link>
            <Link href="/pricing" className="block">
              <Button variant="outline" className="w-full h-10 text-[11px] font-extrabold rounded-xl border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Trust/Offline Hint */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          <span>SolarQuotePro Nigeria • 100% Offline Capable</span>
        </div>

      </div>
    </div>
  );
}
