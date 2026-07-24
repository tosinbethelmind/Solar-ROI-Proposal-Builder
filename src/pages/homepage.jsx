'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  Check, 
  LineChart, 
  Users, 
  Zap, 
  FileText, 
  AlertTriangle,
  Building,
  Mail,
  User,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { BLOG_ARTICLES } from '@/lib/blog';
import { AuthButton } from '@/components/auth/AuthButton';
import { CopyrightYear } from '@/components/ui/CopyrightYear';
import { LegalNotice } from '@/components/ui/LegalNotice';
import Testimonials from '@/components/Testimonials';
import ComparePlans from '@/components/ComparePlans';
import ROICalculator, { PlanROILabel } from '@/components/ROICalculator';
import VideoDemo from '@/components/VideoDemo';
import EnterpriseModal from '@/components/EnterpriseModal';

export default function SolarQuoteProHomepage() {
  const [dieselSpend, setDieselSpend] = React.useState(150000);
  const [gridSpend, setGridSpend] = React.useState(80000);
  const [pricingCycle, setPricingCycle] = React.useState('monthly');
  
  // Modal states
  const [enterpriseModalOpen, setEnterpriseModalOpen] = React.useState(false);
  const [showDemoModal, setShowDemoModal] = React.useState(false);
  const [selectedPlanForDemo, setSelectedPlanForDemo] = React.useState('professional');
  const [demoFormData, setDemoFormData] = React.useState({
    name: '',
    company: '',
    email: '',
    phone: ''
  });
  const [demoSubmitted, setDemoSubmitted] = React.useState(false);

  const totalWaste = dieselSpend + gridSpend;
  const estimatedSavings = Math.round((dieselSpend * 0.85) + (gridSpend * 0.72));
  const paybackMonths = dieselSpend > 300000 || gridSpend > 150000 ? 18 : 24;

  const [demoLoading, setDemoLoading] = React.useState(false);
  const [demoError, setDemoError] = React.useState('');

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setDemoLoading(true);
    setDemoError('');
    try {
      const response = await fetch('/api/leads/implementation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: demoFormData.name,
          phone: demoFormData.phone,
          email: demoFormData.email,
          current_workflow: `Company: ${demoFormData.company}`,
          desired_package: selectedPlanForDemo
        })
      });
      if (response.ok) {
        setDemoSubmitted(true);
      } else {
        const data = await response.json();
        setDemoError(data.error || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit demo request:', err);
      setDemoError('Network error. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  const openDemoModal = (plan) => {
    setSelectedPlanForDemo(plan);
    setDemoFormData({ name: '', company: '', email: '', phone: '' });
    setDemoSubmitted(false);
    setShowDemoModal(true);
  };

  // Pricing calculations
  const getPrice = (tier, cycle) => {
    const prices = {
      payg: { monthly: '₦1,500', annual: '₦1,500' },
      free: { monthly: '₦0', annual: '₦0' },
      starter: { monthly: '₦15,000', annual: '₦12,000' },
      professional: { monthly: '₦35,000', annual: '₦28,000' },
      enterprise: { monthly: '₦95,000', annual: '₦76,000' }
    };
    return prices[tier][cycle];
  };

  // SEO JSON-LD Schema
  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app/#webapp",
        "url": "https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app/",
        "name": "SolarQuotePro Proposal Builder",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "description": "Nigeria's leading proposal builder and Naira ROI modeler for residential solar installers.",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "NGN",
          "lowPrice": "0",
          "highPrice": "95000",
          "offerCount": "4",
          "offers": [
            { "@type": "Offer", "name": "Free Starter Plan", "price": "0", "priceCurrency": "NGN" },
            { "@type": "Offer", "name": "Starter Plan", "price": "15000", "priceCurrency": "NGN" },
            { "@type": "Offer", "name": "Professional Plan", "price": "35000", "priceCurrency": "NGN" },
            { "@type": "Offer", "name": "Enterprise Plan", "price": "95000", "priceCurrency": "NGN" }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Does SolarQuotePro support offline calculations?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, SolarQuotePro is built as a PWA and supports 100% offline capacity sizing and bill of materials generation during rural field visits."
            }
          },
          {
            "@type": "Question",
            "name": "Does the proposal include Lagos State safety checks?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, proposals automatically verify and ensure structural aluminum roof weight remains strictly under 15kg/sqm to comply with Lagos State safety regulations."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Dynamic SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        {/* A1 — Announcement bar */}
        <div className="bg-[#F59E0B] text-[#0A0F1E] py-2 px-4 text-center font-bold text-xs flex flex-wrap items-center justify-center gap-2 z-50 relative">
          <span>⚡ Band A tariffs hit ₦225/kWh this month. Nigerian installers using SolarQuotePro are quoting 3× faster.</span>
          <Link href="/estimator" className="underline font-black whitespace-nowrap hover:opacity-75">→ Estimate My Savings</Link>
        </div>

        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-200">SolarQuotePro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Link href="#why-solarquotepro" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Why SolarQuotePro</Link>
            <Link href="#pricing-tiers" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors text-teal-605 dark:text-teal-400 font-extrabold">Pricing Plans</Link>
            <Link href="#storm-safety" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Safety Standard</Link>
            <Link href="#blog-section" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Energy Insights</Link>
            <Link href="/walkthroughs" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors text-emerald-600 dark:text-emerald-450 font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Walkthrough Academy
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/walkthroughs">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-teal-650 hover:bg-teal-500/10 dark:text-teal-450">
                Academy
              </Button>
            </Link>
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

      <main>
        {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-white via-slate-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[10px] font-black uppercase tracking-wider py-1.5 px-3.5 rounded-full">
                <img src="/assets/nerc-badge.svg" alt="NERC Logo" className="w-6 h-6" />
                <span>Built for NERC-certified solar installers in Nigeria.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                Quote Nigerian solar projects in 3 minutes
              </h1>
              
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed font-medium max-w-lg">
                Stop losing hot WhatsApp leads to slow manual quotes. Build professional Naira proposals with built‑in Band A tariffs, diesel savings, and offline load sizing.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[10px] font-extrabold py-1 px-3 rounded-full">
                  ⚡ 3-minute proposals
                </Badge>
                <Badge variant="secondary" className="bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[10px] font-extrabold py-1 px-3 rounded-full">
                  ₦ Naira-based ROI
                </Badge>
                <Badge variant="secondary" className="bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[10px] font-extrabold py-1 px-3 rounded-full">
                  📶 Works 100% offline
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/workspace" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-[#00C896] hover:bg-[#00b386] text-white font-black text-sm px-8 h-12 rounded-[10px] shadow-lg hover:shadow-[0_0_20px_rgba(0,200,150,0.4)] hover:scale-[1.03] transition-all duration-200 border-none">
                    Open free installer workspace
                  </Button>
                </Link>
                <Link href="/estimator" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto text-sm font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 h-12 rounded-[10px]"
                  >
                    Estimate homeowner savings
                  </Button>
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] text-slate-550 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> Trusted by certified solar installers in Lagos · Abuja · Port Harcourt
                </p>
              </div>
            </div>

            {/* Right Column - Partner Logo Bar & Stats */}
            <div className="space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest text-center">
                Our Industry Partners &amp; Compliance Standards
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex justify-center items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-teal-500/20 transition-all duration-300">
                  <img src="/assets/partner-logos/lseb.svg" alt="LSEB Logo" className="h-8 object-contain" />
                </div>
                <div className="flex justify-center items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-teal-500/20 transition-all duration-300">
                  <img src="/assets/partner-logos/panel-supplier.svg" alt="Vertex Solar Logo" className="h-8 object-contain" />
                </div>
                <div className="flex justify-center items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-teal-500/20 transition-all duration-300">
                  <img src="/assets/partner-logos/battery-manufacturer.svg" alt="CellMax Lithium Logo" className="h-8 object-contain" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-150 dark:border-slate-800 text-center">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">₦2.4B+</div>
                  <div className="text-[9px] text-slate-450 uppercase font-black tracking-wider">Deals Quoted</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">12.5 MW</div>
                  <div className="text-[9px] text-slate-450 uppercase font-black tracking-wider">Capacity Sized</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">99.9%</div>
                  <div className="text-[9px] text-slate-450 uppercase font-black tracking-wider">Offline Uptime</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Marquee Trust Bar */}
      <div className="bg-slate-50 dark:bg-[#0F172A] py-4 px-4 overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <p className="text-center text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">Trusted by installers across Lagos · Abuja · Port Harcourt · Ibadan · Kano</p>
        <div className="animate-marquee flex whitespace-nowrap gap-8 items-center">
          {[0, 1].map((gi) => (
            <div key={gi} className="flex items-center gap-6 shrink-0" aria-hidden={gi === 1}>
              {['Lekki Clean Energy', 'SunPower Lagos', 'Greenfield Solar NG', 'Abuja Solar Works', 'EkoSolar Tech'].map((n) => (
                <span key={n} className="text-slate-600 dark:text-slate-500 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 whitespace-nowrap">{n}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Video Demo Section */}
      <VideoDemo />

      {/* Calculator Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center space-y-2">
            <Badge className="bg-red-500/10 text-red-655 dark:text-red-400 border border-red-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
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
                  <span className="text-slate-700 dark:text-slate-350">🛢️ Monthly Generator Fuel (Petrol/Diesel):</span>
                  <span className="text-teal-655 dark:text-teal-400 font-extrabold text-sm">
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
                  <span className="text-slate-700 dark:text-slate-350">⚡ Monthly Grid Bill (Band A/B Tariff):</span>
                  <span className="text-teal-655 dark:text-teal-400 font-extrabold text-sm">
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

      {/* Path Selector */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Who Are You Here For?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Choose your path below.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl">🏡</div>
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-50">I&apos;m a Homeowner</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Calculate my fuel savings and find a verified installer near me — free.</p>
            <Link href="/estimator"><Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl border-none">Calculate My Savings →</Button></Link>
          </div>
          <div className="bg-white dark:bg-slate-900 border-2 border-teal-500 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl">⚡</div>
            <h3 className="font-black text-lg text-slate-900 dark:text-slate-50">I&apos;m a Solar Installer</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Build professional proposals, size systems, and close more deals — faster than ever.</p>
            <Link href="/workspace"><Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl border-none">Open Installer Workspace →</Button></Link>
          </div>
        </div>
      </section>

      {/* Core Benefits */}
      <section id="why-solarquotepro" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
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

      {/* Customer Testimonials Section */}
      <Testimonials />

      {/* Pricing Section */}
      <section id="pricing-tiers" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8 relative">
        <div className="text-center space-y-3">
          <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
            ₦ Naira-Optimized Packages
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50">Sized to Scale Your Solar Sales</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            🔒 No contracts. Cancel anytime. 7-day free trial on Professional. 30-day money-back guarantee on Enterprise.
          </p>
          
          <div className="pt-3 flex items-center justify-center gap-2 max-w-[280px] mx-auto bg-slate-150 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setPricingCycle('monthly')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all ${pricingCycle === 'monthly' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-800 dark:text-slate-400'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setPricingCycle('annual')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${pricingCycle === 'annual' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-800 dark:text-slate-400'}`}
            >
              Annual <Badge className="bg-emerald-500 text-white font-extrabold text-[8px] uppercase px-1.5 py-0.5 border-none shadow-none">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-stretch">
          {/* Plan 0: Pay-Per-Proposal */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Freelancers</span>
                <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[8px] uppercase font-black border border-teal-500/20">Pay As You Go</Badge>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Pay-Per-Proposal</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₦1,500</span>
                <span className="text-xs text-slate-400 font-bold">/proposal</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Buy proposal credits on demand with zero monthly commitment.</p>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
              <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> ₦1,500 per proposal PDF</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Tokens never expire</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Watermark-free exports</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Direct WhatsApp sharing</li>
              </ul>
            </div>
            <Link href="/pricing#payment-section" className="mt-8">
              <Button className="w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-black">
                Buy Tokens (₦1,500)
              </Button>
            </Link>
          </Card>

          {/* Plan 1: Free */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Homeowners</span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Free Starter Plan</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{getPrice('free', pricingCycle)}</span>
                <span className="text-xs text-slate-400 font-bold">/month</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Great for calculating fuel offsets and load sizes for your own house.</p>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
              <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> 2 proposals / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Standard PDF (Watermarked)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Offline sizer cache</li>
              </ul>
            </div>
            <Link href="/estimator" className="mt-8">
              <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-slate-300 dark:border-slate-755 hover:bg-slate-100 dark:hover:bg-slate-800">
                Try Free Estimator
              </Button>
            </Link>
          </Card>

          {/* Plan 2: Starter */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Solo Installers</span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Starter Plan</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{getPrice('starter', pricingCycle)}</span>
                <span className="text-xs text-slate-400 font-bold">/month</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Create clean, unwatermarked PDF quotes to pitch residential solar prospects.</p>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
              <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> 10 proposals / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Watermark-free exports</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Direct WhatsApp sharing</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> LSEB safety permits</li>
              </ul>
            </div>
            <Link href="/workspace" className="mt-8">
              <Button className="w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-black">
                Start 7-day Trial
              </Button>
            </Link>
          </Card>

          {/* Plan 3: Professional (Highlighted) */}
          <Card className="bg-slate-950 text-slate-100 border-2 border-teal-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative shadow-xl shadow-teal-500/10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-555 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md z-10 border border-teal-400">
              🔥 MOST POPULAR
            </span>
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">Growing Teams</span>
              <h3 className="text-xl font-extrabold text-white">Professional</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{getPrice('professional', pricingCycle)}</span>
                <span className="text-xs text-slate-400 font-bold">/month</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Complete generator fuel ROI analysis and safety calculations for large homes.</p>
              
              <PlanROILabel planId="pro" />

              <div className="h-px bg-slate-900 my-4" />
              <ul className="space-y-2 text-xs font-medium text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> 40 proposals / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Full load capacity calculator</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Generator fuel ROI charts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Custom markup &amp; dynamic VAT</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> 3 Team seats</li>
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <Link href="/workspace" className="w-full">
                <Button className="w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-500/20">
                  Start 7-day Trial
                </Button>
              </Link>
              <Button 
                onClick={() => openDemoModal('professional')}
                variant="outline" 
                className="w-full bg-transparent border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-bold rounded-xl"
              >
                Request Live Demo
              </Button>
            </div>
          </Card>

          {/* Plan 4: Enterprise */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">EPC Firms</span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Enterprise Plan</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{getPrice('enterprise', pricingCycle)}</span>
                <span className="text-xs text-slate-400 font-bold">/month</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">White-labeled proposal software tailored for industrial engineering groups.</p>
              
              <PlanROILabel planId="enterprise" />

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
              <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Unlimited proposals</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> White-label custom domain</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Dedicated account manager</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> SLA &amp; custom contract terms</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Unlimited team seats</li>
              </ul>
            </div>
            <Button 
              onClick={() => setEnterpriseModalOpen(true)}
              className="mt-8 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-black text-xs rounded-xl"
            >
              Contact Sales
            </Button>
          </Card>
        </div>

        {/* Plan Comparison Feature matrix triggers */}
        <ComparePlans />
      </section>

      {/* ROI Calculator Section */}
      <ROICalculator />

      {/* Featured Insights Bento Grid (Blog Section) */}
      <section id="blog-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-3">
            <Badge className="bg-teal-500/10 text-teal-650 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">Data &amp; math</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-850 dark:text-slate-50">From the SolarQuotePro Blog</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md font-medium">
              Read transparent financial breakdowns, safety permits, and regulatory checklists prepared by our engineering insights team.
            </p>
          </div>
          <Link href="/blog">
            <Button variant="ghost" className="text-xs font-black text-teal-650 hover:bg-teal-500/10 rounded-xl flex items-center gap-1 shrink-0">
              View All Insights <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* 6 articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_ARTICLES.slice(0, 6).map((article) => (
            <Card 
              key={article.slug} 
              className="group rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-teal-500/20 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 text-teal-400 backdrop-blur-sm border border-slate-800 text-[8px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full z-10">
                  {article.category}
                </span>
              </div>
              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-450">
                    <span className="text-slate-400">By {article.author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
                  </div>

                  <Link href={`/blog/${article.slug}`}>
                    <h3 className="font-extrabold text-sm sm:text-base leading-snug text-slate-850 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-medium line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between mt-4">
                  <span className="text-[10px] font-bold text-slate-400">{article.date}</span>
                  <Link href={`/blog/${article.slug}`}>
                    <Button variant="ghost" size="sm" className="text-xs font-black text-teal-650 group-hover:bg-teal-500/10 rounded-xl flex items-center gap-1">
                      Read Article <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Homeowner instant CTA strip & PDF checklist link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 rounded-3xl border border-teal-500/20 p-6 text-center space-y-3 flex flex-col justify-center items-center">
            <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold leading-normal">
              ⚡ Estimate your solar capacity and generator fuel savings in 2 minutes.
            </p>
            <Link href="/estimator">
              <Button className="bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs px-6 rounded-xl shadow-md h-10 border-none">
                🏡 Launch Free Homeowner Estimator ➔
              </Button>
            </Link>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 flex flex-col justify-center items-center">
            <p className="text-slate-850 dark:text-slate-200 text-xs sm:text-sm font-bold leading-normal">
              📋 Download our guide on Lagos permit approvals &amp; landlord agreement formats.
            </p>
            <Link href="/blog/lagos-solar-permitting-compliance-checklist" className="block">
              <Button variant="outline" className="border-teal-555/40 text-teal-655 dark:text-teal-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-xs h-10 px-6">
                Download Free Solar ROI Checklist (PDF)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Lagos Safety Standard spotlight */}
      <section id="storm-safety" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-16 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-550/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-450/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-655 dark:text-teal-350 border border-teal-500/30">
              🛠️ Lagos Safety Compliant
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
              Lagos Structural Safety &amp; Wind Permitting Standard
            </h2>
            <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
              Lekki, Victoria Island, and coastal Lagos experience severe wind shear during thunderstorms. To safeguard properties and void warranties, SolarQuotePro enforces structural roof guidelines.
            </p>

            <div className="space-y-4">
              {[
                { title: "Aluminum Roof Weight Limit", desc: "Dead load must remain below 15kg/sqm to prevent beam sag and metal trusses from warping." },
                { title: "EPDM Purlin Mounting", desc: "Mounting screws must attach directly to wood/steel purlins, locked with watertight SikaFlex Polyurethane Sealant." },
                { title: "Tenant Ownership Rights", desc: "Our templates include signed Landlord Addendums identifying removable solar assets." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-655 dark:text-teal-400 font-bold text-xs uppercase">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-slate-900 dark:text-white shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="font-extrabold text-sm sm:text-base text-teal-655 dark:text-teal-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-655 dark:text-teal-400" /> Installer Compliance checklist
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
              Every proposal generated through SolarQuotePro includes a dedicated safety permit annex highlighting these regulatory compliance requirements for Lagos State grid integrations.
            </p>
            <div className="h-px bg-slate-250 dark:bg-white/10" />
            <div className="space-y-3">
              {[
                "LSEB certification verified for grid-tie hybrid inverters",
                "EPDM waterproofing washers deployed on aluminum fasteners",
                "Wind shear deflection angle configured under 15 degrees",
                "Polyurethane sealant SikaFlex applied to penetrations"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-250 leading-relaxed">
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
                <Button variant="outline" className="w-full border-teal-500/30 text-teal-655 dark:text-teal-350 hover:bg-teal-500/10 dark:hover:bg-teal-950/40 rounded-xl font-bold text-xs py-2 h-10">
                  🏡 Check Solar Savings Before Booking Installer
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Operational Suite section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-500/10 text-emerald-655 border border-emerald-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">Operational suite</Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-850 dark:text-slate-550">Robust Proposal Engineering</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            SolarQuotePro is packed with advanced operational triggers that turn standard field surveys into professional, high-converting customer documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Custom Markup", desc: "Fine-tune hardware markup margins, dynamic VAT rates, and labor expenses by operational tiers." },
            { title: "WhatsApp Share", desc: "Share PDF proposal links or direct sizer reports straight to clients' WhatsApp for rapid signing." },
            { title: "PWA Cache", desc: "Loads in milliseconds on mobile devices and works 100% offline during rural field visits." },
            { title: "Proposal Pipeline", desc: "Log milestones inside our installer history board to track approvals, consultations, and reviews." }
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
      </main>

      {/* Footer Section */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </div>
                <span className="font-black text-slate-800 dark:text-slate-200">SolarQuotePro</span>
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Calculate your panel capacity &amp; Naira fuel offsets free.</p>
                </div>
                <div>
                  <Link href="/start-simple" className="hover:underline font-bold text-slate-750 dark:text-slate-350">⚡ Start Simple</Link>
                  <p className="text-[10px] text-slate-400 mt-0.5">Quick site survey templates for active field installers.</p>
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
              <p className="text-[11px] leading-normal font-semibold">
                Built as an progressive offline-ready Web App (PWA). All proposal and calculation data is persisted fully in local indexed storage caches.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-slate-100 dark:border-slate-850 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <div>
            <p>© <CopyrightYear /> SolarQuotePro. Dedicated to stable Nigerian electricity.</p>
            <LegalNotice />
          </div>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>

      {/* Request Demo & Contact Sales Modal */}
      {showDemoModal && (
        <div role="dialog" aria-modal="true" aria-label="Request Demo Modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-white font-extrabold text-sm"
            >
              ✕
            </button>

            {!demoSubmitted ? (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="inline-block bg-teal-500/10 text-teal-650 dark:text-teal-400 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2 rounded-full">
                    ⚡ {selectedPlanForDemo === 'enterprise' ? 'Contact Enterprise Sales' : 'Request Professional Demo'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedPlanForDemo === 'enterprise' ? 'Get Custom Enterprise SLA' : 'Book a Live Workspace Walkthrough'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Fill in your details below and a solar workspace specialist will contact you to set up your account.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="Full Name" 
                      aria-label="Full Name"
                      value={demoFormData.name}
                      onChange={(e) => setDemoFormData({ ...demoFormData, name: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="Company Name" 
                      aria-label="Company Name"
                      value={demoFormData.company}
                      onChange={(e) => setDemoFormData({ ...demoFormData, company: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      placeholder="Work Email" 
                      aria-label="Work Email"
                      value={demoFormData.email}
                      onChange={(e) => setDemoFormData({ ...demoFormData, email: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      required
                      placeholder="WhatsApp Phone Number" 
                      aria-label="WhatsApp Phone Number"
                      value={demoFormData.phone}
                      onChange={(e) => setDemoFormData({ ...demoFormData, phone: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {demoError && (
                  <p className="text-[10px] text-rose-500 font-extrabold text-center mt-1">
                    ⚠️ {demoError}
                  </p>
                )}

                <Button 
                  type="submit" 
                  disabled={demoLoading}
                  className="w-full bg-teal-650 hover:bg-teal-700 text-white font-black text-xs py-2.5 rounded-xl border-none shadow-md mt-4 h-10 cursor-pointer disabled:opacity-50"
                >
                  {demoLoading ? 'Submitting...' : 'Submit Request ➔'}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Request Received Successfully</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                    Thank you, <span className="font-black text-slate-800 dark:text-white">{demoFormData.name}</span>! Our solar operations team will contact you on WhatsApp/Email within 2 hours.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowDemoModal(false)}
                  className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-black text-xs py-2 px-6 rounded-xl border-none h-10"
                >
                  Close Window
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      <EnterpriseModal isOpen={enterpriseModalOpen} onClose={() => setEnterpriseModalOpen(false)} />
    </div>
  );
}
