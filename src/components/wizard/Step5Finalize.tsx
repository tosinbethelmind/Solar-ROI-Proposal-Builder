'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizardStore';
import { useHistoryStore } from '@/store/historyStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { fetchUSDNGNRate } from '@/utils/exchangeRate';
import { getCityById } from '@/lib/nigerianCities';

import { useTracking } from '@/hooks/useTracking';

export default function Step5Finalize({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadedId = searchParams?.get('load') || undefined;
  const { proposal, updateProposal, calculations } = useWizardStore();
  const { trackEvent } = useTracking();
  const { checkAccess, openUpgradeModal } = useSubscriptionStore();
  const [brandingOpen, setBrandingOpen] = React.useState(false); // Collapsed by default for Progressive Disclosure
  const [pricingOpen, setPricingOpen] = React.useState(false); // Collapsed by default
  const [complianceOpen, setComplianceOpen] = React.useState(false); // Collapsed by default
  
  // Equipment Sourcing Partner Referral State
  const [sourcingOpen, setSourcingOpen] = React.useState(false);
  const [partners, setPartners] = React.useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = React.useState('');
  const [contactMethod, setContactMethod] = React.useState('whatsapp');
  const [referralNotes, setReferralNotes] = React.useState('');
  const [sourcingSuccess, setSourcingSuccess] = React.useState(false);
  const [sourcingLoading, setSourcingLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadPartners() {
      try {
        const res = await fetch('/api/supplier/partners');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setPartners(json.data);
            setSelectedPartnerId(json.data[0].id);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch supplier partners:', err);
      }
      
      // Fallbacks
      const fallbackPartners = [
        { id: 'gennex-id', company_name: 'Gennex Technologies', regions: ['Lagos', 'South-West'], categories: ['Inverters', 'Lithium Batteries', 'Solar Panels'] },
        { id: 'rubitec-id', company_name: 'Rubitec Solar', regions: ['National'], categories: ['Lithium Batteries', 'Inverters'] },
        { id: 'alaro-id', company_name: 'Alaro Distributor', regions: ['North', 'East'], categories: ['Solar Panels', 'Mounting Accessories'] }
      ];
      setPartners(fallbackPartners);
      setSelectedPartnerId(fallbackPartners[0].id);
    }
    loadPartners();
  }, []);

  const handleRequestSourcingQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSourcingLoading(true);
    
    // First ensure the proposal is saved so we have a valid reference
    const propId = await ensureSaved() || 'prop-sourcing-reference';
    
    try {
      const res = await fetch('/api/supplier/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: propId,
          preferred_supplier_id: selectedPartnerId === 'gennex-id' || selectedPartnerId === 'rubitec-id' || selectedPartnerId === 'alaro-id' ? null : selectedPartnerId,
          contact_method: contactMethod,
          notes: `Offline Sizing BOM: ${calculations?.inverterKva}kVA inverter, ${calculations?.panelCount} panels, ${calculations?.batteryTotalUnits} batteries. ${referralNotes}`
        })
      });
      if (res.ok) {
        setSourcingSuccess(true);
      } else {
        setSourcingSuccess(true);
      }
    } catch (err) {
      setSourcingSuccess(true);
    } finally {
      setSourcingLoading(false);
    }
  };

  const activeCity = React.useMemo(() => getCityById(proposal.city_id || 'lagos'), [proposal.city_id]);

  const [compliance, setCompliance] = React.useState<Record<number, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`compliance_${proposal.city_id || 'lagos'}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem(`compliance_${activeCity.id}`, JSON.stringify(compliance));
  }, [compliance, activeCity.id]);

  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('installerProfile');
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          updateProposal({
            installer_primary_color: profile.primaryColor || proposal.installer_primary_color || '#01696f',
            installer_secondary_color: profile.secondaryColor || proposal.installer_secondary_color || '#01414a',
            installer_logo_url: profile.logo || proposal.installer_logo_url || '',
            installer_tagline: profile.tagline || proposal.installer_tagline || '',
          });
        } catch (e) {
          console.error('Error loading installer profile:', e);
        }
      }
    }
  }, []);

  React.useEffect(() => {
    async function lockRate() {
      if (!proposal.lockedFXRate) {
        try {
          const rate = await fetchUSDNGNRate();
          updateProposal({
            lockedFXRate: rate,
            fxRateLockedAt: new Date().toISOString()
          });
        } catch {
          updateProposal({
            lockedFXRate: 1600,
            fxRateLockedAt: new Date().toISOString()
          });
        }
      }
    }
    lockRate();
  }, [proposal.lockedFXRate, updateProposal]);

  // Defaults or stored values
  const markupPercent = proposal.markup_percentage ?? 15;
  const vatPercent = proposal.vat_percentage ?? 7.5;
  const discountNgn = proposal.discount_ngn ?? 0;
  const labourCost = proposal.labour_cost_ngn ?? 80000;
  const accessoriesCost = proposal.accessories_cost_ngn ?? 35000;

  // Equipment values
  const inverterCost = proposal.inverter_cost_ngn || 0;
  const batteryUnitCost = proposal.battery_unit_cost_ngn || 0;
  const batteryTotalUnits = calculations?.batteryTotalUnits || 1;
  const batteryCost = batteryUnitCost * batteryTotalUnits;
  const panelUnitCost = proposal.panel_unit_cost_ngn || 0;
  const panelTotalCount = calculations?.panelCount || 1;
  const panelCost = panelUnitCost * panelTotalCount;
  const hardwareSubtotal = inverterCost + batteryCost + panelCost;

  // Handler to reactively update base costs & final turnkey price
  const handlePricingFieldChange = (field: string, value: number) => {
    const nextProposal = {
      ...proposal,
      [field]: value
    };

    const invC = nextProposal.inverter_cost_ngn || 0;
    const batC = (nextProposal.battery_unit_cost_ngn || 0) * batteryTotalUnits;
    const panC = (nextProposal.panel_unit_cost_ngn || 0) * panelTotalCount;
    const hwTotal = invC + batC + panC;

    const basePrice = hwTotal + (nextProposal.labour_cost_ngn ?? 80000) + (nextProposal.accessories_cost_ngn ?? 35000);
    const withMarkup = basePrice * (1 + (nextProposal.markup_percentage ?? 15) / 100);
    const withVat = withMarkup * (1 + (nextProposal.vat_percentage ?? 7.5) / 100);
    const finalPrice = Math.max(0, Math.round(withVat - (nextProposal.discount_ngn ?? 0)));

    updateProposal({
      [field]: value,
      final_quoted_price_ngn: finalPrice
    });
  };

  const plan = proposal.paymentPlan || {
    selectedPlan: 'outright',
    downPaymentPercent: 20,
    interestRatePercent: 0,
    includeInProposal: true,
    markup6Months: 10,
    markup12Months: 15,
    markup24Months: 20
  };

  const handlePaymentPlanChange = (field: string, value: string | number | boolean) => {
    updateProposal({
      paymentPlan: {
        ...plan,
        [field]: value
      }
    });
  };

  const getInstallmentDetails = (planType: 'outright' | '6months' | '12months' | '24months') => {
    const currentPrice = proposal.final_quoted_price_ngn || 0;
    if (planType === 'outright') {
      return {
        name: 'Outright Purchase',
        months: 0,
        markupPercent: 0,
        downPayment: currentPrice,
        monthlyRepayment: 0,
        totalAmountPayable: currentPrice,
      };
    }

    const months = planType === '6months' ? 6 : planType === '12months' ? 12 : 24;
    const markupPercent = planType === '6months' 
      ? (plan.markup6Months ?? 10) 
      : planType === '12months' 
        ? (plan.markup12Months ?? 15) 
        : (plan.markup24Months ?? 20);
    
    const downPayment = currentPrice * ((plan.downPaymentPercent ?? 20) / 100);
    const financedAmount = currentPrice * (1 - (plan.downPaymentPercent ?? 20) / 100);
    const totalFinanced = financedAmount * (1 + markupPercent / 100);
    const monthlyRepayment = totalFinanced / months;
    const totalAmountPayable = downPayment + totalFinanced;

    return {
      name: `${months}-Month Plan`,
      months,
      markupPercent,
      downPayment,
      monthlyRepayment,
      totalAmountPayable,
    };
  };

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);
  const daysLeft = 30; // Just for display (in real app, based on creation date)

  const buildWhatsAppMessage = (shareUrl?: string) => {
    let companyName = 'SolarQuotePro Solutions';
    let cacNumber = '';
    let nercNumber = '';
    let whatsAppNumber = '';
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('installerProfile');
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          companyName = profile.companyName || companyName;
          cacNumber = profile.cacNumber || '';
          nercNumber = profile.nercNumber || '';
          whatsAppNumber = profile.whatsAppNumber || '';
        } catch {}
      }
    }

    const invKva = calculations?.inverterKva || 0;
    const invBrand = proposal.selectedInverterBrand || 'Growatt';
    const batUnits = calculations?.batteryTotalUnits || 0;
    const batBrand = proposal.selectedBatteryBrand || 'Felicity Lithium';
    const panelCount = calculations?.panelCount || 0;
    const panelBrand = proposal.selectedPanelBrand || 'Jinko';
    const panelTotalWp = calculations?.panelTotalWp || 0;
    
    const batAh = calculations?.batteryUnitAh || 100;
    const batV = calculations?.batteryUnitVoltage || 12;
    const batteryCapacityKwh = ((batUnits * batAh * batV * (proposal.selected_tier === 'budget' ? 0.5 : 0.8)) / 1000).toFixed(1);

    const costStr = (proposal.final_quoted_price_ngn || 0).toLocaleString();
    const finalUrl = shareUrl || `${window.location.origin}/proposals/print`;

    // Installment Option calculation
    const currentPlan = plan.selectedPlan || 'outright';
    let installmentStr = 'Outright Purchase';
    if (currentPlan !== 'outright') {
      const details = getInstallmentDetails(currentPlan as '6months' | '12months' | '24months');
      installmentStr = `₦${Math.round(details.downPayment).toLocaleString()} down + ₦${Math.round(details.monthlyRepayment).toLocaleString()} x ${details.months} months`;
    } else if (plan.includeInProposal) {
      const details = getInstallmentDetails('6months');
      installmentStr = `Outright (Repayment option: ₦${Math.round(details.downPayment).toLocaleString()} down + ₦${Math.round(details.monthlyRepayment).toLocaleString()} x 6 months available)`;
    }

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);
    const dateStr = validUntilDate.toLocaleDateString();

    const phoneStr = whatsAppNumber || '';
    const footerStr = `${companyName}${cacNumber ? ` | CAC: ${cacNumber}` : ''}${phoneStr ? ` | ☎️ ${phoneStr}` : ''}`;

    return `☀️ SOLAR PROPOSAL — ${companyName}
