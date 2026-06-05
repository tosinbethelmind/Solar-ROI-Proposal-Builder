'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowRight, ShieldCheck, Smartphone, Clock, Check, LineChart } from 'lucide-react';
import { BLOG_ARTICLES } from '@/lib/blog';
import { AuthButton } from '@/components/auth/AuthButton';
import { TrustStatsCard } from '@/components/home/TrustStatsCard';
import { PricingTable } from '@/components/home/PricingTable';
import { TestimonialsSection, TestimonialChips } from '@/components/home/Testimonials';
import { NewsletterForm } from '@/components/home/NewsletterForm';

export default function SolarProHomepage() {
  const [dieselSpend, setDieselSpend] = React.useState<number>(150000);
  const [gridSpend, setGridSpend] = React.useState<number>(80000);
  const [pricingCycle, setPricingCycle] = React.useState<'monthly' | 'annual'>('monthly');

  const totalWaste = dieselSpend + gridSpend;
  const estimatedSavings = Math.round((dieselSpend * 0.85) + (gridSpend * 0.72));
  const paybackMonths = dieselSpend > 300000 || gridSpend > 150000 ? 18 : 24;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* A1 — Announcement bar */}
      <div className="bg-[#F59E0B] text-[#0A0F1E] py-2 px-4 text-center font-bold text-xs flex flex-wrap items-center justify-center gap-2 z-50 relative">
        <span>⚡ Band A tariffs hit ₦225/kWh this month. Nigerian installers using SolarPro are quoting 3× faster.</span>
        <Link href="/estimator" className="underline font-black whitespace-nowrap hover:opacity-75">→ Estimate My Savings</Link>
      </div>

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-550">SolarPro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Link href="#why-solarpro" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Why SolarPro</Link>
            <Link href="#pricing-tiers" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors text-teal-650 dark:text-teal-400 font-extrabold">Pricing Plans</Link>
            <Link href="#storm-safety" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Safety Standard</Link>
            <Link href="/blog" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Energy Insights</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-655 hover:bg-slate-150 dark:text-slate-350">
                Insights
              </Button>
            </Link>

            <Link href="/workspace" className="hidden sm:block">
              <Button variant="outline" size="sm" className="text-xs font-bold border-teal-500/20 text-teal-655 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl">
                Open Installer Workspace
              </Button>
            </Link>
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* A2 — Hero: installer-first, 2-column */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-white via-slate-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <div className="space-y-6">
              <Badge className="bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full">
                ☀️ Designed for the Nigerian Energy Ecosystem
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                Win More Solar Clients.<br />
                Quote in 3 Minutes.<br />
                <span className="text-teal-600 dark:text-teal-400">Get Paid Faster.</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed font-medium max-w-lg">
                SolarPro gives Nigerian solar installers professional branded proposals, live Naira ROI calculators, and offline field tools — so you never lose a hot lead to a slow quote again.
              </p>
              <div className="space-y-3">
                <Link href="/estimator">
                  <Button size="lg" className="w-full sm:w-auto bg-[#00C896] hover:bg-[#00b386] text-white font-black text-base px-8 h-12 rounded-[10px] shadow-lg hover:shadow-[0_0_20px_rgba(0,200,150,0.4)] hover:scale-[1.03] transition-all duration-200 border-none">
                    → Start Free — No Credit Card Needed
                  </Button>
                </Link>
                <p className="text-[13px] text-[#9CA3AF] font-medium">✅ Free forever plan available. No credit card. Cancel anytime.</p>
              </div>
            </div>
            {/* Right column */}
            <div>
              <TrustStatsCard />
            </div>
          </div>
        </div>
      </section>

      {/* A3 — Trust bar */}
      <div className="bg-[#0F172A] py-4 px-4 overflow-hidden">
        <p className="text-center text-slate-400 text-xs font-medium mb-3">Trusted by installers across Lagos · Abuja · Port Harcourt · Ibadan · Kano</p>
        <div className="animate-marquee flex whitespace-nowrap gap-8 items-center">
          {[0,1].map((gi) => (
            <div key={gi} className="flex items-center gap-6 shrink-0" aria-hidden={gi===1}>
              {['Lekki Clean Energy','SunPower Lagos','Greenfield Solar NG','Abuja Solar Works','EkoSolar Tech'].map((n) => (
                <span key={n} className="text-slate-500 text-xs font-bold border border-slate-700 rounded-lg px-3 py-1 whitespace-nowrap">{n}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* A4 — Calculator */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center space-y-2">
            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
              Monthly Cost Drain
            </Badge>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              How Much Are You Losing Every Month?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Drag the sliders — see your exact Naira savings and solar payback period in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-6">
              {/* Slider 1: Petrol/Diesel Spend */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">🛢️ Monthly Generator Fuel (Petrol/Diesel):</span>
                  <span className="text-teal-650 dark:text-teal-400 font-extrabold text-sm">
                    ₦{dieselSpend.toLocaleString('en-NG')}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="10000" 
                  max="1000000" 
                  step="10000"
                  value={dieselSpend}
                  onChange={(e) => setDieselSpend(Number(e.target.value))}
                  className="w-full h-2 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>₦10,000</span>
                  <span>₦1,000,000</span>
                </div>
              </div>

              {/* Slider 2: NEPA/PHCN Grid Spend */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">⚡ Monthly Grid Bill (Band A/B Tariff):</span>
                  <span className="text-teal-650 dark:text-teal-400 font-extrabold text-sm">
                    ₦{gridSpend.toLocaleString('en-NG')}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="500000" 
                  step="5000"
                  value={gridSpend}
                  onChange={(e) => setGridSpend(Number(e.target.value))}
                  className="w-full h-2 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>₦5,000</span>
                  <span>₦500,000</span>
                </div>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <p className="text-red-500 dark:text-red-400 text-xs font-bold">🔴 At current rates, you&apos;re losing <span className="font-black">₦{totalWaste.toLocaleString('en-NG')}</span> every month you delay going solar.</p>
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">Potential Monthly Savings</div>
                <div className="text-3xl font-black text-slate-850 dark:text-slate-50 tracking-tight leading-none">
                  ₦{estimatedSavings.toLocaleString('en-NG')}
                  <span className="text-xs font-bold text-slate-500 block mt-1">/ month estimated savings</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  By swapping to a custom-configured hybrid solar panel battery system, you offset generator noise and minimize grid dependency.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-teal-500/20 pt-4 text-xs font-bold">
                <span className="text-slate-655 dark:text-slate-350">Avg Payback Period:</span>
                <span className="text-emerald-650 dark:text-emerald-400 font-black text-sm">{paybackMonths} Months</span>
              </div>

              <Link href="/estimator" className="block w-full pt-2">
                <Button className="w-full bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs h-10 rounded-xl border-none">
                  🏡 Launch Full Household Sizer &amp; ROI Tool ➔
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* A5 — Who Are You Here For? */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Who Are You Here For?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Choose your path below.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card-lift bg-white dark:bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4">
            <div className="text-3xl">🏡</div>
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-50">I&apos;m a Homeowner</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Calculate my fuel savings and find a verified installer near me — free.</p>
            <Link href="/estimator"><Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl border-none">Calculate My Savings →</Button></Link>
          </div>
          <div className="card-lift bg-white dark:bg-slate-900 border-2 border-teal-500 rounded-2xl p-6 space-y-4">
            <div className="text-3xl">⚡</div>
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-50">I&apos;m a Solar Installer</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Build professional proposals, size systems, and close more deals — faster than ever.</p>
            <Link href="/workspace"><Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl border-none">Open Installer Workspace →</Button></Link>
          </div>
        </div>
      </section>

      {/* A6 — Core Benefits */}
      <section id="why-solarpro" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">Core Benefits</Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-50">Everything You Need to Close Solar Deals Faster</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Smartphone className="w-6 h-6" />,
              title: "Works on Any Roof, Any Network",
              desc: "Quote and size systems on-site even with zero internet. Your proposals save offline automatically — no signal required."
            },
            {
              icon: <LineChart className="w-6 h-6" />,
              title: "Show Clients Their Exact Payback Date",
              desc: "Live Naira ROI charts compare solar costs against generator fuel and Band A tariffs — so clients say yes faster."
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: "Lagos-Legal Proposals, Every Time",
              desc: "Every proposal includes LSEB certification checks, roof weight compliance, and landlord addendums — built in automatically."
            }
          ].map((item, idx) => (
            <Card key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl shadow-sm hover:shadow-md hover:border-teal-500/20 transition-all duration-300">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400">
                  {item.icon}
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-850 dark:text-slate-100 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* A7 — Testimonials */}
      <TestimonialsSection />

      {/* A8 — Pricing */}
      <section id="pricing-tiers" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-8">
        <div className="text-center space-y-3">
          <Badge className="bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
            ₦ Naira-Optimized Packages
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-50">Sized to Scale Your Solar Sales</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            🔒 No contracts. Cancel anytime. 7-day free trial on Professional. 30-day money-back guarantee on Enterprise.
          </p>
          <div className="pt-3 flex items-center justify-center gap-2 max-w-[280px] mx-auto bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button onClick={() => setPricingCycle('monthly')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all ${pricingCycle==='monthly'?'bg-teal-600 text-white shadow-sm':'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>
              Monthly
            </button>
            <button onClick={() => setPricingCycle('annual')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${pricingCycle==='annual'?'bg-teal-600 text-white shadow-sm':'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>
              Annual <Badge className="bg-emerald-500 text-white font-extrabold text-[8px] uppercase px-1 py-0 border-none shadow-none">Save 20%</Badge>
            </button>
          </div>
        </div>
        <PricingTable cycle={pricingCycle} />
        <TestimonialChips />
      </section>

      {/* ═══ Featured Insights Bento Grid (Blog Section) ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-3">
            <Badge className="bg-teal-500/10 text-teal-650 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">Data &amp; math</Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-850 dark:text-slate-50">From the SolarPro Blog</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md font-medium">
              Read transparent financial breakdowns and regulatory checklists prepared by our engineering insights team.
            </p>
          </div>
          <Link href="/blog">
            <Button variant="ghost" className="text-xs font-black text-teal-650 hover:bg-teal-500/10 rounded-xl flex items-center gap-1 shrink-0">
              View All Insights <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_ARTICLES.slice(0, 3).map((article) => (
            <Card 
              key={article.slug} 
              className="group rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-teal-500/20 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-450">
                  <span className="text-teal-655 dark:text-teal-400 font-extrabold">{article.pillar}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
                </div>

                <Link href={`/blog/${article.slug}`}>
                  <h3 className="font-extrabold text-sm sm:text-base leading-snug text-slate-850 dark:text-slate-550 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                  {article.description}
                </p>
              </div>

              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">{article.date}</span>
                <Link href={`/blog/${article.slug}`}>
                  <Button variant="ghost" size="sm" className="text-xs font-black text-teal-650 group-hover:bg-teal-500/10 rounded-xl flex items-center gap-1">
                    Read <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Not ready to read? Homeowner instant CTA strip */}
        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 rounded-3xl border border-teal-500/20 p-6 text-center space-y-4 max-w-4xl mx-auto mt-8">
          <p className="text-slate-800 dark:text-slate-200 text-sm font-bold leading-normal">
            ⚡ Not ready to read full insights? Estimate your solar capacity and generator fuel savings in 2 minutes.
          </p>
          <Link href="/estimator">
            <Button className="bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs px-6 rounded-xl shadow-md h-10 border-none">
              🏡 Launch Free Homeowner Estimator ➔
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══ Lagos storm Compliance & Regulatory Safety Spotlight ═══ */}
      <section id="storm-safety" className="bg-slate-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-550/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-450/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-350 border border-teal-500/30">
              🛠️ Lagos Safety Compliant
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
              Lagos Structural Safety &amp; Wind Permitting Standard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Lekki, Victoria Island, and coastal Lagos experience severe wind shear during thunderstorms. To safeguard properties and void warranties, SolarPro enforces structural roof guidelines.
            </p>

            <div className="space-y-4">
              {[
                { title: "Aluminum Roof Weight Limit", desc: "Dead load must remain below 15kg/sqm to prevent beam sag and metal truss warping." },
                { title: "EPDM Purlin Mounting", desc: "Mounting screws must attach directly to wood/steel purlins, locked with watertight SikaFlex Polyurethane Sealant." },
                { title: "Tenant Ownership Rights", desc: "Our templates include signed Landlord Addendums identifying removable solar assets." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-xs uppercase">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{step.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-teal-500/20 bg-white/5 border-white/5 backdrop-blur-lg text-white shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="font-extrabold text-sm sm:text-base text-teal-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" /> Installer Compliance checklist
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every proposal generated through SolarPro includes a dedicated safety permit annex highlighting these regulatory compliance requirements for Lagos State grid integrations.
            </p>
            <div className="h-px bg-white/10" />
            <div className="space-y-3">
              {[
                "LSEB certification verified for grid-tie hybrid inverters",
                "EPDM waterproofing washers deployed on aluminum fasteners",
                "Wind shear deflection angle configured under 15 degrees",
                "Polyurethane sealant SikaFlex applied to penetrations"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-250 leading-relaxed">
                  <Check className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/blog/lagos-solar-permitting-compliance-checklist" className="block w-full">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs py-2 h-10 border-none">
                  📋 Download Lagos Compliance Checklist (PDF)
                </Button>
              </Link>
              <Link href="/estimator" className="block w-full">
                <Button variant="outline" className="w-full border-teal-500/30 text-teal-350 hover:bg-teal-950/40 hover:text-white rounded-xl font-bold text-xs py-2 h-10">
                  🏡 Check Solar Savings Before Booking Installer
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>



      {/* ═══ Pricing teaser & Operational Suite ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-500/10 text-emerald-655 border border-emerald-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">Operational suite</Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-850 dark:text-slate-50">Robust Proposal Engineering</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            SolarPro is packed with advanced operational triggers that turn standard field surveys into professional, high-converting customer documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Custom Markup", desc: "Fine-tune hardware markup margins, dynamic VAT rates, and labor expenses by operational tiers." },
            { title: "WhatsApp Share", desc: "Share PDF proposal links or direct sizer reports straight to clients' WhatsApp for rapid signing." },
            { title: "PWA Cache", desc: "Loads in milliseconds on mobile devices and works 100% offline during rural field visits." },
            { title: "Proposal Pipeline", desc: "Log milestones inside our installer history board to track approvals,Consultations, and reviews." }
          ].map((item, idx) => (
            <Card key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm">
              <CardContent className="p-0 space-y-2">
                <span className="text-2xl">⚡</span>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-100">{item.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center pt-6">
          <Link href="/workspace">
            <Button size="lg" className="bg-teal-650 hover:bg-teal-700 text-white rounded-2xl font-black text-xs px-6 h-11 shadow-sm">
              Open Free Workspace Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* A10 — Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <NewsletterForm />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              </div>
              <span className="font-black text-slate-800 dark:text-slate-200">SolarPro</span>
            </div>
            <p className="text-[11px] leading-relaxed max-w-xs">
              Nigeria&apos;s leading progressive engineering modeler for residential solar installers and transparent homeowner self-sizing.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">Sizing Lanes</h4>
            <div className="flex flex-col gap-3">
              <div>
                <Link href="/estimator" className="hover:underline font-bold text-teal-650 dark:text-teal-400">🏡 Homeowner Estimator</Link>
                <p className="text-[10px] text-slate-400 mt-0.5">Calculate your panel capacity & Naira fuel offsets free.</p>
              </div>
              <div>
                <Link href="/start-simple" className="hover:underline font-bold text-slate-750 dark:text-slate-350">⚡ Start Simple</Link>
                <p className="text-[10px] text-slate-400 mt-0.5">Quick site survey presets for active field installers.</p>
              </div>
              <div>
                <Link href="/workspace" className="hover:underline font-bold text-slate-750 dark:text-slate-350">🛠️ Installer Pro Workspace</Link>
                <p className="text-[10px] text-slate-400 mt-0.5">Multi-tier option proposals and branded PDFs.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">Energy Insights</h4>
            <div className="flex flex-col gap-2">
              <Link href="/blog" className="hover:underline">Energy Economics Blog</Link>
              <Link href="/blog/diesel-generator-vs-solar-roi-nigeria" className="hover:underline">Diesel Cost ROI Math</Link>
              <Link href="/blog/nigeria-band-a-tariffs-vs-solar-roi" className="hover:underline">Band A Tariff Analysis</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">Offline capabilities</h4>
            <p className="text-[11px] leading-normal">
              Built as an progressive offline-ready Web App (PWA). All proposal and calculation data is persisted fully in local indexed storage caches.
            </p>
          </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-slate-100 dark:border-slate-850 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} SolarPro. Dedicated to stable Nigerian electricity.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
