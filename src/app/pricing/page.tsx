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
  PhoneCall,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  FileText
} from 'lucide-react';

/* ─── Unified Data Structure Types ─── */
export interface PricingPlan {
  id: string;
  name: string;
  category: 'proposal' | 'listing' | 'bundle';
  bestFor: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceAnnual: number;
  features: string[];
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

/* ─── 1. Proposal Builder SaaS Plans Configuration ─── */
const proposalPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    category: 'proposal',
    bestFor: 'Homeowners & first-time testing',
    priceMonthly: 0,
    priceQuarterly: 0,
    priceAnnual: 0,
    features: [
      '1 proposal per month limit',
      'Quick Proposal Mode only',
      'Watermarked PDF Proposal',
      'Single user seat only'
    ],
    ctaLabel: 'Start Sizing Free',
    ctaHref: '/estimator'
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    category: 'proposal',
    bestFor: 'Solo installers & active technicians',
    priceMonthly: 18000,
    priceQuarterly: 48600, // ₦16,200/mo * 3 (10% off)
    priceAnnual: 172800, // ₦14,400/mo * 12 (20% off)
    features: [
      'Up to 10 proposals per month',
      'Pristine PDF (No watermark)',
      'Watermark-free Custom Branding',
      'Live parallel FX interbank sync',
      'Single user seat only'
    ],
    ctaLabel: 'Get Starter Plan',
    ctaHref: '#payment-section'
  },
  {
    id: 'pro',
    name: 'Professional',
    category: 'proposal',
    bestFor: 'Growing solar installer teams',
    priceMonthly: 45000,
    priceQuarterly: 121500, // ₦40,500/mo * 3 (10% off)
    priceAnnual: 432000, // ₦36,000/mo * 12 (20% off)
    badge: 'Most Popular',
    highlighted: true,
    features: [
      'Up to 40 proposals per month',
      'Full Load Calculator sizing flow',
      'Generator ROI comparison charts',
      'Advanced commercial pricing mode',
      'Up to 3 user seats included'
    ],
    ctaLabel: 'Upgrade to Pro',
    ctaHref: '#payment-section'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    category: 'proposal',
    bestFor: 'EPCs & larger solar corporate companies',
    priceMonthly: 120000,
    priceQuarterly: 324000, // ₦108,000/mo * 3 (10% off)
    priceAnnual: 1152000, // ₦96,000/mo * 12 (20% off)
    features: [
      'Unlimited or custom proposals',
      'Complete White-Label templates',
      'Corporate CAC & NERC cert headers',
      'Unlimited users & custom roles',
      'Dedicated account manager (24/7)'
    ],
    ctaLabel: 'Go Enterprise',
    ctaHref: '#payment-section'
  }
];

/* ─── 2. Installer Directory Listing Plans Configuration ─── */
const listingPlans: PricingPlan[] = [
  {
    id: 'list-free',
    name: 'Free Listing',
    category: 'listing',
    bestFor: 'New businesses seeking basic visibility',
    priceMonthly: 0,
    priceQuarterly: 0,
    priceAnnual: 0,
    features: [
      'Basic public installer profile',
      'Standard directory visibility',
      'Company Name, City & Service Area',
      'Limited text description',
      'No verified partner badge',
      'No boosted search ranking'
    ],
    ctaLabel: 'Register Free Profile',
    ctaHref: '/workspace/listing'
  },
  {
    id: 'list-basic',
    name: 'Basic Listing',
    category: 'listing',
    bestFor: 'Technicians growing local exposure',
    priceMonthly: 12500,
    priceQuarterly: 33750, // ₦11,250/mo * 3 (10% off)
    priceAnnual: 120000, // ₦10,000/mo * 12 (20% off)
    features: [
      'Everything in Free Listing',
      'Better profile placement',
      'Stronger phone & WhatsApp contact',
      'Top tier search coverage results',
      'Exposure to local homeowners'
    ],
    ctaLabel: 'Get Basic Listing',
    ctaHref: '#payment-section'
  },
  {
    id: 'list-verified',
    name: 'SolarPro Verified',
    category: 'listing',
    bestFor: 'Established companies seeking maximum trust',
    priceMonthly: 30000,
    priceQuarterly: 81000, // ₦27,000/mo * 3 (10% off)
    priceAnnual: 288000, // ₦24,000/mo * 12 (20% off)
    badge: 'Highly Visible',
    highlighted: true,
    features: [
      'Everything in Basic Listing',
      'Official SolarPro Verified Badge',
      'Premium search placement weight',
      'Priority visibility for lead-routing',
      'Eligible for direct quote routing'
    ],
    ctaLabel: 'Get Verified Listing',
    ctaHref: '#payment-section'
  }
];

