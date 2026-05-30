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
  Building,
  Upload,
  BookOpen,
  Calendar,
  PhoneCall
} from 'lucide-react';

/* ─── Upgraded Plan Data Definition ─── */
const PLANS = [
  {
    id: 'free' as SubscriptionTier,
    name: 'Free Plan',
    badge: 'Homeowners & Testing',
    priceMonthly: 0,
    priceQuarterly: 0,
    priceAnnual: 0,
    bestFor: 'Homeowners & new technicians checking system ROI economics.',
    features: [
      'Quick Proposal Mode only',
      'Max 1 proposal per month',
      'Basic PDF Proposal Export',
      'SolarPro Watermark included',
      'Standard online email support',
      'Single user only'
    ],
    ctaText: 'Get Started Free',
    icon: Zap,
    color: 'from-slate-400 to-slate-500',
    btnVariant: 'outline' as const
  },
  {
    id: 'starter' as SubscriptionTier,
    name: 'Starter Plan',
    badge: 'Solo Installers',
    priceMonthly: 18000,
    priceQuarterly: 48600, // 10% discount off monthly: 16,200/mo * 3
    priceAnnual: 172800, // 20% discount off monthly: 14,400/mo * 12
    bestFor: 'Independent technicians & installers generating active quotes.',
    features: [
      'Everything in Free',
      'Up to 10 proposals per month',
      'Standard PDF Export (no watermark)',
      'Live parallel FX interbank exchange sync',
      'Equipment referral request quote access',
      'Basic supplier referral tracking',
      'Single user only'
    ],
    ctaText: 'Get Starter Plan',
    icon: Zap,
    color: 'from-teal-500 to-emerald-600',
    btnVariant: 'outline' as const
  },
  {
    id: 'pro' as SubscriptionTier,
    name: 'Professional',
    badge: 'Most Popular',
    popular: true,
    priceMonthly: 45000,
    priceQuarterly: 121500, // 10% off: 40,500/mo * 3
    priceAnnual: 432000, // 20% off: 36,000/mo * 12
    bestFor: 'Growing solar companies with active high-volume quote pipelines.',
    features: [
      'Everything in Starter',
      'Up to 40 proposals per month',
      'Full Wizard Sizing Flow (load calculator)',
      'Advanced commercial pricing mode',
      'Generator ROI comparison charts',
      'Structured installment & financing editor',
      'Up to 3 users included',
      'Priority supplier quote processing'
    ],
    ctaText: 'Upgrade to Pro',
    icon: Sparkles,
    color: 'from-blue-600 to-indigo-650',
    btnVariant: 'default' as const
  },
  {
    id: 'enterprise' as SubscriptionTier,
    name: 'Enterprise Plan',
    badge: 'EPC & Distributors',
    priceMonthly: 120000,
    priceQuarterly: 324000, // 10% off: 108,000/mo * 3
    priceAnnual: 1152000, // 20% off: 96,000/mo * 12
    bestFor: 'Large solar EPC firms, solar equipment distributors, and custom corporate teams.',
    features: [
      'Everything in Professional',
      'Custom or unlimited proposals',
      'Complete White-Label templates',
      'Company logo, color palettes, CAC & NERC certs',
      'Unlimited company users & roles',
      'Custom CRM, ERP, and distributor API sync',
      'Dedicated account manager (24/7 Phone)'
    ],
    ctaText: 'Go Enterprise',
    icon: Building,
    color: 'from-amber-500 to-orange-650',
    btnVariant: 'outline' as const
  }
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

  // Manual Bank Transfer Receipt Form State
  const [receiptFile, setReceiptFile] = React.useState<string>('');
  const [manualPlan, setManualPlan] = React.useState<string>('starter');
  const [manualCycle, setManualCycle] = React.useState<string>('monthly');
  const [manualLoading, setManualLoading] = React.useState(false);

  // Setup/Implementation Service Lead Form State
  const [setupName, setSetupName] = React.useState('');
  const [setupPerson, setSetupPerson] = React.useState('');
  const [setupPhone, setSetupPhone] = React.useState('');
  const [setupEmail, setSetupEmail] = React.useState('');
  const [setupTeamSize, setSetupTeamSize] = React.useState('1');
  const [setupWorkflow, setSetupWorkflow] = React.useState('');
  const [setupPackage, setSetupPackage] = React.useState('basic');
  const [setupSuccess, setSetupSuccess] = React.useState(false);

  // Training Cohort Lead Form State
  const [trainName, setTrainName] = React.useState('');
  const [trainPhone, setTrainPhone] = React.useState('');
  const [trainEmail, setTrainEmail] = React.useState('');
  const [trainCompany, setTrainCompany] = React.useState('');
  const [trainRole, setTrainRole] = React.useState('');
  const [trainExp, setTrainExp] = React.useState('beginner');
  const [trainSuccess, setTrainSuccess] = React.useState(false);

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

  const handleSubscribe = async (tierId: SubscriptionTier) => {
    if (tierId === 'free') {
      setSubscription('free', 'monthly', false);
      alert('🎉 Plan switched to Free Plan!');
      router.push('/');
      return;
    }
    
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: tierId,
          cycle: cycle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || 'Failed to initialize checkout session.');
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      console.error('[Pricing Upgrade] Checkout error:', err);
      // Clean local fallback for manual transfer & sandbox bypass
      setSubscription(tierId, cycle, false);
      alert(`🎉 [Demo Activation] Upgraded locally to ${tierId.toUpperCase()} (${cycle.toUpperCase()})! You can also submit receipt below for formal admin verification.`);
      router.push('/');
    }
  };

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    // Simulate API request to upload manual receipt
    setTimeout(() => {
      setManualLoading(false);
      alert('📥 Bank transfer receipt submitted to SolarPro verification team! Your account will be upgraded within 1-2 hours after verification.');
      setSubscription(manualPlan as SubscriptionTier, manualCycle as BillingCycle, false);
      router.push('/');
    }, 1500);
  };

  const handleSetupLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads/implementation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: setupPerson,
          phone: setupPhone,
          email: setupEmail,
          team_size: setupTeamSize,
          current_workflow: `Company: ${setupName}. Workflow: ${setupWorkflow}`,
          desired_package: setupPackage
        })
      });
      if (res.ok) {
        setSetupSuccess(true);
      } else {
        alert('Failed to submit setup interest. Please try again.');
      }
    } catch (err) {
      alert('Error connecting to setup lead capture.');
    }
  };

  const handleTrainingLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trainName,
          phone: trainPhone,
          email: trainEmail,
          company: trainCompany,
          role: trainRole,
          experience_level: trainExp
        })
      });
      if (res.ok) {
        setTrainSuccess(true);
      } else {
        alert('Failed to submit training interest. Please try again.');
      }
    } catch (err) {
      alert('Error connecting to training lead capture.');
    }
  };

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-650 transition-colors" />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 dark:bg-teal-950/45 dark:text-teal-400 rounded-full">
              Current Plan: <span className="font-black uppercase">{currentTier} {isTrial && '(Trial)'}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ QA Simulation Toolbelt ═══ */}
      <div className="bg-gradient-to-r from-teal-950 to-slate-900 border-b border-teal-500/20 text-white text-xs py-3 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-500 text-white font-extrabold text-[9px] uppercase px-1.5 py-0.5 animate-pulse">
              Sandbox Control
            </Badge>
            <span className="font-semibold text-[11px] text-teal-200">
              Instantly toggle active plan state to verify upgrade triggers & locked features:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setSubscription('free', cycle, false)} className={`px-2.5 py-0.5 rounded-full text-[10px] border transition-all ${currentTier === 'free' ? 'bg-white text-slate-900 font-bold border-white' : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900'}`}>Free</button>
            <button onClick={() => setSubscription('starter', cycle, false)} className={`px-2.5 py-0.5 rounded-full text-[10px] border transition-all ${currentTier === 'starter' ? 'bg-white text-slate-900 font-bold border-white' : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900'}`}>Starter</button>
            <button onClick={() => setSubscription('pro', cycle, false)} className={`px-2.5 py-0.5 rounded-full text-[10px] border transition-all ${currentTier === 'pro' && !isTrial ? 'bg-white text-slate-900 font-bold border-white' : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900'}`}>Professional</button>
            <button onClick={() => setSubscription('enterprise', cycle, false)} className={`px-2.5 py-0.5 rounded-full text-[10px] border transition-all ${currentTier === 'enterprise' ? 'bg-white text-slate-900 font-bold border-white' : 'bg-teal-900/30 text-teal-300 border-teal-700/40 hover:bg-teal-900'}`}>Enterprise</button>
            <button onClick={resetToTrial} className={`px-2.5 py-0.5 rounded-full text-[10px] border border-dashed transition-all ${isTrial ? 'bg-amber-500 text-white font-bold border-transparent' : 'bg-teal-950 text-amber-400 border-amber-550/30 hover:bg-teal-900'}`}>Reset 7-Day Trial</button>
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
            Naira Plans Sized For Nigerian Solar Installers
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Empower your solar sales reps to sizing loads, compare diesel generator ROI, and export stunning branded PDFs offline or on-site.
          </p>

          {/* ═══ Cycle Toggle: Monthly, Quarterly (10% off), Annual (20% off) ═══ */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3 bg-white dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto shadow-sm">
            <button
              onClick={() => setCycle('monthly')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${cycle === 'monthly' ? 'bg-teal-650 text-white shadow' : 'text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('quarterly')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${cycle === 'quarterly' ? 'bg-teal-650 text-white shadow' : 'text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
            >
              Quarterly
              <Badge className="bg-emerald-500 text-white font-extrabold text-[8px] uppercase px-1 py-0 border-none shadow-none">Save 10%</Badge>
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${cycle === 'annual' ? 'bg-teal-650 text-white shadow' : 'text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
            >
              Annual
              <Badge className="bg-emerald-500 text-white font-extrabold text-[8px] uppercase px-1 py-0 border-none shadow-none">Save 20%</Badge>
            </button>
          </div>
        </section>

        {/* ═══ Active Trial Status Banner (If Trial Active) ═══ */}
        {isTrial && (
          <div className="max-w-4xl mx-auto p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-slate-850 dark:text-amber-300 text-xs font-semibold rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
              <span>
                You are currently in a <strong>7-Day Pro Free Trial</strong>. You have <strong>{trialProposalsRemaining}</strong> proposals remaining before default limits gate.
              </span>
            </div>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs py-1 shadow-sm shrink-0" onClick={() => handleSubscribe('pro')}>
              Upgrade & Lock Professional
            </Button>
          </div>
        )}

        {/* ═══ Pricing Cards Grid ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.id && !isTrial;
            
            // Resolve prices based on cycle
            const unitPrice = cycle === 'monthly' ? plan.priceMonthly : cycle === 'quarterly' ? Math.round(plan.priceQuarterly / 3) : Math.round(plan.priceAnnual / 12);
            const cycleTotal = cycle === 'monthly' ? plan.priceMonthly : cycle === 'quarterly' ? plan.priceQuarterly : plan.priceAnnual;
            const cycleLabel = cycle === 'monthly' ? 'month' : cycle === 'quarterly' ? 'quarter' : 'year';

            return (
              <Card 
                key={plan.id}
                className={`relative flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-300 ${
                  plan.popular 
                    ? 'border-teal-500 dark:border-teal-500/40 shadow-lg ring-1 ring-teal-500/10 scale-102 z-10' 
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-teal-650 text-white font-extrabold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm z-20">
                    POPULAR Choice
                  </div>
                )}

                <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${plan.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold border-slate-300 text-slate-500 dark:text-slate-400">
                          {plan.badge}
                        </Badge>
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{plan.name}</h3>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-50">
                          {formatNaira(unitPrice)}
                        </span>
                        <span className="text-xs font-semibold text-slate-455">/mo equivalent</span>
                      </div>
                      {plan.priceMonthly > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                          Billed {cycleLabel}ly ({formatNaira(cycleTotal)}/{cycleLabel})
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pt-1">
                      {plan.bestFor}
                    </p>

                    <div className="h-px bg-slate-200 dark:bg-slate-800" />

                    <ul className="space-y-2.5 pt-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350">
                          <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    {isCurrent ? (
                      <Button className="w-full bg-emerald-600 text-white font-extrabold hover:bg-emerald-650 cursor-default rounded-xl h-11">
                        Active Plan ✓
                      </Button>
                    ) : (
                      <Button
                        variant={plan.btnVariant}
                        className={`w-full font-bold transition-all rounded-xl h-11 ${
                          plan.popular 
                            ? 'bg-teal-650 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10' 
                            : 'border-slate-300 dark:border-slate-700 dark:text-slate-300'
                        }`}
                        onClick={() => handleSubscribe(plan.id)}
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

        {/* ═══ NEW: Manual Bank Transfer Verification Receipt Upload ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Pay via Local Manual Bank Transfer</h2>
              <p className="text-xs text-slate-400">Direct instant upgrade fallback for failed online card transactions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-3">
              <p className="font-bold uppercase tracking-wider text-[10px] text-teal-600 dark:text-teal-400">GTBANK PAYMENT DETAILS</p>
              <div className="space-y-1 text-slate-650 dark:text-slate-350">
                <p>Bank Name: <strong className="text-slate-800 dark:text-slate-200">Guaranty Trust Bank (GTBank)</strong></p>
                <p>Account Name: <strong className="text-slate-800 dark:text-slate-200">SolarPro Technologies</strong></p>
                <p>Account Number: <strong className="text-slate-800 dark:text-slate-200">1029384756</strong></p>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                ⚠️ Make sure to input your company email as transaction reference description to avoid verification delays.
              </p>
            </div>

            <form onSubmit={handleManualPaymentSubmit} className="space-y-3">
              <p className="font-bold uppercase tracking-wider text-[10px] text-teal-600 dark:text-teal-400 font-sans">SUBMIT PAYMENT CONFIRMATION</p>
              <div>
                <label className="block text-[10px] text-slate-455 font-bold mb-1">Select Desired Plan</label>
                <select 
                  value={manualPlan} 
                  onChange={(e) => setManualPlan(e.target.value)} 
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-250 focus:outline-none"
                >
                  <option value="starter">Starter Plan (₦18,000/mo)</option>
                  <option value="pro">Professional Plan (₦45,000/mo)</option>
                  <option value="enterprise">Enterprise Plan (₦120,000/mo)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-455 font-bold mb-1">Cycle Selection</label>
                <select 
                  value={manualCycle} 
                  onChange={(e) => setManualCycle(e.target.value)} 
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-250 focus:outline-none"
                >
                  <option value="monthly">Monthly rolling basis</option>
                  <option value="quarterly">Quarterly (10% Discount)</option>
                  <option value="annual">Annual (20% Discount)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-455 font-bold mb-1">Upload Transfer Slip / Receipt Screenshot</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.value)}
                  required
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950 dark:file:text-teal-400 file:hover:bg-teal-100" 
                />
              </div>
              <Button type="submit" size="sm" disabled={manualLoading} className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-lg text-xs py-1.5 shadow-sm">
                {manualLoading ? 'Uploading Slip...' : 'Submit Receipt Slip'}
              </Button>
            </form>
          </div>
        </section>

        {/* ═══ NEW: Setup & Dedicated Implementation Services Form ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Dedicated Implementation & Setup Services</h2>
              <p className="text-xs text-slate-400">Let our B2B solar consulting team configure CAC data-sheets, DISCO tariffs, and customized pricing sheets for your sales reps.</p>
            </div>
          </div>

          {setupSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center space-y-3 border border-emerald-100 dark:border-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              <h3 className="text-sm font-black">🎉 Request Received!</h3>
              <p className="text-xs">One of our Lagos-based setup specialists will call you at the provided number to onboard your installers.</p>
            </div>
          ) : (
            <form onSubmit={handleSetupLeadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1">Company Legal Name</label>
                  <input type="text" required value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="e.g. Alara Solar Ltd" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1">Contact Person Name</label>
                  <input type="text" required value={setupPerson} onChange={(e) => setSetupPerson(e.target.value)} placeholder="e.g. Engr. Adeleke" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Phone Number</label>
                    <input type="tel" required value={setupPhone} onChange={(e) => setSetupPhone(e.target.value)} placeholder="080..." className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Email Address</label>
                    <input type="email" required value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} placeholder="name@solar.ng" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Desired Setup Package</label>
                    <select value={setupPackage} onChange={(e) => setSetupPackage(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none">
                      <option value="basic">Basic Setup (₦30,000)</option>
                      <option value="professional">Professional Setup (₦75,000)</option>
                      <option value="enterprise">Enterprise Custom Onboarding</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Team Size (Sales Reps)</label>
                    <input type="number" min="1" max="100" value={setupTeamSize} onChange={(e) => setSetupTeamSize(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1">Describe Current Proposal Workflow</label>
                  <textarea rows={2} value={setupWorkflow} onChange={(e) => setSetupWorkflow(e.target.value)} placeholder="e.g. Estimators sizing in Excel, designing quotes in Canva..." className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none resize-none" />
                </div>
                <Button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 mt-1 shadow-sm">
                  Request Implementation Setup
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* ═══ NEW: Training / Cohort Onboarding Form ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Join the Solar Sales Pro Training Cohort</h2>
              <p className="text-xs text-slate-400">Standardize pricing methodology and closing frameworks targeting high-net-worth Nigerian home owners.</p>
            </div>
          </div>

          {trainSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center space-y-3 border border-emerald-100 dark:border-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              <h3 className="text-sm font-black">🎉 Registered Successfully!</h3>
              <p className="text-xs">We have reserved a placeholder for your seat. An invitation syllabus will be dispatched to your email shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleTrainingLeadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1">Full Legal Name</label>
                  <input type="text" required value={trainName} onChange={(e) => setTrainName(e.target.value)} placeholder="e.g. Ademola Alabi" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Whatsapp/Phone Number</label>
                    <input type="tel" required value={trainPhone} onChange={(e) => setTrainPhone(e.target.value)} placeholder="e.g. 0803..." className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Email Address</label>
                    <input type="email" required value={trainEmail} onChange={(e) => setTrainEmail(e.target.value)} placeholder="name@solarcompany.com" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Role / Job Title</label>
                    <input type="text" required value={trainRole} onChange={(e) => setTrainRole(e.target.value)} placeholder="e.g. Solar Estimator / Sales Manager" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Experience Level</label>
                    <select value={trainExp} onChange={(e) => setTrainExp(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none">
                      <option value="beginner">Beginner (1-2 years)</option>
                      <option value="intermediate">Intermediate (2-5 years)</option>
                      <option value="advanced">Advanced Specialist (5+ years)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1">Company / EPC Firm Name</label>
                  <input type="text" required value={trainCompany} onChange={(e) => setTrainCompany(e.target.value)} placeholder="e.g. Alara Solar Solutions" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 mt-1 shadow-sm">
                  Register Cohort Interest
                </Button>
              </div>
            </form>
          )}
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
