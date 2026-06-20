'use client';

import * as React from 'react';
import { useWizardStore } from '@/store/wizardStore';
import { useUiStore } from '@/store/uiStore';
import Step1Appliances from '@/components/wizard/Step1Appliances';
import Step2Preferences from '@/components/wizard/Step2Preferences';
import Step3Hardware from '@/components/wizard/Step3Hardware';
import Step4ROI from '@/components/wizard/Step4ROI';
import Step5Finalize from '@/components/wizard/Step5Finalize';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { WifiOff, HardHat, FileText, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FXRateBadge } from '@/components/FXRateBadge';
import { useHistoryStore } from '@/store/historyStore';
import { useTracking } from '@/hooks/useTracking';
import { useRouter, useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/error-boundary';
import { toast } from 'sonner';

const DEMO_APPLIANCES = [
  {
    id: 'demo-ac',
    name: '1.5HP Inverter Split AC',
    wattage: 1200,
    quantity: 1,
    dailyRuntimeHours: 8,
    isInductive: true,
    loadType: 'essential' as const,
    isIncludedInBackup: true,
    simultaneousStart: true,
  },
  {
    id: 'demo-bulbs',
    name: 'LED Bulbs',
    wattage: 15,
    quantity: 4,
    dailyRuntimeHours: 10,
    isInductive: false,
    loadType: 'essential' as const,
    isIncludedInBackup: true,
    simultaneousStart: false,
  },
  {
    id: 'demo-tv',
    name: '43" LED TV',
    wattage: 80,
    quantity: 1,
    dailyRuntimeHours: 6,
    isInductive: false,
    loadType: 'essential' as const,
    isIncludedInBackup: true,
    simultaneousStart: false,
  },
  {
    id: 'demo-router',
    name: 'Wi-Fi Router',
    wattage: 15,
    quantity: 1,
    dailyRuntimeHours: 24,
    isInductive: false,
    loadType: 'essential' as const,
    isIncludedInBackup: true,
    simultaneousStart: false,
  },
  {
    id: 'demo-fan',
    name: 'Standing Fan',
    wattage: 60,
    quantity: 1,
    dailyRuntimeHours: 8,
    isInductive: true,
    loadType: 'essential' as const,
    isIncludedInBackup: true,
    simultaneousStart: false,
  },
];

const DEMO_CALCULATIONS = {
  totalDailyWh: 11520,
  essentialDailyWh: 11520,
  pContinuous: 1415,
  peakSurgeWatts: 2615,
  inverterKva: 5.0,
  systemVoltage: 48,
  batteryConfigString: '1S2P',
  batteryTotalUnits: 2,
  batteryUnitVoltage: 48,
  batteryUnitAh: 100,
  panelCount: 8,
  panelUnitWp: 450,
  panelTotalWp: 3600,
};

function useNetworkStatus() {
  return React.useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true
  );
}

