'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Lightbulb, Wind, Refrigerator, Monitor, ShieldCheck,
  Plus, Minus, Search, Zap, AlertTriangle, PlusCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { useWizardStore, InputAppliance } from '@/store/wizardStore';
import { useUiStore } from '@/store/uiStore';
import { calculateDailyLoad, calculateInverterSize } from '@/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const MOCK_APPLIANCES = [
  { id: '1', name: '1.5HP Inverter Split AC', default_wattage: 1050, is_inductive: true, load_type: 'heavy' },
  { id: '2', name: '1HP Standing Fan', default_wattage: 75, is_inductive: false, load_type: 'essential' },
  { id: '3', name: 'Chest Freezer (200L)', default_wattage: 150, is_inductive: true, load_type: 'essential' },
  { id: '4', name: 'Upright Fridge', default_wattage: 120, is_inductive: true, load_type: 'essential' },
  { id: '5', name: '43" LED TV', default_wattage: 80, is_inductive: false, load_type: 'essential' },
  { id: '6', name: 'Wi-Fi Router', default_wattage: 12, is_inductive: false, load_type: 'essential' },
  { id: '7', name: 'LED Bulb (9W)', default_wattage: 9, is_inductive: false, load_type: 'essential' },
  { id: '8', name: 'Laptop/Charger', default_wattage: 65, is_inductive: false, load_type: 'essential' },
  { id: '9', name: '0.75HP Submersible Pump', default_wattage: 550, is_inductive: true, load_type: 'heavy' },
  { id: '10', name: 'Microwave (800W)', default_wattage: 800, is_inductive: false, load_type: 'heavy' },
  { id: '11', name: 'DSTV Decoder', default_wattage: 15, is_inductive: false, load_type: 'essential' },
  { id: '12', name: 'CCTV DVR (4-ch)', default_wattage: 20, is_inductive: false, load_type: 'essential' },
];

// ── Types ──────────────────────────────────────────────────────────────────
interface ApplianceRow {
  id: string;
  name: string;
  default_wattage: number;
  is_inductive: boolean;
  load_type: 'essential' | 'heavy';
  group: string;
}



const customAppSchema = z.object({
  name: z.string().min(1, 'Name required'),
  wattage: z.number().int().positive().max(20000, 'Max 20,000 W'),
  loadType: z.enum(['essential', 'heavy']),
  isInductive: z.boolean(),
});

type CustomAppForm = z.infer<typeof customAppSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────
const GROUP_ICONS: Record<string, React.ReactNode> = {
  Lighting: <Lightbulb className="w-5 h-5" />,
  Cooling: <Wind className="w-5 h-5" />,
  Kitchen: <Refrigerator className="w-5 h-5" />,
  Office: <Monitor className="w-5 h-5" />,
  Security: <ShieldCheck className="w-5 h-5" />,
};

const GROUPS = ['All', 'Lighting', 'Cooling', 'Kitchen', 'Office', 'Security'];

function inferGroup(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('bulb') || n.includes('light') || n.includes('lamp')) return 'Lighting';
  if (n.includes('ac') || n.includes('fan') || n.includes('air')) return 'Cooling';
  if (n.includes('fridge') || n.includes('freezer') || n.includes('microwave') || n.includes('iron')) return 'Kitchen';
  if (n.includes('tv') || n.includes('laptop') || n.includes('router') || n.includes('dstv') || n.includes('wi-fi')) return 'Office';
  if (n.includes('cctv') || n.includes('pump') || n.includes('security')) return 'Security';
  return 'Office';
}

