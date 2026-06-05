'use client';
import * as React from 'react';
import CountUp from 'react-countup';

const STATS = [
  { icon: '📋', value: 1200, suffix: '+', label: 'Proposals Generated' },
  { icon: '⚡', value: 340, suffix: '+', label: 'Active Installers' },
  { icon: '₦', value: 2.4, suffix: 'B+', label: 'in Solar Projects', decimals: 1 },
  { icon: '⭐', value: 4.8, suffix: '/5', label: 'Avg Installer Rating', decimals: 1 },
];

const CHIPS = [
  { initials: 'EA', quote: 'Closed 4 deals in one week using SolarPro proposals', author: 'Emeka A., Lagos Installer' },
  { initials: 'NF', quote: 'Calculated my savings in 2 minutes, no tech knowledge needed', author: 'Ngozi F., Homeowner, Abuja' },
];

export function TrustStatsCard() {
  const [started, setStarted] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-4">
      <div className="bg-[#111827] border-l-4 border-teal-500 rounded-xl p-5 space-y-3">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-7 text-center text-base">{s.icon}</span>
            <div className="flex-1">
              <span className="font-black text-white text-lg leading-none">
                {started ? (
                  <CountUp end={s.value} decimals={s.decimals ?? 0} duration={1.8} />
                ) : (
                  <span>{s.decimals ? s.value.toFixed(s.decimals) : s.value}</span>
                )}
                {s.suffix}
              </span>
              <span className="text-slate-400 text-xs ml-2 font-medium">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {CHIPS.map((c) => (
          <div key={c.initials} className="bg-[#111827] rounded-xl p-3 flex gap-3 items-start border border-slate-800">
            <div className="shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-black">{c.initials}</div>
            <div>
              <p className="text-white text-xs italic leading-relaxed">"{c.quote}"</p>
              <p className="text-teal-400 text-[10px] font-bold mt-1">★★★★★ — {c.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
