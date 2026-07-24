'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  HelpCircle, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Volume2, 
  Download, 
  FileText, 
  AlertTriangle, 
  Check, 
  Send,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateROI } from '@/utils/calculations';

interface ProposalData {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  region_id?: number;
  status: string;
  tracking_status: string;
  proposal_version: number;
  backup_hours: number;
  peak_sun_hours: number;
  nepa_daily_hours: number;
  nepa_tariff_per_kwh: number;
  gen_fuel_type?: 'petrol' | 'diesel';
  gen_capacity_kva?: number;
  gen_daily_hours: number;
  gen_fuel_price_per_liter: number;
  roi_gen_maintenance_cost_per_event?: number;
  final_quoted_price_ngn: number;
  locked_fx_rate?: number;
  fx_rate_locked_at?: string;
  calculations_snapshot: any;
  created_at: string;
  subscription_tier?: string;
  monthly_phcn_bill?: number;
  monthly_gen_fuel_cost?: number;
  monthly_gen_maintenance?: number;
}

interface InteractiveProposalClientProps {
  token: string;
}

export default function InteractiveProposalClient({ token }: InteractiveProposalClientProps) {
  const router = useRouter();

  const [proposal, setProposal] = React.useState<ProposalData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showRevisionModal, setShowRevisionModal] = React.useState<boolean>(false);
  const [revisionFeedback, setRevisionFeedback] = React.useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = React.useState<boolean>(false);
  const [hasViewedFired, setHasViewedFired] = React.useState<boolean>(false);
  const [payingSurvey, setPayingSurvey] = React.useState<boolean>(false);

  // New Transaction Engine States
  const [insuranceTier, setInsuranceTier] = React.useState<'none' | 'lite' | 'pro' | 'enterprise'>('pro');
  const [payingDeposit, setPayingDeposit] = React.useState<boolean>(false);
  const [paymentOption, setPaymentOption] = React.useState<'outright' | 'finance'>('outright');
  const [financeMonths, setFinanceMonths] = React.useState<number>(12);
  const [downPaymentPercent, setDownPaymentPercent] = React.useState<number>(20);
  const [showFinanceModal, setShowFinanceModal] = React.useState<boolean>(false);
  const [applyingFinance, setApplyingFinance] = React.useState<boolean>(false);
  const [monthlyIncomeInput, setMonthlyIncomeInput] = React.useState<string>('500000');
  const [employmentStatus, setEmploymentStatus] = React.useState<string>('salaried');
  const [preferredLender, setPreferredLender] = React.useState<string>('Sterling Bank');
  const [bvn, setBvn] = React.useState<string>('');

  // Check URL query parameters for payment redirection callback
  React.useEffect(() => {
    if (!proposal) return;
    const activeProposal = proposal;

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');

    if (paymentStatus === 'success' && reference) {
      const insuranceTierParam = urlParams.get('insuranceTier') || 'none';
      if (activeProposal.calculations_snapshot?.paystackRef === reference) {
        return;
      }

      async function verifyPayment() {
        try {
          const loadingToast = toast.loading('Verifying Paystack payment reference...');
          const res = await fetch(`/api/proposals/${activeProposal.id}/verify-survey`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reference,
              includeInsurance: insuranceTierParam,
            }),
          });

          toast.dismiss(loadingToast);

          if (!res.ok) {
            throw new Error('Failed to verify payment reference');
          }

          const responseData = await res.json();
          if (responseData.success && responseData.proposal) {
            setProposal({
              ...responseData.proposal,
              subscription_tier: activeProposal.subscription_tier
            });
            toast.success('Survey booking confirmed and paid!');
            
            // Clean up the URL query parameters without reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          toast.error('Payment verification failed. Please contact support.');
        }
      }

      verifyPayment();
    } else if (paymentStatus === 'deposit_success' && reference) {
      const paymentType = urlParams.get('paymentType') || 'deposit';
      if (activeProposal.calculations_snapshot?.depositRef === reference) {
        return;
      }

      async function verifyDepositPayment() {
        try {
          const loadingToast = toast.loading('Verifying deposit payment reference...');
          const res = await fetch(`/api/proposals/${activeProposal.id}/verify-deposit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reference,
              paymentType,
            }),
          });

          toast.dismiss(loadingToast);

          if (!res.ok) {
            throw new Error('Failed to verify deposit payment');
          }

          const responseData = await res.json();
          if (responseData.success && responseData.proposal) {
            setProposal({
              ...responseData.proposal,
              subscription_tier: activeProposal.subscription_tier
            });
            toast.success('Deposit payment verified and proposal approved!');
            
            // Clean up the URL query parameters without reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch (err) {
          console.error('Error verifying deposit:', err);
          toast.error('Deposit verification failed. Please contact support.');
        }
      }

      verifyDepositPayment();
    }
  }, [proposal]);

  const handleSurveyPayment = async () => {
    if (!proposal) return;

    try {
      setPayingSurvey(true);
      const res = await fetch(`/api/proposals/${proposal.id}/pay-survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: proposal.customer_email || 'client@example.com',
          insuranceTier: insuranceTier,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to initialize payment');
      }

      const { authorization_url } = await res.json();
      if (authorization_url) {
        window.location.href = authorization_url;
      } else {
        toast.error('Could not obtain checkout link. Please try again.');
      }
    } catch (err) {
      console.error('Error starting survey payment:', err);
      toast.error('Failed to start transaction. Please try again.');
    } finally {
      setPayingSurvey(false);
    }
  };

  const handleDepositPayment = async (type: 'deposit' | 'full' | 'installment_deposit') => {
    if (!proposal) return;

    try {
      setPayingDeposit(true);
      const res = await fetch(`/api/proposals/${proposal.id}/pay-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: proposal.customer_email || 'client@example.com',
          paymentType: type,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to initialize deposit payment');
      }

      const { authorization_url } = await res.json();
      if (authorization_url) {
        window.location.href = authorization_url;
      } else {
        toast.error('Could not obtain checkout link. Please try again.');
      }
    } catch (err) {
      console.error('Error starting deposit payment:', err);
      toast.error('Failed to start transaction. Please try again.');
    } finally {
      setPayingDeposit(false);
    }
  };

  const handleFinanceApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    try {
      setApplyingFinance(true);
      const finalPrice = proposal.final_quoted_price_ngn || 0;
      const financedAmount = finalPrice * (1 - downPaymentPercent / 100);
      const downPayment = finalPrice * (downPaymentPercent / 100);
      
      const res = await fetch('/api/finance/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          monthlyIncome: Number(monthlyIncomeInput),
          employmentStatus,
          preferredLender,
          termMonths: financeMonths,
          downPayment,
          financedAmount,
        }),
      });

      if (!res.ok) {
        throw new Error('Financing application failed');
      }

      const data = await res.json();
      if (data.success && data.proposal) {
        setProposal({
          ...data.proposal,
          subscription_tier: proposal.subscription_tier
        });
        toast.success(`Financing Application: ${data.status.replace(/_/g, ' ')}!`);
        setShowFinanceModal(false);
      }
    } catch (err) {
      console.error('Error applying for finance:', err);
      toast.error('Failed to process financing application. Please try again.');
    } finally {
      setApplyingFinance(false);
    }
  };

  // Load proposal data
  React.useEffect(() => {
    async function fetchProposal() {
      try {
        setLoading(true);
        const res = await fetch(`/api/proposals/${token}/public`);
        if (!res.ok) {
          throw new Error('Failed to retrieve proposal details');
        }
        const { data, subscription_tier } = await res.json();

        if (!data) {
          setError('We could not find this proposal. Please confirm the link is correct.');
          return;
        }

        setProposal({
          ...data,
          subscription_tier,
        });
        setError(null);
      } catch (err: any) {
        console.error('Error fetching proposal:', err);
        setError('Failed to load proposal details. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchProposal();
    }
  }, [token]);

  // Track the 'Viewed' event on first load
  React.useEffect(() => {
    if (!proposal || hasViewedFired) return;

    const activeProposal = proposal;

    async function trackViewed() {
      try {
        setHasViewedFired(true);
        const updates: any = {
          last_viewed_at: new Date().toISOString()
        };

        // Update status to Viewed only if it's currently 'Sent' or empty
        if (activeProposal.tracking_status === 'Sent' || !activeProposal.tracking_status) {
          updates.tracking_status = 'Viewed';
        }

        const { error: updateErr } = await supabase
          .from('proposals')
          .update(updates)
          .eq('id', activeProposal.id);

        if (updateErr) {
          console.error('Failed to update tracking status:', updateErr);
        } else {
          // Sync state locally
          setProposal(prev => prev ? { ...prev, ...updates } : null);
        }
      } catch (err) {
        console.error('Error updating tracking status:', err);
      }
    }

    trackViewed();
  }, [proposal, hasViewedFired]);

  // Handle CTA approval
  const handleApprove = async () => {
    if (!proposal) return;

    const calcs = proposal.calculations_snapshot || {};
    if (calcs.surveyFee > 0 && !calcs.surveyPaid) {
      const element = document.getElementById('survey-booking-card');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        toast.info('Please review pre-installation site survey booking and proceed to payment.');
        return;
      }
    }

    try {
      const updates = {
        tracking_status: 'Approved',
        accepted_at: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposal.id);

      if (updateErr) throw updateErr;

      setProposal(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Proposal Approved successfully!');

      // Redirect to WhatsApp with confirmation message
      const branding = proposal.calculations_snapshot?.branding || {};
      const company = branding.tagline ? `with ${branding.tagline}` : 'solar proposal';
      const text = `Hi, I have reviewed and APPROVED my custom ${proposal.calculations_snapshot?.inverterKva || 5}kVA solar proposal ${company} (Ref: ${proposal.id}). Let's book the pre-installation site survey!`;
      const waUrl = `https://wa.me/${proposal.customer_phone || ''}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Error approving proposal:', err);
      toast.error('Failed to submit approval. Please try again.');
    }
  };

  // Handle CTA revision request
  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal || !revisionFeedback.trim()) return;

    try {
      setSubmittingFeedback(true);
      const updates = {
        tracking_status: 'Revision Requested',
        client_feedback: revisionFeedback,
        proposal_version: (proposal.proposal_version || 1)
      };

      const { error: updateErr } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposal.id);

      if (updateErr) throw updateErr;

      setProposal(prev => prev ? { ...prev, ...updates } : null);
      setShowRevisionModal(false);
      toast.success('Revision request sent to installer!');

      // Redirect to WhatsApp with feedback summary
      const text = `Hi, I reviewed my solar proposal (Ref: ${proposal.id}) and would like to request a revision.\n\nFeedback:\n"${revisionFeedback}"`;
      const waUrl = `https://wa.me/${proposal.customer_phone || ''}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Error submitting revision request:', err);
      toast.error('Failed to submit revision. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-slate-400 font-medium animate-pulse">Retrieving your personalized proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-955 text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">⚠️</div>
          <h2 className="text-2xl font-bold tracking-tight">Access Link Expired or Invalid</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {error || 'This interactive proposal link is not active. Please request a new invite link from your installer.'}
          </p>
          <Button onClick={() => router.push('/')} className="w-full bg-emerald-605 hover:bg-emerald-700 text-white rounded-xl">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const calcs = proposal.calculations_snapshot || {};
  const branding = calcs.branding || {};
  
  // Custom Dynamic Color Theme configuration
  const primaryColor = branding.primaryColor || '#01696f';
  const secondaryColor = branding.secondaryColor || '#01414a';
  const logoUrl = branding.logoUrl || '';

  // Get raw logo format or base64
  const logoSrc = (() => {
    if (!logoUrl) return '';
    if (logoUrl.startsWith('data:') || logoUrl.startsWith('http') || logoUrl.startsWith('/')) {
      return logoUrl;
    }
    if (/^[A-Za-z0-9+/=]+$/.test(logoUrl)) {
      return `data:image/png;base64,${logoUrl}`;
    }
    return logoUrl;
  })();

  // Naira financial details
  const finalPrice = proposal.final_quoted_price_ngn || 0;
  const backupHours = proposal.backup_hours || 8;
  const psh = proposal.peak_sun_hours || 4.2;

  // Sizing specs
  const inverterKva = calcs.inverterKva || 5;
  const batteryConfig = calcs.batteryConfigString || '2.4kWh Lithium';
  const panelCount = calcs.panelCount || 4;
  const panelWp = calcs.panelUnitWp || 550;
  const totalPanelWp = panelCount * panelWp;

  // ROI / Savings Calculations
  const roiCalculations = React.useMemo(() => {
    const essentialWh = calcs.essentialDailyWh || 0;
    const genInputs = {
      fuelType: (proposal.gen_fuel_type || 'petrol') as 'petrol' | 'diesel',
      capacityKva: proposal.gen_capacity_kva ?? 5,
      dailyHours: proposal.gen_daily_hours ?? 0,
      fuelPricePerLiter: proposal.gen_fuel_price_per_liter ?? 1200,
      serviceCostPerEvent: proposal.roi_gen_maintenance_cost_per_event ?? (proposal.gen_fuel_type === 'diesel' ? 35005 : 6000)
    };
    const gridInputs = {
      dailyHours: proposal.nepa_daily_hours ?? 0,
      tariffPerKwh: proposal.nepa_tariff_per_kwh ?? 225
    };
    const actualBilling = {
      monthlyGridBill: proposal.monthly_phcn_bill ?? 0,
      monthlyGenFuel: proposal.monthly_gen_fuel_cost ?? 0,
      monthlyGenMaint: proposal.monthly_gen_maintenance ?? 0
    };
    return calculateROI(finalPrice, genInputs, gridInputs, essentialWh, actualBilling);
  }, [finalPrice, proposal.gen_fuel_type, proposal.gen_capacity_kva, proposal.gen_daily_hours, proposal.gen_fuel_price_per_liter, proposal.roi_gen_maintenance_cost_per_event, proposal.nepa_daily_hours, proposal.nepa_tariff_per_kwh, proposal.monthly_phcn_bill, proposal.monthly_gen_fuel_cost, proposal.monthly_gen_maintenance, calcs.essentialDailyWh]);

  const totalOldEnergyCost = Math.round((roiCalculations.genMonthlyCost || 0) + (roiCalculations.gridMonthlyCost || 0));
  const solarSavings = Math.round(roiCalculations.baseMonthlySavings);

  const plan = calcs.paymentPlan || { selectedPlan: 'outright', downPaymentPercent: 20 };
  const hasPaymentPlan = plan.includeInProposal && plan.selectedPlan !== 'outright';

  const getPlanDetails = () => {
    if (plan.selectedPlan === 'outright') return null;
    const months = plan.selectedPlan === '6months' ? 6 : plan.selectedPlan === '12months' ? 12 : 24;
    const markupPercent = plan.selectedPlan === '6months' 
      ? (plan.markup6Months ?? 10) 
      : plan.selectedPlan === '12months' 
        ? (plan.markup12Months ?? 15) 
        : (plan.markup24Months ?? 20);
    
    const downPayment = finalPrice * (plan.downPaymentPercent / 100);
    const financedAmount = finalPrice * (1 - plan.downPaymentPercent / 100);
    const totalFinanced = financedAmount * (1 + markupPercent / 100);
    const monthlyRepayment = totalFinanced / months;

    return {
      months,
      downPayment,
      monthlyRepayment,
      totalPayable: downPayment + totalFinanced
    };
  };

  const planDetails = getPlanDetails();

  const getInsurancePremium = () => {
    if (insuranceTier === 'lite') return Math.round(finalPrice * 0.015);
    if (insuranceTier === 'pro') return Math.round(finalPrice * 0.025);
    if (insuranceTier === 'enterprise') return Math.round(finalPrice * 0.035);
    return 0;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32">
      {/* Inject Dynamic Installer Color tokens */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --installer-primary: ${primaryColor};
          --installer-secondary: ${secondaryColor};
        }
      `}} />

      {/* Free tier watermark */}
      {(!proposal.subscription_tier || proposal.subscription_tier === 'starter') && (
        <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 py-2.5 px-4 text-center text-xs text-white font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-md">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Powered by <strong>SolarQuotePro</strong> — Build and send interactive client-negotiable proposals.</span>
          <a href="https://solarquotepro.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-100 ml-1.5">Get Started Free →</a>
        </div>
      )}

      {/* FX Rates Locked banner at top */}
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs text-amber-300 font-medium">
        ⚡ Rate Locked: ₦{proposal.locked_fx_rate?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '1,600.00'}/$ locked for system components. Quote valid for 72 hours.
      </div>

      {/* Branded Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img src={logoSrc} alt="Company Logo" className="h-10 w-auto object-contain max-w-[140px]" />
            ) : (
              <span className="font-black text-xl tracking-wider text-emerald-400">SOLARQUOTEPRO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                proposal.tracking_status === 'Approved' ? 'bg-emerald-500' :
                proposal.tracking_status === 'Revision Requested' ? 'bg-amber-500' : 'bg-blue-400 animate-pulse'
              }`}></span>
              {proposal.tracking_status || 'Viewed'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Interactive Summary Container */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        
        {/* Customer Welcome card */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-955 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Customized For You
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              Solar Power Proposal
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Hello <strong className="text-white">{proposal.customer_name}</strong>, based on your appliance inputs and backup needs, your designer has sized a high-performance system to guarantee energy independence.
            </p>
          </div>
        </section>

        {/* Dynamic Pricing Summary & Transaction Engine */}
        <section className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-slate-400 font-bold text-sm">Choose Payment Method</span>
            <span className="text-xs text-slate-500">Ref: {proposal.id.substring(0, 8)}</span>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPaymentOption('outright')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                paymentOption === 'outright'
                  ? 'bg-emerald-500 text-slate-955 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Outright Purchase
            </button>
            <button
              onClick={() => setPaymentOption('finance')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                paymentOption === 'finance'
                  ? 'bg-emerald-500 text-slate-955 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Financing / Pay Later
            </button>
          </div>

          {paymentOption === 'outright' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Outright Investment</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-emerald-400">₦{finalPrice.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">fully installed</span>
                </div>
              </div>

              {calcs.depositPaid ? (
                <div className="bg-emerald-555/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">System Deposit Paid!</p>
                    <p className="text-[10px] text-slate-400">
                      Amount: ₦{(calcs.depositAmount || 0).toLocaleString()} (Ref: {calcs.depositRef})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => handleDepositPayment('deposit')}
                    disabled={payingDeposit}
                    className="py-5 bg-slate-955 hover:bg-slate-900 border border-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {payingDeposit ? 'Loading...' : `Pay 50% Deposit (₦${Math.round(finalPrice * 0.5).toLocaleString()})`}
                  </Button>
                  <Button
                    onClick={() => handleDepositPayment('full')}
                    disabled={payingDeposit}
                    className="py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-955 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {payingDeposit ? 'Loading...' : `Pay In Full (₦${finalPrice.toLocaleString()})`}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* If already applied for financing */}
              {calcs.financeApplication ? (
                <div className="space-y-4">
                  <div className={`border rounded-2xl p-5 space-y-4 ${
                    calcs.financeApplication.status === 'approved' 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-amber-500/5 border-amber-500/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`w-5 h-5 ${
                          calcs.financeApplication.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                        }`} />
                        <span className="font-extrabold text-sm uppercase tracking-wider text-white">
                          Lender Pre-Approval Offer
                        </span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        calcs.financeApplication.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {calcs.financeApplication.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Lender Partner</p>
                        <p className="font-bold text-white">{calcs.financeApplication.lender}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Amortization Period</p>
                        <p className="font-bold text-white">{calcs.financeApplication.termMonths} Months</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Down Payment (Paid/Due)</p>
                        <p className="font-bold text-white">₦{Math.round(calcs.financeApplication.downPayment).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Repayment</p>
                        <p className="font-bold text-white">₦{Math.round(calcs.financeApplication.monthlyRepayment).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <p className="text-[10px] text-slate-400">
                        * APR standard is 28% for solar financing loans. Pre-approval letter is issued by {calcs.financeApplication.lender}.
                      </p>
                      {calcs.financeApplication.preApprovalLetterUrl && (
                        <a
                          href={calcs.financeApplication.preApprovalLetterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline"
                        >
                          <FileText className="w-4 h-4" /> Download Official Pre-Approval Letter.pdf
                        </a>
                      )}
                    </div>
                  </div>

                  {calcs.depositPaid ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">Amortized Down Payment Paid!</p>
                        <p className="text-[10px] text-slate-400">
                          Secure deposit verified. Project proceeding to technical verification.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleDepositPayment('installment_deposit')}
                      disabled={payingDeposit}
                      className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      {payingDeposit ? 'Redirecting...' : `Pay Amortized Down Payment (₦${Math.round(calcs.financeApplication.downPayment).toLocaleString()}) via Paystack`}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dynamic Term Selector Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Finance Duration (Months)</span>
                      <span className="text-emerald-400 font-bold">{financeMonths} Months</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[6, 12, 24].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFinanceMonths(m)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                            financeMonths === m
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m} Months
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Down Payment Picker */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Down Payment Percentage</span>
                      <span className="text-emerald-400 font-bold">{downPaymentPercent}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[20, 30, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDownPaymentPercent(pct)}
                          className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition-all ${
                            downPaymentPercent === pct
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Live Calculations */}
                  {(() => {
                    const markupPercent = financeMonths === 6 ? 10 : financeMonths === 12 ? 15 : 20;
                    const downPayment = finalPrice * (downPaymentPercent / 100);
                    const financedAmount = finalPrice * (1 - downPaymentPercent / 100);
                    const totalFinanced = financedAmount * (1 + markupPercent / 100);
                    const monthlyRepayment = totalFinanced / financeMonths;

                    return (
                      <div className="bg-slate-955 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total System Cost:</span>
                          <span className="font-semibold text-white">₦{finalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Down Payment ({downPaymentPercent}%):</span>
                          <span className="font-semibold text-white">₦{Math.round(downPayment).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Financed Loan Amount:</span>
                          <span className="font-semibold text-white">₦{Math.round(financedAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                          <span className="text-slate-300 font-bold">Monthly Repayment:</span>
                          <span className="font-black text-emerald-400">
                            ₦{Math.round(monthlyRepayment).toLocaleString()} / mo
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <Button
                    onClick={() => setShowFinanceModal(true)}
                    className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    Apply for Instant Lender Pre-Approval ⚡
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-955/60 p-3 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-405 shrink-0" />
            <span>Secure checkout and bank validation is powered by Paystack.</span>
          </div>
        </section>

        {/* Hardware System Sizing details */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-300">System Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Inverter Card */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-lg font-bold">⚡</div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Hybrid Inverter</p>
                <p className="text-lg font-bold text-white">{inverterKva}kVA Capacity</p>
                <p className="text-xs text-slate-400 mt-1">Handles peak appliances & surge protection.</p>
              </div>
            </div>

            {/* Battery Card */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-lg font-bold">🔋</div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Lithium Battery</p>
                <p className="text-lg font-bold text-white">{batteryConfig}</p>
                <p className="text-xs text-slate-400 mt-1">Guarantees {backupHours} hours backup runtime.</p>
              </div>
            </div>

            {/* Panel Card */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-lg font-bold">☀️</div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Solar Array</p>
                <p className="text-lg font-bold text-white">{totalPanelWp.toLocaleString()}Wp Total</p>
                <p className="text-xs text-slate-400 mt-1">{panelCount}x {panelWp}W monocrystalline panels.</p>
              </div>
            </div>

          </div>

          {/* Verified Components Trust Registry */}
          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-405 flex items-center justify-center font-bold text-lg shrink-0">🛡️</div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-white">Genuine Component Trust Verification</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5 shrink-0" /> Verified Authentic
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Hardware serial numbers for this system (Growatt, Felicity, Jinko) have been cross-verified with manufacturers' registries. Guarantees 100% genuine components with no counterfeits.
                </p>
              </div>
            </div>
            <div className="text-[10px] text-slate-505 font-mono self-end sm:self-center shrink-0">
              REG-ID: SQP-REG-{proposal.id.substring(0, 8).toUpperCase()}
            </div>
          </div>
        </section>

        {/* Generator ROI Nigeria Savings Weapon */}
        <section className="bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-lg font-bold tracking-tight">Your Naira ROI & Savings Weapon</h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Comparing monthly diesel/petrol generator runtime at fuel rates of ₦{proposal.gen_fuel_price_per_liter || 1200}/L against solar, here is your financial advantage:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-505 uppercase font-semibold">Monthly Fuel Expense</p>
              <p className="text-lg font-extrabold text-red-400 line-through">₦{totalOldEnergyCost.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Generator + PHCN</p>
            </div>
            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-800/20">
              <p className="text-[10px] text-emerald-400 uppercase font-semibold">Estimated Monthly Savings</p>
              <p className="text-lg font-extrabold text-emerald-400">₦{solarSavings.toLocaleString()}</p>
              <p className="text-[9px] text-emerald-500 mt-0.5">Naira saved monthly</p>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 col-span-2 md:col-span-1">
              <p className="text-[10px] text-slate-505 uppercase font-semibold">Investment Payback Period</p>
              <p className="text-lg font-extrabold text-amber-400">
                {roiCalculations.paybackMonths === Infinity ? 'N/A' : `${(roiCalculations.paybackMonths / 12).toFixed(1)} Years`}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">Break-even timeline</p>
            </div>
          </div>

          {/* Noise rating */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
            <Volume2 className="w-10 h-10 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Silent Power vs Noisy Generator</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enjoy 0dB total silence. Protect your family from continuous petrol generator noise pollution (85dB average) and carbon fumes.
              </p>
            </div>
          </div>
        </section>

        {/* Physical Inspection & Survey Booking Section */}
        {calcs.surveyFee > 0 && (
          <section id="survey-booking-card" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                📋 Pre-Installation Site Survey
              </h3>
              {calcs.surveyPaid ? (
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20">
                  Paid & Booked
                </span>
              ) : (
                <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                  Action Required
                </span>
              )}
            </div>

            {calcs.surveyPaid ? (
              <div className="space-y-4">
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-emerald-400 font-medium leading-relaxed">
                    🎉 <strong>Site Survey Payment Confirmed!</strong> Your inspection is booked. Our technical engineers will contact you within 24 hours at <strong className="text-white">{proposal.customer_phone || 'your phone number'}</strong> to schedule the physical roof & electrical inspection.
                  </p>
                  <div className="pt-2 border-t border-emerald-900/30 text-[10px] text-slate-400 space-y-1 font-mono">
                    <div>PAYMENT REF: {calcs.paystackRef || 'N/A'}</div>
                    {calcs.warrantyCert && (
                      <div className="text-emerald-400 font-bold">WARRANTY CERT: {calcs.warrantyCert}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Before system installation, a physical site survey is required to verify roof structural capacity, panel tilt alignment, and cable path distances. 
                </p>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Survey Inspection Fee:</span>
                    <span className="font-bold text-white">₦{Number(calcs.surveyFee).toLocaleString()}</span>
                  </div>
                  
                  {calcs.offerInsurance && (
                    <div className="pt-4 border-t border-slate-800 space-y-4">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        🛡️ Multi-Tier Solar Shield Protection Plan
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setInsuranceTier('lite')}
                          className={`p-3 rounded-xl border text-left space-y-1.5 transition-all ${
                            insuranceTier === 'lite'
                              ? 'bg-emerald-500/5 border-emerald-500 ring-1 ring-emerald-500'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[11px] text-white">Lite (1.5%)</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            Covers installation workmanship errors & basic wiring defects.
                          </p>
                          <p className="text-[10px] font-black text-emerald-400 pt-1">
                            +₦{Math.round(finalPrice * 0.015).toLocaleString()}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInsuranceTier('pro')}
                          className={`p-3 rounded-xl border text-left space-y-1.5 transition-all relative ${
                            insuranceTier === 'pro'
                              ? 'bg-emerald-500/5 border-emerald-500 ring-1 ring-emerald-500'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="absolute -top-2 right-2 bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                            Popular
                          </span>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[11px] text-white">Pro (2.5%)</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            Covers Lite + power surges & lightning strike spikes.
                          </p>
                          <p className="text-[10px] font-black text-emerald-400 pt-1">
                            +₦{Math.round(finalPrice * 0.025).toLocaleString()}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInsuranceTier('enterprise')}
                          className={`p-3 rounded-xl border text-left space-y-1.5 transition-all ${
                            insuranceTier === 'enterprise'
                              ? 'bg-emerald-500/5 border-emerald-500 ring-1 ring-emerald-500'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[11px] text-white">Enterprise (3.5%)</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            Covers Pro + panel theft, accidental damage & storm.
                          </p>
                          <p className="text-[10px] font-black text-emerald-400 pt-1">
                            +₦{Math.round(finalPrice * 0.035).toLocaleString()}
                          </p>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInsuranceTier('none')}
                        className={`text-[10px] font-semibold hover:underline block text-center w-full ${
                          insuranceTier === 'none' ? 'text-emerald-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        Decline Insurance Coverage
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSurveyPayment}
                  disabled={payingSurvey}
                  className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  {payingSurvey ? 'Initializing Paystack...' : `Book & Pay ₦${(Number(calcs.surveyFee) + getInsurancePremium()).toLocaleString()} via Paystack`}
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Lagos Safety & Compliance Details */}
        <section className="bg-slate-900 border border-slate-805 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-405" /> Lagos Building & Fire Compliance
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All our solar array structural mounts conform to local government wind lift tolerances, complete with proper DC isolation breakers, professional earthing spikes, and lightning arresters for maximum storm safety in Lagos and coastal regions.
          </p>
        </section>

        {/* Shared PDF download */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/proposals/print?id=${proposal.id}`)}
            className="text-xs border-slate-800 text-slate-400 hover:text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Official Print PDF
          </Button>
        </div>

      </main>

      {/* Floating Glassmorphic CTA Bar for mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 z-30 shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          
          {proposal.tracking_status === 'Approved' ? (
            <div className="w-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl py-3 px-4 text-center font-bold text-sm flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Proposal Approved & Locked!
            </div>
          ) : (
            <>
              <Button 
                onClick={() => setShowRevisionModal(true)} 
                variant="outline" 
                className="flex-1 py-6 border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
              >
                Request Revision
              </Button>
              <Button 
                onClick={handleApprove}
                className="flex-1 py-6 bg-emerald-555 hover:bg-emerald-600 text-slate-955 font-black rounded-xl text-xs flex items-center justify-center gap-2"
              >
                Approve & Book Survey
              </Button>
            </>
          )}

        </div>
      </div>

      {/* Elegant Revision Overlay Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
            <h3 className="text-xl font-bold tracking-tight text-white">Request Proposal Revision</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Type your changes (e.g. adding appliances, reducing cost, changing tiers). Your designer will be notified instantly to update the sizing.
            </p>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <textarea 
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                required
                rows={4}
                placeholder="Example: I would like to add my 1.5HP inverter AC to the backup load..."
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
              />

              <div className="flex gap-3">
                <Button 
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  variant="outline"
                  className="flex-1 py-5 border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submittingFeedback || !revisionFeedback.trim()}
                  className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-955 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? 'Sending...' : 'Send Feedback'} <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Finance Application KYC Modal */}
      {showFinanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              ⚡ Lender Financing Application
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your pre-qualification KYC. Applications are processed instantly with Sterling Bank (L.A.S.E.R.), CDcare, or CredPal.
            </p>

            <form onSubmit={handleFinanceApply} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Monthly Net Income (₦)</label>
                <input
                  type="number"
                  value={monthlyIncomeInput}
                  onChange={(e) => setMonthlyIncomeInput(e.target.value)}
                  required
                  placeholder="e.g. 500000"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Employment Status</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="salaried">Salaried (Full-time Employee)</option>
                  <option value="self_employed">Self Employed / Business Owner</option>
                  <option value="unemployed">Contractor / Freelancer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Preferred Financing Institution</label>
                <select
                  value={preferredLender}
                  onChange={(e) => setPreferredLender(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Sterling Bank">Sterling Bank (L.A.S.E.R. Solar)</option>
                  <option value="CredPal">CredPal Solar Financing</option>
                  <option value="SunKing">SunKing Pay-As-You-Go</option>
                  <option value="Carbon">Carbon Asset Finance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Bank Verification Number (BVN) - Optional</label>
                <input
                  type="text"
                  maxLength={11}
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value)}
                  placeholder="11-digit BVN"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[9px] text-slate-500 font-medium">
                  Providing BVN increases instant approval rates by 45%. We do not store your BVN.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button"
                  onClick={() => setShowFinanceModal(false)}
                  variant="outline"
                  className="flex-1 py-5 border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={applyingFinance}
                  className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {applyingFinance ? 'Evaluating...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