const DEFAULT_ROWS: ApplianceRow[] = MOCK_APPLIANCES.map((r) => ({
  id: r.id,
  name: r.name,
  default_wattage: r.default_wattage,
  is_inductive: r.is_inductive,
  load_type: r.load_type as 'essential' | 'heavy',
  group: inferGroup(r.name),
}));

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ── Main Component ─────────────────────────────────────────────────────────
export default function Step1Appliances({ onNext }: { onNext: () => void }) {
  const { proposal, updateProposal, setStep } = useWizardStore();
  const { fieldMode } = useUiStore();
  const [library, setLibrary] = useState<ApplianceRow[]>(DEFAULT_ROWS);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [showCustom, setShowCustom] = useState(false);
  const [formError, setFormError] = useState('');

  // Local qty+hours map for grid controls
  const [localState, setLocalState] = useState<
    Record<string, { qty: number; hours: number }>
  >(() => {
    const map: Record<string, { qty: number; hours: number }> = {};
    DEFAULT_ROWS.forEach((r) => {
      const existing = proposal.appliances.find((a) => a.applianceId === r.id);
      map[r.id] = { qty: existing?.quantity ?? 0, hours: existing?.dailyRuntimeHours ?? 4 };
    });
    return map;
  });

  // ── Fetch library ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('appliances').select('*');
        if (!error && data?.length) {
          const rows = data.map((r: { id: string; name: string; default_wattage: number; is_inductive: boolean; load_type: string }) => ({
            id: r.id,
            name: r.name,
            default_wattage: r.default_wattage,
            is_inductive: r.is_inductive,
            load_type: r.load_type as 'essential' | 'heavy',
            group: inferGroup(r.name),
          })) as ApplianceRow[];
          
          setLibrary(rows);
          
          setLocalState((prev) => {
            const map = { ...prev };
            rows.forEach((r) => {
              if (map[r.id] === undefined) {
                const existing = proposal.appliances.find((a) => a.applianceId === r.id);
                map[r.id] = { qty: existing?.quantity ?? 0, hours: existing?.dailyRuntimeHours ?? 4 };
              }
            });
            return map;
          });
        }
      } catch {
        // Fall back gracefully to DEFAULT_ROWS already loaded in library/localState
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filtered library ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return library.filter((a) => {
      const matchGroup = activeTab === 'All' || a.group === activeTab;
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [library, activeTab, search]);

  // ── Sync local state → store appliances ───────────────────────────────
  useEffect(() => {
    const active: InputAppliance[] = library
      .filter((r) => (localState[r.id]?.qty ?? 0) > 0)
      .map((r) => ({
        id: r.id,
        applianceId: r.id,
        name: r.name,
        wattage: r.default_wattage,
        quantity: localState[r.id]?.qty ?? 1,
        dailyRuntimeHours: localState[r.id]?.hours ?? 4,
        isInductive: r.is_inductive,
        loadType: r.load_type,
        isIncludedInBackup: r.load_type === 'essential',
        simultaneousStart: false,
      }));

    // Merge with custom appliances (those without an applianceId in the library)
    const customs = proposal.appliances.filter((a) => !a.applianceId || !library.find((l) => l.id === a.applianceId));
    updateProposal({ appliances: [...active, ...customs] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localState]);

  // ── Live calculations ──────────────────────────────────────────────────
  const liveCalc = useMemo(() => {
    const daily = calculateDailyLoad(proposal.appliances);
    const inverter = calculateInverterSize(proposal.appliances, daily.pContinuous);
    return {
      ...daily,
      peakSurgeWatts: inverter.peakSurgeWatts,
    };
  }, [proposal.appliances]);

  // ── Qty / Hours helpers ────────────────────────────────────────────────
  const setQty = (id: string, delta: number) => {
    setLocalState((prev) => {
      const cur = prev[id]?.qty ?? 0;
      const next = Math.max(0, Math.min(20, cur + delta));
      return { ...prev, [id]: { qty: next, hours: prev[id]?.hours ?? 4 } };
    });
  };

  const setHours = (id: string, val: number) => {
    setLocalState((prev) => ({
      ...prev,
      [id]: { qty: prev[id]?.qty ?? 0, hours: val },
    }));
  };

  // ── Custom appliance form ──────────────────────────────────────────────
  const customForm = useForm<CustomAppForm>({
    resolver: zodResolver(customAppSchema),
    defaultValues: { name: '', wattage: 100, loadType: 'essential', isInductive: false },
  });

  const addCustom = (data: CustomAppForm) => {
    const newApp: InputAppliance = {
      id: uuidv4(),
      name: data.name,
      wattage: data.wattage,
      quantity: 1,
      dailyRuntimeHours: 4,
      isInductive: data.isInductive,
      loadType: data.loadType,
      isIncludedInBackup: data.loadType === 'essential',
      simultaneousStart: false,
    };
    updateProposal({ appliances: [...proposal.appliances, newApp] });
    customForm.reset();
    setShowCustom(false);
  };

  // ── Step navigation ────────────────────────────────────────────────────
  const handleNext = () => {
    if (proposal.appliances.length === 0) {
      setFormError('Please add at least one appliance before continuing.');
      return;
    }
    setFormError('');
    setStep(2);
    onNext();
  };

  // ── Chart data ─────────────────────────────────────────────────────────
  const chartData = [
    { name: 'Essential', value: liveCalc.essentialDailyWh / 1000, fill: '#01696f' },
    { name: 'Heavy', value: (liveCalc.totalDailyWh - liveCalc.essentialDailyWh) / 1000, fill: '#da7101' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── LEFT: Appliance Grid ── */}
      <div className="flex-1 min-w-0">
        {/* Search + Add Custom */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search appliances…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCustom(true)}>
            <PlusCircle className="w-4 h-4 mr-1" /> Custom
          </Button>
        </div>

        {/* Lagos Load Presets Quick-Add Tray */}
        <div className="mb-6 p-4 rounded-xl border border-teal-500/20 bg-teal-50/20 dark:border-teal-500/10 dark:bg-teal-950/10">
          <p className="text-xs font-semibold text-teal-800 dark:text-teal-400 mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-teal-600 dark:fill-teal-400 text-teal-600 dark:text-teal-400" />
            Quick-Add Typical Lagos Loads
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: '📺 LED TV', defaultId: '5', watts: 80, hours: 6, inductive: false, type: 'essential' },
              { label: '🥶 Fridge/Freezer', defaultId: '3', watts: 250, hours: 24, inductive: true, type: 'essential' },
              { label: '💨 Standing Fan', defaultId: '2', watts: 60, hours: 10, inductive: true, type: 'essential' },
              { label: '💻 Laptop', defaultId: '8', watts: 90, hours: 8, inductive: false, type: 'essential' },
              { label: '❄️ 1.5HP AC', defaultId: '1', watts: 1200, hours: 8, inductive: true, type: 'heavy' },
              { label: '🚰 Water Pump', defaultId: '9', watts: 750, hours: 1, inductive: true, type: 'heavy' },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="justify-start text-xs py-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50/20 text-slate-800 dark:text-slate-200"
                onClick={() => {
                  setLocalState(prev => {
                    const currentVal = prev[preset.defaultId] || { qty: 0, hours: preset.hours };
                    return {
                      ...prev,
                      [preset.defaultId]: {
                        qty: currentVal.qty + 1,
                        hours: preset.hours
                      }
                    };
                  });
                }}
              >
                <Plus className="w-3 h-3 mr-1 text-teal-600" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto mb-4">
            {GROUPS.map((g) => (
              <TabsTrigger key={g} value={g} className="text-xs px-3 py-1">
                {GROUP_ICONS[g] && <span className="mr-1">{GROUP_ICONS[g]}</span>}
                {g}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            <div className={fieldMode ? "flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1" : "grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1"}>
              {filtered.map((app) => {
                const qty = localState[app.id]?.qty ?? 0;
                const hours = localState[app.id]?.hours ?? 4;
                const active = qty > 0;
                return (
                  <div
                    key={app.id}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      active ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm leading-tight">{app.name}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{app.default_wattage}W</Badge>
                          {app.is_inductive && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                              <Zap className="w-3 h-3 mr-0.5" /> Surge
                            </Badge>
                          )}
                          {app.load_type === 'heavy' && (
                            <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-300">Heavy</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-muted-foreground">{GROUP_ICONS[app.group]}</span>
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setQty(app.id, -1)}
                        className={`${fieldMode ? 'w-12 h-12' : 'w-7 h-7'} rounded-full border flex items-center justify-center hover:bg-muted transition-colors shrink-0`}
                        aria-label="Decrease quantity"
                      >
                        <Minus className={fieldMode ? 'w-5 h-5' : 'w-3 h-3'} />
                      </button>
                      <span className={`text-center font-semibold ${fieldMode ? 'w-10 text-xl' : 'w-6 text-sm'}`}>{qty}</span>
                      <button
                        onClick={() => setQty(app.id, 1)}
                        className={`${fieldMode ? 'w-12 h-12' : 'w-7 h-7'} rounded-full border flex items-center justify-center hover:bg-muted transition-colors shrink-0`}
                        aria-label="Increase quantity"
                      >
                        <Plus className={fieldMode ? 'w-5 h-5' : 'w-3 h-3'} />
                      </button>
                      <span className="text-xs text-muted-foreground ml-1">units</span>
                    </div>

                    {/* Hours slider or large inputs — only show when qty > 0 */}
                    {qty > 0 && (
                      <div className={fieldMode ? "mt-4" : ""}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Daily usage</span>
                          {!fieldMode && <span className="font-medium text-foreground">{hours} hrs/day</span>}
                        </div>
                        {fieldMode ? (
                          <div className="flex items-center gap-2">
                            <button
                              title="Decrease daily usage hours"
                              aria-label="Decrease daily usage hours"
                              onClick={() => setHours(app.id, Math.max(0.5, hours - 0.5))}
                              className="w-12 h-12 rounded-xl border flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 shrink-0"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <Input
                              type="number"
                              className="h-12 text-center text-lg font-bold"
                              value={hours}
                              onChange={(e) => setHours(app.id, parseFloat(e.target.value) || 0)}
                            />
                            <button
                              title="Increase daily usage hours"
                              aria-label="Increase daily usage hours"
                              onClick={() => setHours(app.id, Math.min(24, hours + 0.5))}
                              className="w-12 h-12 rounded-xl border flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 shrink-0"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <Slider
                            min={0.5}
                            max={24}
                            step={0.5}
                            value={[hours]}
                            onValueChange={(val) => setHours(app.id, Array.isArray(val) ? val[0] : val)}
                            className="[&_.slider-thumb]:bg-teal-600"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <p className="col-span-2 text-center text-muted-foreground py-8 text-sm">
                  No appliances found. Try a different search or add a custom one.
                </p>
              )}
            </div>

            {/* Custom appliances list */}
            {proposal.appliances.filter((a) => !a.applianceId).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Custom Added</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proposal.appliances
                    .filter((a) => !a.applianceId)
                    .map((a) => (
                      <div key={a.id} className="rounded-xl border-2 border-teal-500 bg-teal-50/30 p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{a.name}</p>
                          <Badge variant="secondary" className="text-xs mt-1">{a.wattage}W</Badge>
                        </div>
                        <button
                          onClick={() =>
                            updateProposal({ appliances: proposal.appliances.filter((x) => x.id !== a.id) })
                          }
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {formError && (
          <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> {formError}
          </p>
        )}

        <Button onClick={handleNext} className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white">
          Next: System Preferences →
        </Button>
      </div>

      {/* ── RIGHT: Live Sidebar ── */}
      {(!fieldMode || proposal.appliances.length > 0) && (
        <div className="lg:w-72 xl:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-6 rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-base">Live Load Summary</h3>

            {liveCalc.peakSurgeWatts > 10000 && (
              <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Very high load — commercial system sizing recommended.</span>
              </div>
            )}

            <div className="space-y-3">
              {[
                { label: 'Total Daily Load', value: `${fmt(liveCalc.totalDailyWh / 1000)} kWh` },
                { label: 'Essential Load', value: `${fmt(liveCalc.essentialDailyWh / 1000)} kWh`, sub: 'Used for battery sizing' },
                { label: 'Peak Running Load', value: `${fmt(liveCalc.pContinuous / 1000)} kW` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    {item.sub && <p className="text-xs text-muted-foreground/70">{item.sub}</p>}
                  </div>
                  <p className="font-semibold text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            {(!fieldMode && proposal.appliances.length > 0) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Load breakdown</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" unit=" kWh" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
                    <Tooltip formatter={(v: unknown) => [`${Number(v as string | number).toFixed(2)} kWh`]} />
                    <Bar dataKey="value" radius={4}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">
                {proposal.appliances.length} appliance{proposal.appliances.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Appliance Dialog ── */}
      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Appliance</DialogTitle>
          </DialogHeader>
          <form onSubmit={customForm.handleSubmit(addCustom)} className="space-y-4">
            <div>
              <Label htmlFor="c-name">Appliance Name</Label>
              <Input id="c-name" {...customForm.register('name')} placeholder="e.g. Water Dispenser" className="mt-1" />
              {customForm.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">{customForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="c-watt">Wattage (W)</Label>
              <Input
                id="c-watt"
                type="number"
                {...customForm.register('wattage', { valueAsNumber: true })}
                placeholder="e.g. 100"
                className="mt-1"
              />
              {customForm.formState.errors.wattage && (
                <p className="text-red-500 text-xs mt-1">{customForm.formState.errors.wattage.message}</p>
              )}
            </div>
            <div>
              <Label>Load Type</Label>
              <div className="flex gap-3 mt-1">
                {(['essential', 'heavy'] as const).map((lt) => (
                  <label key={lt} className="flex items-center gap-2 cursor-pointer capitalize">
                    <input type="radio" value={lt} {...customForm.register('loadType')} />
                    <span className="text-sm">{lt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="c-inductive" {...customForm.register('isInductive')} />
              <Label htmlFor="c-inductive" className="cursor-pointer">
                Inductive load (motor / compressor) — has startup surge
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCustom(false)}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Add Appliance</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
