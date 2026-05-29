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
  CheckCircle,
  Clock,
  Check,
  LineChart
} from 'lucide-react';
import { BLOG_ARTICLES } from '@/lib/blog';
import { AuthButton } from '@/components/auth/AuthButton';

export default function SolarProHomepage() {


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
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Link href="#why-solarpro" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Why SolarPro</Link>
            <Link href="#comparison" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Start Simple vs Pro</Link>
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
              <Button variant="outline" size="sm" className="text-xs font-bold border-teal-500/20 text-teal-650 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl">
                Open Installer Workspace
              </Button>
            </Link>
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Hero Section ═══ */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-white via-slate-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full animate-in fade-in duration-700">
            ☀️ Designed for the Nigerian Energy Ecosystem
          </Badge>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-850 dark:text-slate-50 leading-tight max-w-4xl mx-auto">
            Build Branded Solar Proposals &amp; Sizing Estimations Instantly
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Tackle generator diesel expenses, NERC Band A utility tariff hikes, and FX volatility. Whether you are a NERC-certified solar installer on a field visit or a homeowner calculating potential fuel savings, we have a progressive tool built precisely for you.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3.5 max-w-md mx-auto">
            {/* Quick Estimator CTA */}
            <Link href="/estimator" className="w-full">
              <Button size="lg" className="w-full bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm rounded-2xl shadow-md h-12 flex items-center justify-center gap-2">
                🏡 Calculate Solar Savings
              </Button>
            </Link>

            {/* Quick Sizer CTA */}
            <Link href="/start-simple" className="w-full">
              <Button size="lg" variant="outline" className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 font-extrabold text-sm rounded-2xl h-12 flex items-center justify-center gap-1.5">
                ⚡ Start Simple Sizer
              </Button>
            </Link>
          </div>

          <div className="pt-2">
            <Link href="/workspace" className="text-xs font-black text-teal-650 dark:text-teal-400 hover:underline flex items-center justify-center gap-1">
              Are you a professional installer? Enter workspace dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Value Proposition / Why SolarPro ═══ */}
      <section id="why-solarpro" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-500/10 text-emerald-650 border border-emerald-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">Core Benefits</Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-850 dark:text-slate-50">Smarter Solar Engineering</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            SolarPro streamlines operations from initial site survey calculations to final branded PDF quote generations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Smartphone className="w-6 h-6" />,
              title: "100% Offline-Ready Field Mode",
              desc: "Save proposals and recalculate sizing specifications directly on structural roofs even during weak 3G/LTE interbank networks in remote districts."
            },
            {
              icon: <LineChart className="w-6 h-6" />,
              title: "Naira ROI Payback Modeler",
              desc: "Compare direct solar LCOE averages (₦92/kWh) against monthly petrol generator expenditures or premium NERC Band A utility electricity rates."
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: "Lagos Safety Compliance Checks",
              desc: "Assess aluminum roof bearing limits (max 15kg/sqm weight guidelines) and lock in legal Tenancy Agreement Addendums for removable solar assets."
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

      {/* ═══ Progressive Disclosure: Start Simple vs Workspace Pro ═══ */}
      <section id="comparison" className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-850 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <Badge className="bg-teal-500/10 text-teal-655 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">Progressive layers</Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-850 dark:text-slate-50">Choose Your Sizing Flow</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
              We offer different modules depending on the urgency and technical details required for your quotation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Start Simple Package */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 p-6 sm:p-8 flex flex-col justify-between gap-6 hover:shadow-md hover:border-teal-500/20 transition-all duration-300">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-650 rounded-full text-[10px] font-black uppercase tracking-wider">
                  ⚡ Fast Field Shortcut
                </div>
                <h3 className="text-xl sm:text-2xl font-black">Start Simple</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Ideal for installers running active property walkthroughs who need to outline a budget in under 60 seconds without keying in granular appliance wattages.
                </p>
                <div className="space-y-2.5 pt-2">
                  {[
                    "Standard load presets (1.2kVA / 3kVA / 5kVA)",
                    "Tap essential appliances (LED Lights, Standing Fans, AC)",
                    "Instant budget approximation range (₦900k - ₦5.5M)",
                    "One-tap conversion into full CRM proposal wizard"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-655 dark:text-slate-350">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/start-simple">
                <Button size="lg" className="w-full bg-slate-850 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-750 rounded-2xl text-xs font-black h-11 flex items-center justify-center gap-2">
                  Launch Quick Shortcut <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>

            {/* Pro Workspace */}
            <Card className="rounded-3xl border border-teal-500/30 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between gap-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                  🛠️ Professional Suite
                </div>
                <h3 className="text-xl sm:text-2xl font-black">Pro Workspace</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Ideal for established solar businesses requiring multi-tier option pricing (Budget vs Standard vs Premium) and customizable branded PDF generators.
                </p>
                <div className="space-y-2.5 pt-2">
                  {[
                    "Granular appliance load lists and surge indicators",
                    "Battery specs customizations (Gel vs LiFePO4 chemistry)",
                    "Branded PDF builder with customizable markup, VAT, & labor",
                    "CRM pipeline tracking (Approve, Revise, site-survey statuses)"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/workspace">
                <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-750 text-white rounded-2xl text-xs font-black h-11 flex items-center justify-center gap-2 shadow-md">
                  Open Workspace Pro <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          </div>

        </div>
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
                { title: "epdm Purling Mounting", desc: "Mounting screws must attach directly to wood/steel purlins, locked with watertight Sika polyurethane sealants." },
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
                "Polyurethane polyurethane sealant SikaFlex applied to penetrations"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-250 leading-relaxed">
                  <Check className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <Link href="/blog/lagos-solar-permitting-compliance-checklist" className="block w-full">
              <Button className="w-full bg-teal-600 hover:bg-teal-750 text-white rounded-xl font-bold text-xs py-2 h-10">
                Read Compliance Guide
              </Button>
            </Link>
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

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-500 dark:text-slate-400 font-medium">
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
            <div className="flex flex-col gap-2">
              <Link href="/estimator" className="hover:underline">Homeowner Sizer Estimator</Link>
              <Link href="/start-simple" className="hover:underline">Start Simple Field Lane</Link>
              <Link href="/workspace" className="hover:underline">Installer Pro Workspace</Link>
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
