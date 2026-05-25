'use client';

import * as React from 'react';
import { useWizardStore } from '@/store/wizardStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Info, 
  Wifi, 
  WifiOff, 
  FileCheck, 
  Landmark, 
  Shield, 
  Layers, 
  HelpCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  DollarSign,
  Lock
} from 'lucide-react';

export default function Step4ROI({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { proposal, updateProposal, finalPriceNaira, calculations } = useWizardStore();
  const { checkAccess, openUpgradeModal } = useSubscriptionStore();

  // 1. Interactive App States
  const [pricingMode, setPricingMode] = React.useState<'simple' | 'advanced'>('simple');
  const [isOnline, setIsOnline] = React.useState<boolean>(true);
  const [rateStatus, setRateStatus] = React.useState<'loading' | 'synced' | 'stale'>('stale');
  const [draftSaved, setDraftSaved] = React.useState<boolean>(true);
  const [pendingSync, setPendingSync] = React.useState<boolean>(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [rateLoading, setRateLoading] = React.useState<boolean>(false);

  // Grouped collapsible accordion sections for Advanced Mode
  const [accordions, setAccordions] = React.useState({
    costs: true,
    margin: false,
    fx: false,
    tax: false,
    terms: false,
    warranty: false,
    proposalTerms: false
  });

  const toggleAccordion = (section: keyof typeof accordions) => {
    setAccordions(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync state values on mount
  React.useEffect(() => {
    // Sync pricing mode from global store if available
    if (proposal.pricing_mode) {
      setPricingMode(proposal.pricing_mode);
    }
    
    // Check network online status
    setIsOnline(navigator.onLine);
    const goOnline = () => {
      setIsOnline(true);
      fetchExchangeRate();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Initial exchange rate fetch if online
    if (navigator.onLine) {
      fetchExchangeRate();
    } else {
      setRateStatus('stale');
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Fetch exchange rate from ExchangeRate-API
  const fetchExchangeRate = async () => {
    setRateLoading(true);
    setRateStatus('loading');
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      const fetchedRate = Math.round(data.rates.NGN);
      if (fetchedRate > 500) {
        updateProposal({
          lockedFXRate: fetchedRate,
          fxRateLockedAt: new Date().toISOString()
        });
        setRateStatus('synced');
        setPendingSync(false);
      } else {
        throw new Error('Unreasonable exchange rate fetched');
      }
    } catch (err) {
      console.warn('Could not fetch latest exchange rates, falling back to cached local rate.', err);
      setRateStatus('stale');
    } finally {
      setRateLoading(false);
    }
  };

  // Handle value changes with validation and state preservation
  const handleFieldChange = (fields: Partial<typeof proposal>) => {
    setDraftSaved(false);
    setPendingSync(true);
    updateProposal(fields);
    
    // Auto-save simulations (Zustand persists changes automatically to localStorage)
    setTimeout(() => {
      setDraftSaved(true);
    }, 800);
  };

  // Sizing and derived equipment totals from BOM
  const inverterCost = proposal.inverter_cost_ngn || 0;
  const batteryUnitCost = proposal.battery_unit_cost_ngn || 0;
  const batteryTotalUnits = calculations?.batteryTotalUnits || 1;
  const batteryCost = batteryUnitCost * batteryTotalUnits;
  const panelUnitCost = proposal.panel_unit_cost_ngn || 0;
  const panelTotalCount = calculations?.panelCount || 1;
  const panelCost = panelUnitCost * panelTotalCount;
  const hardwareSubtotal = inverterCost + batteryCost + panelCost;

  // Retrieve pricing inputs with clean defaults
  const labour = proposal.labour_cost_ngn ?? 80000;
  const transport = proposal.transport_cost_ngn ?? 25000;
  const accessories = proposal.accessories_cost_ngn ?? 35000;
  const markupPercent = proposal.markup_percentage ?? 15;
  const discountNgn = proposal.discount_ngn ?? 0;
  const includeVat = proposal.include_vat !== false;
  const vatPercent = proposal.vat_percentage ?? 7.5;

  // Advanced pricing inputs
  const contingency = proposal.contingency_cost_ngn ?? 15000;
  const adminFee = proposal.admin_fee_ngn ?? 10000;
  const serviceFee = proposal.service_fee_ngn ?? 0;
  const warranty = proposal.warranty_cost_ngn ?? 30000;
  const maintenance = proposal.maintenance_plan_cost_ngn ?? 0;
  const recurringFee = proposal.recurring_service_fee_ngn ?? 0;
  const minMarginThreshold = proposal.min_margin_threshold ?? 10;
  const fxBufferPercent = proposal.fx_buffer_percentage ?? 2;
  const quoteValidity = proposal.quote_validity_days ?? 30;

  // Calculated Totals
  const extraCostsSum = pricingMode === 'simple' 
    ? (labour + transport + accessories)
    : (labour + transport + accessories + contingency + adminFee + serviceFee + warranty + maintenance);

  const baseSubtotal = hardwareSubtotal + extraCostsSum;
  const marginNgn = Math.round(baseSubtotal * (markupPercent / 100));
  const sellingPriceBeforeVatAndDiscount = baseSubtotal + marginNgn;
  const vatNgn = includeVat ? Math.round(sellingPriceBeforeVatAndDiscount * (vatPercent / 100)) : 0;
  const finalSellingPrice = Math.max(0, Math.round(sellingPriceBeforeVatAndDiscount + vatNgn - discountNgn));

  // Validation Warnings
  React.useEffect(() => {
    const errors: string[] = [];
    if (markupPercent < minMarginThreshold) {
      errors.push(`Warning: Selling margin (${markupPercent}%) is below your minimum threshold of ${minMarginThreshold}%!`);
    }
    if (discountNgn > (sellingPriceBeforeVatAndDiscount * 0.3)) {
      errors.push(`Warning: Discount amount is exceptionally high (over 30% of total pre-tax price)!`);
    }
    if (labour <= 0) {
      errors.push(`Caution: Installation Labour cost is set to zero.`);
    }
    if (transport <= 0) {
      errors.push(`Caution: Logistics/Transport cost is set to zero.`);
    }
    if (finalSellingPrice <= 0) {
      errors.push(`Critical Error: Final selling price is calculated as ₦0. Check cost and markup inputs.`);
    }
    setValidationErrors(errors);
  }, [markupPercent, minMarginThreshold, discountNgn, sellingPriceBeforeVatAndDiscount, labour, transport, finalSellingPrice]);

  // ROI / Savings Calculations
  const genSizeKva = proposal.roi_gen_size_kva ?? 5;
  const fuelConsumption = proposal.roi_fuel_consumption ?? 1.2;
  const hoursPerDay = proposal.roi_gen_hours_per_day ?? 4;
  const fuelPrice = proposal.roi_fuel_price ?? 1200;
  const phcnBill = proposal.monthly_phcn_bill ?? 8000;
  const yearsToCalculate = proposal.roi_years_to_calculate ?? 5;

  const monthlyGenFuelCost = Math.round(fuelConsumption * hoursPerDay * 30 * fuelPrice);
  const monthlySavings = Math.round(monthlyGenFuelCost + phcnBill);
  const paybackMonths = monthlySavings > 0 ? Math.round(finalSellingPrice / monthlySavings) : 0;
  const paybackYears = (paybackMonths / 12).toFixed(1);

  // standard generator size change logic
  const handleGenSizeChange = (val: string) => {
    const kva = parseFloat(val);
    const getAutoFuelConsumption = (sz: number): number => {
      if (sz <= 2.5) return 0.7;
      if (sz <= 5.0) return 1.2;
      if (sz <= 7.5) return 1.8;
      return 2.5;
    };
    handleFieldChange({
      roi_gen_size_kva: kva,
      roi_fuel_consumption: getAutoFuelConsumption(kva)
    });
  };

  return (
    <div className="space-y-6">
      {/* 🚀 COMPACT PROFESSIONAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>📊</span> Step 4: ROI & System Pricing Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system installation costs, commercial markups, and calculate customer break-even indices.
          </p>
        </div>

        {/* PRICING MODE SWITCH (Segmented controls) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border rounded-xl w-fit self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setPricingMode('simple');
              handleFieldChange({ pricing_mode: 'simple' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              pricingMode === 'simple'
                ? 'bg-white dark:bg-slate-850 text-teal-650 dark:text-teal-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Simple Mode
          </button>
          <button
            type="button"
            onClick={() => {
              if (!checkAccess('advancedPricing').unlocked) {
                openUpgradeModal('advancedPricing');
              } else {
                setPricingMode('advanced');
                handleFieldChange({ pricing_mode: 'advanced' });
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
              pricingMode === 'advanced'
                ? 'bg-white dark:bg-slate-850 text-teal-650 dark:text-teal-400 shadow-sm border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Advanced Mode <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3 text-teal-650 bg-teal-50 dark:bg-teal-950 dark:text-teal-400 uppercase tracking-widest font-black">Pro</Badge>
          </button>
        </div>
      </div>

      {/* ⚠️ COMPACT SYSTEM STATES & EXCHANGE RATE ALERTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Offline & Rates Sync Card */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
          isOnline 
            ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800' 
            : 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-400'
        }`}>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider">Connection Status</span>
              <Badge className={`text-[8px] font-bold px-1.5 py-0 ${
                isOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
              }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">
              {isOnline 
                ? `Exchange rates synced: ₦${(proposal.lockedFXRate || 1600).toLocaleString()}/$`
                : `Offline mode — using locked rate from ${proposal.fxRateLockedAt ? new Date(proposal.fxRateLockedAt).toLocaleDateString() : 'local storage'}`
              }
            </p>
          </div>
          {isOnline && (
            <button
              onClick={fetchExchangeRate}
              disabled={rateLoading}
              title="Resync live interbank rate"
              className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rateLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Local Storage & Proposal Persistence Card */}
        <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
            <FileCheck className="w-4 h-4 text-teal-650 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider">Draft Persistence</span>
              <Badge className={`text-[8px] font-bold px-1.5 py-0 ${
                draftSaved ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400' : 'bg-amber-100 text-amber-800'
              }`}>
                {draftSaved ? 'SAVED LOCALLY' : 'SAVING...'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">
              {pendingSync ? 'Pending cloud network handshake...' : '100% offline-ready proposal draft in state cache.'}
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ LIVE VALIDATION ALERTS PANEL */}
      {validationErrors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Margin & Pricing Constraints Active</span>
          </div>
          <ul className="list-disc list-inside text-[10px] text-amber-600 dark:text-amber-500/90 space-y-0.5 pl-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="leading-tight">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* MAIN LAYOUT: INPUTS VS STICKY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE FORM VIEW (SIMPLE OR ADVANCED) */}
        <div className="lg:col-span-2 space-y-5">
          {pricingMode === 'simple' ? (
            /* ==============================================================
               2. SIMPLE PRICING MODE
               ============================================================== */
            <div className="border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm">
              <div className="border-b pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">🚀 Quick Sizing Pricing (Simple)</h3>
                  <p className="text-[10px] text-slate-500">Perfect for residential or fast estate solar quotes.</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold text-slate-500">Simple View</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Equipment Cost (BOM derived, read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>🔌</span> Hardware Subtotal (BOM derived)
                  </Label>
                  <div className="w-full text-xs font-extrabold p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300">
                    ₦{hardwareSubtotal.toLocaleString()}
                  </div>
                  <span className="block text-[9px] text-slate-400">Total system hardware costs calculated from BOM.</span>
                </div>

                {/* Labour/Installation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>🛠️</span> Installation Fee (₦)
                  </Label>
                  <Input
                    type="number"
                    value={labour}
                    onChange={(e) => handleFieldChange({ labour_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-9 text-xs"
                    placeholder="80,000"
                  />
                  <span className="block text-[9px] text-slate-400">Includes mounting, switchgear wiring, trunking labor.</span>
                </div>

                {/* Transport & Logistics */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>🚚</span> Logistics / Transport Fee (₦)
                  </Label>
                  <Input
                    type="number"
                    value={transport}
                    onChange={(e) => handleFieldChange({ transport_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-9 text-xs"
                    placeholder="25,000"
                  />
                  <span className="block text-[9px] text-slate-400">Logistics dispatch to mainland/island locations.</span>
                </div>

                {/* Margin Percentage */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>📈</span> Profit Margin / Markup (%)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={markupPercent}
                      onChange={(e) => handleFieldChange({ markup_percentage: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="h-9 pr-7 text-xs"
                      placeholder="15"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">%</span>
                  </div>
                  <span className="block text-[9px] text-slate-400">Business surcharge margin on total project costs.</span>
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>🎁</span> Discount Amount (₦)
                  </Label>
                  <Input
                    type="number"
                    value={discountNgn}
                    onChange={(e) => handleFieldChange({ discount_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-9 text-xs"
                    placeholder="0"
                  />
                  <span className="block text-[9px] text-slate-400">Deducted from total final proposal price.</span>
                </div>

                {/* VAT Toggle */}
                <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                  <div className="flex items-center gap-2.5 p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-950/30 cursor-pointer hover:bg-slate-50 select-none">
                    <input
                      type="checkbox"
                      id="simple_vat"
                      checked={includeVat}
                      onChange={(e) => handleFieldChange({ include_vat: e.target.checked })}
                      className="rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4 cursor-pointer"
                    />
                    <label htmlFor="simple_vat" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                      Include VAT (+{vatPercent}%)
                    </label>
                  </div>
                  <span className="block text-[9px] text-slate-400 mt-1">Lagos State/Federal solar component tax compliance.</span>
                </div>
              </div>

              {/* Dynamic Selling Price Indicator Box */}
              <div className="p-4 bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-950 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Total Turnkey Investment (Naira):</span>
                  <span className="text-base font-black text-teal-650 dark:text-teal-400">₦{finalSellingPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end">
                <Button 
                  onClick={onNext}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs h-9 px-4 flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Save & Update Pricing
                </Button>
              </div>
            </div>
          ) : (
            /* ==============================================================
               3. ADVANCED PRICING MODE (ACCORDIONS)
               ============================================================== */
            <div className="space-y-3.5">
              
              {/* Accordion 1: Cost Inputs */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('costs')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-left border-b"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                    1. Cost Inputs & Overhead Budget
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {accordions.costs ? '▲ Collapse' : `▼ Expand (Base: ₦${baseSubtotal.toLocaleString()})`}
                  </span>
                </button>
                {accordions.costs && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Hardware Subtotal (BOM)</Label>
                        <div className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-600 dark:text-slate-400">
                          ₦{hardwareSubtotal.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Installation Labor Cost (₦)</Label>
                        <Input
                          type="number"
                          value={labour}
                          onChange={(e) => handleFieldChange({ labour_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Logistics & Logistics Hire (₦)</Label>
                        <Input
                          type="number"
                          value={transport}
                          onChange={(e) => handleFieldChange({ transport_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Installation Accessories (₦)</Label>
                        <Input
                          type="number"
                          value={accessories}
                          onChange={(e) => handleFieldChange({ accessories_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Project Contingency Buffer (₦)</Label>
                        <Input
                          type="number"
                          value={contingency}
                          onChange={(e) => handleFieldChange({ contingency_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Commercial Adjustments */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('margin')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-left border-b"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    2. Commercial Margins & Safeguards
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {accordions.margin ? '▲ Collapse' : `▼ Expand (Margin: ${markupPercent}%)`}
                  </span>
                </button>
                {accordions.margin && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Profit Markup Margin (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={markupPercent}
                            onChange={(e) => handleFieldChange({ markup_percentage: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="h-8 pr-7 text-xs font-mono"
                          />
                          <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Min. Margin Safeguard (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={minMarginThreshold}
                            onChange={(e) => handleFieldChange({ min_margin_threshold: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="h-8 pr-7 text-xs font-mono"
                          />
                          <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Direct Proposal Discount (₦)</Label>
                        <Input
                          type="number"
                          value={discountNgn}
                          onChange={(e) => handleFieldChange({ discount_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Currency / FX Indexation */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('fx')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-left border-b"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    3. Currency & FX Volatility Safeguards
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {accordions.fx ? '▲ Collapse' : `▼ Expand (Locked FX: ₦${(proposal.lockedFXRate || 1600).toLocaleString()})`}
                  </span>
                </button>
                {accordions.fx && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">USD Rate indexation (₦/$)</Label>
                        <Input
                          type="number"
                          value={proposal.lockedFXRate || 1600}
                          onChange={(e) => handleFieldChange({ lockedFXRate: Math.max(100, parseInt(e.target.value) || 1600) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">FX Indexation Buffer (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={fxBufferPercent}
                            onChange={(e) => handleFieldChange({ fx_buffer_percentage: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="h-8 pr-7 text-xs font-mono"
                          />
                          <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Indexation Source</Label>
                        <div className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-600 dark:text-slate-400">
                          ExchangeRate-API Live
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: Tax & Regulatory Fees */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('tax')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-left border-b"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    4. Taxes & Professional Fees
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {accordions.tax ? '▲ Collapse' : `▼ Expand (VAT: ${includeVat ? `${vatPercent}%` : 'Disabled'})`}
                  </span>
                </button>
                {accordions.tax && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1 flex flex-col justify-end pb-1.5">
                        <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeVat}
                            onChange={(e) => handleFieldChange({ include_vat: e.target.checked })}
                            className="rounded border-slate-350 text-teal-650 focus:ring-teal-500 size-4 cursor-pointer"
                          />
                          <span>Calculate VAT</span>
                        </label>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">VAT Rate (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={vatPercent}
                            onChange={(e) => handleFieldChange({ vat_percentage: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="h-8 pr-7 text-xs font-mono"
                            disabled={!includeVat}
                          />
                          <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Regulatory Doc Fee (₦)</Label>
                        <Input
                          type="number"
                          value={adminFee}
                          onChange={(e) => handleFieldChange({ admin_fee_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Installer Service Fee (₦)</Label>
                        <Input
                          type="number"
                          value={serviceFee}
                          onChange={(e) => handleFieldChange({ service_fee_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 5: Payment Terms & Financing */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('terms')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-left border-b"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    5. Payment Terms & Down Payment
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {accordions.terms ? '▲ Collapse' : `▼ Expand (Deposit: ${proposal.paymentPlan?.downPaymentPercent || 20}%)`}
                  </span>
                </button>
                {accordions.terms && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Down Payment Deposit (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={proposal.paymentPlan?.downPaymentPercent ?? 20}
                            onChange={(e) => handleFieldChange({
                              paymentPlan: {
                                ...(proposal.paymentPlan || {
                                  selectedPlan: 'outright',
                                  interestRatePercent: 0,
                                  includeInProposal: true,
                                  markup6Months: 10,
                                  markup12Months: 15,
                                  markup24Months: 20
                                }),
                                downPaymentPercent: Math.max(0, Math.min(100, parseInt(e.target.value) || 20))
                              }
                            })}
                            className="h-8 pr-7 text-xs font-mono"
                          />
                          <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Standard Financing terms</Label>
                        <div className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-600 dark:text-slate-400">
                          Outright, 6, 12 or 24 months options active.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 6: Warranty & Recurring Maintenance */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('warranty')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-left border-b"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    6. Warranty & Extended Support
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {accordions.warranty ? '▲ Collapse' : `▼ Expand (Warranty: ₦${warranty.toLocaleString()})`}
                  </span>
                </button>
                {accordions.warranty && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Extended Warranty Cost (₦)</Label>
                        <Input
                          type="number"
                          value={warranty}
                          onChange={(e) => handleFieldChange({ warranty_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Maintenance Plan Cost (₦)</Label>
                        <Input
                          type="number"
                          value={maintenance}
                          onChange={(e) => handleFieldChange({ maintenance_plan_cost_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Recurring SLA Service Fee (₦)</Label>
                        <Input
                          type="number"
                          value={recurringFee}
                          onChange={(e) => handleFieldChange({ recurring_service_fee_ngn: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 7: Proposal Terms & Exclusions */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('proposalTerms')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-left border-b"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    7. Validity, Terms & Exclusions
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {accordions.proposalTerms ? '▲ Collapse' : `▼ Expand (Validity: ${quoteValidity} Days)`}
                  </span>
                </button>
                {accordions.proposalTerms && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-bold">Quote Validity Duration (Days)</Label>
                        <Input
                          type="number"
                          value={quoteValidity}
                          onChange={(e) => handleFieldChange({ quote_validity_days: Math.max(1, parseInt(e.target.value) || 30) })}
                          className="h-8 text-xs font-mono max-w-[200px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Proposal Custom Notes / Notes</Label>
                          <textarea
                            value={proposal.proposal_notes || ''}
                            onChange={(e) => handleFieldChange({ proposal_notes: e.target.value })}
                            className="w-full text-xs p-2 border rounded-lg h-20 outline-none focus:ring-1 focus:ring-teal-500"
                            placeholder="Add payment structure notes..."
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Exclusions</Label>
                          <textarea
                            value={proposal.proposal_exclusions || ''}
                            onChange={(e) => handleFieldChange({ proposal_exclusions: e.target.value })}
                            className="w-full text-xs p-2 border rounded-lg h-20 outline-none focus:ring-1 focus:ring-teal-500"
                            placeholder="Specify exclusion components, e.g. lightning arrestors..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* ==============================================================
           4. STICKY PRICING SUMMARY PANEL (DESKTOP & MOBILE INTEGRATED)
           ============================================================== */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 space-y-4">
          <div className="border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
            
            {/* Header info */}
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-450 dark:text-slate-400">Live Quote Summary</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">Commercial Pro-Forma</span>
                  <Badge variant="outline" className="text-[8px] bg-slate-50 dark:bg-slate-950 uppercase font-black tracking-widest text-teal-650 h-4 px-1.5">
                    {pricingMode}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Price items list */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>BOM Hardware Subtotal:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-350">₦{hardwareSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Labor & Extra Services:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-350">₦{extraCostsSum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Profit Margin ({markupPercent}%):</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-350">₦{marginNgn.toLocaleString()}</span>
              </div>
              {includeVat && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>VAT ({vatPercent}%):</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-350">₦{vatNgn.toLocaleString()}</span>
                </div>
              )}
              {discountNgn > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-semibold">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-₦{discountNgn.toLocaleString()}</span>
                </div>
              )}

              {/* Total final price block */}
              <div className="border-t pt-3 mt-2 space-y-1">
                <div className="flex justify-between items-end">
                  <span className="font-black text-xs text-slate-700 dark:text-slate-300">Final Selling Price:</span>
                  <span className="text-lg font-black text-teal-650 dark:text-teal-400 tracking-tight leading-none">
                    ₦{finalSellingPrice.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">
                  Quote validity: {quoteValidity} days | USD locked rate: ₦{(proposal.lockedFXRate || 1600).toLocaleString()}/$.
                </p>
              </div>
            </div>

            {/* ROI Sizing Indicators inside summary */}
            <div className="border-t pt-4 space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 flex items-center gap-1">
                <span>⚡</span> Return On Investment Indicators
              </h5>
              
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400">Est. Savings / Mo</span>
                  <span className="block text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    ₦{monthlySavings.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400">Payback Period</span>
                  <span className="block text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {paybackMonths > 0 ? `${paybackMonths} Months` : 'Instant'}
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 text-center leading-relaxed">
                {paybackMonths > 0 ? `~${paybackYears} Years required to break even against recurring fossil generator burn.` : 'System immediately breaks even.'}
              </div>
            </div>

            {/* Active Status Badges Shelf */}
            <div className="border-t pt-3 flex flex-wrap gap-1.5 justify-center">
              <Badge className={`text-[8px] font-bold px-1.5 h-4 select-none ${
                isOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
              }`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
              <Badge className={`text-[8px] font-bold px-1.5 h-4 select-none ${
                rateStatus === 'synced' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-amber-100 text-amber-800'
              }`}>
                {rateStatus === 'synced' ? 'FX RATE SYNCED' : 'FX RATE LOCAL'}
              </Badge>
              <Badge className={`text-[8px] font-bold px-1.5 h-4 select-none ${
                markupPercent >= minMarginThreshold ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800'
              }`}>
                {markupPercent >= minMarginThreshold ? 'HEALTHY MARGIN' : 'MARGIN ALERT'}
              </Badge>
            </div>

          </div>
        </div>

      </div>

      {/* ==============================================================
         ⛽ ORIGINAL INTERACTIVE ROI & GENERATOR COST savings calculator
         ============================================================== */}
      <div className="border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 space-y-6 relative overflow-hidden">
        {!checkAccess('roiComparison').unlocked && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-sm font-black text-white">Generator Savings & ROI Timeline</h4>
              <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">
                Compare diesel burn charges and PHCN grid utility bills over 5, 7, and 10 years to showcase long-term solar payback calculations.
              </p>
            </div>
            <Button 
              size="sm" 
              className="bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-[11px] py-1.5 px-4 shadow-md"
              onClick={() => openUpgradeModal('roiComparison')}
            >
              Upgrade to Pro to Unlock ROI Tool
            </Button>
          </div>
        )}
        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>⛽</span> Fossil Generator Cost Offset Calculator
          </h3>
          <p className="text-xs text-slate-500">
            Compare system lifecycle pricing against high petroleum fuel bills to show absolute value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 border-b pb-1.5 flex items-center gap-1.5">
              <span>⛽</span> Generator Setup
            </h4>
            
            {/* Gen Size Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Generator Rating (kVA)</label>
              <select
                value={genSizeKva}
                onChange={(e) => handleGenSizeChange(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value={2.5}>2.5 kVA (Small Petrol)</option>
                <option value={5.0}>5.0 kVA (Medium Diesel/Petrol)</option>
                <option value={7.5}>7.5 kVA (Large Diesel)</option>
                <option value={10.0}>10.0 kVA (Heavy Diesel)</option>
              </select>
            </div>

            {/* Fuel Consumption */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Fuel Consumption (Litres/hr)</label>
                <span className="text-[9px] text-teal-650 font-semibold">Auto-filled</span>
              </div>
              <Input
                type="number"
                step="0.1"
                value={fuelConsumption}
                onChange={(e) => handleFieldChange({ roi_fuel_consumption: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Run hours per day */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Generator Runtime (Hrs/day)</label>
              <Input
                type="number"
                min="0"
                max="24"
                value={hoursPerDay}
                onChange={(e) => handleFieldChange({ roi_gen_hours_per_day: Math.min(24, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Fuel price */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Lagos Fuel Price (₦/Litre)</label>
              <Input
                type="number"
                value={fuelPrice}
                onChange={(e) => handleFieldChange({ roi_fuel_price: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* PHCN utility bill */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Current Monthly PHCN Grid Bill (₦)</label>
              <Input
                type="number"
                value={phcnBill}
                onChange={(e) => handleFieldChange({ monthly_phcn_bill: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3.5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-teal-500/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-widest">Offset Performance Summary</span>
                <span className="text-[10px] text-slate-400 font-bold">Timeline: {yearsToCalculate} Years</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
                <div>
                  <span className="block text-[9px] text-slate-400 font-semibold">Monthly Fuel Expense</span>
                  <span className="block text-sm font-black text-amber-500 mt-1">₦{monthlyGenFuelCost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-semibold">Total Utility Bill</span>
                  <span className="block text-sm font-black text-amber-500 mt-1">₦{monthlySavings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-semibold">Solar Payback break-even</span>
                  <span className="block text-sm font-black text-teal-400 mt-1">{paybackMonths} Months</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed border-t border-white/10 pt-2 mt-1">
                By investing in Solar, you fully pay off your power capital and save{' '}
                <strong className="text-teal-300">
                  ₦{Math.max(0, (monthlySavings * 12 * yearsToCalculate) - finalSellingPrice).toLocaleString()}
                </strong>{' '}
                over {yearsToCalculate} years!
              </p>
            </div>

            {/* Forecast Range selector */}
            <div className="flex gap-2">
              {[5, 7, 10].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleFieldChange({ roi_years_to_calculate: yr })}
                  className={`flex-1 text-xs py-1.5 rounded-lg border font-semibold transition-all ${
                    yearsToCalculate === yr
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {yr} Years Savings Projections
                </button>
              ))}
            </div>

            {/* Projections Table */}
            <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-2.5">Year</th>
                    <th className="p-2.5">Utility Spend</th>
                    <th className="p-2.5">Solar Investment</th>
                    <th className="p-2.5 text-right">Net Savings (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                  {Array.from({ length: yearsToCalculate }).map((_, idx) => {
                    const yr = idx + 1;
                    const legacy = monthlySavings * 12 * yr;
                    const savings = legacy - finalSellingPrice;

                    return (
                      <tr key={yr} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                        <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Year {yr}</td>
                        <td className="p-2.5 text-slate-500">₦{legacy.toLocaleString()}</td>
                        <td className="p-2.5 text-slate-500">₦{finalSellingPrice.toLocaleString()}</td>
                        <td className={`p-2.5 text-right font-black ${savings >= 0 ? 'text-teal-650 dark:text-teal-400' : 'text-slate-500'}`}>
                          {savings >= 0 ? `+₦${savings.toLocaleString()}` : `-₦${Math.abs(savings).toLocaleString()}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER WIZARD STEPS BUTTONS */}
      <div className="flex gap-4 border-t pt-6">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto text-xs h-9">
          ← Back to Hardware BOM
        </Button>
        <div className="flex-1" />
        <Button 
          onClick={onNext} 
          disabled={finalSellingPrice <= 0}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs h-9 px-6 shadow-sm"
        >
          Next: Finalize Proposal →
        </Button>
      </div>
    </div>
  );
}