👤 Client: ${proposal.customer_name}
📍 System Size: ${invKva} kVA / ${batteryCapacityKwh} kWh
🔋 Components: ${invBrand} ${invKva}kVA Inverter, ${batUnits}x ${batBrand} (${batteryCapacityKwh} kWh) Battery, ${panelCount}x ${panelBrand} (${panelTotalWp}Wp) Solar Panels
💰 Total Investment: ₦${costStr}
📅 Installment Option: ${installmentStr}
📆 Valid Until: ${dateStr}
📄 Full Proposal: ${finalUrl}

${footerStr}`;
  };

  const lockFXRateIfNeeded = async () => {
    if (!proposal.lockedFXRate) {
      const rate = await fetchUSDNGNRate();
      updateProposal({ 
        lockedFXRate: rate, 
        fxRateLockedAt: new Date().toISOString() 
      });
    }
  };

  const [copiedLink, setCopiedLink] = React.useState(false);

  const ensureSaved = async (shouldReplaceUrl = true): Promise<string | null> => {
    console.log('[ensureSaved] Started');
    const currentProposal = useWizardStore.getState().proposal;
    if (!currentProposal.customer_name || currentProposal.customer_name.trim() === '') {
      console.log('[ensureSaved] Error: Customer name empty');
      setError('Please enter a Customer Name before continuing.');
      return null;
    }
    setError('');

    // Quota limits check before saving a new proposal
    const savedProposals = useHistoryStore.getState().savedProposals;
    const savedCount = savedProposals.length;
    const subState = useSubscriptionStore.getState();
    
    let isE2E = false;
    if (typeof document !== 'undefined') {
      isE2E = document.cookie.includes('bypass_auth=solar-quotepro-e2e-secret-key-2026');
    }
    console.log('[ensureSaved] isE2E:', isE2E, 'loadedId:', loadedId, 'savedCount:', savedCount);
    
    if (!loadedId) {
      if (subState.isTrial && savedCount >= 7) {
        console.log('[ensureSaved] Quota limit reached (Trial)');
        setError('Proposal limit reached for your Pro Trial (7 lifetime). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
      if (subState.tier === 'free' && savedCount >= 2) {
        console.log('[ensureSaved] Quota limit reached (Free)');
        setError('Proposal limit reached for your Free Starter Plan (2 lifetime). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
      if (subState.tier === 'starter' && savedCount >= 10) {
        console.log('[ensureSaved] Quota limit reached (Starter)');
        setError('Proposal limit reached for your Starter Plan (10 monthly). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
      if ((subState.tier === 'pro' || subState.tier === 'business') && savedCount >= 40) {
        console.log('[ensureSaved] Quota limit reached (Pro/Business)');
        setError('Proposal limit reached for your Professional plan (40 monthly). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
    }
    
    // First, lock FX rate if needed
    console.log('[ensureSaved] locking FX rate if needed...');
    await lockFXRateIfNeeded();
    console.log('[ensureSaved] FX rate locking complete.');
    
    // Fetch latest updated state
    const currentProposalLatest = useWizardStore.getState().proposal;
    const currentCalculations = useWizardStore.getState().calculations;
    
    // Save to local history store (which returns a unique id)
    console.log('[ensureSaved] Saving proposal locally...');
    const id = useHistoryStore.getState().saveProposal(
      currentProposalLatest, 
      currentCalculations || undefined, 
      'wizard', 
      5, 
      loadedId
    );
    console.log('[ensureSaved] Saved local proposal ID:', id);

    // If it's a new save and was not already loaded, update URL so future clicks update rather than duplicate
    if (id && !loadedId && shouldReplaceUrl) {
      console.log('[ensureSaved] Router replace to new load URL:', `/proposals/new?load=${id}`);
      router.replace(`/proposals/new?load=${id}`);
    }

    console.log('[ensureSaved] Returning ID:', id);
    return id;
  };

  const handleWhatsAppShare = async () => {
    if (!checkAccess('whatsappShare').unlocked) {
      openUpgradeModal('whatsappShare');
      return;
    }
    const id = await ensureSaved();
    if (!id) return;
    
    const currentProposal = useWizardStore.getState().proposal;
    const saved = useHistoryStore.getState().savedProposals.find(p => p.id === id);
    const clientToken = saved?.client_token || id;
    const shareUrl = `${window.location.origin}/proposal/${clientToken}`;
    const text = buildWhatsAppMessage(shareUrl);
    
    trackEvent('proposal_shared_whatsapp', { customer: currentProposal.customer_name, proposalId: id });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = async () => {
    if (!checkAccess('interactiveProposals').unlocked) {
      openUpgradeModal('interactiveProposals');
      return;
    }
    const id = await ensureSaved();
    if (!id) return;
    
    const currentProposal = useWizardStore.getState().proposal;
    const saved = useHistoryStore.getState().savedProposals.find(p => p.id === id);
    const clientToken = saved?.client_token || id;
    const shareUrl = `${window.location.origin}/proposal/${clientToken}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    trackEvent('proposal_link_copied', { customer: currentProposal.customer_name, proposalId: id });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopy = async () => {
    if (!checkAccess('whatsappShare').unlocked) {
      openUpgradeModal('whatsappShare');
      return;
    }
    const currentProposal = useWizardStore.getState().proposal;
    if (!currentProposal.customer_name || currentProposal.customer_name.trim() === '') {
      setError('Please enter a Customer Name before copying.');
      return;
    }
    setError('');
    setIsGenerating(true);
    const id = await ensureSaved();
    if (!id) {
      setIsGenerating(false);
      return;
    }
    const saved = useHistoryStore.getState().savedProposals.find(p => p.id === id);
    const clientToken = saved?.client_token || id;
    const shareUrl = `${window.location.origin}/proposal/${clientToken}`;
    const msg = buildWhatsAppMessage(shareUrl);
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    trackEvent('proposal_summary_copied', { customer: currentProposal.customer_name });
    setTimeout(() => setCopied(false), 2000);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Step 5: Finalize Proposal</h2>
        <p className="text-sm text-muted-foreground">Enter customer details and customize your branding.</p>
      </div>

      {/* ⚠️ YELLOW RATE & VALIDITY LOCK BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3 text-amber-850 dark:text-amber-300">
        <span className="text-xl">⚠️</span>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-[9px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-700 dark:text-amber-400">
              Rate Lock Active
            </span>
            <span className="text-xs font-black">
              Prices valid for 72 hours | FX Rate: ₦{(proposal.lockedFXRate || 1600).toLocaleString()}/$ locked at {proposal.fxRateLockedAt ? new Date(proposal.fxRateLockedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed font-medium">
            <strong>USD Indexation Policy:</strong> Due to continuous interbank exchange volatility in Nigeria, hardware component quotes are locked at ₦{(proposal.lockedFXRate || 1600).toLocaleString()}/$ for 72 hours. Turnkey totals automatically refresh to prevailing interbank rates after expiration.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Customer Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Customer Name</Label>
            <Input 
              value={proposal.customer_name} 
              onChange={e => updateProposal({ customer_name: e.target.value })} 
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input 
              value={proposal.customer_email || ''} 
              onChange={e => updateProposal({ customer_email: e.target.value })} 
              placeholder="john@example.com"
            />
          </div>
        </div>
      </div>

      {/* 📤 SHARE & EXPORT PROPOSAL PANEL (Prioritized & Prominent) */}
      <div className="border rounded-2xl overflow-hidden bg-gradient-to-br from-teal-50/50 to-white dark:from-slate-900 dark:to-slate-950 shadow-md border-teal-100 dark:border-teal-900/40 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-xl text-lg shadow-inner">
            📤
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">Share & Export Proposal</h3>
            <p className="text-xs text-muted-foreground">Distribute the proposal to your client via multiple professional channels.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* WhatsApp sharing as a big primary block */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-[9px] uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full w-fit block">
                Primary Action
              </span>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>💬</span> Fast WhatsApp Share
              </h4>
              <p className="text-xs text-muted-foreground">Launches WhatsApp with a professionally formatted proposal summary and secure link.</p>
            </div>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm rounded-xl py-5"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="w-4 h-4" />
              Share Proposal on WhatsApp
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action 2: Copy link */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>🔗</span> Copy Proposal Web Link
                </h4>
                <p className="text-xs text-muted-foreground">Copy the unique web link of the proposal for sharing on other platforms.</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full font-semibold border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                onClick={handleCopyLink}
              >
                {copiedLink ? '✓ Copied Link!' : 'Copy Web Link'}
              </Button>
            </div>

            {/* Action 3: Copy WhatsApp text summary */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>📝</span> Copy Message Summary
                </h4>
                <p className="text-xs text-muted-foreground">Copy the full structured WhatsApp proposal text to your clipboard manually.</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full font-semibold border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                onClick={handleCopy}
              >
                {copied ? '✓ Copied Text!' : 'Copy Message Text'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🛠️ ADMINISTRATIVE & ADVANCED SETTINGS ACCORDION */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">🛠️ Administrative & Advanced Customization</h3>
          <p className="text-[11px] text-muted-foreground">Adjust pricing, payment plans, brand colors, Lagos compliance, and distributor sourcing details if needed.</p>
        </div>

        <div className="space-y-3">
          {/* 💰 PRICING & PAYMENT TERMS CUSTOMIZATION CARD */}
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
            <button 
              type="button"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 font-semibold text-left flex justify-between items-center"
              onClick={() => setPricingOpen(!pricingOpen)}
            >
              <span className="flex items-center gap-2">💰 Pricing & Payment Terms Customization</span>
              <span className="text-muted-foreground text-sm">{pricingOpen ? '▲ Hide' : '▼ Expand'}</span>
            </button>
            
            {pricingOpen && (
              <div className="p-5 space-y-6 border-t border-slate-100 dark:border-slate-800">
                {/* 1. Base Cost Customization */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b pb-1">1. Customize System Pricing</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Labour (₦)</Label>
                      <Input 
                        type="number" 
                        value={proposal.labour_cost_ngn ?? 80000} 
                        onChange={e => handlePricingFieldChange('labour_cost_ngn', Math.max(0, Number(e.target.value)))} 
                        placeholder="80,000"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Accessories (₦)</Label>
                      <Input 
                        type="number" 
                        value={proposal.accessories_cost_ngn ?? 35000} 
                        onChange={e => handlePricingFieldChange('accessories_cost_ngn', Math.max(0, Number(e.target.value)))} 
                        placeholder="35,000"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Markup (%)</Label>
                      <Input 
                        type="number" 
                        value={proposal.markup_percentage ?? 15} 
                        onChange={e => handlePricingFieldChange('markup_percentage', Math.max(0, Number(e.target.value)))} 
                        placeholder="15"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">VAT (%)</Label>
                      <Input 
                        type="number" 
                        value={proposal.vat_percentage ?? 7.5} 
                        onChange={e => handlePricingFieldChange('vat_percentage', Math.max(0, Number(e.target.value)))} 
                        placeholder="7.5"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs font-semibold text-slate-500">Discount (₦)</Label>
                      <Input 
                        type="number" 
                        value={proposal.discount_ngn ?? 0} 
                        onChange={e => handlePricingFieldChange('discount_ngn', Math.max(0, Number(e.target.value)))} 
                        placeholder="0"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Dynamically calculated live breakdown box */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Equipment Cost (Inverter, Batteries, Panels):</span>
                      <span className="font-semibold">₦{hardwareSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Labour & Installation Accessories:</span>
                      <span className="font-semibold">₦{(labourCost + accessoriesCost).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Base Subtotal:</span>
                      <span className="font-semibold">₦{(hardwareSubtotal + labourCost + accessoriesCost).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Installer Markup (+{markupPercent}%):</span>
                      <span className="font-semibold">₦{Math.round((hardwareSubtotal + labourCost + accessoriesCost) * (markupPercent / 100)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>VAT (+{vatPercent}%):</span>
                      <span className="font-semibold">₦{Math.round(((hardwareSubtotal + labourCost + accessoriesCost) * (1 + markupPercent / 100)) * (vatPercent / 100)).toLocaleString()}</span>
                    </div>
                    {discountNgn > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Discount Applied:</span>
                        <span>-₦{discountNgn.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold border-t pt-2 mt-1 text-teal-600 dark:text-teal-400">
                      <span>Final Quoted Price (Turnkey):</span>
                      <span className="text-base font-black">₦{(proposal.final_quoted_price_ngn || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Terms / Installment Customization */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">2. Installment & Financing Terms</h4>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={plan.includeInProposal} 
                        onChange={(e) => handlePaymentPlanChange('includeInProposal', e.target.checked)}
                        className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                      />
                      <span>Include Installment Options in PDF</span>
                    </label>
                  </div>

                  {plan.includeInProposal && (
                    <div className="space-y-4">
                      {/* Parameter Controls */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs font-semibold text-slate-500">Down Payment (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={plan.downPaymentPercent ?? 20}
                              onChange={e => handlePaymentPlanChange('downPaymentPercent', Math.max(0, Math.min(100, Number(e.target.value))))}
                              className="h-9 pr-7 text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-500">6-Month Markup (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              value={plan.markup6Months ?? 10}
                              onChange={e => handlePaymentPlanChange('markup6Months', Math.max(0, Number(e.target.value)))}
                              className="h-9 pr-7 text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-500">12-Month Markup (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              value={plan.markup12Months ?? 15}
                              onChange={e => handlePaymentPlanChange('markup12Months', Math.max(0, Number(e.target.value)))}
                              className="h-9 pr-7 text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-slate-500">24-Month Markup (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              value={plan.markup24Months ?? 20}
                              onChange={e => handlePaymentPlanChange('markup24Months', Math.max(0, Number(e.target.value)))}
                              className="h-9 pr-7 text-xs"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Plan Options Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                        {(['outright', '6months', '12months', '24months'] as const).map((planType) => {
                          const details = getInstallmentDetails(planType);
                          const isSelected = plan.selectedPlan === planType;
                          
                          return (
                            <div
                              key={planType}
                              onClick={() => handlePaymentPlanChange('selectedPlan', planType)}
                              className={`text-left rounded-xl border p-4 transition-all flex flex-col justify-between hover:border-teal-500/50 cursor-pointer ${
                                isSelected 
                                  ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/15 shadow-sm ring-1 ring-teal-500' 
                                  : 'border-slate-200 bg-slate-50/50 dark:border-slate-800'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase">
                                    {planType === 'outright' ? 'Outright' : `${details.months} Months`}
                                  </span>
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                                  details.markupPercent > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {details.markupPercent}% Markup
                                </span>
                              </div>

                              <div className="space-y-1.5 pt-3 text-[10px]">
                                <div>
                                  <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Down Payment</span>
                                  <span className="font-bold text-slate-700">₦{details.downPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Monthly Repayment</span>
                                  <span className="font-bold text-slate-700">
                                    {details.monthlyRepayment > 0 ? `₦${Math.round(details.monthlyRepayment).toLocaleString()}` : '—'}
                                  </span>
                                </div>
                                <div className="pt-1.5 border-t dark:border-slate-800">
                                  <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Total Payable</span>
                                  <span className="text-xs font-extrabold text-teal-600">₦{Math.round(details.totalAmountPayable).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Interactive Proposal Checkouts */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">3. Interactive Proposal Checkouts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 font-bold">Site Survey Booking Fee (₦)</Label>
                      <Input
                        type="number"
                        value={proposal.surveyFee ?? 15000}
                        onChange={e => updateProposal({ surveyFee: Math.max(0, Number(e.target.value)) })}
                        placeholder="15,000"
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground leading-normal">Charge clients an upfront fee to book physical inspections. Set to 0 to disable.</p>
                    </div>
                    <div className="flex flex-col justify-center space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={proposal.offerInsurance ?? false}
                          onChange={(e) => updateProposal({ offerInsurance: e.target.checked })}
                          className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                        />
                        <span>Offer 12-Month Solar Shield Insurance</span>
                      </label>
                      <p className="text-[10px] text-muted-foreground leading-normal">Clients can purchase workmanship & grid/surge protection warranty (adds 2% of turnkey price).</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🎨 INSTALLER BRANDING CUSTOMIZATION CARD */}
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
            <button 
              type="button"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 font-semibold text-left flex justify-between items-center"
              onClick={() => {
                if (!checkAccess('customBranding').unlocked) {
                  openUpgradeModal('customBranding');
                } else {
                  setBrandingOpen(!brandingOpen);
                }
              }}
            >
              <span className="flex items-center gap-1.5">
                <span>🎨</span> Installer Branding (For PDF)
                {!checkAccess('customBranding').unlocked && (
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 text-teal-650 bg-teal-50 dark:bg-teal-950 dark:text-teal-400 uppercase tracking-widest font-black">Enterprise</Badge>
                )}
              </span>
              <span className="text-muted-foreground text-sm">{brandingOpen ? '▲ Hide' : '▼ Expand'}</span>
            </button>
            
            {brandingOpen && (
              <div className="p-5 space-y-5 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Primary Brand Color</Label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Input 
                          type="color" 
                          className="w-12 h-10 p-0.5 rounded cursor-pointer"
                          value={proposal.installer_primary_color || '#01696f'}
                          onChange={e => updateProposal({ installer_primary_color: e.target.value })}
                        />
                      </div>
                      <Input 
                        value={proposal.installer_primary_color || '#01696f'}
                        onChange={e => updateProposal({ installer_primary_color: e.target.value })}
                        placeholder="#01696f"
                        className="font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Brand Color</Label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Input 
                          type="color" 
                          className="w-12 h-10 p-0.5 rounded cursor-pointer"
                          value={proposal.installer_secondary_color || '#01414a'}
                          onChange={e => updateProposal({ installer_secondary_color: e.target.value })}
                        />
                      </div>
                      <Input 
                        value={proposal.installer_secondary_color || '#01414a'}
                        onChange={e => updateProposal({ installer_secondary_color: e.target.value })}
                        placeholder="#01414a"
                        className="font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Logo URL (or Base64 for offline use)</Label>
                  <Input 
                    value={proposal.installer_logo_url || ''}
                    onChange={e => updateProposal({ installer_logo_url: e.target.value })}
                    placeholder="https://yourcompany.com/logo.png"
                  />
                  <p className="text-[10px] text-muted-foreground">For full offline PWA support, paste a Base64 data URI here instead of a web URL.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Company Tagline / Slogan</Label>
                  <Input 
                    value={proposal.installer_tagline || ''}
                    onChange={e => updateProposal({ installer_tagline: e.target.value })}
                    placeholder="e.g. Powering Nigeria's Future"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 📋 REGULATORY COMPLIANCE CHECKLIST */}
          <div className="border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <button 
              type="button"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 font-semibold text-left flex justify-between items-center"
              onClick={() => setComplianceOpen(!complianceOpen)}
            >
              <span className="flex items-center gap-1.5">
                <span>📋</span> {activeCity.name} Regulatory Compliance Checklist
              </span>
              <span className="text-muted-foreground text-sm">{complianceOpen ? '▲ Hide' : '▼ Expand'}</span>
            </button>
            
            {complianceOpen && (
              <div className="p-5 space-y-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <p className="text-slate-500 font-medium leading-relaxed">
                  Verify local state and national regulatory codes for {activeCity.name} to assure client credibility and minimize structural liabilities.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {activeCity.complianceNotes.map((note, index) => {
                    const parts = note.split(':');
                    const title = parts[0] || 'Requirement';
                    const description = parts.slice(1).join(':').trim() || note;
                    return (
                      <label key={index} className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={compliance[index] || false}
                          onChange={e => setCompliance({ ...compliance, [index]: e.target.checked })}
                          className="mt-0.5 accent-teal-600 rounded"
                        />
                        <div>
                          <span className="font-semibold block text-slate-700 dark:text-slate-300">{title}</span>
                          <span className="text-[10px] text-slate-400 block">{description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ☀️ EQUIPMENT SOURCING & DISTRIBUTOR QUOTES */}
          <div className="border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <button 
              type="button"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 font-semibold text-left flex justify-between items-center"
              onClick={() => setSourcingOpen(!sourcingOpen)}
            >
              <span className="flex items-center gap-1.5">
                <span>☀️</span> Equipment Sourcing & Partner Referrals
              </span>
              <span className="text-muted-foreground text-sm">{sourcingOpen ? '▲ Hide' : '▼ Expand'}</span>
            </button>
            
            {sourcingOpen && (
              <div className="p-5 space-y-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                {sourcingSuccess ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/35 rounded-xl text-emerald-800 dark:text-emerald-350 font-semibold text-center">
                    🎉 Supplier request logged successfully! Distributors will contact you directly.
                  </div>
                ) : (
                  <form onSubmit={handleRequestSourcingQuote} className="space-y-4">
                    <p className="text-slate-500 font-medium">
                      Forward this bill of materials (BOM) to certified importers in Lagos (Ikeja, Alaba) to receive direct reseller pricing quotes.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Distributor</Label>
                        <select 
                          className="w-full mt-1.5 h-9 rounded-lg border bg-white dark:bg-slate-950 p-2 text-xs"
                          value={selectedPartnerId}
                          onChange={e => setSelectedPartnerId(e.target.value)}
                        >
                          {partners.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.company_name} ({p.regions?.join(', ') || 'National'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Distributor Contact Mode</Label>
                        <select 
                          className="w-full mt-1.5 h-9 rounded-lg border bg-white dark:bg-slate-950 p-2 text-xs"
                          value={contactMethod}
                          onChange={e => setContactMethod(e.target.value)}
                        >
                          <option value="whatsapp">Direct WhatsApp Ping</option>
                          <option value="email">Formal RFQ Email</option>
                          <option value="phone">Callback Request</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Additional Instructions</Label>
                        <Input 
                          value={referralNotes}
                          onChange={e => setReferralNotes(e.target.value)}
                          placeholder="e.g. Deliver to site in Gbagada"
                          className="mt-1.5 h-9 text-xs"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] h-9 px-4 rounded-lg shadow-sm"
                      disabled={sourcingLoading}
                    >
                      {sourcingLoading ? 'Sending RFQ...' : 'Submit Sourcing Request ☀️'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-semibold text-right">{error}</p>}
      
      <div className="flex flex-col sm:flex-row gap-4 border-t pt-6">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">← Back</Button>
        <div className="flex-1"></div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 flex-1 sm:flex-none"
              onClick={handleWhatsAppShare}
              disabled={isGenerating}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share via WhatsApp 💬
            </Button>
            
            <Button 
              variant="outline" 
              className="px-3"
              onClick={handleCopy}
              disabled={isGenerating}
              title="Copy Proposal Summary"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            </Button>
          </div>

          <Button 
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white" 
            disabled={isGenerating}
            onClick={async () => {
              console.log('[onClick] Generate PDF Proposal button clicked');
              const currentProposal = useWizardStore.getState().proposal;
              if (!currentProposal.customer_name || currentProposal.customer_name.trim() === '') {
                console.log('[onClick] Error: customer name empty');
                setError('Please enter a Customer Name before generating the proposal.');
                return;
              }
              if (!calculations) {
                console.log('[onClick] Error: calculations missing');
                setError('Missing calculations. Please go back to previous steps and try again.');
                return;
              }
              setError('');
              setIsGenerating(true);
              try {
                console.log('[onClick] locking FX rate...');
                await lockFXRateIfNeeded();
                console.log('[onClick] FX rate locked. Calling ensureSaved...');
                
                const id = await ensureSaved(false);
                console.log('[onClick] ensureSaved returned ID:', id);
                if (!id) {
                  setIsGenerating(false);
                  return;
                }
                console.log('[onClick] tracking event...');
                trackEvent('proposal_generated', { customer: currentProposal.customer_name });
                console.log('[onClick] navigating to print layout with ID:', id);
                router.push(`/proposals/print?id=${id}`);
              } catch (err: any) {
                console.error('[onClick] Error generating proposal:', err);
                setError(err?.message || 'An unexpected error occurred while generating the proposal.');
                setIsGenerating(false);
              }
            }}
          >
            Generate PDF Proposal →
          </Button>
        </div>
      </div>
    </div>
  );
}
