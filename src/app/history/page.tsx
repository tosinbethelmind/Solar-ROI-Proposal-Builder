'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHistoryStore, SavedProposal } from '@/store/historyStore';
import { useWizardStore } from '@/store/wizardStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

/* ─── Helpers ───────────────────────────────────────────────── */

function formatCurrency(n: number) {
  return '₦' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function tierLabel(tier: string) {
  if (tier === 'budget') return 'Economy';
  if (tier === 'standard') return 'Standard';
  if (tier === 'premium') return 'Premium';
  return tier;
}

function tierColor(tier: string) {
  if (tier === 'budget') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
  if (tier === 'premium') return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
  return 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400';
}

export default function HistoryPage() {
  const router = useRouter();
  const { savedProposals, deleteProposal, updatePipelineStatus } = useHistoryStore();
  const { updateProposal, setCalculations, setStep, reset } = useWizardStore();
  const { checkAccess, openUpgradeModal } = useSubscriptionStore();
  const [mounted, setMounted] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'list' | 'pipeline'>('list');

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLoad = (item: SavedProposal) => {
    router.push(`/proposals/new?load=${item.id}`);
  };

  const handlePrint = (id: string) => {
    router.push(`/proposals/print?id=${id}`);
  };

  const crmAccess = checkAccess('crmPipeline');
  const isCrmLocked = !crmAccess.unlocked;

  const columns = [
    { id: 'new', title: '🆕 New Lead', color: 'bg-blue-500/10 text-blue-500 dark:text-blue-400' },
    { id: 'sent', title: '📄 Proposal Sent', color: 'bg-amber-500/10 text-amber-500 dark:text-amber-400' },
    { id: 'negotiating', title: '💬 Negotiating', color: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' },
    { id: 'closed', title: '✅ Closed / Won', color: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' },
    { id: 'lost', title: '❌ Lost / Cancelled', color: 'bg-rose-500/10 text-rose-500 dark:text-rose-400' },
  ] as const;

  const placeholderProposals: SavedProposal[] = [
    {
      id: 'placeholder-1',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      proposal: {
        customer_name: 'Aliko Dangote Villa System',
        selected_tier: 'premium',
        final_quoted_price_ngn: 18500000,
        appliances: []
      } as any,
      calculations: {
        inverterKva: 15,
        batteryBankCapacityKwh: 30,
        panelCount: 36,
        panelTotalWp: 19800,
        batteryTotalUnits: 6,
        batteryUnitAh: 200,
        batteryUnitVoltage: 48,
        inverterBrand: 'Victron Energy',
        batteryBrand: 'BYD Premium',
        panelBrand: 'Jinko Solar'
      } as any,
      pipelineStatus: 'new'
    },
    {
      id: 'placeholder-2',
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 172800000,
      proposal: {
        customer_name: 'Lekki Phase 1 Residential',
        selected_tier: 'standard',
        final_quoted_price_ngn: 5200000,
        appliances: []
      } as any,
      calculations: {
        inverterKva: 5,
        batteryBankCapacityKwh: 10,
        panelCount: 12,
        panelTotalWp: 6600,
        batteryTotalUnits: 2,
        batteryUnitAh: 200,
        batteryUnitVoltage: 48,
        inverterBrand: 'Growatt',
        batteryBrand: 'Felicity Lithium',
        panelBrand: 'JA Solar'
      } as any,
      pipelineStatus: 'sent'
    },
    {
      id: 'placeholder-3',
      createdAt: Date.now() - 259200000,
      updatedAt: Date.now() - 259200000,
      proposal: {
        customer_name: 'Ikeja Office Back-up Grid',
        selected_tier: 'premium',
        final_quoted_price_ngn: 9800000,
        appliances: []
      } as any,
      calculations: {
        inverterKva: 10,
        batteryBankCapacityKwh: 20,
        panelCount: 24,
        panelTotalWp: 13200,
        batteryTotalUnits: 4,
        batteryUnitAh: 200,
        batteryUnitVoltage: 48,
        inverterBrand: 'Victron Energy',
        batteryBrand: 'Felicity Lithium',
        panelBrand: 'Trina Solar'
      } as any,
      pipelineStatus: 'negotiating'
    },
    {
      id: 'placeholder-4',
      createdAt: Date.now() - 345600000,
      updatedAt: Date.now() - 345600000,
      proposal: {
        customer_name: 'Eko Atlantic Penthouse',
        selected_tier: 'premium',
        final_quoted_price_ngn: 24500000,
        appliances: []
      } as any,
      calculations: {
        inverterKva: 20,
        batteryBankCapacityKwh: 40,
        panelCount: 48,
        panelTotalWp: 26400,
        batteryTotalUnits: 8,
        batteryUnitAh: 200,
        batteryUnitVoltage: 48,
        inverterBrand: 'Victron Energy',
        batteryBrand: 'BYD Premium',
        panelBrand: 'Longi Solar'
      } as any,
      pipelineStatus: 'closed'
    }
  ];

  const activeProposals = isCrmLocked ? placeholderProposals : savedProposals;

  const handleStatusChange = (id: string, newStatus: typeof columns[number]['id']) => {
    if (isCrmLocked) {
      openUpgradeModal('crmPipeline');
      return;
    }
    updatePipelineStatus(id, newStatus);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-bold text-base tracking-tight">SolarPro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Proposal History & Leads</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and access all your saved proposals, and track your deal conversions.</p>
          </div>
          <Button 
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/10"
            onClick={() => {
              reset();
              router.push('/proposals/new');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            New Proposal
          </Button>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold pt-2">
          <button
            onClick={() => setViewMode('list')}
            className={`pb-3 relative transition-all ${viewMode === 'list' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400' : 'text-muted-foreground'}`}
          >
            📋 Proposals List
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`pb-3 relative transition-all flex items-center gap-1.5 ${viewMode === 'pipeline' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400' : 'text-muted-foreground'}`}
          >
            📊 Lead Pipeline Kanban
            {isCrmLocked && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 text-teal-650 bg-teal-50 dark:bg-teal-950 dark:text-teal-400 uppercase tracking-widest font-black">Business</Badge>
            )}
          </button>
        </div>

        {viewMode === 'list' ? (
          savedProposals.length === 0 ? (
            /* Empty State */
            <Card className="border-dashed bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-650 dark:bg-teal-950/30 dark:text-teal-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </div>
                <h3 className="text-lg font-bold mb-1">No saved proposals yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  All proposals you finalize are automatically saved locally on your device so you can view, edit, or print them even when offline.
                </p>
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  onClick={() => {
                    reset();
                    router.push('/proposals/new');
                  }}
                >
                  Create First Proposal
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Table Layout */
            <Card className="overflow-hidden border bg-card/30">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-4 px-6 font-semibold">Proposal Name</TableHead>
                      <TableHead className="py-4 px-4 font-semibold">Customer</TableHead>
                      <TableHead className="py-4 px-4 font-semibold">System Size</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-right">Quoted Price</TableHead>
                      <TableHead className="py-4 px-4 font-semibold">Date Created</TableHead>
                      <TableHead className="py-4 px-6 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedProposals.map((item) => {
                      const customerName = item.proposal.customer_name || 'Unnamed Client';
                      const proposalTitle = `${tierLabel(item.proposal.selected_tier)} Sized System`;
                      const sizeKva = item.calculations?.inverterKva;
                      const quotedPrice = item.proposal.final_quoted_price_ngn;
                      
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          {/* Proposal Name */}
                          <TableCell className="py-4 px-6 font-medium">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-sm">{proposalTitle}</span>
                              <Badge className={`w-fit text-[10px] px-2 py-0.5 rounded-full uppercase ${tierColor(item.proposal.selected_tier)}`}>
                                {tierLabel(item.proposal.selected_tier)}
                              </Badge>
                            </div>
                          </TableCell>
                          
                          {/* Customer */}
                          <TableCell className="py-4 px-4">
                            <span className="text-sm font-medium">{customerName}</span>
                          </TableCell>
                          
                          {/* System Size */}
                          <TableCell className="py-4 px-4 text-sm font-medium">
                            {sizeKva ? `${sizeKva} kVA` : 'Not Sized'}
                          </TableCell>
                          
                          {/* Quoted Price */}
                          <TableCell className="py-4 px-4 text-sm font-bold text-right tabular-nums">
                            {quotedPrice ? formatCurrency(quotedPrice) : '₦0'}
                          </TableCell>
                          
                          {/* Date Created */}
                          <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="text-xs bg-teal-600/10 text-teal-650 hover:bg-teal-600/20 dark:text-teal-400 dark:bg-teal-400/10 dark:hover:bg-teal-400/20"
                                onClick={() => handleLoad(item)}
                              >
                                Open
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => handlePrint(item.id)}
                              >
                                Download PDF
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="text-xs"
                                onClick={() => deleteProposal(item.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )
        ) : (
          /* CRM Lead Pipeline View */
          <div className="relative border rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 p-6 min-h-[500px] overflow-hidden">
            {/* Lock Overlay */}
            {isCrmLocked && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-8 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-[6px] rounded-2xl text-center">
                <div className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                  {/* Elegant glowing background rings */}
                  <div className="absolute -top-12 -left-12 size-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-12 -right-12 size-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-650 dark:text-teal-400 mb-5 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  
                  <h3 className="text-xl font-extrabold tracking-tight mb-2">Unlock Lead Pipeline CRM</h3>
                  <Badge className="bg-teal-600/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400 font-extrabold text-[10px] tracking-wider uppercase mb-4 px-3 py-1 rounded-full border border-teal-500/20">
                    Business Tier Feature
                  </Badge>
                  
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    Stop losing deals to WhatsApp DM clutter. Organize your Lagos solar clients, track active proposal follow-ups, and move won deals into installation with our custom drag-and-drop solar pipeline.
                  </p>
                  
                  <Button
                    onClick={() => openUpgradeModal('crmPipeline')}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm py-5 shadow-lg shadow-teal-600/20 rounded-xl"
                  >
                    Upgrade to Business Tier ⚡
                  </Button>
                </div>
              </div>
            )}

            {/* Kanban Columns Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${isCrmLocked ? 'opacity-40 blur-sm pointer-events-none select-none' : ''}`}>
              {columns.map((col) => {
                const colProposals = activeProposals.filter(p => (p.pipelineStatus || 'new') === col.id);
                
                return (
                  <div key={col.id} className="flex flex-col bg-slate-100/60 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/40 min-h-[400px]">
                    <div className="flex items-center justify-between pb-2.5 border-b mb-3 border-slate-200 dark:border-slate-800">
                      <span className={`text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full ${col.color}`}>
                        {col.title}
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">
                        {colProposals.length}
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] scrollbar-none">
                      {colProposals.length === 0 ? (
                        <div className="h-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-medium italic">
                          No leads here
                        </div>
                      ) : (
                        colProposals.map((item) => {
                          const customerName = item.proposal.customer_name || 'Unnamed Client';
                          const sizeKva = item.calculations?.inverterKva;
                          const quotedPrice = item.proposal.final_quoted_price_ngn;
                          
                          return (
                            <div 
                              key={item.id} 
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3 hover:shadow-md transition-shadow relative group"
                            >
                              <div className="space-y-1">
                                <h4 className="font-bold text-xs truncate pr-4 text-slate-800 dark:text-slate-200">
                                  {customerName}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  <span>{sizeKva ? `${sizeKva} kVA` : 'No Size'}</span>
                                  <span>•</span>
                                  <span className={tierColor(item.proposal.selected_tier)}>
                                    {tierLabel(item.proposal.selected_tier)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="font-extrabold text-[11px] text-teal-650 dark:text-teal-400">
                                  {quotedPrice ? formatCurrency(quotedPrice) : '₦0'}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold">
                                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              
                              {/* Interactive Status Changer / Action Row */}
                              <div className="flex items-center justify-between gap-1 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-1.5 text-[9px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700/80 font-bold"
                                  onClick={() => handleLoad(item)}
                                >
                                  Open
                                </Button>
                                
                                {/* Move stage buttons */}
                                <div className="flex items-center gap-0.5">
                                  {col.id !== 'new' && (
                                    <button
                                      type="button"
                                      className="size-5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-650"
                                      onClick={() => {
                                        const idx = columns.findIndex(c => c.id === col.id);
                                        handleStatusChange(item.id, columns[idx - 1].id);
                                      }}
                                      title="Move back"
                                    >
                                      ◀
                                    </button>
                                  )}
                                  {col.id !== 'lost' && (
                                    <button
                                      type="button"
                                      className="size-5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-650"
                                      onClick={() => {
                                        const idx = columns.findIndex(c => c.id === col.id);
                                        handleStatusChange(item.id, columns[idx + 1].id);
                                      }}
                                      title="Move forward"
                                    >
                                      ▶
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} SolarPro — Built for Nigerian Installers</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Offline-ready PWA
          </p>
        </div>
      </footer>
    </div>
  );
}