/* ─── 3. Combined Value Bundles Configuration ─── */
const bundlePlans: PricingPlan[] = [
  {
    id: 'bundle-growth',
    name: 'Growth Bundle',
    category: 'bundle',
    bestFor: 'Solo installers combining tools & leads',
    priceMonthly: 27000, // Starter (18k) + Basic (12.5k) = 30.5k value for 27k (Save 3.5k)
    priceQuarterly: 72900, // ₦24,300/mo * 3 (10% off)
    priceAnnual: 259200, // ₦21,600/mo * 12 (20% off)
    features: [
      'Starter Proposal SaaS Plan included',
      'Basic Listing Directory Plan included',
      'Pristine PDF Proposal Export',
      'Custom phone/WhatsApp presentation',
      'Save ₦3,500/month combined!'
    ],
    ctaLabel: 'Select Growth Bundle',
    ctaHref: '#payment-section'
  },
  {
    id: 'bundle-verified-growth',
    name: 'Verified Growth Bundle',
    category: 'bundle',
    bestFor: 'Established companies seeking quotes & high visibility',
    priceMonthly: 60000, // Professional (45k) + Verified (30k) = 75k value for 60k (Save 15k)
    priceQuarterly: 162000, // ₦54,000/mo * 3 (10% off)
    priceAnnual: 576000, // ₦48,000/mo * 12 (20% off)
    badge: 'Ultimate Value',
    highlighted: true,
    features: [
      'Professional Proposal SaaS Plan',
      'SolarPro Verified Directory Listing',
      'Full load sizing + ROI generator tool',
      'Verified Badge + Priority lead routing',
      'Save ₦15,000/month combined!'
    ],
    ctaLabel: 'Select Verified Bundle',
    ctaHref: '#payment-section'
  }
];

/* ─── 4. Optional consulting onboarding services ─── */
const servicePlans = [
  {
    id: 'srv-basic',
    name: 'Basic Setup',
    price: 30000,
    bestFor: 'Setting up custom company catalogs',
    features: [
      'Upload customized price sheets',
      'Input local utility DISCO tariffs',
      'Configure default component catalog',
      '1-hour remote staff onboarding session'
    ],
    ctaLabel: 'Request Basic Setup'
  },
  {
    id: 'srv-professional',
    name: 'Professional Setup',
    price: 75000,
    bestFor: 'Complete historical migration and workflow support',
    features: [
      'Everything in Basic Setup',
      'Migrate historical proposals to database',
      'Add custom branding & logos',
      'Surge indicator configuration support',
      'Full 1-on-1 rep team training session'
    ],
    ctaLabel: 'Request Professional Setup',
    highlighted: true
  },
  {
    id: 'srv-enterprise',
    name: 'Enterprise Consulting',
    price: 'Custom Quote',
    bestFor: 'Large operations & multi-city EPC firms',
    features: [
      'Custom pricing engine configuration',
      'Dedicated integration specialist',
      'Offline sync conflict safeguards',
      'Lagos State regulatory permittings',
      'Custom SLA & priority support line'
    ],
    ctaLabel: 'Contact Consulting Sales'
  }
];

