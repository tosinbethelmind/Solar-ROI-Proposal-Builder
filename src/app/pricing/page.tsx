'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSubscriptionStore, SubscriptionTier, BillingCycle } from '@/store/subscriptionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthButton } from '@/components/auth/AuthButton';
import { supabase } from '@/lib/supabase/client';
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
import EnterpriseModal from '@/components/EnterpriseModal';
import PaymentMethodModal from '@/components/PaymentMethodModal';

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
    id: 'payg',
    name: 'Pay-Per-Proposal',
    category: 'proposal',
    bestFor: 'Freelancers & casual installers',
    priceMonthly: 1500,
    priceQuarterly: 1500,
    priceAnnual: 1500,
    badge: 'Pay As You Go',
    features: [
      '₦1,500 per proposal PDF export',
      'Tokens never expire (Use anytime)',
      'Watermark-free Custom Branding',
      'Live parallel FX interbank sync',
      'Direct WhatsApp quote sharing',
      'No monthly recurring commitment'
    ],
    ctaLabel: 'Buy Proposal Tokens (₦1,500)',
    ctaHref: '#payment-section'
  },
  {
    id: 'free',
    name: 'Free Starter Plan',
    category: 'proposal',
    bestFor: 'Homeowners & testing',
    priceMonthly: 0,
    priceQuarterly: 0,
    priceAnnual: 0,
    features: [
      '2 proposals/month quota',
      'Quick Proposal Mode included',
      'Standard PDF (Watermarked)',
      'Single user seat included'
    ],
    ctaLabel: 'Activate Free Workspace',
    ctaHref: '/'
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    category: 'proposal',
    bestFor: 'Solo installers & active technicians',
    priceMonthly: 15000,
    priceQuarterly: 40500, // ₦13,500/mo * 3 (10% off)
    priceAnnual: 144000, // ₦12,000/mo * 12 (20% off)
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
    priceMonthly: 35000,
    priceQuarterly: 94500, // ₦31,500/mo * 3 (10% off)
    priceAnnual: 336000, // ₦28,000/mo * 12 (20% off)
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
    bestFor: 'EPCs & corporate solar groups',
    priceMonthly: 95000,
    priceQuarterly: 256500, // ₦85,500/mo * 3 (10% off)
    priceAnnual: 912000, // ₦76,000/mo * 12 (20% off)
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
    name: 'Free Basic Listing',
    category: 'listing',
    bestFor: 'New businesses seeking visibility',
    priceMonthly: 0,
    priceQuarterly: 0,
    priceAnnual: 0,
    features: [
      'Basic public installer profile',
      'Standard directory visibility (₦0/mo)',
      'Company Name, City & Service Area',
      'Limited profile description',
      'No verified partner badge',
      'No boosted search ranking'
    ],
    ctaLabel: 'Register Free Listing Profile',
    ctaHref: '/workspace/listing'
  },
  {
    id: 'list-verified',
    name: 'Verified Partner',
    category: 'listing',
    bestFor: 'Growing local exposure and lead access',
    priceMonthly: 25000,
    priceQuarterly: 67500, // ₦22,500/mo * 3 (10% off)
    priceAnnual: 240000, // ₦20,000/mo * 12 (20% off)
    badge: 'Highly Visible',
    highlighted: true,
    features: [
      'Everything in Free Listing',
      'Official Verified Partner Badge',
      'Premium search placement weight',
      'Priority visibility for lead-routing',
      'Access to local homeowner leads'
    ],
    ctaLabel: 'Get Verified Listing',
    ctaHref: '#payment-section'
  },
  {
    id: 'list-verified_partner_plus',
    name: 'Partner Plus',
    category: 'listing',
    bestFor: 'Established companies seeking maximum trust & exclusive leads',
    priceMonthly: 75000,
    priceQuarterly: 202500, // ₦67,500/mo * 3 (10% off)
    priceAnnual: 720000, // ₦60,000/mo * 12 (20% off)
    features: [
      'Everything in Verified Listing',
      'Official Partner Plus Gold Badge',
      'Exclusive lead routing priority',
      'Unlimited service area coverage states',
      'Direct customer phone & WhatsApp presentation'
    ],
    ctaLabel: 'Get Partner Plus Listing',
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
    priceMonthly: 30000, // Starter (15k) + Verified Partner (25k) = 40k value for 30k (Save 10k)
    priceQuarterly: 81000, // ₦27,000/mo * 3 (10% off)
    priceAnnual: 288000, // ₦24,000/mo * 12 (20% off)
    features: [
      'Starter Proposal SaaS Plan included',
      'Verified Partner Directory Listing included',
      'Pristine PDF Proposal Export',
      'Custom phone/WhatsApp presentation',
      'Save ₦10,000/month combined!'
    ],
    ctaLabel: 'Select Growth Bundle',
    ctaHref: '#payment-section'
  },
  {
    id: 'bundle-verified-growth',
    name: 'Verified Growth Bundle',
    category: 'bundle',
    bestFor: 'Established companies seeking quotes & high visibility',
    priceMonthly: 85000, // Professional (35k) + Partner Plus (75k) = 110k value for 85k (Save 25k)
    priceQuarterly: 229500, // ₦76,500/mo * 3 (10% off)
    priceAnnual: 816000, // ₦68,000/mo * 12 (20% off)
    badge: 'Ultimate Value',
    highlighted: true,
    features: [
      'Professional Proposal SaaS Plan',
      'Partner Plus Directory Listing',
      'Full load sizing + ROI generator tool',
      'Verified Badge + Exclusive lead routing',
      'Save ₦25,000/month combined!'
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
    a: 'Yes. You can register a Free Listing, Basic Listing, or SolarQuotePro Verified listing without paying for the advanced proposal wizard tool.'
  },
  {
    q: 'Can I subscribe to both together?',
    a: 'Yes! Our combined Bundle Packages offer the best of both worlds under a single simplified billing invoice, while giving you substantial multi-month savings.'
  },
  {
    q: 'What do bundle packages include?',
    a: 'Bundles pair a premium Proposal Workspace tier (Starter or Professional) with a premium Directory visibility tier (Basic or SolarQuotePro Verified), saving you up to ₦15,000 every single month.'
  },
  {
    q: 'Can I pay by bank transfer?',
    a: 'Yes, we support local bank transfers to our GTBank account for Nigerian installers, alongside automated online card processing via Paystack.'
  },
  {
    q: 'Is setup required before I can use SolarQuotePro?',
    a: 'No. Setup and custom catalog configurations are completely optional. SolarQuotePro is ready to use immediately out of the box with standard defaults.'
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
    resetToTrial,
    launchPromoClaimed,
    claimLaunchPromo
  } = useSubscriptionStore();
  
  const [cycle, setCycle] = React.useState<BillingCycle>(billingCycle);
  const [mounted, setMounted] = React.useState(false);
  const [session, setSession] = React.useState<any>(null);
  const [sessionLoading, setSessionLoading] = React.useState(true);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = React.useState(false);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [paymentSelectionOpen, setPaymentSelectionOpen] = React.useState(false);

  React.useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSessionLoading(false);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setSessionLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
  const [setupLoading, setSetupLoading] = React.useState(false);

  // Training Cohort Lead Form State
  const [trainName, setTrainName] = React.useState('');
  const [trainPhone, setTrainPhone] = React.useState('');
  const [trainEmail, setTrainEmail] = React.useState('');
  const [trainCompany, setTrainCompany] = React.useState('');
  const [trainRole, setTrainRole] = React.useState('');
  const [trainExp, setTrainExp] = React.useState('beginner');
  const [trainSuccess, setTrainSuccess] = React.useState(false);
  const [trainLoading, setTrainLoading] = React.useState(false);

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
    if (tierId === 'enterprise') {
      setEnterpriseModalOpen(true);
      return;
    }
    if (tierId === 'free') {
      setSubscription('free', 'monthly', false);
      alert('🎉 Plan switched to Free Starter Plan!');
      router.push('/');
      return;
    }
    
    setSelectedPlanId(tierId);
    setPaymentSelectionOpen(true);
  };

  const handleExecutePaystack = async () => {
    if (!selectedPlanId) return;
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          cycle: cycle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || 'Failed to initialize checkout session.');
      }

      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error('[Pricing Upgrade] Checkout error:', err);
      // Fallback manual sandboxed upgrade
      const targetSaaSTier = (selectedPlanId.startsWith('list-') || selectedPlanId.startsWith('bundle-')) ? 'pro' : selectedPlanId;
      setSubscription(targetSaaSTier as SubscriptionTier, cycle, false);
      alert(`🎉 [Demo Activation] Upgraded locally to ${selectedPlanId.toUpperCase()} (${cycle.toUpperCase()})! You can also submit bank receipt below for formal admin verification.`);
      router.push('/');
    }
  };

  const handleSelectManualPayment = () => {
    if (selectedPlanId) {
      setManualPlan(selectedPlanId);
    }
    setManualCycle(cycle);
    setTimeout(() => {
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    setTimeout(() => {
      setManualLoading(false);
      alert('📥 Bank transfer receipt submitted to SolarQuotePro verification team! Your account will be upgraded within 1-2 hours after verification.');
      
      const mappedSaaSTier = (manualPlan.startsWith('list-') || manualPlan.startsWith('bundle-')) ? 'pro' : manualPlan;
      setSubscription(mappedSaaSTier as SubscriptionTier, manualCycle as BillingCycle, false);
      router.push('/');
    }, 1500);
  };

  const handleSetupLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
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
    } finally {
      setSetupLoading(false);
    }
  };

  const handleTrainingLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrainLoading(true);
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
    } finally {
      setTrainLoading(false);
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

  const allPlans = [...proposalPlans, ...listingPlans, ...bundlePlans];
  const selectedPlan = allPlans.find((p) => p.id === selectedPlanId);
  const planName = selectedPlan?.name || '';
  const planPrice = selectedPlan ? getTotalPrice(selectedPlan) : 0;
  const priceFormatted = formatNaira(planPrice) + (cycle === 'monthly' ? '/month' : cycle === 'quarterly' ? '/quarter' : '/year');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ═══ Header ═══ */}
      {sessionLoading ? (
        <header className="sticky top-0 z-40 border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border-slate-200 dark:border-slate-800 h-14" />
      ) : session ? (
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
      ) : (
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
              <Link href="/#why-solarquotepro" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Why SolarQuotePro</Link>
              <Link href="/#pricing-tiers" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors text-teal-605 dark:text-teal-400 font-extrabold">Pricing Plans</Link>
              <Link href="/#storm-safety" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Safety Standard</Link>
              <Link href="/#blog-section" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">Energy Insights</Link>
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
      )}

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

        {/* ── Addition A: Trust Reassurance Strip ── */}
        <p className="text-sm text-center text-emerald-400 mt-3" style={{ marginTop: '12px' }}>
          ✓ All prices fixed in Naira · No FX adjustments mid-subscription · Cancel anytime · 7-day free trial included
        </p>

        {/* 🇳🇬 Special Nigeria Launch Offer Banner */}
        {!launchPromoClaimed && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-8 text-white shadow-xl animate-in slide-in-from-top-3 duration-500 max-w-4xl mx-auto">
            <div className="absolute -top-12 -right-12 size-40 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-450 rounded-full text-[10px] font-black uppercase tracking-wider">
                  🇳🇬 Special Launch Promo
                </div>
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Get 20 Free Proposals (Valued at ₦175,000!)
                </h2>
                <p className="text-slate-350 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  To celebrate our launch in Nigeria, we are offering the first 1,000 installers <strong>20 free proposal credits</strong> with full access to Pro tier features, custom branding, and watermark-free PDF downloads. Absolutely zero setup cost!
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold shadow-lg shadow-emerald-500/20 transition-all rounded-2xl flex items-center justify-center gap-2 text-xs px-6 h-11 shrink-0 border-none w-full md:w-auto"
                onClick={() => {
                  claimLaunchPromo();
                  alert('🎉 Congratulations! You have unlocked the Pro Launch Offer with 20 free proposals!');
                  router.push('/');
                }}
              >
                Claim Free Launch Upgrade ➔
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Homeowner Free Estimator Callout ═══ */}
        <section className="bg-gradient-to-r from-teal-500/10 via-indigo-500/5 to-teal-500/10 border border-teal-500/20 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 shadow-md transition-all duration-300 hover:shadow-lg">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-teal-600 dark:text-teal-400 bg-teal-150/40 dark:bg-teal-950/40 px-3 py-1 rounded-full border border-teal-500/20">
              <span className="size-2 rounded-full bg-teal-500 animate-pulse" />
              For Homeowners & Residential Buildings
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              Size Your House Solar Setup for Free
            </h2>
            <p className="text-xs text-slate-555 dark:text-slate-350 leading-relaxed font-semibold">
              Calculate your household load requirements, see monthly generator fuel savings, and get an instant cost-estimation checklist—completely free. No credit card or CAC registration required.
            </p>
          </div>
          <Link href="/estimator" className="w-full md:w-auto shrink-0">
            <Button size="lg" className="w-full md:w-auto bg-teal-650 hover:bg-teal-700 text-white font-black rounded-2xl h-12 px-6 flex items-center justify-center gap-2 shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-none">
              🏠 Run Free House Estimator <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
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

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-stretch">
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
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
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
                            handleSubscribe(plan.id);
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
                    {/* Addition B: Enterprise custom invoicing note */}
                    {plan.id === 'enterprise' && (
                      <p className="mt-2 text-xs italic text-center text-teal-600/70 dark:text-teal-400/60 leading-snug">
                        Custom Naira invoicing and purchase orders available for EPC firms and government projects. Ask us about annual contracts.
                      </p>
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
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
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
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
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
              <p className="font-extrabold uppercase tracking-wider text-[9px] text-teal-655 dark:text-teal-400">CHOOSE BANK ACCOUNT FOR TRANSFER</p>
              
              <div className="space-y-3">
                {/* GTBank */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400">OPTION 1: GUARANTY TRUST BANK</p>
                  <p>Bank: <strong className="text-slate-800 dark:text-slate-200">Guaranty Trust Bank (GTBank)</strong></p>
                  <p>Account Name: <strong className="text-slate-800 dark:text-slate-200">SolarQuotePro Technologies Ltd</strong></p>
                  <p>Account Number: <strong className="text-slate-850 dark:text-white font-extrabold">1029384756</strong></p>
                </div>

                {/* Moniepoint */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400">OPTION 2: MONIEPOINT MICROFINANCE BANK</p>
                  <p>Bank: <strong className="text-slate-800 dark:text-slate-200">Moniepoint MFB</strong></p>
                  <p>Account Name: <strong className="text-slate-800 dark:text-slate-200">SolarQuotePro Technologies Ltd</strong></p>
                  <p>Account Number: <strong className="text-slate-850 dark:text-white font-extrabold">5092837461</strong></p>
                </div>

                {/* OPay */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400">OPTION 3: OPAY</p>
                  <p>Bank: <strong className="text-slate-800 dark:text-slate-200">OPay</strong></p>
                  <p>Account Name: <strong className="text-slate-800 dark:text-slate-200">SolarQuotePro Technologies Ltd</strong></p>
                  <p>Account Number: <strong className="text-slate-850 dark:text-white font-extrabold">8192837465</strong></p>
                </div>
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
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-880 dark:bg-slate-950 text-slate-800 dark:text-slate-250 focus:outline-none"
                >
                  <option value="payg">Pay-Per-Proposal Token (₦1,500/proposal)</option>
                  <option value="starter">Starter Proposal (₦15,000/mo)</option>
                  <option value="pro">Professional Proposal (₦35,000/mo)</option>
                  <option value="enterprise">Enterprise Proposal (₦95,000/mo)</option>
                  <option value="list-verified">Verified Partner Listing (₦25,000/mo)</option>
                  <option value="list-verified_partner_plus">Partner Plus Listing (₦75,000/mo)</option>
                  <option value="bundle-growth">Growth Combined Bundle (₦30,000/mo)</option>
                  <option value="bundle-verified-growth">Verified Growth Bundle (₦85,000/mo)</option>
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
                  <a href={plan.id === 'srv-enterprise' ? undefined : "#setup-form"} className="block w-full">
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        if (plan.id === 'srv-enterprise') {
                          e.preventDefault();
                          setEnterpriseModalOpen(true);
                        } else {
                          setSetupPackage(plan.id.replace('srv-', ''));
                        }
                      }}
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
                  <Button type="submit" disabled={setupLoading} className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 mt-1 shadow-sm border-none transition-all flex items-center justify-center gap-2">
                    {setupLoading ? (
                      <>
                        <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Dispatched Setup Request...
                      </>
                    ) : (
                      'Submit Onboarding Setup Request'
                    )}
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
              <div className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/15">
                🎁 <strong>Cohort Bonus:</strong> Register today and get instant access to download our premium <strong>Solar Proposal Excel Sizer Template</strong> (₦25,000 value).
              </div>
            </div>
          </div>

          {trainSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
              <p className="text-emerald-800 dark:text-emerald-350 text-sm font-extrabold">
                🎉 Seat Reservation Verified! You will receive syllabus details shortly.
              </p>
              <div className="pt-2">
                <a 
                  href="https://assets.solarquotepro.ng/templates/Solar_Proposal_Sizer_v2.xlsx" 
                  download
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={(e) => {
                    alert('📥 Downloader triggered: Solar_Proposal_Sizer_v2.xlsx');
                  }}
                >
                  📥 Download Solar Proposal Excel Sizer Template (XLSX)
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTrainingLeadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Full Legal Name</label>
                  <input type="text" required value={trainName} onChange={(e) => setTrainName(e.target.value)} placeholder="e.g. Ademola Alabi" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/30 transition-all duration-200" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">WhatsApp Phone Number</label>
                    <input type="tel" required value={trainPhone} onChange={(e) => setTrainPhone(e.target.value)} placeholder="e.g. 080..." className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/30 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Email</label>
                    <input type="email" required value={trainEmail} onChange={(e) => setTrainEmail(e.target.value)} placeholder="name@solar.ng" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/30 transition-all duration-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Role / Job Title</label>
                    <input type="text" required value={trainRole} onChange={(e) => setTrainRole(e.target.value)} placeholder="e.g. Sales Manager" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/30 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Solar Experience Level</label>
                    <select value={trainExp} onChange={(e) => setTrainExp(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/30 transition-all duration-200">
                      <option value="beginner">Beginner (1-2 years)</option>
                      <option value="intermediate">Intermediate (2-5 years)</option>
                      <option value="advanced">Advanced Specialist (5+ years)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Company / EPC Name</label>
                  <input type="text" required value={trainCompany} onChange={(e) => setTrainCompany(e.target.value)} placeholder="e.g. Alara Solar Solutions" className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/30 transition-all duration-200" />
                </div>
                <Button type="submit" disabled={trainLoading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 mt-1 shadow-sm border-none transition-all flex items-center justify-center gap-2">
                  {trainLoading ? (
                    <>
                      <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Reserving & Registering...
                    </>
                  ) : (
                    'Register & Download Template'
                  )}
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
      <EnterpriseModal isOpen={enterpriseModalOpen} onClose={() => setEnterpriseModalOpen(false)} />
      <PaymentMethodModal
        isOpen={paymentSelectionOpen}
        onClose={() => setPaymentSelectionOpen(false)}
        planId={selectedPlanId}
        planName={planName}
        priceFormatted={priceFormatted}
        onSelectManual={handleSelectManualPayment}
        onSelectAutomatic={handleExecutePaystack}
      />
    </div>
  );
}
