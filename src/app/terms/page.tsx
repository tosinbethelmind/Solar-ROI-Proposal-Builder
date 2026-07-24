'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, Shield, FileText, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { CopyrightYear } from '@/components/ui/CopyrightYear';
import { LegalNotice } from '@/components/ui/LegalNotice';

export default function TermsOfService() {
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
            <Scale className="w-3.5 h-3.5" /> Legal Terms
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-850 dark:text-slate-50 leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Last Updated: June 2026. The terms governing your usage of the SolarQuotePro proposal builder platform.
          </p>
        </div>

        {/* Bento summary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-2">
            <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Accurate Sizing</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Installers are solely responsible for verifying final site dimensions and beam capacities.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-2">
            <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Quote Legitimacy</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Calculations are guidelines; local state regulations and physical surveys govern safety approvals.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-2">
            <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Account Safety</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Keep your credentials and design tokens secure. You are liable for any client links generated.
            </p>
          </div>
        </div>

        {/* Section Contents */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Acceptance of Terms
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              By accessing or using SolarQuotePro, you agree to comply with and be bound by these Terms of Service. These terms apply to all visitors, solar installers, developers, and homeowners who access the website.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              2. Sizing Estimations & Disclaimer
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              SolarQuotePro provides software calculations to estimate solar payload specifications, battery runtimes, and generator fuel replacement statistics. These figures represent models based on average peak sun hours in Nigeria and installer inputs:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-semibold">
              <li>All pricing estimates are subject to FX volatility; final pricing is configured by the specific installer.</li>
              <li>Calculations do not replace a physical structural roof survey. Beams and truss conditions must be inspected by certified professionals before panel mountings.</li>
              <li>Grid integration compliance is subject to local DisCo permits.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-805 pb-2">
              3. Installer Workspace and Account Billing
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              Installers creating profiles or purchasing subscription packages (Starter, Pro, or Combined Directory Listing) agree to provide complete registered details (e.g. business/CAC names). Subscription cycles are billed monthly, quarterly, or annually, with bank transfer confirmations verified within 1-2 business hours.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              4. Governing Law
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              These terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising out of the platform usage will be subject to the exclusive jurisdiction of the state courts in Lagos.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 bg-white dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-450">
          <div>
            <p>© <CopyrightYear /> SolarQuotePro. All rights reserved.</p>
            <LegalNotice />
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