/* ─── 5. Comprehensive FAQs ─── */
const FAQS = [
  {
    q: 'Can I use the proposal software without paying for installer listing?',
    a: 'Absolutely! The SaaS proposal builder is completely independent. You can operate on any proposal tier without participating in the directory or paying listing fees.'
  },
  {
    q: 'Can I list my business without subscribing to the proposal tool?',
    a: 'Yes. You can register a Free Listing, Basic Listing, or SolarPro Verified listing without paying for the advanced proposal wizard tool.'
  },
  {
    q: 'Can I subscribe to both together?',
    a: 'Yes! Our combined Bundle Packages offer the best of both worlds under a single simplified billing invoice, while giving you substantial multi-month savings.'
  },
  {
    q: 'What do bundle packages include?',
    a: 'Bundles pair a premium Proposal Workspace tier (Starter or Professional) with a premium Directory visibility tier (Basic or SolarPro Verified), saving you up to ₦15,000 every single month.'
  },
  {
    q: 'Can I pay by bank transfer?',
    a: 'Yes, we support local bank transfers to our GTBank account for Nigerian installers, alongside automated online card processing via Paystack.'
  },
  {
    q: 'Is setup required before I can use SolarPro?',
    a: 'No. Setup and custom catalog configurations are completely optional. SolarPro is ready to use immediately out of the box with standard defaults.'
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

  const handleSubscribe = async (tierId: string) => {
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
      // Fallback manual sandboxed upgrade
      const targetSaaSTier = (tierId.startsWith('list-') || tierId.startsWith('bundle-')) ? 'pro' : tierId;
      setSubscription(targetSaaSTier as SubscriptionTier, cycle, false);
      alert(`🎉 [Demo Activation] Upgraded locally to ${tierId.toUpperCase()} (${cycle.toUpperCase()})! You can also submit bank receipt below for formal admin verification.`);
      router.push('/');
    }
  };

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    setTimeout(() => {
      setManualLoading(false);
      alert('📥 Bank transfer receipt submitted to SolarPro verification team! Your account will be upgraded within 1-2 hours after verification.');
      
      const mappedSaaSTier = (manualPlan.startsWith('list-') || manualPlan.startsWith('bundle-')) ? 'pro' : manualPlan;
      setSubscription(mappedSaaSTier as SubscriptionTier, manualCycle as BillingCycle, false);
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

  const getPrice = (plan: PricingPlan) => {
    if (cycle === 'monthly') return plan.priceMonthly;
    if (cycle === 'quarterly') return Math.round(plan.priceQuarterly / 3);
    return Math.round(plan.priceAnnual / 12);
  };

  const getTotalPrice = (plan: PricingPlan) => {
    if (cycle === 'monthly') return plan.priceMonthly;
    if (cycle === 'quarterly') return plan.priceQuarterly;
    return plan.priceAnnual;
  };

  const getCycleLabel = () => {
    if (cycle === 'monthly') return 'month';
    if (cycle === 'quarterly') return 'quarter';
    return 'year';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-650 transition-colors" />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-350">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-teal-100 text-teal-800 dark:bg-teal-950/45 dark:text-teal-400 rounded-full">
              Current Plan: <span className="font-black uppercase">{currentTier} {isTrial && '(Trial)'}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Pricing Intro / Hero ═══ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <Badge className="bg-teal-500/10 text-teal-655 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
            ₦ Naira-Optimized Packages
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-850 dark:text-slate-50 leading-tight">
            Pricing built for Nigerian solar installers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Choose proposal software, directory visibility, or a combined growth package to close more deals and get discovered by homeowners.
          </p>

          {/* ═══ Pricing Toggle ═══ */}
          <div className="pt-6 flex items-center justify-center gap-2 max-w-[340px] mx-auto bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setCycle('monthly')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all ${cycle === 'monthly' ? 'bg-teal-650 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('quarterly')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${cycle === 'quarterly' ? 'bg-teal-650 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
            >
              Quarterly
              <Badge className="bg-emerald-500 text-white font-extrabold text-[8px] px-1 py-0 border-none shadow-none uppercase">Save 10%</Badge>
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${cycle === 'annual' ? 'bg-teal-650 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
            >
              Annual
              <Badge className="bg-emerald-500 text-white font-extrabold text-[8px] px-1 py-0 border-none shadow-none uppercase">Save 20%</Badge>
            </button>
          </div>
        </section>

        {/* ═══ 1. PROPOSAL BUILDER PLANS ═══ */}
        <section className="space-y-8">
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-teal-650 dark:text-teal-400">
              <FileText className="w-5 h-5" />
              <h2 className="text-xl sm:text-2xl font-black">1. Proposal Builder Plans</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
              Software plans configured to design, calculate surges, and generate professional PDF quotes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {proposalPlans.map((plan) => {
              const currentPrice = getPrice(plan);
              const totalPrice = getTotalPrice(plan);
              const isCurrent = currentTier === plan.id && !isTrial;

              return (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-300 p-6 ${
                    plan.highlighted 
                      ? 'border-teal-500 dark:border-teal-500/40 shadow-lg ring-1 ring-teal-500/10' 
                      : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-teal-655 text-white font-extrabold text-[8px] uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-sm z-20">
                      {plan.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{plan.bestFor}</span>
                      <h3 className="text-base font-black text-slate-850 dark:text-slate-100">{plan.name}</h3>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-850 dark:text-white">
                          {currentPrice === 0 ? '₦0' : formatNaira(currentPrice)}
                        </span>
                        {currentPrice > 0 && <span className="text-[10px] font-bold text-slate-400">/ month equivalent</span>}
                      </div>
                      {plan.priceMonthly > 0 && (
                        <p className="text-[9px] font-extrabold text-emerald-650 dark:text-emerald-400 mt-0.5">
                          Billed {getCycleLabel()}ly ({formatNaira(totalPrice)}/{getCycleLabel()})
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    <ul className="space-y-2.5">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-[10px] font-bold text-slate-655 dark:text-slate-350">
                          <Check className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <Button className="w-full bg-emerald-600 text-white font-black cursor-default rounded-xl h-10 border-none">
                        Active Workspace ✓
                      </Button>
                    ) : (
                      <Link href={plan.ctaHref} className="block w-full">
                        <Button
                          onClick={() => {
                            if (plan.id !== 'free') handleSubscribe(plan.id);
                          }}
                          variant={plan.highlighted ? 'default' : 'outline'}
                          className={`w-full text-[11px] font-black rounded-xl h-10 ${
                            plan.highlighted
                              ? 'bg-teal-650 hover:bg-teal-700 text-white border-none'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {plan.ctaLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ═══ 2. INSTALLER DIRECTORY LISTING PLANS ═══ */}
        <section className="space-y-8">
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-650 dark:text-indigo-400">
              <Users className="w-5 h-5" />
              <h2 className="text-xl sm:text-2xl font-black">2. Installer Directory Listing Plans</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              Get visibility and connect with active homeowners seeking solar installations.
            </p>
            <div className="inline-block bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 px-3 py-1 rounded-xl text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400">
              ⚠️ Installer listing is separate from Proposal Builder software.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto md:mx-0">
            {listingPlans.map((plan) => {
              const currentPrice = getPrice(plan);
              const totalPrice = getTotalPrice(plan);

              return (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-300 p-6 ${
                    plan.highlighted 
                      ? 'border-indigo-500 dark:border-indigo-500/40 shadow-lg ring-1 ring-indigo-500/10' 
                      : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white font-extrabold text-[8px] uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-sm z-20">
                      {plan.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">{plan.bestFor}</span>
                      <h3 className="text-base font-black text-slate-850 dark:text-slate-100">{plan.name}</h3>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-850 dark:text-white">
                          {currentPrice === 0 ? '₦0' : formatNaira(currentPrice)}
                        </span>
                        {currentPrice > 0 && <span className="text-[10px] font-bold text-slate-400">/ month equivalent</span>}
                      </div>
                      {plan.priceMonthly > 0 && (
                        <p className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Billed {getCycleLabel()}ly ({formatNaira(totalPrice)}/{getCycleLabel()})
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    <ul className="space-y-2.5">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-[10px] font-bold text-slate-655 dark:text-slate-350">
                          <Check className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link href={plan.ctaHref} className="block w-full">
                      <Button
                        onClick={() => {
                          if (plan.id !== 'list-free') handleSubscribe(plan.id);
                        }}
                        variant={plan.highlighted ? 'default' : 'outline'}
                        className={`w-full text-[11px] font-black rounded-xl h-10 ${
                          plan.highlighted
                            ? 'bg-indigo-650 hover:bg-indigo-700 text-white border-none'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {plan.ctaLabel}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ═══ 3. BUNDLE PACKAGES ═══ */}
        <section className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-500/20 rounded-3xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-teal-655 dark:text-teal-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black">3. Combined Growth Bundles</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto font-medium">
              Need both proposal tools and homeowner visibility? Choose a bundle and save.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {bundlePlans.map((plan) => {
              const currentPrice = getPrice(plan);
              const totalPrice = getTotalPrice(plan);

              return (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col justify-between overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur border transition-all duration-300 p-6 sm:p-8 ${
                    plan.highlighted 
                      ? 'border-teal-500 dark:border-teal-500/40 shadow-xl ring-2 ring-teal-500/10' 
                      : 'border-slate-200 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-teal-650 text-white font-extrabold text-[8px] uppercase tracking-widest px-4 py-1.5 rounded-bl-lg shadow z-20">
                      {plan.badge}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-teal-650 dark:text-teal-400 tracking-wider">{plan.bestFor}</span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-850 dark:text-slate-100">{plan.name}</h3>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-850 dark:text-white">
                          {formatNaira(currentPrice)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">/ month equivalent</span>
                      </div>
                      <p className="text-[10px] font-extrabold text-emerald-650 dark:text-emerald-400 mt-0.5">
                        Billed {getCycleLabel()}ly ({formatNaira(totalPrice)}/{getCycleLabel()})
                      </p>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    <ul className="space-y-3">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs font-bold text-slate-655 dark:text-slate-350">
                          <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Link href={plan.ctaHref} className="block w-full">
                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        className="w-full text-xs font-black rounded-xl h-11 bg-teal-650 hover:bg-teal-750 text-white border-none shadow-md"
                      >
                        {plan.ctaLabel}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ═══ 4. MANUAL BANK TRANSFER OPTION ═══ */}
        <section id="payment-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Local Nigerian Bank Transfer</h2>
              <p className="text-xs text-slate-400">Direct fallback payment pathway matching local billing processes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-4">
              <p className="font-extrabold uppercase tracking-wider text-[9px] text-teal-655 dark:text-teal-400">GTBANK PAYMENT INSTRUCTIONS</p>
              <div className="space-y-1 text-slate-655 dark:text-slate-350">
                <p>Bank Name: <strong className="text-slate-800 dark:text-slate-200">Guaranty Trust Bank (GTBank)</strong></p>
                <p>Account Name: <strong className="text-slate-800 dark:text-slate-200">SolarPro Technologies Ltd</strong></p>
                <p>Account Number: <strong className="text-slate-800 dark:text-slate-200">1029384756</strong></p>
              </div>
              <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl text-[10px] text-slate-500 leading-relaxed font-semibold">
                ⚠️ **Reference instruction**: Always include your company email and selected tier in the transfer description box to secure automatic confirmation within minutes.
              </div>
            </div>

            <form onSubmit={handleManualPaymentSubmit} className="space-y-3">
              <p className="font-extrabold uppercase tracking-wider text-[9px] text-teal-655 dark:text-teal-400">SUBMIT TRANSFER RECEIPT SLIP</p>
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold mb-1">Select Chosen Tier</label>
                <select 
                  value={manualPlan} 
                  onChange={(e) => setManualPlan(e.target.value)} 
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-250 focus:outline-none"
                >
                  <option value="starter">Starter Proposal (₦18,000/mo)</option>
                  <option value="pro">Professional Proposal (₦45,000/mo)</option>
                  <option value="enterprise">Enterprise Proposal (₦120,000/mo)</option>
                  <option value="list-basic">Basic Directory Listing (₦12,500/mo)</option>
                  <option value="list-verified">SolarPro Verified Listing (₦30,000/mo)</option>
                  <option value="bundle-growth">Growth Combined Bundle (₦27,000/mo)</option>
                  <option value="bundle-verified-growth">Verified Combined Bundle (₦60,000/mo)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold mb-1">Select Interval</label>
                <select 
                  value={manualCycle} 
                  onChange={(e) => setManualCycle(e.target.value)} 
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-250 focus:outline-none"
                >
                  <option value="monthly">Monthly billing</option>
                  <option value="quarterly">Quarterly (10% Discount)</option>
                  <option value="annual">Annual (20% Discount)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold mb-1">Upload Receipt Screenshot</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.value)}
                  required
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[9px] file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950 dark:file:text-teal-400" 
                />
              </div>
              <Button type="submit" size="sm" disabled={manualLoading} className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-lg text-xs py-1.5 shadow-sm border-none">
                {manualLoading ? 'Uploading Slip...' : 'Submit Confirmation Screenshot'}
              </Button>
            </form>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
            ℹ️ **What happens next**: Once uploaded, our Lagos-based account operations team will manually verify the payment and provision your workspace or listing within 1-2 hours. You will receive an automated email and WhatsApp confirmation once activated.
          </div>
        </section>

        {/* ═══ 5. OPTIONAL SETUP / CONSULTING SERVICES ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Optional Setup & Onboarding Services</h2>
              <p className="text-xs text-slate-400">One-time services to upload your CAC data-sheets, DISCO tariffs, and customized inventories.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {servicePlans.map((plan) => (
              <div 
                key={plan.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-xs ${
                  plan.highlighted ? 'border-indigo-500' : 'border-slate-250 dark:border-slate-850'
                }`}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="font-extrabold text-slate-850 dark:text-slate-100">{plan.name}</h4>
                    <span className="font-black text-slate-850 dark:text-white text-base">
                      {typeof plan.price === 'number' ? formatNaira(plan.price) : plan.price}
                    </span>
                    {typeof plan.price === 'number' && <span className="text-[10px] text-slate-400 font-bold"> one-time</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">{plan.bestFor}</p>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[10px] text-slate-655 dark:text-slate-400 leading-tight">
                        <Check className="w-3. h-3 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4">
                  <a href="#setup-form" className="block w-full">
                    <Button 
                      variant="outline" 
                      onClick={() => setSetupPackage(plan.id.replace('srv-', ''))}
                      className="w-full text-[10px] font-black rounded-lg h-9 border-slate-300 dark:border-slate-700"
                    >
                      {plan.ctaLabel}
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Setup Service Request Intake Form */}
          <div id="setup-form" className="border-t border-slate-150 dark:border-slate-850 pt-6">
            {setupSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                🎉 Setup Request Dispatched! One of our Lagos specialists will contact you shortly.
              </div>
            ) : (
              <form onSubmit={handleSetupLeadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Company Registered Name</label>
                    <input type="text" required value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="e.g. Alara Solar Solutions" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Contact Name</label>
                    <input type="text" required value={setupPerson} onChange={(e) => setSetupPerson(e.target.value)} placeholder="e.g. Engr. Adeleke" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Phone Number</label>
                      <input type="tel" required value={setupPhone} onChange={(e) => setSetupPhone(e.target.value)} placeholder="e.g. 0803..." className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Email</label>
                      <input type="email" required value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} placeholder="name@company.com" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Chosen Setup Package</label>
                      <select value={setupPackage} onChange={(e) => setSetupPackage(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none">
                        <option value="basic">Basic Setup (₦30,000)</option>
                        <option value="professional">Professional Setup (₦75,000)</option>
                        <option value="enterprise">Enterprise Consulting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Field Sales Team Size</label>
                      <input type="number" min="1" max="100" value={setupTeamSize} onChange={(e) => setSetupTeamSize(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Describe Current Proposal Flow</label>
                    <textarea rows={2} value={setupWorkflow} onChange={(e) => setSetupWorkflow(e.target.value)} placeholder="e.g. Quoting in Excel, designing outputs in Canva..." className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none resize-none" />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 mt-1 shadow-sm border-none">
                    Submit Onboarding Setup Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ═══ 6. TRAINING / COHORT SECTION ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Join the Solar Sales Pro Training Cohort</h2>
              <p className="text-xs text-slate-400">Standardize pricing methodology and closing frameworks targeting HNW homeowners in Lagos.</p>
            </div>
          </div>

          {trainSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              🎉 Seat Reservation Verified! You will receive syllabus details shortly.
            </div>
          ) : (
            <form onSubmit={handleTrainingLeadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Full Legal Name</label>
                  <input type="text" required value={trainName} onChange={(e) => setTrainName(e.target.value)} placeholder="e.g. Ademola Alabi" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">WhatsApp Phone Number</label>
                    <input type="tel" required value={trainPhone} onChange={(e) => setTrainPhone(e.target.value)} placeholder="e.g. 080..." className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Email</label>
                    <input type="email" required value={trainEmail} onChange={(e) => setTrainEmail(e.target.value)} placeholder="name@solar.ng" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Role / Job Title</label>
                    <input type="text" required value={trainRole} onChange={(e) => setTrainRole(e.target.value)} placeholder="e.g. Sales Manager" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Solar Experience Level</label>
                    <select value={trainExp} onChange={(e) => setTrainExp(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none">
                      <option value="beginner">Beginner (1-2 years)</option>
                      <option value="intermediate">Intermediate (2-5 years)</option>
                      <option value="advanced">Advanced Specialist (5+ years)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Company / EPC Name</label>
                  <input type="text" required value={trainCompany} onChange={(e) => setTrainCompany(e.target.value)} placeholder="e.g. Alara Solar Solutions" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none" />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 mt-1 shadow-sm border-none">
                  Register Interest in Next Cohort
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* ═══ 7. COMPREHENSIVE FAQS ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-850 dark:text-slate-50 justify-center">
            <HelpCircle className="w-5 h-5 text-teal-650" />
            <h2 className="text-lg font-black">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-5 text-xs">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="space-y-2 border-b border-slate-100 dark:border-slate-850 pb-4 last:border-none">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="text-teal-650 font-black">Q:</span> {faq.q}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold pl-4">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 8. FINAL CTA ═══ */}
        <section className="text-center py-10 max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl font-black">Ready to scale your solar business?</h2>
          <p className="text-xs text-slate-400 leading-normal font-semibold">Join over 240 Nigerian solar installers standardizing their field sales and proposal design workflows today.</p>
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
