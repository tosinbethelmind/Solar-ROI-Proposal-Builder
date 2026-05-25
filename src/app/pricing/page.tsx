'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSubscriptionStore, SubscriptionTier, BillingCycle } from '@/store/subscriptionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Check, 
  HelpCircle, 
  ArrowLeft, 
  Zap, 
  Users, 
  Sparkles,
  Building
} from 'lucide-react';

/* ─── Plan Data Definition ─── */
const PLANS = [
  {
    id: 'starter' as SubscriptionTier,
    name: 'Starter',
    badge: 'Solo Installers',
    priceMonthly: 9900,
    priceAnnual: 99000,
    bestFor: 'Solo installers & new technicians generating basic field quotes.',
    features: [
      'Quick Proposal Mode only',
      'Max 3 proposals per month',
      'Basic PDF Proposal Export',
      'Standard SolarPro Watermark',
      'Basic client contact capture',
      'Simple Pricing Mode (markup & discounts)',
      'Live USD/NGN exchange rate display',
      'Single User only',
      'Local offline drafts history (limited to 3)'
    ],
    ctaText: 'Start Quoting',
    icon: Zap,
    color: 'from-slate-400 to-slate-550',
    btnVariant: 'outline' as const
  },
  {
    id: 'pro' as SubscriptionTier,
    name: 'Pro',
    badge: 'Recommended',
    popular: true,
    priceMonthly: 24900,
    priceAnnual: 249000,
    bestFor: 'Active installers and growing companies doing premium residential & commercial projects.',
    features: [
      'Everything in Starter',
      'Unlimited Quick Proposals',
      'Full Wizard Sizing Flow (load calculator)',
      'Advanced Pricing Mode (full safeguards & warranty)',
      'NO SolarPro Watermark on exported PDFs',
      'Branded PDF Proposals (company logo & colors)',
      'Live margin health & discount validation alerts',
      'Interactive Generator ROI Comparison Tables',
      'Installment / Financing plans customization',
      'Offline draft continuity (unlimited history)'
    ],
    ctaText: 'Upgrade to Pro',
    icon: Sparkles,
    color: 'from-teal-500 to-emerald-600',
    btnVariant: 'default' as const
  },
  {
    id: 'business' as SubscriptionTier,
    name: 'Business',
    badge: 'Installer Teams',
    priceMonthly: 59900,
    priceAnnual: 599000,
    bestFor: 'Solar companies with multi-user teams, shared default rates, and quote reviews.',
    features: [
      'Everything in Pro',
      'Team Seats (Invite estimators & sales reps)',
      'Shared Company templates & default BOM prices',
      'Low-Margin quote approval workflow for admins',
      'Unified team proposal history CRM pipeline',
      'Offline sync depth & automated conflicts resolution',
      'Shared installer profile and company-level defaults',
      'Full company activity logs & audit trail history',
      'Premium customer success channels'
    ],
    ctaText: 'Scale Your Team',
    icon: Users,
    color: 'from-indigo-500 to-purple-600',
    btnVariant: 'outline' as const
  },
  {
    id: 'enterprise' as SubscriptionTier,
    name: 'Enterprise',
    badge: 'EPC & Distributors',
    customPrice: true,
    priceMonthly: 0,
    priceAnnual: 1200000, // starting from 1.2M/yr
    bestFor: 'Large solar EPC firms, solar equipment distributors, and custom corporate deployments.',
    features: [
      'Everything in Business',
      'Custom branding templates & engineering specifications',
      'Negotiated dedicated installer onboarding',
      'Dedicated support engineer channels',
      'Custom CRM, ERP, and local inventory api syncs',
      'Full white-labeled domain options (optional)',
      'Unlimited company users & advanced role controls'
    ],
    ctaText: 'Contact Sales',
    icon: Building,
    color: 'from-amber-500 to-orange-600',
    btnVariant: 'outline' as const
  }
];