function NewProposalPageInner() {
  const { step, setStep, proposal, calculations, updateProposal, setCalculations, reset } = useWizardStore();
  const { fieldMode, setFieldMode, appMode } = useUiStore();
  const { saveProposal } = useHistoryStore();
  const { trackEvent } = useTracking();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useNetworkStatus();

  // Switch between quick and full wizard flows
  const [flowType, setFlowType] = React.useState<'quick' | 'wizard'>(() => {
    const t = searchParams?.get('type');
    if (t === 'quick' || t === 'wizard') return t;
    return appMode === 'simple' ? 'quick' : 'wizard';
  });

  React.useEffect(() => {
    const t = searchParams?.get('type');
    if (t === 'quick' || t === 'wizard') {
      setFlowType(t);
    }
  }, [searchParams]);


  // Quick Proposal Inputs
  const [quickName, setQuickName] = React.useState('');
  const [quickPhone, setQuickPhone] = React.useState('');
  const [quickKva, setQuickKva] = React.useState('5');
  const [quickPrice, setQuickPrice] = React.useState('');
  const [quickPaymentEnabled, setQuickPaymentEnabled] = React.useState(false);
  const [quickDownPaymentPercent, setQuickDownPaymentPercent] = React.useState('20');
  const [quickDuration, setQuickDuration] = React.useState('12');

  const [saveButtonText, setSaveButtonText] = React.useState('Save Draft');

  // B1: Check for load query param and load data
  React.useEffect(() => {
    const loadId = searchParams?.get('load');
    if (!loadId) return;

    let loadedItem: any = null;
    try {
      const stored = localStorage.getItem(`solarquotepro_proposal_${loadId}`);
      if (stored) {
        loadedItem = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse loaded proposal from localStorage key:', e);
    }

    if (!loadedItem) {
      // Fallback to savedProposals list
      const { savedProposals } = useHistoryStore.getState();
      const found = savedProposals.find((p) => p.id === loadId);
      if (found) {
        loadedItem = found;
      }
    }

    if (loadedItem && loadedItem.proposal) {
      updateProposal(loadedItem.proposal);
      if (loadedItem.calculations) {
        setCalculations(loadedItem.calculations);
      }
      
      const restoredFlowType = loadedItem.flowType || 'wizard';
      setFlowType(restoredFlowType);
      
      if (restoredFlowType === 'quick') {
        setQuickName(loadedItem.proposal.customer_name || '');
        setQuickPhone(loadedItem.proposal.customer_phone || '');
        setQuickKva(String(loadedItem.calculations?.inverterKva || '5'));
        setQuickPrice(String(loadedItem.proposal.final_quoted_price_ngn || ''));
        const hasPayment = loadedItem.proposal.paymentPlan?.includeInProposal ?? false;
        setQuickPaymentEnabled(hasPayment);
        setQuickDownPaymentPercent(String(loadedItem.proposal.paymentPlan?.downPaymentPercent ?? '20'));
        
        const planName = loadedItem.proposal.paymentPlan?.selectedPlan || 'outright';
        if (planName === '6months') setQuickDuration('6');
        else if (planName === '12months') setQuickDuration('12');
        else if (planName === '24months') setQuickDuration('24');
      } else {
        setStep(5); // Jump straight to Step 5 (Finalize)
      }
      
      toast.success('Loaded saved proposal draft!');
    }
  }, [searchParams, updateProposal, setCalculations, setStep]);

  // ?reset=1 URL param: clears localStorage then redirects clean
  React.useEffect(() => {
    if (searchParams?.get('reset') === '1') {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('solar-')) localStorage.removeItem(key);
        });
      } catch { /* ignore */ }
      reset();
      router.replace('/proposals/new');
    }
  }, [searchParams, reset, router]);

  React.useEffect(() => {
    trackEvent('wizard_mounted', { initialStep: step, flowType });
  }, [trackEvent, step, flowType]);

  const handleClearAndRestart = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('solar-')) localStorage.removeItem(key);
      });
    } catch { /* ignore */ }
    reset();
    setQuickName('');
    setQuickPhone('');
    setQuickPrice('');
    setQuickPaymentEnabled(false);
    trackEvent('wizard_reset');
    toast.success('System state reset successfully.');
  };

  const handleSaveDraft = () => {
    const currentProposal = useWizardStore.getState().proposal;
    const currentCalculations = useWizardStore.getState().calculations;
    saveProposal(currentProposal, currentCalculations || undefined, flowType, step);
    trackEvent('proposal_saved_draft', { customer: proposal.customer_name });
    
    toast.success('Draft saved successfully!');
    setSaveButtonText('Saved ✓');
    setTimeout(() => {
      setSaveButtonText('Save Draft');
    }, 2000);
  };

  const handleLoadDemo = () => {
    trackEvent('demo_loaded');
    reset(); // clear existing state first so there's no layering
    updateProposal({
      customer_name: 'Demo Client',
      customer_email: 'demo@solarquotepro.ng',
      customer_phone: '08012345678',
      backup_hours: 8,
      peak_sun_hours: 4.2,
      battery_chemistry: 'lithium',
      selected_tier: 'standard',
      selectedInverterBrand: 'Growatt',
      selectedBatteryBrand: 'Felicity Lithium',
      selectedPanelBrand: 'Jinko',
      nepa_daily_hours: 4,
      nepa_tariff_per_kwh: 225,
      fuelPrices: {
        petrolPerLitre: 1250,
        dieselPerLitre: 1750,
      },
      roi_gen_size_kva: 5,
      roi_fuel_consumption: 1.2,
      roi_gen_hours_per_day: 4,
      roi_fuel_price: 1250,
      roi_years_to_calculate: 5,
      monthly_phcn_bill: 45000,
      monthly_gen_fuel_cost: 180000,
      monthly_gen_maintenance: 15000,
      inverter_cost_ngn: 1200000,
      battery_unit_cost_ngn: 900000,
      panel_unit_cost_ngn: 150000,
      labour_cost_ngn: 250000,
      accessories_cost_ngn: 150000,
      markup_percentage: 15,
      discount_ngn: 0,
      vat_percentage: 7.5,
      appliances: DEMO_APPLIANCES,
    });
    setCalculations(DEMO_CALCULATIONS);
    setStep(1);
    setFlowType('wizard');
    toast.success('Demo client loaded! Walk through the wizard steps.');
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickName.trim();
    const phone = quickPhone.trim();
    const kva = Number(quickKva);
    const totalPrice = Number(quickPrice);

    if (!name || isNaN(totalPrice) || totalPrice <= 0) return;

    // Smart sizing configuration values mapped to selected system capacity
    let batteryTotalUnits = 2;
    let batteryUnitAh = 100;
    let batteryUnitVoltage = 48;
    let panelCount = 6;
    let panelUnitWp = 450;
    let systemVoltage = 48;
    let batteryConfigString = '1S2P';

    if (kva <= 1.5) {
      batteryTotalUnits = 1;
      batteryUnitAh = 200;
      batteryUnitVoltage = 12;
      panelCount = 2;
      systemVoltage = 12;
      batteryConfigString = '1S1P';
    } else if (kva <= 2.5) {
      batteryTotalUnits = 2;
      batteryUnitAh = 200;
      batteryUnitVoltage = 12;
      panelCount = 4;
      systemVoltage = 24;
      batteryConfigString = '2S1P';
    } else if (kva <= 3.5) {
      batteryTotalUnits = 4;
      batteryUnitAh = 200;
      batteryUnitVoltage = 12;
      panelCount = 6;
      systemVoltage = 48;
      batteryConfigString = '4S1P';
    } else if (kva <= 5) {
      batteryTotalUnits = 1;
      batteryUnitAh = 100;
      batteryUnitVoltage = 48;
      panelCount = 8;
      systemVoltage = 48;
      batteryConfigString = '1S1P';
    } else if (kva <= 7.5) {
      batteryTotalUnits = 2;
      batteryUnitAh = 100;
      batteryUnitVoltage = 48;
      panelCount = 12;
      systemVoltage = 48;
      batteryConfigString = '1S2P';
    } else if (kva <= 10) {
      batteryTotalUnits = 2;
      batteryUnitAh = 200;
      batteryUnitVoltage = 48;
      panelCount = 16;
      systemVoltage = 48;
      batteryConfigString = '1S2P';
    } else {
      batteryTotalUnits = 4;
      batteryUnitAh = 200;
      batteryUnitVoltage = 48;
      panelCount = 24;
      systemVoltage = 48;
      batteryConfigString = '2S2P';
    }

    setCalculations({
      totalDailyWh: kva * 2200,
      essentialDailyWh: kva * 1100,
      pContinuous: kva * 800,
      peakSurgeWatts: kva * 1600,
      inverterKva: kva,
      systemVoltage,
      batteryConfigString,
      batteryTotalUnits,
      batteryUnitVoltage,
      batteryUnitAh,
      panelCount,
      panelUnitWp,
      panelTotalWp: panelCount * panelUnitWp,
    });

    updateProposal({
      customer_name: name,
      customer_phone: phone,
      selected_tier: kva >= 5 ? 'standard' : 'budget',
      inverter_cost_ngn: Math.round(totalPrice * 0.3),
      battery_unit_cost_ngn: Math.round((totalPrice * 0.45) / batteryTotalUnits),
      panel_unit_cost_ngn: Math.round((totalPrice * 0.18) / panelCount),
      labour_cost_ngn: Math.round(totalPrice * 0.05),
      accessories_cost_ngn: Math.round(totalPrice * 0.02),
      markup_percentage: 0,
      discount_ngn: 0,
      vat_percentage: 0,
      final_quoted_price_ngn: totalPrice,
      paymentPlan: {
        selectedPlan: quickPaymentEnabled ? (quickDuration === '6' ? '6months' : quickDuration === '12' ? '12months' : '24months') : 'outright',
        downPaymentPercent: Number(quickDownPaymentPercent),
        interestRatePercent: 0,
        includeInProposal: quickPaymentEnabled,
        markup6Months: 10,
        markup12Months: 15,
        markup24Months: 20
      }
    });

    trackEvent('quick_proposal_submitted', { customer: name, kva });
    setStep(5);
    setFlowType('wizard'); // transitions display back to final summary checklist page
  };

  const stepsList = [
    { number: 1, label: 'Load Inventory' },
    { number: 2, label: 'System Prefs' },
    { number: 3, label: 'Hardware BOM' },
    { number: 4, label: 'ROI & Pricing' },
    { number: 5, label: 'Finalize Proposal' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={() => router.push('/history')}>
              <FileText className="w-4 h-4 mr-1.5" />
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLoadDemo} className="hidden sm:inline-flex rounded-xl">
              Load Demo
            </Button>
            {flowType === 'wizard' && (
              <Button variant="secondary" size="sm" onClick={handleSaveDraft} className="hidden sm:inline-flex rounded-xl font-bold">
                <Download className="w-4 h-4 mr-1.5" />
                {saveButtonText}
              </Button>
            )}
            <FXRateBadge />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAndRestart}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
              title="Clear all data and start fresh"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <HardHat className={`w-4 h-4 ${fieldMode ? 'text-teal-655' : 'text-slate-400'}`} />
            <label htmlFor="field-mode" className="text-sm font-semibold select-none cursor-pointer">
              Field Mode
            </label>
            <Switch
              id="field-mode"
              checked={fieldMode}
              onCheckedChange={setFieldMode}
            />
          </div>
        </div>

        {/* Toggle Builder Type */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 bg-slate-150 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setFlowType('quick');
                reset();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                flowType === 'quick'
                  ? 'bg-white dark:bg-slate-900 text-teal-650 shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              ⚡ Quick Proposal
            </button>
            <button
              onClick={() => {
                setFlowType('wizard');
                reset();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                flowType === 'wizard'
                  ? 'bg-white dark:bg-slate-900 text-teal-650 shadow-sm border border-slate-200 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              ⚙️ Full Wizard Flow
            </button>
          </div>
        </div>

        {flowType === 'quick' ? (
          /* ═══ Quick Proposal Form Screen ═══ */
          <div className="max-w-xl mx-auto animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-650 dark:text-teal-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  ⚡ Quick Quote
                </div>
                <h2 className="text-xl font-black tracking-tight text-slate-850 dark:text-slate-100">Lightweight Proposal</h2>
                <p className="text-xs text-slate-500">Perfect for instantly generating NGN WhatsApp summaries &amp; PDFs on client sites.</p>
              </div>

              <form onSubmit={handleQuickSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="customer_name" className="text-xs font-bold text-slate-700 dark:text-slate-330">Customer Name</label>
                  <Input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    required
                    value={quickName}
                    onChange={e => setQuickName(e.target.value)}
                    placeholder="e.g. Alhaji Adeleke"
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-330">WhatsApp / Phone Number</label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={quickPhone}
                    onChange={e => setQuickPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-330">System Size (kVA)</label>
                    <select
                      value={quickKva}
                      onChange={e => setQuickKva(e.target.value)}
                      aria-label="System Size in kVA"
                      title="System Size"
                      className="w-full h-11 bg-background border border-input rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="1.5">1.5 kVA (Economy)</option>
                      <option value="2.5">2.5 kVA (Comfort)</option>
                      <option value="3.5">3.5 kVA (Premium Light)</option>
                      <option value="5">5 kVA (Standard Home)</option>
                      <option value="7.5">7.5 kVA (Big Home/Office)</option>
                      <option value="10">10 kVA (Heavy Load)</option>
                      <option value="15">15 kVA (Max Power)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="price" className="text-xs font-bold text-slate-700 dark:text-slate-330">Total Price (₦)</label>
                    <Input
                      type="number"
                      id="price"
                      name="price"
                      required
                      min={0}
                      value={quickPrice}
                      onChange={e => setQuickPrice(e.target.value)}
                      placeholder="e.g. 3500000"
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Payment Plan Sub-Toggle */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Flexible Installment Options</span>
                      <span className="block text-[10px] text-slate-500">Provide monthly financing options to client.</span>
                    </div>
                    <Switch
                      checked={quickPaymentEnabled}
                      onCheckedChange={setQuickPaymentEnabled}
                    />
                  </div>

                  {quickPaymentEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">Down Payment (%)</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={quickDownPaymentPercent}
                          onChange={e => setQuickDownPaymentPercent(e.target.value)}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">Duration (Months)</label>
                        <select
                          value={quickDuration}
                          onChange={e => setQuickDuration(e.target.value)}
                          aria-label="Payment installment plan duration"
                          title="Installment Plan Duration"
                          className="w-full h-9 bg-background border border-input rounded-xl px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="6">6 Months</option>
                          <option value="12">12 Months</option>
                          <option value="24">24 Months</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md mt-2"
                >
                  Generate Proposal Summary & PDF →
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* ═══ Full Wizard Flow ═══ */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Progress bar */}
            <div className="border rounded-2xl bg-white dark:bg-slate-900 p-6 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                {stepsList.map((s, idx) => {
                  const isActive = step === s.number;
                  const isCompleted = step > s.number;
                  return (
                    <div key={s.number} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center relative">
                        <button
                          type="button"
                          disabled={!isCompleted}
                          onClick={() => {
                            if (isCompleted) {
                              setStep(s.number);
                              trackEvent('wizard_step_indicator_clicked', { targetStep: s.number });
                            }
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                            isActive
                               ? 'border-teal-650 bg-teal-650 text-white shadow-md'
                               : isCompleted
                               ? 'border-teal-650 bg-teal-50 text-teal-655 dark:bg-teal-950/30 cursor-pointer hover:ring-2 hover:ring-teal-500/50 hover:bg-teal-100/50'
                               : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 cursor-not-allowed'
                          }`}
                        >
                          {s.number}
                        </button>
                        <span
                          className={`absolute -bottom-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${
                            isActive ? 'text-teal-600 font-extrabold' : 'text-slate-400'
                          }`}
                        >
                          {s.label.split(' ')[0]}
                        </span>
                      </div>
                      {idx < stepsList.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-4 transition-all ${
                            step > s.number ? 'bg-teal-650' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Wizard Wrapper */}
            <div className="border rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm border-slate-200 dark:border-slate-800">
              {step === 1 && <Step1Appliances onNext={() => setStep(2)} />}
              {step === 2 && (
                <Step2Preferences
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <Step3Hardware
                  onNext={() => setStep(4)}
                  onBack={() => setStep(2)}
                />
              )}
              {step === 4 && (
                <Step4ROI
                  onNext={() => setStep(5)}
                  onBack={() => setStep(3)}
                />
              )}
              {step === 5 && (
                <Step5Finalize
                  onBack={() => setStep(4)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WizardPageClient() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Loading builder…</p></div>}>
        <NewProposalPageInner />
      </React.Suspense>
    </ErrorBoundary>
  );
}
