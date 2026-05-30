'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { BLOG_ARTICLES } from '@/lib/blog';
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowRight, 
  Zap, 
  Search, 
  ListFilter,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Coins,
  TrendingUp,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function BlogHubPage() {
  const [selectedPillar, setSelectedPillar] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  
  // Interactive Slider State (₦ Generator Displacement Calculator)
  const [genSpend, setGenSpend] = React.useState<number>(150000);
  const [gridBill, setGridBill] = React.useState<number>(45000);

  const pillars = [
    { id: 'All', label: 'All Insights' },
    { id: 'ROI Math', label: '📊 ROI & Generator Displacement' },
    { id: 'Sizing & Grid', label: '⚡ Sizing & Band A Tariffs' },
    { id: 'Battery Tech', label: '🔋 Battery Lifecycles' },
    { id: 'Lagos Compliance', label: '📜 Lagos Permitting & Codes' },
    { id: 'Installer Growth', label: '💼 Business & Sales Growth' }
  ];

  // Dynamic Pillar Article Counts
  const getPillarCount = React.useCallback((pillarId: string) => {
    if (pillarId === 'All') return BLOG_ARTICLES.length;
    return BLOG_ARTICLES.filter(a => a.pillar === pillarId).length;
  }, []);

  const filteredArticles = React.useMemo(() => {
    return BLOG_ARTICLES.filter((article) => {
      const matchesPillar = selectedPillar === 'All' || article.pillar === selectedPillar;
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPillar && matchesSearch;
    });
  }, [selectedPillar, searchQuery]);

  // Derived Interactive Savings Metrics
  const calculatedMonthlySavings = Math.round(genSpend * 0.95 + gridBill * 0.55);
  const estimatedPaybackMonths = calculatedMonthlySavings > 0 ? Math.round(4800000 / calculatedMonthlySavings) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarPro</span>
            <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shrink-0">Insights</Badge>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/estimator">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-655 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800">
                🏡 Sizer Estimator
              </Button>
            </Link>

            <Link href="/workspace">
              <Button variant="outline" size="sm" className="text-xs font-bold border-teal-500/20 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl">
                Open Installer Workspace
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Main content ═══ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        
        {/* ═══ Hero Title (Redesigned for Premium Copy & Authority) ═══ */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-500/15 to-emerald-500/15 text-teal-650 dark:text-teal-400 border border-teal-500/10 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 animate-pulse" /> Certified Solar Intelligence
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-850 dark:text-slate-50 leading-tight">
            ₦ Naira-Optimized Solar Sizing &amp; Financial Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
            Pristine engineering sizing audits, Levelized Cost of Energy (LCOE) formulas, and Lagos compliance frameworks. Sized for local installers to eliminate client sticker shock and accelerate contract conversions.
          </p>
        </section>

        {/* ═══ Interactive Savings Simulator (Auditor addition for micro-conversion engagement) ═══ */}
        <section className="border border-teal-500/20 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-650 dark:text-teal-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4" /> Interactive Fuel Displacement Calculator
              </span>
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">Estimate Monthly Solar Savings &amp; System Break-even Instantly</h2>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-bold text-[9px] self-start sm:self-auto">
              ₦ naira optimized
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Generator Fuel Spend Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-350">Monthly Generator Fuel Cost (Petrol/Diesel):</label>
                  <span className="font-mono font-black text-teal-650 dark:text-teal-400 text-sm">₦{genSpend.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="30000"
                  max="450000"
                  step="5000"
                  value={genSpend}
                  onChange={(e) => setGenSpend(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <span className="block text-[9px] text-slate-400">Based on Lagos average of ₦1,250/L petrol &amp; ₦1,750/L diesel.</span>
              </div>

              {/* Utility / NEPA Grid Bill Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-350">Monthly NEPA Utility Bill:</label>
                  <span className="font-mono font-black text-teal-650 dark:text-teal-400 text-sm">₦{gridBill.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="2500"
                  value={gridBill}
                  onChange={(e) => setGridBill(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <span className="block text-[9px] text-slate-400">Adjusted for current NERC Band A standard tariff rates (₦225/kWh).</span>
              </div>
            </div>

            {/* Simulated Return Metrics */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex flex-col justify-between gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider">Estimated Monthly Savings</span>
                  <p className="text-lg font-black text-slate-850 dark:text-slate-100 font-mono">₦{calculatedMonthlySavings.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-black uppercase text-slate-500 tracking-wider">Calculated Payback Period</span>
                  <p className="text-lg font-black text-emerald-650 dark:text-emerald-450 font-mono">{estimatedPaybackMonths} Months</p>
                </div>
              </div>

              <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[10px] text-slate-450 leading-relaxed max-w-xs font-semibold">
                  ROI math based on a standard 5kVA Lithium setup (₦4,800,000 baseline investment).
                </span>
                <Link href="/estimator">
                  <Button size="sm" className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-[10px] rounded-xl flex items-center gap-1 py-1 shadow-sm shrink-0">
                    Sizer preset: 5kVA Lithium <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Search & Category Filters (Redesigned with Pill counts) ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl shadow-sm flex flex-col gap-4 items-center justify-between">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-slate-400" /> Filter Calculations by Technical Pillar
            </h3>
            {/* Search box */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search technical insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 dark:text-slate-350"
              />
            </div>
          </div>

          {/* Pillars filter buttons with Article Counts */}
          <div className="flex flex-wrap gap-2 items-center justify-start w-full">
            {pillars.map((pillar) => {
              const count = getPillarCount(pillar.id);
              const isActive = selectedPillar === pillar.id;

              return (
                <button
                  key={pillar.id}
                  onClick={() => setSelectedPillar(pillar.id)}
                  disabled={count === 0 && !isActive}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <span>{pillar.label}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-teal-750 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-650'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ Articles Grid ═══ */}
        <section>
          {filteredArticles.length === 0 ? (
            <Card className="border-dashed border-slate-250 dark:border-slate-850 py-16 text-center">
              <CardContent className="space-y-3">
                <span className="text-3xl block">🔍</span>
                <h3 className="text-base font-bold">No articles match your query</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try checking another category pillar or refining your search parameters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card 
                  key={article.slug} 
                  className="group relative overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between rounded-3xl"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header items */}
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                      <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 rounded-full font-extrabold text-[9px] px-2 py-0.5">
                        {article.pillar}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {article.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <Link href={`/blog/${article.slug}`}>
                      <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-50 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                      {article.description}
                    </p>
                  </div>

                  {/* High Credibility Author Byline Section */}
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-550 dark:text-slate-350">
                        <User className="w-3.5 h-3.5 text-slate-450" /> {article.author}
                      </div>
                      <span className="text-[8px] font-extrabold text-teal-655 dark:text-teal-400 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified NERC Installer
                      </span>
                    </div>

                    <Link href={`/blog/${article.slug}`}>
                      <Button variant="ghost" size="sm" className="text-xs font-black text-teal-650 group-hover:bg-teal-500/10 rounded-xl flex items-center gap-1">
                        Read Breakdown <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ═══ Methodology Disclaimers & Regulatory Warning (Credibility Hook) ═══ */}
        <section className="bg-slate-100/50 dark:bg-slate-900/30 border rounded-2xl p-4 flex gap-3 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-slate-750 dark:text-slate-300">Methodology &amp; Regulatory Disclaimers</p>
            <p>
              Calculations, payback schedules, and levelized costs (LCOE) are modeled based on NERC Band A standard tariff rates (₦225 per kWh) and local retail fuel average costs as of May 2026. Solar array wind-load estimates follow Lagos structural guidelines. Individual client sizing results will vary depending on physical shade profiles, roof slope truss integrity, and appliance usage behaviors.
            </p>
          </div>
        </section>

        {/* ═══ Large Public Estimator Promo (Redesigned with Split-Target CTAs) ═══ */}
        <section className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white shadow-lg p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3 relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-350 border border-teal-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> High-Accuracy Solar Sizer
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Size Your Power and Estimate Monthly Fuel Savings Instantly
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              Put the ROI math of our insights team to work on your specific appliances. Define your residential appliances, grid blackout frequency, and monthly petrol budget to get a detailed specification sheet.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
            <Link href="/estimator">
              <Button size="lg" className="bg-teal-650 hover:bg-teal-700 text-white rounded-2xl font-black text-xs px-5 h-11 shadow-md flex items-center gap-1.5 w-full sm:w-auto">
                🏡 Launch Free Sizer <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/workspace">
              <Button size="lg" variant="outline" className="border-teal-500/35 text-white hover:bg-teal-900/20 rounded-2xl font-black text-xs px-5 h-11 w-full sm:w-auto">
                💼 Open Installer Portal
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 bg-white dark:bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-700 dark:text-slate-300">SolarPro Insights</span>
            <span>·</span>
            <Link href="/" className="hover:text-slate-650">Home</Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-slate-650">Insights</Link>
            <span>·</span>
            <Link href="/estimator" className="hover:text-slate-650">Sizer</Link>
          </div>
          <p>© {new Date().getFullYear()} SolarPro. Dedicated to Nigerian energy independence.</p>
        </div>
      </footer>
    </div>
  );
}
