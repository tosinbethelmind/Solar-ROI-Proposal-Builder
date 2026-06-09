'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWizardStore, InputAppliance } from '@/store/wizardStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Zap, 
  ArrowRight, 
  Check, 
  Sparkles,
  Info,
  SlidersHorizontal,
  FolderSync
} from 'lucide-react';
import { CopyrightYear } from '@/components/ui/CopyrightYear';

interface QuickPackage {
  id: string;
  name: string;
  kva: string;
  battery: string;
  panels: string;
  costMin: number;
  costMax: number;
  description: string;
  appliances: InputAppliance[];
}

const QUICK_PACKAGES: QuickPackage[] = [
  {
    id: 'starter',
    name: '1.2kVA Starter System',
    kva: '1.2kVA',
    battery: '1x 2.5kWh Lithium Battery',
    panels: '2x 450W Panels',
    costMin: 900000,
    costMax: 1400000,
    description: 'Perfect for small apartments or flats. Sustains basic lighting, standing fans, television, laptops, and a highly efficient small fridge.',
    appliances: [
      { id: 'led_lights', name: 'LED Bulbs / Lights', wattage: 15, quantity: 6, dailyRuntimeHours: 8, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'standing_fans', name: 'Standing or Ceiling Fans', wattage: 75, quantity: 2, dailyRuntimeHours: 12, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'led_tv', name: 'Smart TV & Decoder', wattage: 150, quantity: 1, dailyRuntimeHours: 6, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'laptops', name: 'Laptops & Phones', wattage: 65, quantity: 2, dailyRuntimeHours: 8, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true }
    ]
  },
  {
    id: 'standard',
    name: '3kVA Standard System',
    kva: '3kVA / 24V',
    battery: '1x 5.0kWh Lithium Battery',
    panels: '4x 450W Panels',
    costMin: 2200000,
    costMax: 3000000,
    description: 'Best for standard 3-bedroom family houses. Comfortably runs double-door refrigerators, chest freezers, fans, water pumping, and lighting.',
    appliances: [
      { id: 'led_lights', name: 'LED Bulbs / Lights', wattage: 15, quantity: 10, dailyRuntimeHours: 8, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'standing_fans', name: 'Standing or Ceiling Fans', wattage: 75, quantity: 4, dailyRuntimeHours: 12, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'led_tv', name: 'Smart TV & Decoder', wattage: 150, quantity: 2, dailyRuntimeHours: 6, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'laptops', name: 'Laptops & Phones', wattage: 65, quantity: 3, dailyRuntimeHours: 8, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'standard_fridge', name: 'Double-Door Refrigerator', wattage: 250, quantity: 1, dailyRuntimeHours: 24, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'deep_freezer', name: 'Deep Chest Freezer', wattage: 350, quantity: 1, dailyRuntimeHours: 24, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true }
    ]
  },
  {
    id: 'premium',
    name: '5kVA Premium System',
    kva: '5kVA / 48V',
    battery: '2x 5.0kWh Lithium (10kWh)',
    panels: '8x 450W Panels',
    costMin: 4200000,
    costMax: 5500000,
    description: 'Perfect for executive duplex homes or small offices. Runs 1x Inverter AC, pump, chest freezer, microwave, lighting, and heavy desktop loads.',
    appliances: [
      { id: 'led_lights', name: 'LED Bulbs / Lights', wattage: 15, quantity: 15, dailyRuntimeHours: 8, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'standing_fans', name: 'Standing or Ceiling Fans', wattage: 75, quantity: 5, dailyRuntimeHours: 12, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'led_tv', name: 'Smart TV & Decoder', wattage: 150, quantity: 3, dailyRuntimeHours: 6, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'laptops', name: 'Laptops & Phones', wattage: 65, quantity: 4, dailyRuntimeHours: 8, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'standard_fridge', name: 'Double-Door Refrigerator', wattage: 250, quantity: 1, dailyRuntimeHours: 24, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'deep_freezer', name: 'Deep Chest Freezer', wattage: 350, quantity: 1, dailyRuntimeHours: 24, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: true },
      { id: 'inverter_ac', name: '1.5HP Inverter AC', wattage: 900, quantity: 1, dailyRuntimeHours: 6, isInductive: true, loadType: 'heavy', isIncludedInBackup: true, simultaneousStart: true }
    ]
  }
];