/* ─── Comparison Matrix Data ─── */
const COMPARISON_FEATURES = [
  { category: 'Quoting & Proposals', name: 'Quick Proposal', starter: '✓', pro: '✓', business: '✓', enterprise: '✓' },
  { category: 'Quoting & Proposals', name: 'Full Wizard Flow (Load Profile)', starter: '—', pro: '✓', business: '✓', enterprise: '✓' },
  { category: 'Quoting & Proposals', name: 'Proposal Quota', starter: '3 / month', pro: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited' },
  { category: 'Quoting & Proposals', name: 'Live FX Interbank Sync', starter: '✓', pro: '✓', business: '✓', enterprise: '✓' },
  
  { category: 'Pricing & Margins', name: 'Simple Pricing Mode', starter: '✓', pro: '✓', business: '✓', enterprise: '✓' },
  { category: 'Pricing & Margins', name: 'Advanced Pricing (Accessory, Transport, VAT, contingency)', starter: '—', pro: '✓', business: '✓', enterprise: '✓' },
  { category: 'Pricing & Margins', name: 'Margin health alerts & discount safeguards', starter: '—', pro: '✓', business: '✓', enterprise: '✓' },
  { category: 'Pricing & Margins', name: 'Interactive Down-payment & Installment editor', starter: '—', pro: '✓', business: '✓', enterprise: '✓' },
  
  { category: 'Branding & ROI', name: 'SolarPro Branding Watermark', starter: 'Always On', pro: 'Removed', business: 'Removed', enterprise: 'White-Label Available' },
  { category: 'Branding & ROI', name: 'Custom Logo & Branding Colors', starter: '—', pro: '✓', business: '✓', enterprise: '✓' },
  { category: 'Branding & ROI', name: 'Generator Cost vs. Solar ROI savings charts', starter: '—', pro: '✓', business: '✓', enterprise: '✓' },
  
  { category: 'Offline & Sync', name: 'Offline Draft Creation', starter: '✓', pro: '✓', business: '✓', enterprise: '✓' },
  { category: 'Offline & Sync', name: 'Draft history count limit', starter: 'Up to 3 drafts', pro: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited' },
  { category: 'Offline & Sync', name: 'Corporate Multi-device Sync', starter: '—', pro: '—', business: '✓', enterprise: '✓' },
  
  { category: 'Team & Security', name: 'Multi-seat seats count', starter: '1 User only', pro: '1 User only', business: 'Up to 10 included', enterprise: 'Custom / Unlimited' },
  { category: 'Team & Security', name: 'Shared Team Templates & BOMs', starter: '—', pro: '—', business: '✓', enterprise: '✓' },
  { category: 'Team & Security', name: 'Low-Margin Quoting Approvals', starter: '—', pro: '—', business: '✓', enterprise: '✓' },
  { category: 'Team & Security', name: 'Manager Audit Logs', starter: '—', pro: '—', business: '✓', enterprise: '✓' },
  { category: 'Team & Security', name: 'Dedicated Account Manager', starter: '—', pro: '—', starterDesc: 'Standard Email', enterprise: '✓ (24/7 Phone)' }
];

export default function PricingPage() {
  const router = useRouter();
  const { 
    tier: currentTier, 
    billingCycle, 
    isTrial, 
    trialProposalsRemaining, 
    setSubscription,
    resetToTrial 
  } = useSubscriptionStore();
  const [cycle, setCycle] = React.useState<BillingCycle>(billingCycle);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      setCycle(billingCycle);
    });
  }, [billingCycle]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleToggleCycle = () => {
    const newCycle = cycle === 'monthly' ? 'annual' : 'monthly';
    setCycle(newCycle);
  };

  const handleSubscribe = (tierId: SubscriptionTier, customPrice: boolean = false) => {
    if (customPrice) {
      // Simulate enterprise email trigger
      window.location.href = `mailto:sales@solarpro.ng?subject=SolarPro Enterprise Upgrade Inquiry&body=Hello SolarPro Sales, We are an EPC solar firm interested in the Enterprise custom plan. We have around 15 estimators. Please reach out to us.`;
      return;
    }
    
    // In a real app, this would route to a Paystack / NOWPayments checkout page.
    // For our fully offline-functional Next.js app, we let them upgrade instantly!
    setSubscription(tierId, cycle, false);
    
    // Add custom toast / modal alert
    alert(`🎉 Congratulations! You have successfully upgraded to the SolarPro ${tierId.toUpperCase()} Plan (${cycle === 'monthly' ? 'Monthly' : 'Annual'}). Locked features are now fully accessible!`);
    router.push('/');
  };

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-600 transition-colors" />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-350">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 dark:bg-teal-950/45 dark:text-teal-400 rounded-full">
              Current Plan: <span className="font-black uppercase">{currentTier} {isTrial && '(Trial)'}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Dev Simulation Toolbelt ═══ */}
      <div className="bg-gradient-to-r from-teal-950 to-slate-900 border-b border-teal-500/20 text-white text-xs py-3 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-500 text-white font-extrabold text-[9px] uppercase px-1.5 py-0.5 animate-pulse">
              QA Simulator
            </Badge>
            <span className="font-semibold text-[11px] text-teal-200">
              Change your active account tier instantly to verify the paywall locking gates:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => { setSubscription('starter', cycle, false); }}
              className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
                currentTier === 'starter' && !isTrial
                  ? 'bg-white text-slate-900 border-white font-black' 
                  : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900/60'
              }`}
            >
              Starter
            </button>
            <button 
              onClick={() => { setSubscription('pro', cycle, false); }}
              className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
                currentTier === 'pro' && !isTrial
                  ? 'bg-white text-slate-900 border-white font-black' 
                  : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900/60'
              }`}
            >
              Pro (Standard)
            </button>
            <button 
              onClick={() => { setSubscription('business', cycle, false); }}
              className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
                currentTier === 'business'
                  ? 'bg-white text-slate-900 border-white font-black' 
                  : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900/60'
              }`}
            >
              Business (Teams)
            </button>
            <button 
              onClick={() => { setSubscription('enterprise', cycle, false); }}
              className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
                currentTier === 'enterprise'
                  ? 'bg-white text-slate-900 border-white font-black' 
                  : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900/60'
              }`}
            >
              Enterprise
            </button>
            <button 
              onClick={resetToTrial}
              className={`px-3 py-1 rounded-full text-[10px] font-black border border-dashed transition-all ${
                isTrial
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent' 
                  : 'bg-teal-950 text-amber-400 border-amber-550/30 hover:bg-teal-900'
              }`}
            >
              Reset 7-Day Pro Trial
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        
        {/* ═══ Hero Header ═══ */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <Badge className="bg-teal-100 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/45 dark:text-teal-300 border border-teal-250 dark:border-teal-900/30 font-black uppercase text-[10px] tracking-wider px-3 py-1 rounded-full">
            ₦ Naira-Optimized Packages
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Close Solar Jobs 3x Faster With Branded Proposals
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Stop losing client deals to sticker shock. Empower your estimators to design engineering load profiles, protect margins with local overhead tools, and generate immaculate branded PDFs.
          </p>

          {/* ═══ Monthly/Annual Billing Toggle ═══ */}
          <div className="pt-6 flex items-center justify-center gap-4">
            <span className={`text-xs font-bold ${cycle === 'monthly' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>
              Monthly billing
            </span>
            <button
              onClick={handleToggleCycle}
              className="relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 dark:bg-slate-800 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <span
                className={`pointer-events-none inline-block size-5.5 transform rounded-full bg-white dark:bg-slate-300 shadow ring-0 transition duration-200 ease-in-out ${
                  cycle === 'annual' ? 'translate-x-5 bg-teal-650' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${cycle === 'annual' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>
                Annual billing
              </span>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-md py-0.5 px-1.5 shadow-sm">
                Save 20%
              </Badge>
            </div>
          </div>
        </section>

        {/* ═══ Active Trial Status Banner (If Trial Active) ═══ */}
        {isTrial && (
          <div className="max-w-4xl mx-auto p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-slate-850 dark:text-amber-300 text-xs font-semibold rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
              <span>
                You are currently in a <strong>7-Day Pro Trial</strong>. You have <strong>{trialProposalsRemaining}</strong> free Pro-level proposals remaining before default limits lock.
              </span>
            </div>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs py-1 shadow-sm shrink-0" onClick={() => handleSubscribe('pro')}>
              Upgrade Now & Lock Pro
            </Button>
          </div>
        )}

        {/* ═══ Pricing Cards Grid ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.id && !isTrial;
            const monthlyEquivalent = plan.customPrice ? 'Custom' : (cycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceAnnual / 12));
            const annualSaving = plan.customPrice ? '' : (cycle === 'annual' ? `₦${(plan.priceMonthly * 12 - plan.priceAnnual).toLocaleString()} saved/year` : '');

            return (
              <Card 
                key={plan.id}
                className={`relative flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-300 ${
                  plan.popular 
                    ? 'border-teal-500 dark:border-teal-500/40 shadow-lg ring-1 ring-teal-500/10 scale-102 z-10' 
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                {/* Popular overlay tag */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-teal-600 text-white font-extrabold text-[8px] sm:text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm z-20">
                    POPULAR Choice
                  </div>
                )}

                <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
                  {/* Top Block */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${plan.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold border-slate-300 text-slate-500 dark:text-slate-400">
                          {plan.badge}
                        </Badge>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{plan.name}</h3>
                      </div>
                    </div>

                    {/* Price Tag */}
                    <div className="pt-2">
                      {plan.customPrice ? (
                        <div className="space-y-1">
                          <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-50">Custom</p>
                          <p className="text-xs text-slate-400">Custom business SLA quote</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-50">
                              {formatNaira(monthlyEquivalent as number)}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">/month</span>
                          </div>
                          {cycle === 'annual' ? (
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Billed annually ({formatNaira(plan.priceAnnual)}/yr)
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              Monthly rolling tenure
                            </p>
                          )}
                          {annualSaving && (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-extrabold text-[8px] rounded py-0.5 px-1 border-none shadow-none uppercase">
                              {annualSaving}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pt-1">
                      {plan.bestFor}
                    </p>

                    <div className="h-px bg-slate-200 dark:bg-slate-800" />

                    {/* Features List */}
                    <ul className="space-y-2.5 pt-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-350">
                          <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button Action */}
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button className="w-full bg-emerald-600 text-white font-extrabold hover:bg-emerald-600 cursor-default rounded-xl h-11">
                        Active Subscription ✓
                      </Button>
                    ) : (
                      <Button
                        variant={plan.btnVariant}
                        className={`w-full font-bold transition-all rounded-xl h-11 ${
                          plan.popular 
                            ? 'bg-teal-650 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10' 
                            : 'border-slate-300 dark:border-slate-700 dark:text-slate-300'
                        }`}
                        onClick={() => handleSubscribe(plan.id, plan.customPrice)}
                      >
                        {plan.ctaText}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* ═══ Lagos Installer Testimonial / Social Proof ═══ */}
        <section className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-3xl font-black shadow-sm">
            “
          </div>
          <div className="space-y-3">
            <p className="text-sm sm:text-base italic text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              &ldquo;We used to quote solar packages via WhatsApp voice notes or handwritten estimates. Sticker shock killed half our pipeline instantly. Since moving our installers to SolarPro Pro, we generate branded PDF specs with localized generator fuel ROI models on-site. Clients close 3x faster because they finally understand the numbers.&rdquo;
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Engr. Adeleke O. <span className="font-medium text-slate-400">· Managing Director at Alara Solar Ltd</span>
              </span>
              <Badge className="bg-teal-50 hover:bg-teal-550/10 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full border border-teal-250 dark:border-teal-900/30">
                Verified Lagos Installer
              </Badge>
            </div>
          </div>
        </section>

        {/* ═══ Plan Feature Matrix Table ═══ */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">Compare Quoting Capabilities</h2>
            <p className="text-xs text-slate-400">Discover which plan matches your solar installation pipeline.</p>
          </div>

          <Card className="border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 font-bold text-slate-650 dark:text-slate-400">Feature</th>
                    <th className="p-4 font-bold text-center w-24">Starter</th>
                    <th className="p-4 font-bold text-center w-24 text-teal-600 dark:text-teal-400">Pro</th>
                    <th className="p-4 font-bold text-center w-24">Business</th>
                    <th className="p-4 font-bold text-center w-24">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {/* Map Categories */}
                  {Array.from(new Set(COMPARISON_FEATURES.map(f => f.category))).map(cat => (
                    <React.Fragment key={cat}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-100/50 dark:bg-slate-900/30">
                        <td colSpan={5} className="p-3 font-extrabold uppercase tracking-wider text-[9px] text-teal-650 dark:text-teal-400">
                          {cat}
                        </td>
                      </tr>
                      {COMPARISON_FEATURES.filter(f => f.category === cat).map((feat, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                            {feat.name}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-500 tabular-nums">
                            {feat.starter}
                          </td>
                          <td className="p-3 text-center font-bold text-teal-650 dark:text-teal-400 tabular-nums">
                            {feat.pro}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-650 dark:text-slate-350 tabular-nums">
                            {feat.business}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                            {feat.enterprise}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* ═══ FAQ Section ═══ */}
        <section className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about pricing packages, sync depth, and limits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {[
              {
                q: 'How does the monthly/annual toggle affect billing?',
                a: 'Billed plans are presented in local Nigerian Naira (₦). If you opt for annual billing, you are billed once every 12 months with a 20% discount. Monthly plans run on a rolling basis and can be canceled/adjusted at any time.'
              },
              {
                q: 'What happens when I hit the Starter proposal monthly limit?',
                a: 'Starter plans are capped at 3 proposal drafts created per month. Once you reach 3 proposals in history, you can open, edit, or delete existing quotes, but creating new drafts requires upgrading to Pro. Active Pro trials allow up to 10 quotes.'
              },
              {
                q: 'Can I work offline when network signals drop on client sites?',
                a: 'Yes, absolutely. SolarPro is a Progressive Web App (PWA). Your client load inventory, sizing results, pricing modes, and proposal drafts save locally in the browser immediately. Business plans sync this history across team members once connectivity resumes.'
              },
              {
                q: 'Will downgrading delete my historical draft templates?',
                a: 'No. If you decide to downgrade or cancel your Pro membership, your existing proposals remain preserved in your Local Proposal History. However, accessing locked Pro features (such as Advanced markup fields or ROI graphs) in those old proposals is restricted until you renew.'
              },
              {
                q: 'Does upgrading remove the SolarPro branding watermark?',
                a: 'Yes. Starter proposals include a professional watermark: "Sized by SolarPro" at the footer of generated proposals. Upgrading to the Pro tier removes this entirely and unlocks custom logo uploads, personalized business colors, NERC/CAC certifications, and direct WhatsApp links.'
              },
              {
                q: 'How do low-margin manager approvals work?',
                a: 'On the Business plan, managers can configure safeguards (e.g. minimum 15% net profit margin). If a sales rep applies discounts that drop the margin below that, the final PDF quote automatically locks, displaying "Awaiting Manager Approval" until an admin unlocks it.'
              }
            ].map((faq, i) => (
              <div key={i} className="space-y-2 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-white dark:bg-slate-900/30">
                <p className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Footer CTA ═══ */}
        <section className="text-center py-10 max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl font-black">Ready to scale your solar business?</h2>
          <p className="text-xs text-slate-400">Join over 240 Nigerian solar installers standardizing their field sales and proposal design workflows today.</p>
          <div className="flex justify-center gap-3">
            <Button size="lg" className="bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-sm" onClick={() => router.push('/')}>
              Return to Dashboard
            </Button>
            <Button size="lg" variant="outline" className="border-slate-300 dark:border-slate-700 rounded-xl text-sm" onClick={resetToTrial}>
              Try 7-Day Pro Free
            </Button>
          </div>
        </section>

      </main>

    </div>
  );
}
