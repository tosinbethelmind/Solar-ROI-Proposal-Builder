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
  final_quoted_price_ngn: number;
  locked_fx_rate?: number;
  fx_rate_locked_at?: string;
  calculations_snapshot: any;
  created_at: string;
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

  // Load proposal data
  React.useEffect(() => {
    async function fetchProposal() {
      try {
        setLoading(true);
        // Find proposal by token (first check client_token, fallback to ID)
        const { data, error: dbError } = await supabase
          .from('proposals')
          .select('*')
          .or(`client_token.eq.${token},id.eq.${token}`)
          .single();

        if (dbError) throw dbError;

        if (!data) {
          setError('We could not find this proposal. Please confirm the link is correct.');
          return;
        }

        setProposal(data as ProposalData);
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

  // Monthly generator calculations to Nigerian Naira savings weapon
  const currentGenFuelCost = proposal.gen_daily_hours * (proposal.gen_fuel_price_per_liter || 1200) * 1.5 * 30; // Liters consumed estimate
  const phcnCost = (proposal.nepa_daily_hours * (proposal.nepa_tariff_per_kwh || 225) * 2 * 30); // Base PHCN bill estimate
  const totalOldEnergyCost = Math.round(currentGenFuelCost + phcnCost);
  const solarSavings = Math.round(totalOldEnergyCost * 0.85); // 85% average savings

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

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32">
      {/* Inject Dynamic Installer Color tokens */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --installer-primary: ${primaryColor};
          --installer-secondary: ${secondaryColor};
        }
      `}} />

      {/* FX Rates Locked banner at top */}
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs text-amber-300 font-medium">
        ⚡ Rate Locked: ₦{proposal.locked_fx_rate?.toLocaleString() || '1,600'}/$ locked for system components. Quote valid for 72 hours.
      </div>

      {/* Branded Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img src={logoSrc} alt="Company Logo" className="h-10 w-auto object-contain max-w-[140px]" />
            ) : (
              <span className="font-black text-xl tracking-wider text-emerald-400">SOLARPRO</span>
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

        {/* Dynamic Pricing Summary Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-slate-400 font-semibold text-sm">Investment Summary</span>
            <span className="text-xs text-slate-500">Ref: {proposal.id.substring(0, 8)}</span>
          </div>

          <div className="space-y-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Turnkey Investment</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-emerald-400">₦{finalPrice.toLocaleString()}</span>
              <span className="text-xs text-slate-500">fully installed</span>
            </div>
          </div>

          {/* Payment Plan Details if included */}
          {hasPaymentPlan && planDetails && (
            <div className="bg-slate-955 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-400 font-bold uppercase tracking-wider">Installment Plan Available</span>
                <span className="text-slate-400 font-medium">{planDetails.months} Months Plan</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Down Payment</p>
                  <p className="text-lg font-bold text-white">₦{Math.round(planDetails.downPayment).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Repayment</p>
                  <p className="text-lg font-bold text-white">₦{Math.round(planDetails.monthlyRepayment).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-955/60 p-3 rounded-xl border border-slate-805">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Includes high-grade surge protection, AC/DC safety earthing & copper wiring.</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Fuel Expense</p>
              <p className="text-lg font-extrabold text-red-400 line-through">₦{totalOldEnergyCost.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Generator + PHCN</p>
            </div>
            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-800/20">
              <p className="text-[10px] text-emerald-400 uppercase font-semibold">Estimated Monthly Savings</p>
              <p className="text-lg font-extrabold text-emerald-400">₦{solarSavings.toLocaleString()}</p>
              <p className="text-[9px] text-emerald-500 mt-0.5">Naira saved monthly</p>
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
                  className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? 'Sending...' : 'Send Feedback'} <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