export default function StartSimplePage() {
  const router = useRouter();
  const wizard = useWizardStore();
  const [selectedPkgId, setSelectedPkgId] = React.useState<string>('standard');

  const selectedPkg = React.useMemo(() => {
    return QUICK_PACKAGES.find(p => p.id === selectedPkgId) || QUICK_PACKAGES[1];
  }, [selectedPkgId]);

  const handleConvert = () => {
    // 1. Reset wizard
    wizard.reset();

    // 2. Pre-fill wizard store with package appliances and config parameters
    wizard.updateProposal({
      appliances: selectedPkg.appliances,
      selected_tier: selectedPkgId === 'starter' ? 'budget' : selectedPkgId === 'premium' ? 'premium' : 'standard',
      nepa_daily_hours: 8,
      backup_hours: 10,
      customer_name: 'Quick Lead - ' + selectedPkg.kva
    });

    // 3. Route installer to proposal creation route
    router.push('/proposals/new?type=quick');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ═══ Top Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarPro</span>
            <Badge className="bg-emerald-500/10 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shrink-0">Field shortcut</Badge>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/workspace">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-655 hover:bg-slate-100 dark:text-slate-350">
                Workspace Dashboard
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Main Area ═══ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        
        {/* Title */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Rapid Field Quoting
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-850 dark:text-slate-50">
            Start Simple: Installer Quick Sizer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto leading-relaxed font-medium">
            Select a standard solar package sizing profile below during customer site walkthroughs. Refine appliances instantly and convert straight into a full proposal.
          </p>
        </section>

        {/* Package Tabs */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_PACKAGES.map((pkg) => {
            const isSelected = selectedPkgId === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`p-5 rounded-3xl text-left border transition-all duration-200 flex flex-col justify-between gap-4 h-full relative ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-teal-500/40 ring-4 ring-teal-500/5 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 flex size-5 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-xs shadow-sm">
                    <Check className="w-3 h-3" />
                  </span>
                )}
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Package Profile</span>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{pkg.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-3">{pkg.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 w-full">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Estimated Budget</span>
                  <span className="font-mono font-black text-sm text-teal-650 dark:text-teal-400 block mt-0.5">
                    ₦{(pkg.costMin / 1000000).toFixed(1)}M - ₦{(pkg.costMax / 1000000).toFixed(1)}M
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Selected Package Details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-3xl shadow-sm">
          {/* Sizing outputs */}
          <div className="space-y-6">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-teal-600" /> Sizing Specifications
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-2xl">🛠️</span>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inverter Size</p>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-100 mt-0.5">{selectedPkg.kva}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-2xl">🔋</span>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Battery Spec</p>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-100 mt-0.5">{selectedPkg.battery}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-2xl">☀️</span>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Solar Panels Spec</p>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-100 mt-0.5">{selectedPkg.panels}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Included Appliances list */}
          <div className="space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <SlidersHorizontal className="w-5 h-5 text-teal-650" /> Included Default Loads
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedPkg.appliances.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{app.name}</span>
                    <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 text-[10px] font-black">
                      Qty: {app.quantity} ({app.wattage}W)
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Trigger Button */}
            <Button
              onClick={handleConvert}
              size="lg"
              className="w-full bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black text-sm h-12 shadow-md flex items-center justify-center gap-2 mt-4"
            >
              <FolderSync className="w-4 h-4" /> Convert to Full Proposal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* Small installer note */}
        <div className="p-4 bg-teal-500/5 border border-teal-500/15 rounded-2xl text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2 max-w-2xl mx-auto leading-relaxed">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            <strong>Pro Tip:</strong> converting this quick sizing profile immediately saves the hardware components and appliance quantities in your local state memory. The full proposal wizard will auto-fill these values so you can jump straight to customizing your customer markup, VAT, labor expenses, and client-specific logo templates.
          </span>
        </div>

      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 bg-white dark:bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <p>© <CopyrightYear /> SolarPro Shortcut Layer</p>
          <Link href="/workspace" className="text-teal-655 font-bold hover:underline">
            Open Installer Workspace
          </Link>
        </div>
      </footer>
    </div>
  );
}
