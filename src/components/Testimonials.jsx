'use client';

import * as React from 'react';

const TESTIMONIALS = [
  {
    quote: "Acme Solar closed ₦5M deal using Professional plan",
    author: "Mr. Tunde",
    role: "Lagos Installer",
    rating: 5,
    tag: "Professional Plan User",
    avatar: "T"
  },
  {
    quote: "Saved ₦1.8M/year on generator fuel",
    author: "Mrs. Amina",
    role: "Lagos Homeowner",
    rating: 5,
    tag: "Free Estimator User",
    avatar: "A"
  },
  {
    quote: "7-day trial led to 40 proposals/month",
    author: "SolarExpress team",
    role: "Abuja EPC Firm",
    rating: 5,
    tag: "Professional Plan Trial",
    avatar: "SE"
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-slate-900 text-white border-t border-b border-slate-800 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-3 mb-12">
          <span className="inline-block bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full">
            🔥 Proof of ROI
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Nigerian Installers &amp; Homeowners Are Winning
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-lg mx-auto">
            From sole installers closing their first multi-million Naira projects to residents cutting generator fuel bills in half.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={idx} 
              className="bg-slate-950 border border-slate-850 hover:border-teal-500/30 transition-all duration-300 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-md relative group hover:-translate-y-1"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4 text-amber-500 text-sm">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-base font-bold text-slate-100 mb-6 leading-snug">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-900">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{t.author}</h4>
                  <p className="text-slate-400 text-[10px] font-medium">{t.role}</p>
                </div>
                <span className="ml-auto inline-block bg-slate-800/80 text-teal-450 border border-slate-700/50 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {t.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
