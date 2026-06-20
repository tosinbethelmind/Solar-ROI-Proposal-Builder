'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ThemeToggle } from '@/components/theme-toggle';
import { BLOG_ARTICLES } from '@/lib/blog';
import { CopyrightYear } from '@/components/ui/CopyrightYear';
import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  Zap, 
  CheckCircle, 
  ChevronDown, 
  Info,
  Calendar
} from 'lucide-react';

/* ─── FAQ Accordion Component ───────────────────────────────── */
function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 py-3.5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-250 py-1 hover:text-teal-650 dark:hover:text-teal-400 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium animate-in fade-in duration-200">
          {answer}
        </p>
      )}
    </div>
  );
}

interface BlogArticleClientProps {
  slug: string;
}

export default function BlogArticleClient({ slug }: BlogArticleClientProps) {
  const router = useRouter();
  
  const article = React.useMemo(() => {
    return BLOG_ARTICLES.find((a) => a.slug === slug);
  }, [slug]);

  /* ── Interactive Widget State: ROI Calculator ── */
  const [fuelSpend, setFuelSpend] = React.useState<number>(120000);
  const paybackYears = React.useMemo(() => {
    // If they spend more fuel, solar payback is faster
    // Standard system costs ~₦4.8M. Replaces 90% of fuel spend.
    const monthlySavings = fuelSpend * 0.9;
    const annualSavings = monthlySavings * 12;
    if (annualSavings === 0) return 0;
    return Math.min(Math.max(4800000 / annualSavings, 1.8), 4.5);
  }, [fuelSpend]);

  /* ── Interactive Widget State: Grid vs Solar ── */
  const [gridBill, setGridBill] = React.useState<number>(100000);
  const gridKwh = React.useMemo(() => gridBill / 225, [gridBill]); // Band A is ₦225/kWh
  const solarCostKwh = 92; // Avg levelized solar cost is ₦92/kWh
  const solarSavingsMonthly = React.useMemo(() => {
    return gridKwh * (225 - solarCostKwh);
  }, [gridKwh]);

  /* ── Interactive Widget State: Compliance Checklist ── */
  const [checks, setChecks] = React.useState({
    structural: false,
    purlin: false,
    tenancy: false,
    sealant: false
  });
  const complianceScore = React.useMemo(() => {
    let count = 0;
    if (checks.structural) count += 25;
    if (checks.purlin) count += 25;
    if (checks.tenancy) count += 25;
    if (checks.sealant) count += 25;
    return count;
  }, [checks]);

  // Load JSON-LD FAQ Schema
  React.useEffect(() => {
    if (!article) return;
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.innerHTML = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'headline': article.schema.headline,
      'description': article.schema.description,
      'author': {
        '@type': 'Person',
        'name': article.author
      },
      'datePublished': article.date,
      'mainEntity': article.schema.faqList.map(faq => ({
        '@type': 'Question',
        'name': faq.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.a
        }
      }))
    });
    document.head.appendChild(schemaScript);
    return () => {
      document.head.removeChild(schemaScript);
    };
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center space-y-4">
        <h2 className="text-xl font-bold">Article not found</h2>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          The requested energy insight could not be found. Let us guide you back to safety.
        </p>
        <Link href="/blog">
          <Button className="bg-teal-655 hover:bg-teal-700 text-white font-bold rounded-xl text-xs">
            Back to Blog Hub
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/blog" className="flex items-center gap-1.5 text-xs font-bold text-slate-605 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-205">
            <ArrowLeft className="w-4 h-4" /> Back to Insights
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/estimator">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-655 hover:bg-slate-100 dark:text-slate-350">
                🏡 Sizer Estimator
              </Button>
            </Link>

            <Link href="/workspace">
              <Button variant="outline" size="sm" className="text-xs font-bold border-teal-500/20 text-teal-650 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl">
                Workspace
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Main layout ═══ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Article Meta */}
        <section className="space-y-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <Badge className="bg-teal-500/10 text-teal-655 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 font-black text-[9px] px-2 py-0.5 rounded-full">
              {article.pillar}
            </Badge>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {article.date}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-850 dark:text-slate-55">
            {article.title}
          </h1>

          <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="flex size-7 items-center justify-center rounded-full bg-teal-650 text-white font-black text-xs uppercase">
              {article.author.charAt(0)}
            </div>
            <span>Breakdown by {article.author}</span>
          </div>
        </section>

        {/* ═══ GEO Answer-First Bento Card ═══ */}
        <section className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 via-teal-500/10 to-transparent p-6 sm:p-7 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-555/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-655 text-white shadow-sm">
              <Sparkles className="w-3 h-3" /> Quick Take / RAG Answer
            </div>
            <p className="font-extrabold text-sm sm:text-base leading-relaxed text-slate-855 dark:text-slate-100">
              {article.answerFirst}
            </p>
          </div>
        </section>

        {/* Summary Points Checklist */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 sm:p-6 rounded-3xl shadow-sm">
          <div className="space-y-2 sm:col-span-2">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">Key Takeaways &amp; Data</h3>
          </div>
          {article.summaryPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
              <CheckCircle className="w-4.5 h-4.5 text-teal-655 shrink-0 mt-0.5" />
              <span>{point}</span>
            </div>
          ))}
        </section>

        {/* ═══ Main Article Sections ═══ */}
        <section className="space-y-8 prose prose-slate dark:prose-invert max-w-none">
          {article.sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-855 dark:text-slate-50 border-b border-slate-200 dark:border-slate-850 pb-2">
                {section.title}
              </h2>
              {section.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </section>

        {/* ═══ EMBEDDED HIGH-CONVERSION INTERACTIVE WIDGET ═══ */}
        <section className="pt-4">
          {article.widgetType === 'roi-calculator' && (
            <Card className="border-teal-500/25 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-555/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-2">
                <Badge className="bg-teal-500/20 text-teal-350 border border-teal-500/30 rounded-full text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5">
                  Live Calculator widget
                </Badge>
                <CardTitle className="text-lg sm:text-xl font-black text-white">Interactive 5kVA Solar ROI Modeler</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Slide to match your actual monthly petrol/diesel spending in Naira and view estimated sizing payload & payback duration instantly.
                </CardDescription>
              </div>

              {/* Input Spend */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-slate-300">Your Average Fuel Spend</label>
                  <span className="text-lg font-black text-teal-400 tabular-nums">₦{fuelSpend.toLocaleString()} <span className="text-xs text-slate-400">/ month</span></span>
                </div>
                <Slider
                  value={[fuelSpend]}
                  min={30000}
                  max={300000}
                  step={5000}
                  onValueChange={(val) => setFuelSpend(Array.isArray(val) ? val[0] : val)}
                  className="py-2"
                />
              </div>

              <div className="h-px bg-white/10" />

              {/* Output ROI Sizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payback Duration</p>
                  <p className="font-extrabold text-lg text-teal-400 mt-1">{paybackYears.toFixed(1)} Years</p>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">Months to offset capital setup costs fully.</p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Panel count needed</p>
                  <p className="font-extrabold text-lg text-white mt-1">
                    {fuelSpend <= 70000 ? '4x 450W' : fuelSpend <= 150000 ? '8x 450W' : '12x 450W'} Array
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">Optimized panel capacity for recharging.</p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lithium Battery Spec</p>
                  <p className="font-extrabold text-lg text-white mt-1">
                    {fuelSpend <= 70000 ? '1x 5kWh' : fuelSpend <= 150000 ? '2x 5kWh' : '3x 5kWh'} LiFePO4
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">Lifetime exceeding 10 years comfortably.</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold text-center sm:text-left">
                  <Info className="w-3.5 h-3.5 text-teal-500" /> Sizing calculations mapped to premium Lagos installer components.
                </p>
                <Button 
                  onClick={() => router.push('/estimator')}
                  className="bg-teal-655 hover:bg-teal-700 text-white rounded-xl font-bold text-xs px-5 h-9 shrink-0"
                >
                  🏡 Customize Fully in Client Sizer
                </Button>
              </div>
            </Card>
          )}

          {article.widgetType === 'grid-vs-solar' && (
            <Card className="border-teal-500/25 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-555/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-2">
                <Badge className="bg-teal-500/20 text-teal-350 border border-teal-500/30 rounded-full text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5">
                  Grid Tariff vs Solar
                </Badge>
                <CardTitle className="text-lg sm:text-xl font-black text-white">Live Levelized Cost Comparator</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Compare NERC Band A rates (₦225/kWh) against Solar LCOE lifetime averages for home generators.
                </CardDescription>
              </div>

              {/* Input Spend */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-slate-300">Your Current Monthly Utility Bill</label>
                  <span className="text-lg font-black text-teal-400 tabular-nums">₦{gridBill.toLocaleString()} <span className="text-xs text-slate-400">/ month</span></span>
                </div>
                <Slider
                  value={[gridBill]}
                  min={20000}
                  max={250000}
                  step={5000}
                  onValueChange={(val) => setGridBill(Array.isArray(val) ? val[0] : val)}
                  className="py-2"
                />
              </div>

              <div className="h-px bg-white/10" />

              {/* LCOE Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Band A rate</p>
                  <p className="font-extrabold text-lg text-rose-400 mt-1">₦225 / kWh</p>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">Fixed billing rate set by DisCos.</p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-405 tracking-wider">Solar LCOE Average</p>
                  <p className="font-extrabold text-lg text-emerald-400 mt-1">₦92 / kWh</p>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">Levelized energy cost over 10 years.</p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Calculated Savings</p>
                  <p className="font-extrabold text-lg text-teal-400 mt-1">₦{(solarSavingsMonthly).toLocaleString(undefined, { maximumFractionDigits: 0 })} / mo</p>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">Direct long-term utility reduction.</p>
                </div>
              </div>
            </Card>
          )}

          {article.widgetType === 'compliance-checklist' && (
            <Card className="border-teal-500/25 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-555/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-2">
                <Badge className="bg-teal-500/20 text-teal-355 border border-teal-500/30 rounded-full text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5">
                  Compliance Auditor widget
                </Badge>
                <CardTitle className="text-lg sm:text-xl font-black text-white">Lagos Structural Wind &amp; Permit Auditor</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Tick standard compliance boxes below to analyze your project safety rating under LSEB regulations.
                </CardDescription>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                {[
                  { key: 'structural', label: 'Roof truss load inspection complete (Maximum 15kg/sqm weight limit checked)' },
                  { key: 'purlin', label: 'Mounting brackets secured directly to structural timber/steel purlins' },
                  { key: 'tenancy', label: 'Landlord Tenancy Agreement Solar Addendum signed identifying removable asset rights' },
                  { key: 'sealant', label: 'Polyurethane weatherproofing sealants used (EPDM washers + SikaFlex applied)' }
                ].map((item) => (
                  <div key={item.key} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={item.key}
                      checked={checks[item.key as keyof typeof checks]}
                      onChange={(e) => setChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="size-4.5 rounded border-white/20 bg-white/5 text-teal-650 focus:ring-teal-500/20 cursor-pointer mt-0.5"
                    />
                    <label htmlFor={item.key} className="text-xs text-slate-350 leading-relaxed cursor-pointer font-bold select-none">{item.label}</label>
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/10" />

              {/* Result progress */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project compliance Rating</p>
                  <p className={`font-extrabold text-lg mt-1 ${complianceScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {complianceScore}% - {complianceScore >= 75 ? 'Safety Approved' : 'Action Required'}
                  </p>
                </div>
                <div className="size-12 rounded-full border-4 border-white/10 flex items-center justify-center font-black text-xs text-teal-400 relative">
                  <span className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent transition-all duration-300" style={{ transform: `rotate(${(complianceScore / 100) * 360}deg)` }} />
                  {complianceScore}%
                </div>
              </div>
            </Card>
          )}
        </section>

        {/* ═══ FAQ ACCORDION SECTION ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-50">Frequently Asked Questions</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {article.faqs.map((faq, idx) => (
              <FaqAccordion key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* ═══ STICKY BOTTOM CONVERSION BAR ═══ */}
        <section className="p-5 bg-gradient-to-r from-teal-650 to-emerald-700 text-white rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-[10px] uppercase font-black tracking-wider text-teal-200">Ready to secure stable power?</p>
            <h4 className="font-black text-sm text-white">Get a Certified Survey &amp; Detailed Proposal</h4>
            <p className="text-[10px] text-teal-100 leading-normal max-w-md font-medium">
              Important: Sizing calculations represent initial estimates. Final configuration is confirmed after a physical site structural survey by a certified installer.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/estimator')}
            className="bg-white text-teal-955 hover:bg-slate-100 rounded-xl font-black text-xs px-6 h-9 shrink-0 flex items-center gap-1.5"
          >
            🏡 Sizer Sizing Estimator <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 bg-white dark:bg-slate-900 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-700 dark:text-slate-350">SolarQuotePro Insights</span>
            <span>·</span>
            <Link href="/" className="hover:text-slate-650">Home</Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-slate-650">Insights</Link>
            <span>·</span>
            <Link href="/estimator" className="hover:text-slate-650">Sizer</Link>
          </div>
          <p>© <CopyrightYear /> SolarQuotePro. Licensed installers in all Lagos DisCos.</p>
        </div>
      </footer>
    </div>
  );
}
