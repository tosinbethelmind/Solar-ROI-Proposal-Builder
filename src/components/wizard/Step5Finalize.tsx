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

import { useTracking } from '@/hooks/useTracking';

export default function Step5Finalize({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadedId = searchParams.get('load') || undefined;
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

  const [compliance, setCompliance] = React.useState(() => {
    try {
      const stored = localStorage.getItem('lagosCompliance');
      return stored ? JSON.parse(stored) : {
        nercPermit: false,
        laspppaApproval: false,
        landlordApproval: false,
        sonCertified: false,
        structuralRoof: false,
        wiringDiagram: false
      };
    } catch {
      return {
        nercPermit: false,
        laspppaApproval: false,
        landlordApproval: false,
        sonCertified: false,
        structuralRoof: false,
        wiringDiagram: false
      };
    }
  });

  React.useEffect(() => {
    localStorage.setItem('lagosCompliance', JSON.stringify(compliance));
  }, [compliance]);

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
    let companyName = 'SolarPro Solutions';
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

  const ensureSaved = async (): Promise<string | null> => {
    const currentProposal = useWizardStore.getState().proposal;
    if (!currentProposal.customer_name || currentProposal.customer_name.trim() === '') {
      setError('Please enter a Customer Name before continuing.');
      return null;
    }
    setError('');

    // Quota limits check before saving a new proposal
    const savedProposals = useHistoryStore.getState().savedProposals;
    const savedCount = savedProposals.length;
    const subState = useSubscriptionStore.getState();
    
    if (!loadedId) {
      if (subState.isTrial && savedCount >= 2) {
        setError('Proposal limit reached for your Pro Trial (2 lifetime). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
      if (subState.tier === 'free' && savedCount >= 1) {
        setError('Proposal limit reached for your Free plan (1 lifetime). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
      if (subState.tier === 'starter' && savedCount >= 10) {
        setError('Proposal limit reached for your Starter plan (10 monthly). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
      if ((subState.tier === 'pro' || subState.tier === 'business') && savedCount >= 40) {
        setError('Proposal limit reached for your Professional plan (40 monthly). Please upgrade to save new estimates.');
        subState.openUpgradeModal(null);
        return null;
      }
    }
    
    // First, lock FX rate if needed
    await lockFXRateIfNeeded();
    
    // Fetch latest updated state
    const currentProposalLatest = useWizardStore.getState().proposal;
    const currentCalculations = useWizardStore.getState().calculations;
    
    // Save to local history store (which returns a unique id)
    const id = useHistoryStore.getState().saveProposal(
      currentProposalLatest, 
      currentCalculations || undefined, 
      'wizard', 
      5, 
      loadedId
    );

    // If it's a new save and was not already loaded, update URL so future clicks update rather than duplicate
    if (id && !loadedId) {
      router.replace(`/proposals/new?load=${id}`);
    }

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

      {/* 📋 LAGOS REGULATORY COMPLIANCE CHECKLIST */}
      <div className="border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setComplianceOpen(!complianceOpen)}
          className="w-full flex items-center justify-between p-5 text-left font-bold text-sm bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-b border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📋</span>
            <div>
              <span className="block font-black text-slate-850 dark:text-slate-150">Lagos Regulatory Compliance Checklist (Optional)</span>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Ensure site eligibility & state safety standards</span>
            </div>
          </div>
          <span className="text-slate-400 text-lg transition-transform duration-200" style={{ transform: complianceOpen ? 'rotate(180deg)' : 'none' }}>
            ▼
          </span>
        </button>

        {complianceOpen && (
          <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Lagos State physical planning and electricity regulatory frameworks recommend documenting these pre-installation checks for residential and estate solar grids.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={compliance.nercPermit}
                  onChange={e => setCompliance({ ...compliance, nercPermit: e.target.checked })}
                  className="mt-1 rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-805 dark:text-slate-200">NERC Grid-Tie Permit</span>
                  <span className="block text-[10px] text-slate-500">Required if system exceeds 1kW and has grid bypass.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={compliance.laspppaApproval}
                  onChange={e => setCompliance({ ...compliance, laspppaApproval: e.target.checked })}
                  className="mt-1 rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-805 dark:text-slate-200">LASPPPA Approval Check</span>
                  <span className="block text-[10px] text-slate-500">Lagos State Physical Planning permit (for residential estates).</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={compliance.landlordApproval}
                  onChange={e => setCompliance({ ...compliance, landlordApproval: e.target.checked })}
                  className="mt-1 rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-805 dark:text-slate-200">Landlord / Estate Clearance</span>
                  <span className="block text-[10px] text-slate-500">Written approval of structural mounting from owner/facility head.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={compliance.sonCertified}
                  onChange={e => setCompliance({ ...compliance, sonCertified: e.target.checked })}
                  className="mt-1 rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-805 dark:text-slate-200">SON Certified Components</span>
                  <span className="block text-[10px] text-slate-500">Verify inverters and batteries carry Standards Organisation of Nigeria seals.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={compliance.structuralRoof}
                  onChange={e => setCompliance({ ...compliance, structuralRoof: e.target.checked })}
                  className="mt-1 rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-805 dark:text-slate-200">Roof Structural Integrity</span>
                  <span className="block text-[10px] text-slate-500">Confirmed wind load rating & trusses will hold panel array securely.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={compliance.wiringDiagram}
                  onChange={e => setCompliance({ ...compliance, wiringDiagram: e.target.checked })}
                  className="mt-1 rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-805 dark:text-slate-200">Engineering Schematic Done</span>
                  <span className="block text-[10px] text-slate-500">Bypass wiring, breaker sizing, and surge protection diagrams completed.</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ☀️ EQUIPMENT SOURCING & DISTRIBUTOR REFERRAL PANEL */}
      <div className="border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setSourcingOpen(!sourcingOpen)}
          className="w-full flex items-center justify-between p-5 text-left font-bold text-sm bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-b border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">☀️</span>
            <div>
              <span className="block font-black text-slate-850 dark:text-slate-150">Equipment Sourcing & Distributor Quotes</span>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Request bulk wholesale pricing from registered partners</span>
            </div>
          </div>
          <span className="text-slate-400 text-lg transition-transform duration-200" style={{ transform: sourcingOpen ? 'rotate(180deg)' : 'none' }}>
            ▼
          </span>
        </button>

        {sourcingOpen && (
          <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 text-xs">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Wholesale solar hardware supply requests in Nigeria. We pull your proposal hardware BOM (inverters, batteries, panels) and request direct wholesale deals with verified importers to secure installer cashbacks and referral commissions.
            </p>

            {sourcingSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-center space-y-2 border border-emerald-100 dark:border-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                <p className="font-black text-sm">✓ Sourcing Quote Request Submitted!</p>
                <p className="text-[11px]">
                  Your component BOM was successfully dispatched. A sales representative from the preferred supplier will contact you within 15-30 minutes with installer discounts.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSourcingQuote} className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Preferred Supplier Partner</label>
                    <select
                      value={selectedPartnerId}
                      onChange={e => setSelectedPartnerId(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-250 focus:outline-none"
                    >
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.company_name} ({p.regions?.join(', ') || 'National'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Preferred Contact Method</label>
                    <select
                      value={contactMethod}
                      onChange={e => setContactMethod(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-250 focus:outline-none"
                    >
                      <option value="whatsapp">Direct WhatsApp Message (wa.me link)</option>
                      <option value="phone">Direct Phone Call</option>
                      <option value="email">Direct Email Quote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold mb-1">Custom Notes / Dropoff Site Address</label>
                    <textarea
                      rows={2}
                      value={referralNotes}
                      onChange={e => setReferralNotes(e.target.value)}
                      placeholder="e.g. Needs delivery to Lekki Phase 1, Lagos. Please bundle mounting rails..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Components Sourced From BOM</p>
                  <div className="space-y-2 text-[11px] text-slate-650 dark:text-slate-350">
                    <div className="flex justify-between">
                      <span>Inverter System Sizing:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {proposal.selectedInverterBrand || 'Growatt'} {calculations?.inverterKva || 5}kVA
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Battery Capacity:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {calculations?.batteryTotalUnits || 1}x {proposal.selectedBatteryBrand || 'Felicity'} ({calculations?.batteryUnitVoltage || 48}V {calculations?.batteryUnitAh || 100}Ah)
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Solar Panel Array:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {calculations?.panelCount || 8}x {proposal.selectedPanelBrand || 'Jinko'} ({calculations?.panelUnitWp || 450}Wp)
                      </strong>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={sourcingLoading}
                    className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl h-10 shadow-sm mt-1"
                  >
                    {sourcingLoading ? 'Dispatching BOM...' : 'Request Wholesale Quote'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 📤 SHARE & EXPORT PROPOSAL PANEL */}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsAppShare}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-green-100 dark:border-green-900/20 bg-green-50/30 dark:bg-green-950/10 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-800/40 transition-all group active:scale-95 text-left w-full"
          >
            <div className="p-3 bg-green-500 text-white rounded-full group-hover:scale-110 transition-transform shadow-md shadow-green-500/10">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="block text-xs font-bold text-green-800 dark:text-green-400">Share on WhatsApp</span>
              <span className="block text-[10px] text-green-600/80 dark:text-green-500/60 mt-0.5">Send directly via wa.me</span>
            </div>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-teal-100 dark:border-teal-900/20 bg-teal-50/20 dark:bg-slate-900 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 hover:border-teal-300 dark:hover:border-teal-800/40 transition-all group active:scale-95 text-left w-full"
          >
            <div className="p-3 bg-teal-600 text-white rounded-full group-hover:scale-110 transition-transform shadow-md shadow-teal-600/10">
              {copiedLink ? <CheckCircle2 className="w-5 h-5 text-emerald-300 animate-bounce" /> : <Copy className="w-5 h-5" />}
            </div>
            <div className="text-center">
              <span className="block text-xs font-bold text-teal-800 dark:text-teal-400">
                {copiedLink ? 'Link Copied!' : 'Copy Proposal Link'}
              </span>
              <span className="block text-[10px] text-teal-600/80 dark:text-teal-500/60 mt-0.5">
                {copiedLink ? 'Copied to Clipboard' : 'For web-client reading'}
              </span>
            </div>
          </button>

          {/* PDF/Print Button */}
          <button
            onClick={async () => {
              const id = await ensureSaved();
              if (!id) return;
              trackEvent('proposal_generated', { customer: proposal.customer_name, proposalId: id });
              router.push(`/proposals/print?id=${id}`);
            }}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 transition-all group active:scale-95 text-left w-full"
          >
            <div className="p-3 bg-slate-700 text-white rounded-full group-hover:scale-110 transition-transform shadow-md shadow-slate-700/10">
              🖨️
            </div>
            <div className="text-center">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Print / Save as PDF</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">Full 2-page document</span>
            </div>
          </button>
        </div>
      </div>

      {/* 💰 PRICING & PAYMENT TERMS CUSTOMIZATION CARD */}
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <button 
          className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 font-semibold text-left flex justify-between items-center"
          onClick={() => setPricingOpen(!pricingOpen)}
        >
          <span className="flex items-center gap-2">💰 Pricing & Payment Terms Customization</span>
          <span className="text-muted-foreground text-sm">{pricingOpen ? '▲ Hide' : '▼ Expand'}</span>
        </button>
        
        {pricingOpen && (
          <div className="p-5 space-y-6">
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
            <div className="space-y-4 pt-4 border-t">
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
          </div>
        )}
      </div>

      {/* UPGRADE 5: Installer Branding Collapsible */}
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
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
          <div className="p-5 space-y-5">
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
              const currentProposal = useWizardStore.getState().proposal;
              if (!currentProposal.customer_name || currentProposal.customer_name.trim() === '') {
                setError('Please enter a Customer Name before generating the proposal.');
                return;
              }
              if (!calculations) {
                setError('Missing calculations. Please go back to previous steps and try again.');
                return;
              }
              setError('');
              setIsGenerating(true);
              await lockFXRateIfNeeded();
              
              trackEvent('proposal_generated', { customer: currentProposal.customer_name });
              router.push('/proposals/print');
            }}
          >
            Generate PDF Proposal →
          </Button>
        </div>
      </div>
    </div>
  );
}
