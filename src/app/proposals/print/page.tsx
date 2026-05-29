'use client';

import * as React from 'react';
import { useWizardStore, ProposalState, SizingResult } from '@/store/wizardStore';
import { useHistoryStore } from '@/store/historyStore';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { fetchUSDNGNRate } from '@/utils/exchangeRate';

export interface PrintProposalData extends Partial<ProposalState> {
  id?: string;
  client_token?: string;
  lockedFXRate?: number;
  fxRateLockedAt?: string;
  installer_primary_color?: string;
  installer_secondary_color?: string;
  installer_logo_url?: string;
  installer_tagline?: string;
  paymentPlan?: any;
}

const getLogoSrc = (logoUrl?: string) => {
  if (!logoUrl) return '';
  if (logoUrl.startsWith('data:') || logoUrl.startsWith('http') || logoUrl.startsWith('/')) {
    return logoUrl;
  }
  // Prepend standard PNG base64 prefix if raw base64 data is stored
  if (/^[A-Za-z0-9+/=]+$/.test(logoUrl)) {
    return `data:image/png;base64,${logoUrl}`;
  }
  return logoUrl;
};

export default function PrintProposalPage() {
  const { proposal: storeProposal, calculations: storeCalculations } = useWizardStore();
  const { savedProposals } = useHistoryStore();
  const router = useRouter();

  // Helper to resolve initial values client-side to prevent cascading setState renders
  const getInitialValues = () => {
    if (typeof window === 'undefined') {
      return { initialProposal: null, initialCalculations: null, initialLoading: true };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');

    if (!id) {
      return { initialProposal: storeProposal, initialCalculations: storeCalculations, initialLoading: false };
    }

    const localProp = savedProposals.find(p => p.id === id);
    if (localProp) {
      return {
        initialProposal: { ...localProp.proposal, id: localProp.id, client_token: localProp.client_token },
        initialCalculations: localProp.calculations,
        initialLoading: false
      };
    }

    return { initialProposal: null, initialCalculations: null, initialLoading: true };
  };

  const { initialProposal, initialCalculations, initialLoading } = getInitialValues();

  const [proposal, setProposal] = React.useState<PrintProposalData | null>(initialProposal || null);
  const [calculations, setCalculations] = React.useState<SizingResult | null>(initialCalculations || null);
  const [loading, setLoading] = React.useState<boolean>(initialLoading);

  const [fxRate, setFxRate] = React.useState<number | null>(null);
  const [fxTimestamp, setFxTimestamp] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadRate() {
      try {
        const fetchedRate = await fetchUSDNGNRate();
        setFxRate(fetchedRate);
        
        // Try getting timestamp from localStorage, or use current time if not set
        const TIME_KEY = 'solarpro_fx_rate_timestamp';
        const storedTime = typeof window !== 'undefined' ? localStorage.getItem(TIME_KEY) : null;
        if (storedTime) {
          setFxTimestamp(new Date(parseInt(storedTime, 10)).toISOString());
        } else {
          setFxTimestamp(new Date().toISOString());
        }
      } catch (err) {
        console.error('Failed to load rate in print page:', err);
      }
    }
    loadRate();
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');

    if (!id) return;

    // If already loaded via constructor initial values, bypass
    if (proposal && proposal.id === id) return;

    // Try finding in local history store first (offline-first!)
    const localProp = savedProposals.find(p => p.id === id);
    if (localProp) {
      setProposal({
        ...localProp.proposal,
        id: localProp.id,
        client_token: localProp.client_token
      });
      setCalculations(localProp.calculations || null);
      setLoading(false);
      return;
    }

    // Fallback: Fetch from Supabase!
    const fetchRemote = async () => {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          // Reconstruct the proposal & calculations structures perfectly
          const reconstructedProposal: PrintProposalData = {
            id: data.id,
            client_token: data.client_token,
            customer_name: data.customer_name,
            customer_email: data.customer_email || undefined,
            customer_phone: data.customer_phone || undefined,
            region_id: data.region_id || undefined,
            backup_hours: Number(data.backup_hours),
            peak_sun_hours: Number(data.peak_sun_hours),
            battery_chemistry: data.calculations_snapshot?.battery_chemistry || 'lithium',
            nepa_daily_hours: Number(data.nepa_daily_hours),
            nepa_tariff_per_kwh: Number(data.nepa_tariff_per_kwh),
            gen_fuel_type: data.gen_fuel_type || undefined,
            gen_capacity_kva: data.gen_capacity_kva ? Number(data.gen_capacity_kva) : undefined,
            gen_daily_hours: Number(data.gen_daily_hours),
            labour_cost_ngn: Number(data.labour_cost_ngn),
            accessories_cost_ngn: Number(data.accessories_cost_ngn),
            markup_percentage: Number(data.markup_percentage),
            discount_ngn: Number(data.discount_ngn),
            vat_percentage: Number(data.vat_percentage),
            selected_tier: data.selected_tier,
            final_quoted_price_ngn: Number(data.final_quoted_price_ngn),
            installer_primary_color: data.calculations_snapshot?.branding?.primaryColor || '#01696f',
            installer_secondary_color: data.calculations_snapshot?.branding?.secondaryColor || '#01414a',
            installer_logo_url: data.calculations_snapshot?.branding?.logoUrl || '',
            installer_tagline: data.calculations_snapshot?.branding?.tagline || '',
            paymentPlan: data.calculations_snapshot?.paymentPlan || { selectedPlan: 'outright', downPaymentPercent: 20, includeInProposal: true },
            lockedFXRate: data.locked_fx_rate || data.calculations_snapshot?.lockedFXRate || null,
            fxRateLockedAt: data.fx_rate_locked_at || data.calculations_snapshot?.fxRateLockedAt || null,
          };

          setProposal(reconstructedProposal);
          setCalculations(data.calculations_snapshot);
        }
      } catch (err) {
        console.error('Error fetching remote proposal:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRemote();
  }, [storeProposal, storeCalculations, savedProposals, proposal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium animate-pulse">Loading Proposal Details...</p>
        </div>
      </div>
    );
  }

  if (!calculations || !proposal) {
    return (
      <div className="p-8 text-center space-y-4">
        <p>No calculations found. Please complete the proposal builder.</p>
        <Button onClick={() => router.push('/proposals/new')}>Go to Builder</Button>
      </div>
    );
  }

  const primaryColor = proposal.installer_primary_color || '#01696f';
  const secondaryColor = proposal.installer_secondary_color || '#01414a';

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);

  const systemCost = proposal.final_quoted_price_ngn || 0;
  const backupHours = proposal.backup_hours ?? 4;
  const peakSunHours = proposal.peak_sun_hours ?? 5;

  const plan = proposal.paymentPlan || {
    selectedPlan: 'outright',
    downPaymentPercent: 20,
    interestRatePercent: 0,
    includeInProposal: true,
    markup6Months: 10,
    markup12Months: 15,
    markup24Months: 20
  };

  const getPlanDetails = (planType: 'outright' | '6months' | '12months' | '24months') => {
    if (planType === 'outright') {
      return {
        name: 'Outright Purchase',
        months: 0,
        markupPercent: 0,
        downPayment: systemCost,
        monthlyRepayment: 0,
        totalAmountPayable: systemCost,
      };
    }

    const months = planType === '6months' ? 6 : planType === '12months' ? 12 : 24;
    const markupPercent = planType === '6months' 
      ? (plan.markup6Months ?? 10) 
      : planType === '12months' 
        ? (plan.markup12Months ?? 15) 
        : (plan.markup24Months ?? 20);
    
    const downPayment = systemCost * ((plan.downPaymentPercent ?? 20) / 100);
    const financedAmount = systemCost * (1 - (plan.downPaymentPercent ?? 20) / 100);
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

  const plansList: Array<'outright' | '6months' | '12months' | '24months'> = [
    'outright',
    '6months',
    '12months',
    '24months',
  ];

  const selectedPlanType = proposal.paymentPlan?.selectedPlan || 'outright';
  const selectedDetails = getPlanDetails(selectedPlanType);

  const displayRate = proposal?.lockedFXRate || fxRate || 1600;
  const displayTimestampRaw = proposal?.fxRateLockedAt || fxTimestamp;
  const displayTimestamp = displayTimestampRaw 
    ? new Date(displayTimestampRaw).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : new Date().toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

  const handleWhatsAppShare = () => {
    if (!proposal || !calculations) return;
    const clientToken = proposal.client_token || proposal.id;
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/proposal/${clientToken}` : '';
    const text = `Hi ${proposal.customer_name},\n\nHere is a summary of your Solar ROI Proposal from ${proposal.installer_tagline || 'us'}:\n\n- System: ${calculations.inverterKva}kVA Inverter with ${calculations.batteryConfigString} Battery Bank\n- Solar Array: ${(calculations.panelCount * calculations.panelUnitWp).toLocaleString()}Wp\n- Estimated Turnkey Price: ₦${(proposal.final_quoted_price_ngn || 0).toLocaleString()}\n\n🔗 View full dynamic proposal: ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />
      <div className="print:hidden p-4 bg-white dark:bg-slate-800 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <Button variant="outline" onClick={() => router.push('/proposals/new')}>← Back to Builder</Button>
        <div className="space-x-4 flex">
          <Button variant="secondary" onClick={handleWhatsAppShare} className="bg-green-500 hover:bg-green-600 text-white flex gap-2">
            Share on WhatsApp
          </Button>
          <Button onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-700 text-white">🖨️ Print / Save as PDF</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 print:p-0 bg-white shadow-xl my-8 print:my-0 print:shadow-none min-h-[1122px]">
        {/* === PAGE 1: COVER & QUOTE === */}
        <div className="print:h-screen print:break-after-page p-12 relative flex flex-col justify-between" style={{ color: secondaryColor }}>
          
          {/* Prices Validity & FX Rate locked Yellow Banner */}
          <div className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-6 flex items-center justify-center text-center text-xs text-yellow-800 font-bold shadow-sm print:bg-yellow-50 print:border-yellow-300 print:shadow-none">
            <span className="flex items-center gap-1.5 justify-center">
              <span>⚠️</span>
              <span>
                Prices valid for 72 hours | FX Rate: ₦{displayRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}/$ locked at {displayTimestamp}
              </span>
            </span>
          </div>

          <div className="flex justify-between items-start">
            <div>
              {proposal.installer_logo_url ? (
                <img 
                  src={getLogoSrc(proposal.installer_logo_url)} 
                  alt="Installer Logo" 
                  className="h-16 object-contain block print:block" 
                  style={{ height: '64px', maxWidth: '240px', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <h1 className="text-3xl font-black" style={{ color: primaryColor }}>SOLAR PROPOSAL</h1>
              )}
              {proposal.installer_tagline && <p className="text-sm font-medium mt-2 italic opacity-80">{proposal.installer_tagline}</p>}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">Quotation</p>
              <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm">Valid Until: {expirationDate.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="my-16 space-y-6">
            <h2 className="text-5xl font-black tracking-tight" style={{ color: primaryColor }}>
              Your Custom Solar Solution
            </h2>
            <div className="p-6 bg-slate-50 rounded-2xl border-l-8" style={{ borderColor: primaryColor }}>
              <p className="text-lg font-semibold">Prepared for:</p>
              <p className="text-2xl font-bold">{proposal.customer_name || 'Valued Client'}</p>
              {proposal.customer_email && <p className="text-muted-foreground">{proposal.customer_email}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold border-b-2 pb-2 mb-6" style={{ borderColor: primaryColor }}>Investment Summary</h3>
            <div className="flex justify-between items-end bg-slate-50 p-6 rounded-xl border">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Turnkey Price</p>
                <p className="text-xs text-muted-foreground mt-1">Includes equipment, standard installation, and accessories.</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black" style={{ color: primaryColor }}>
                  ₦{(proposal.final_quoted_price_ngn || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === PAGE 2: SIZING TRANSPARENCY (UPGRADE 3) === */}
        <div className="print:h-screen print:break-after-page p-12 bg-white">
          <h2 className="text-3xl font-black mb-8" style={{ color: primaryColor }}>How We Sized Your System</h2>
          <p className="text-lg mb-8 text-slate-700 leading-relaxed">
            We don&apos;t guess. Your system was precisely engineered based on the inventory you provided. Here is the math behind your recommendation:
          </p>

          <div className="space-y-12">
            {/* Inverter Math */}
            <div className="flex gap-6 items-start print-avoid-break">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: primaryColor, color: 'white' }}>⚡</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">1. Inverter Sizing</h3>
                <p className="text-slate-600 mb-3">
                  Your peak simultaneous power draw is calculated at <strong>{calculations.peakSurgeWatts.toLocaleString()} Watts</strong> (accounting for the start-up surge of inductive appliances like fridges/ACs).
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700">
                  <p><strong>Math:</strong> {calculations.peakSurgeWatts.toLocaleString()}W + 25% safety margin = {((calculations.peakSurgeWatts * 1.25) / 1000).toFixed(2)} kW</p>
                  <p><strong>Result:</strong> We selected a <strong>{calculations.inverterKva}kVA Inverter</strong> for safe, reliable operation without overloading.</p>
                </div>
              </div>
            </div>

            {/* Battery Math */}
            <div className="flex gap-6 items-start print-avoid-break">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: primaryColor, color: 'white' }}>🔋</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">2. Battery Bank Sizing</h3>
                <p className="text-slate-600 mb-3">
                  You requested <strong>{backupHours} hours</strong> of backup for your essential loads. Your essential loads consume <strong>{(calculations.essentialDailyWh).toLocaleString()} Watt-hours</strong> per 24-hour cycle.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700">
                  <p><strong>Math:</strong> ({((calculations.essentialDailyWh / 24) * backupHours).toFixed(0)} Wh needed) ÷ ({calculations.systemVoltage}V system × safe depth of discharge)</p>
                  <p><strong>Result:</strong> A {calculations.batteryTotalUnits} unit {calculations.systemVoltage}V battery bank ensures you meet your {backupHours}-hour goal without degrading the batteries prematurely.</p>
                </div>
              </div>
            </div>

            {/* Solar Math */}
            <div className="flex gap-6 items-start print-avoid-break">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: primaryColor, color: 'white' }}>☀️</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">3. Solar Array Sizing</h3>
                <p className="text-slate-600 mb-3">
                  To power your home during the day AND fully recharge your batteries, we need to capture enough energy during Nigeria&apos;s average of <strong>{peakSunHours} peak sun hours</strong>.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700">
                  <p><strong>Math:</strong> {(calculations.totalDailyWh).toLocaleString()} Wh daily usage + battery charging overhead ÷ {peakSunHours} hours ÷ system efficiency losses.</p>
                  <p><strong>Result:</strong> We specified a <strong>{(calculations.panelCount * calculations.panelUnitWp).toLocaleString()}Wp solar array</strong> ({calculations.panelCount} panels) to ensure your system charges quickly and reliably even on cloudy days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === PAGE 3: EQUIPMENT LIST === */}
        <div className="p-12 bg-white min-h-[1122px] print-avoid-break">
          {(() => {
            const inverterCost = proposal.inverter_cost_ngn ?? 0;
            const batteryUnitCost = proposal.battery_unit_cost_ngn ?? 0;
            const panelUnitCost = proposal.panel_unit_cost_ngn ?? 0;
            const labourCost = proposal.labour_cost_ngn ?? 0;
            const accessoriesCost = proposal.accessories_cost_ngn ?? 0;

            return (
              <>
                <h2 className="text-3xl font-black mb-8 border-b-2 pb-4" style={{ color: primaryColor, borderColor: primaryColor }}>Equipment Bill of Materials</h2>
                
                <table className="w-full text-left border-collapse print-avoid-break">
                  <thead>
                    <tr className="border-b-2" style={{ borderColor: secondaryColor }}>
                      <th className="py-3 font-bold text-slate-700">Component Type</th>
                      <th className="py-3 font-bold text-slate-700">Specification</th>
                      <th className="py-3 font-bold text-slate-700 text-right">Qty</th>
                      <th className="py-3 font-bold text-slate-700 text-right">Unit Price</th>
                      <th className="py-3 font-bold text-slate-700 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 font-semibold text-slate-800">Inverter</td>
                      <td className="py-4 text-slate-600">{calculations.inverterKva}kVA Rated Capacity</td>
                      <td className="py-4 text-slate-600 text-right">1</td>
                      <td className="py-4 text-slate-600 text-right">
                        {inverterCost > 0 ? `₦${inverterCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 text-slate-800 font-semibold text-right">
                        {inverterCost > 0 ? `₦${inverterCost.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 font-semibold text-slate-800">Battery Bank</td>
                      <td className="py-4 text-slate-600">
                        {calculations.batteryConfigString} ({calculations.systemVoltage}V System)
                      </td>
                      <td className="py-4 text-slate-600 text-right">{calculations.batteryTotalUnits}</td>
                      <td className="py-4 text-slate-600 text-right">
                        {batteryUnitCost > 0 ? `₦${batteryUnitCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 text-slate-800 font-semibold text-right">
                        {batteryUnitCost > 0 ? `₦${(batteryUnitCost * calculations.batteryTotalUnits).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 font-semibold text-slate-800">Solar Panels</td>
                      <td className="py-4 text-slate-600">
                        {calculations.panelUnitWp}Wp High-Efficiency Panels
                      </td>
                      <td className="py-4 text-slate-600 text-right">{calculations.panelCount}</td>
                      <td className="py-4 text-slate-600 text-right">
                        {panelUnitCost > 0 ? `₦${panelUnitCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 text-slate-800 font-semibold text-right">
                        {panelUnitCost > 0 ? `₦${(panelUnitCost * calculations.panelCount).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 font-semibold text-slate-800">Installation & Accessories</td>
                      <td className="py-4 text-slate-600">Cabling, Breakers, Mounts & Labour</td>
                      <td className="py-4 text-slate-600 text-right">1</td>
                      <td className="py-4 text-slate-600 text-right">
                        {(labourCost > 0 || accessoriesCost > 0) ? `₦${(labourCost + accessoriesCost).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 text-slate-800 font-semibold text-right">
                        {(labourCost > 0 || accessoriesCost > 0) ? `₦${(labourCost + accessoriesCost).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            );
          })()}

          <div className="mt-16 pt-8 border-t text-sm text-slate-500 text-center space-y-1">
            <p>This proposal is computer-generated and serves as a formal quotation.</p>
            {displayRate && displayTimestamp && (
              <p>Quote generated at ₦{displayRate.toLocaleString()}/$1 on {displayTimestamp}. Valid 30 days. USD-indexed components subject to FX movement.</p>
            )}
            {proposal.fuelPrices && (
              <p>Generator ROI calculated using petrol at ₦{proposal.fuelPrices.petrolPerLitre.toLocaleString()}/L and diesel at ₦{proposal.fuelPrices.dieselPerLitre.toLocaleString()}/L (May 2026 Lagos average).</p>
            )}
            <p>Subject to standard terms and conditions.</p>
          </div>
        </div>

        {/* === PAGE 4: PAYMENT OPTIONS (Conditional) === */}
        {proposal.paymentPlan?.includeInProposal && (
          <div className="p-12 bg-white min-h-[1122px] print-avoid-break print:break-before-page space-y-8">
            <h2 className="text-3xl font-black mb-6 border-b-2 pb-4" style={{ color: primaryColor, borderColor: primaryColor }}>
              Flexible Payment Options
            </h2>
            <p className="text-base mb-6 text-slate-700 leading-relaxed">
              We understand that the upfront cost of solar can be a barrier. That&apos;s why we offer flexible payment plans to help you transition to clean energy today. Below is the selection of plans available for your system, with your chosen plan marked.
            </p>

            <table className="w-full text-left border-collapse print-avoid-break mb-8">
              <thead>
                <tr className="border-b-2" style={{ borderColor: secondaryColor }}>
                  <th className="py-3 font-bold text-slate-700 text-sm">Plan Options</th>
                  <th className="py-3 font-bold text-slate-700 text-sm text-right">Down Payment</th>
                  <th className="py-3 font-bold text-slate-700 text-sm text-right">Monthly Repayment</th>
                  <th className="py-3 font-bold text-slate-700 text-sm text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {plansList.map((planType) => {
                  const details = getPlanDetails(planType);
                  const isSelected = selectedPlanType === planType;
                  
                  return (
                    <tr key={planType} className={`border-b ${isSelected ? 'bg-slate-50 font-semibold' : ''}`}>
                      <td className="py-4 text-slate-800 text-sm">
                        <span className="font-bold">{details.name}</span>
                        {isSelected && <span className="ml-2 text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-medium">Selected Plan</span>}
                      </td>
                      <td className="py-4 text-slate-600 text-sm text-right">
                        ₦{Math.round(details.downPayment).toLocaleString()}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ({planType === 'outright' ? '100%' : `${plan.downPaymentPercent}%`})
                        </div>
                      </td>
                      <td className="py-4 text-slate-600 text-sm text-right">
                        {details.monthlyRepayment > 0 
                          ? `₦${Math.round(details.monthlyRepayment).toLocaleString()} / mo` 
                          : '—'}
                      </td>
                      <td className="py-4 text-slate-800 font-bold text-sm text-right">
                        ₦{Math.round(details.totalAmountPayable).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Instalment Schedule Table */}
            <div className="mt-8 print-avoid-break">
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                🗓️ Instalment Payment Schedule — {selectedDetails.name === 'Outright Purchase' ? 'Outright' : selectedDetails.name}
              </h3>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: secondaryColor }}>
                    <th className="py-2.5 font-semibold text-slate-700 text-sm">Payment Stage</th>
                    <th className="py-2.5 font-semibold text-slate-700 text-sm">Estimated Due Date</th>
                    <th className="py-2.5 font-semibold text-slate-700 text-sm text-right">Amount Due</th>
                    <th className="py-2.5 font-semibold text-slate-700 text-sm text-right">Cumulative Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlanType === 'outright' ? (
                    <tr className="border-b">
                      <td className="py-3 text-slate-800 font-medium text-sm">Outright Payment (100%)</td>
                      <td className="py-3 text-slate-600 text-sm">Upon contract signing & delivery</td>
                      <td className="py-3 text-slate-800 font-semibold text-sm text-right">₦{systemCost.toLocaleString()}</td>
                      <td className="py-3 text-slate-800 font-semibold text-sm text-right">₦{systemCost.toLocaleString()}</td>
                    </tr>
                  ) : (
                    <>
                      {/* Down Payment Row */}
                      <tr className="border-b bg-slate-50/50">
                        <td className="py-3 text-slate-800 font-medium text-sm">Down Payment ({plan.downPaymentPercent}%)</td>
                        <td className="py-3 text-slate-600 text-sm">Immediate (Contract Signing)</td>
                        <td className="py-3 text-slate-800 font-semibold text-sm text-right">₦{Math.round(selectedDetails.downPayment).toLocaleString()}</td>
                        <td className="py-3 text-slate-800 font-semibold text-sm text-right">₦{Math.round(selectedDetails.downPayment).toLocaleString()}</td>
                      </tr>
                      {/* Repayment Rows */}
                      {Array.from({ length: selectedDetails.months }).map((_, index) => {
                        const monthNum = index + 1;
                        const cumPaid = selectedDetails.downPayment + (selectedDetails.monthlyRepayment * monthNum);
                        return (
                          <tr key={monthNum} className="border-b">
                            <td className="py-3 text-slate-700 text-sm font-medium">Month {monthNum} Installment</td>
                            <td className="py-3 text-slate-500 text-sm">{monthNum * 30} Days Post-Installation</td>
                            <td className="py-3 text-slate-800 font-semibold text-sm text-right">₦{Math.round(selectedDetails.monthlyRepayment).toLocaleString()}</td>
                            <td className="py-3 text-slate-800 font-semibold text-sm text-right">₦{Math.round(cumPaid).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-4 bg-slate-50 border rounded-lg text-sm text-slate-600">
              <p><strong>Note:</strong> Flexible payment plans are subject to verification and terms agreement. Contact our installation representative to finalize payment schedule and milestones.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
