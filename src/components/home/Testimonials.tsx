'use client';
export const TESTIMONIALS = [
  {
    initials: 'EA', name: 'Emeka Adeyemi', company: 'Lekki Clean Energy Ltd', location: 'Lagos',
    badge: 'Solo Installer — Starter Plan',
    quote: 'Before SolarQuotePro I was sending handwritten quotes. Now I send a branded PDF in 3 minutes. I closed 4 deals in my first week.',
  },
  {
    initials: 'CO', name: 'Chidi Okonkwo', company: 'Greenfield Solar NG', location: 'Abuja',
    badge: 'Team Lead — Professional Plan',
    quote: 'The generator ROI comparison chart literally sells the system for me. Clients see the payback date and sign the same day.',
  },
  {
    initials: 'NF', name: 'Ngozi Fashola', company: 'Homeowner', location: 'Surulere, Lagos',
    badge: 'Free Plan User',
    quote: 'I had no idea I was spending ₦180,000 a month on generator fuel. The free estimator showed me I\'d pay back solar in under 2 years.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-10">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">Proof</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">Installers Across Nigeria Are Closing Deals Faster</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t) => (
          <div key={t.initials} className="bg-[#111827] border-t-4 border-teal-500 rounded-2xl p-5 space-y-4">
            <p className="text-yellow-400 text-xs tracking-wide">★★★★★</p>
            <p className="text-slate-200 text-sm italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-black shrink-0">{t.initials}</div>
              <div>
                <p className="text-white text-xs font-bold">{t.name}</p>
                <p className="text-slate-400 text-[10px]">{t.company} · {t.location}</p>
              </div>
            </div>
            <span className="inline-block bg-slate-800 text-slate-400 text-[9px] font-bold px-2 py-1 rounded-full">{t.badge}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TestimonialChips() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      {TESTIMONIALS.slice(0, 2).map((t) => (
        <div key={t.initials} className="flex-1 bg-[#111827] border border-slate-800 rounded-xl p-3 flex gap-2 items-start">
          <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center text-white text-[10px] font-black shrink-0">{t.initials}</div>
          <div>
            <p className="text-yellow-400 text-[9px]">★★★★★</p>
            <p className="text-slate-300 text-[10px] italic leading-relaxed">&ldquo;{t.quote.slice(0, 80)}…&rdquo;</p>
            <p className="text-teal-400 text-[9px] font-bold mt-0.5">— {t.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
