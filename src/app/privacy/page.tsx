'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { CopyrightYear } from '@/components/ui/CopyrightYear';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-45 border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-655 transition-colors" />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-350">Back to Home</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-3 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-655 dark:text-teal-400 border border-teal-500/20">
            <Shield className="w-3.5 h-3.5" /> Data Protection Charter
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-850 dark:text-slate-50 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Last Updated: June 2026. How SolarQuotePro handles and protects your solar design data.
          </p>
        </div>

        {/* Bento summary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-2">
            <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Local-First Storage</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              All initial calculator configurations are saved to local indexed browser caches before upload.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-2">
            <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Eye className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">No Third-Party Sharing</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              We never sell or distribute homeowner leads or installer performance statistics to third parties.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-2">
            <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Database className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Secure Database</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Data synchronized to our Supabase database is guarded by Row-Level Security (RLS) constraints.
            </p>
          </div>
        </div>

        {/* Section Contents */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Information We Collect
            </h2>
            <p className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed font-semibold">
              SolarQuotePro collects technical information necessary to size solar arrays, calculate payback thresholds, and generate professional proposals. This includes:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-semibold">
              <li><strong>Appliance Configurations:</strong> Load specifications, runtimes, and surge parameters.</li>
              <li><strong>Utility Rates:</strong> DisCo tariffs (including NERC Band classifications) and fuel expenditure estimates.</li>
              <li><strong>Installer Profiles:</strong> Company details, logo formats, branding primary/secondary colors, and pricing matrices.</li>
              <li><strong>Homeowner Details:</strong> Contact name, phone, email, and property city locations (for calculating peak sun hours).</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              2. How We Use Your Data
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              The data we capture is strictly used to:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-semibold">
              <li>Synthesize dynamic interactive proposal views for clients.</li>
              <li>Maintain tracking updates (e.g. Sent, Viewed, Approved status) for installer workspaces.</li>
              <li>Improve automated sizing estimators and city configurations based on aggregated load data.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              3. Data Retention and Safety
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              SolarQuotePro stores your information locally in browser memory using IndexedDB for uninterrupted offline capability. When connected to the internet, proposals are synchronized to our secure PostgreSQL database managed via Supabase. We retain this data as long as your installer profile remains active.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              4. Contact Us
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              If you have any questions about this Privacy Policy or wish to request data deletion, please contact our support team at <strong className="text-slate-800 dark:text-slate-200">privacy@solarquotepro.ng</strong>.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 bg-white dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-450">
          <p>© <CopyrightYear /> SolarQuotePro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
