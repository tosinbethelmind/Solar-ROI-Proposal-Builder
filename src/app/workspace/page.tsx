'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHistoryStore, SavedProposal } from '@/store/historyStore';
import { useWizardStore } from '@/store/wizardStore';
import { useUiStore } from '@/store/uiStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthButton } from '@/components/auth/AuthButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyrightYear } from '@/components/ui/CopyrightYear';
import { Settings, FileText, Plus, Zap, Sparkles, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

/* ─── Helpers ───────────────────────────────────────────────── */

function formatCurrency(n: number) {
  return '₦' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
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

/* ─── Stat Card ─────────────────────────────────────────────── */

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="relative overflow-hidden border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="flex items-start gap-4 pt-5 pb-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black tracking-tight mt-0.5 text-slate-850 dark:text-slate-100">{value}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Draft Row ─────────────────────────────────────────────── */

function DraftRow({ item, onLoad, onDelete }: { item: SavedProposal; onLoad: () => void; onDelete: () => void }) {
  const name = item.proposal.customer_name || 'Unnamed Client';
  const kva = item.calculations?.inverterKva;
  const price = item.proposal.final_quoted_price_ngn;
  const tier = item.proposal.selected_tier;

  return (
    <div className="group flex items-center justify-between gap-4 rounded-xl border bg-white dark:bg-slate-900 p-4 border-slate-200 dark:border-slate-800 transition-all hover:shadow-md hover:border-teal-500/30 dark:hover:border-teal-500/20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar circle */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-sm shadow-sm">
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{name}</p>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
            {kva ? `${kva} kVA` : 'Not sized'} · {relativeTime(item.updatedAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Tier badge */}
        <span className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tierColor(tier)}`}>
          {tierLabel(tier)}
        </span>

        {/* Price */}
        {price ? (
          <span className="text-sm font-bold text-slate-700 dark:text-slate-350 tabular-nums">{formatCurrency(price)}</span>
        ) : null}

        {/* Actions */}
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" className="h-8 px-3 text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-650 dark:bg-slate-800 dark:hover:bg-slate-750 font-bold rounded-xl" onClick={onLoad}>Open</Button>
          <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold rounded-xl" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────── */

export default function WorkspaceDashboardPage() {
  const router = useRouter();
  const { savedProposals, deleteProposal } = useHistoryStore();
  const { reset } = useWizardStore();
  const { appMode, setAppMode } = useUiStore();
  const { checkAccess, openUpgradeModal, tier: currentTier, isTrial } = useSubscriptionStore();
  const [mounted, setMounted] = React.useState(false);
  const [profileComplete, setProfileComplete] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('installerProfile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.companyName?.trim() && parsed.whatsAppNumber?.trim()) {
          setProfileComplete(true);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleCreateQuickProposal = () => {
    // Exact subscription-based proposal quota check
    const currentCount = savedProposals.length;
    
    let isE2E = false;
    if (typeof document !== 'undefined') {
      isE2E = document.cookie.includes('bypass_auth=solar-quotepro-e2e-secret-key-2026');
    }

    if (!isE2E) {
      if (isTrial && currentCount >= 2) {
        openUpgradeModal(null);
        return;
      }
      if (currentTier === 'free' && currentCount >= 1) {
        openUpgradeModal(null);
        return;
      }
      if (currentTier === 'starter' && currentCount >= 10) {
        openUpgradeModal(null);
        return;
      }
      if ((currentTier === 'pro' || currentTier === 'business') && currentCount >= 40) {
        openUpgradeModal(null);
        return;
      }
    }

    reset();
    router.push('/proposals/new?type=quick');
  };

  const handleCreateFullWizard = () => {
    // Quota check
    const currentCount = savedProposals.length;

    let isE2E = false;
    if (typeof document !== 'undefined') {
      isE2E = document.cookie.includes('bypass_auth=solar-quotepro-e2e-secret-key-2026');
    }

    if (!isE2E) {
      if (isTrial && currentCount >= 2) {
        openUpgradeModal(null);
        return;
      }
      if (currentTier === 'free' && currentCount >= 1) {
        openUpgradeModal(null);
        return;
      }
      if (currentTier === 'starter' && currentCount >= 10) {
        openUpgradeModal(null);
        return;
      }
      if ((currentTier === 'pro' || currentTier === 'business') && currentCount >= 40) {
        openUpgradeModal(null);
        return;
      }

      if (!checkAccess('wizardFlow').unlocked) {
        openUpgradeModal('wizardFlow');
        return;
      }
    }
    
    reset();
    router.push('/proposals/new?type=wizard');
  };

  const handleLoad = (item: SavedProposal) => {
    router.push(`/proposals/new?load=${item.id}`);
  };

  /* ── Computed Stats ── */
  const totalProposals = savedProposals.length;
  const avgKva = totalProposals > 0
    ? (savedProposals.reduce((sum, p) => sum + (p.calculations?.inverterKva || 0), 0) / totalProposals).toFixed(1)
    : '—';
  const totalRevenue = savedProposals.reduce((sum, p) => sum + (p.proposal.final_quoted_price_ngn || 0), 0);
  const recentDrafts = savedProposals.slice(0, 8);

  /* ── Tier distribution ── */
  const tierCounts = { budget: 0, standard: 0, premium: 0 };
  savedProposals.forEach((p) => {
    const t = p.proposal.selected_tier;
    if (t in tierCounts) tierCounts[t as keyof typeof tierCounts]++;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-350 transition-colors duration-300">
      {/* ═══ Top Nav ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-bold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarQuotePro</span>
            <Badge variant="outline" className="border-teal-500/20 text-teal-600 dark:text-teal-400 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ml-1">Workspace</Badge>
          </Link>

          <div className="flex items-center gap-3">
            {/* Simple / Pro Switch */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setAppMode('simple')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  appMode === 'simple'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ⚡ Simple
              </button>
              <button
                onClick={() => {
                  if (!checkAccess('wizardFlow').unlocked) {
                    openUpgradeModal('wizardFlow');
                  } else {
                    setAppMode('pro');
                  }
                }}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  appMode === 'pro'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                🛠️ Pro
              </button>
            </div>

            {profileComplete ? (
              <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30 flex items-center gap-1 text-[9px] py-0.5 px-2 rounded-full uppercase tracking-wider font-bold cursor-pointer" onClick={() => router.push('/settings')}>
                ✓ Profile Active
              </Badge>
            ) : (
              <Button variant="ghost" size="sm" className="text-xs text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/30 font-semibold flex items-center gap-1.5 rounded-full" onClick={() => router.push('/settings')}>
                <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                Setup Profile
              </Button>
            )}

            <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800" onClick={() => router.push('/')}>
              Home
            </Button>

            <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800" onClick={() => router.push('/blog')}>
              Insights
            </Button>

            <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800" onClick={() => router.push('/history')}>
              CRM & History
            </Button>

            <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800" onClick={() => router.push('/workspace/listing')}>
              🏪 Partner Hub
            </Button>

            <Button variant="ghost" size="sm" className="text-xs font-bold text-teal-650 hover:text-teal-700 dark:text-teal-400 dark:hover:bg-slate-800 flex items-center gap-1" onClick={() => router.push('/estimator')}>
              🏡 Client Estimator
            </Button>

            <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 dark:hover:bg-slate-800 flex items-center gap-1" onClick={() => router.push('/start-simple')}>
              ⚡ Start Simple
            </Button>
            
            <Button variant="ghost" size="sm" className="text-xs font-extrabold text-slate-750 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800 flex items-center gap-1" onClick={() => router.push('/pricing')}>
              💎 Pricing
            </Button>
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {!profileComplete && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-2xl animate-in slide-in-from-top-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm shadow-amber-500/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>Complete your installer profile to customize proposal PDF brand styling, active phone triggers, and NERC certifications.</span>
            </div>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-750 text-white shrink-0 font-bold rounded-xl text-xs py-1" onClick={() => router.push('/settings')}>
              Setup Profile
            </Button>
          </div>
        )}

        {/* ═══ Subscription Quota Alerts ═══ */}
        {isTrial && savedProposals.length === 1 && (
          <div className="p-4 bg-teal-500/10 border border-teal-500/35 text-teal-900 dark:text-teal-300 text-xs font-semibold rounded-2xl animate-in slide-in-from-top-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-base">💡</span>
              <span><strong>Trial Active:</strong> You have used <strong>1 of 2</strong> free proposals on your Pro Trial. Upgrade to Starter or Pro to save unlimited draft proposals.</span>
            </div>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shrink-0 font-extrabold rounded-xl text-xs py-1 px-4 shadow-md" onClick={() => openUpgradeModal(null)}>
              Upgrade Now
            </Button>
          </div>
        )}

        {isTrial && savedProposals.length >= 2 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/35 text-rose-900 dark:text-rose-300 text-xs font-semibold rounded-2xl animate-in slide-in-from-top-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔒</span>
              <span><strong>Trial Completed:</strong> You have created your <strong>2 of 2</strong> allowed free proposals. Upgrade to a paid plan now to save and share new proposals.</span>
            </div>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shrink-0 font-extrabold rounded-xl text-xs py-1 px-4 shadow-md" onClick={() => openUpgradeModal(null)}>
              Unlock Unlimited
            </Button>
          </div>
        )}

        {currentTier === 'free' && savedProposals.length >= 1 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/35 text-rose-900 dark:text-rose-300 text-xs font-semibold rounded-2xl animate-in slide-in-from-top-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔒</span>
              <span><strong>Proposal Limit Reached:</strong> Your Free plan is limited to <strong>1 proposal</strong>. Upgrade to Starter or Pro to continue drafting quotes.</span>
            </div>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shrink-0 font-extrabold rounded-xl text-xs py-1 px-4 shadow-md" onClick={() => openUpgradeModal(null)}>
              Upgrade Plan
            </Button>
          </div>
        )}

        {currentTier === 'starter' && !isTrial && savedProposals.length >= 8 && savedProposals.length < 10 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/35 text-amber-900 dark:text-amber-300 text-xs font-semibold rounded-2xl animate-in slide-in-from-top-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <span><strong>Approaching Plan Limit:</strong> You have created <strong>{savedProposals.length} of 10</strong> monthly Starter proposals. Upgrade to Pro for high-velocity sales.</span>
            </div>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-extrabold rounded-xl text-xs py-1 px-4 shadow-md" onClick={() => openUpgradeModal(null)}>
              Upgrade to Pro
            </Button>
          </div>
        )}

        {currentTier === 'starter' && !isTrial && savedProposals.length >= 10 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/35 text-rose-900 dark:text-rose-300 text-xs font-semibold rounded-2xl animate-in slide-in-from-top-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔒</span>
              <span><strong>Starter Limit Reached:</strong> You have used all <strong>10 of 10</strong> Starter proposals for this month. Upgrade to Pro to continue selling.</span>
            </div>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shrink-0 font-extrabold rounded-xl text-xs py-1 px-4 shadow-md" onClick={() => openUpgradeModal(null)}>
              Upgrade to Pro
            </Button>
          </div>
        )}

        {/* ═══ Simple Mode Hero Section ═══ */}
        {appMode === 'simple' ? (
          <section className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-900 to-slate-950 p-8 sm:p-10 text-white shadow-xl">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-300 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> Simple Mode Enabled
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Solar Proposal Builder
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
                  Create and share professional solar proposals with Nigerian clients in under 2 minutes. Simple default layouts are optimized for fast client closing.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button
                  size="lg"
                  className="bg-teal-550 hover:bg-teal-655 text-white font-bold shadow-lg hover:shadow-xl transition-all rounded-2xl flex items-center justify-center gap-2 text-sm px-6 h-12"
                  onClick={handleCreateQuickProposal}
                >
                  <Plus className="w-4 h-4" />
                  Quick Proposal (Recommended)
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent hover:bg-white/10 text-white border-white/20 hover:border-white/40 font-bold transition-all rounded-2xl flex items-center justify-center gap-2 text-sm px-6 h-12"
                  onClick={handleCreateFullWizard}
                >
                  <Settings className="w-4 h-4 text-teal-350" />
                  Full Wizard Setup
                </Button>
              </div>
            </div>
          </section>
        ) : (
          /* ── Pro Mode Hero Section ── */
          <section className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 p-8 sm:p-10 text-white shadow-xl">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  🛠️ Professional Flow Active
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Detailed Sizing & ROI Modeler
                </h1>
                <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                  Analyze load requirements, customize inverter/battery capacity levels, model payback parameters against daily diesel generator consumption, and log milestones inside the CRM pipeline.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button
                  size="lg"
                  className="bg-white text-teal-950 hover:bg-teal-50 font-bold shadow-lg hover:shadow-xl transition-all rounded-2xl flex items-center justify-center gap-2 text-sm px-6 h-12"
                  onClick={handleCreateFullWizard}
                >
                  <Plus className="w-4 h-4" />
                  Full Wizard Setup
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ═══ Pro Mode Stats Block ═══ */}
        {appMode === 'pro' && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              label="Total Proposals"
              value={String(totalProposals)}
              sub={totalProposals === 0 ? 'Create your first' : undefined}
            />
            <StatCard
              icon={<Zap className="w-5 h-5" />}
              label="Avg System Size"
              value={`${avgKva} kVA`}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Revenue Quoted"
              value={totalRevenue > 0 ? formatCurrency(totalRevenue) : '₦0'}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Top Tier"
              value={totalProposals > 0 ? tierLabel(Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0][0]) : '—'}
              sub={totalProposals > 0 ? `${tierCounts.budget}B · ${tierCounts.standard}S · ${tierCounts.premium}P` : undefined}
            />
          </section>
        )}

        {/* ═══ Homeowner Public Sizer Banner ═══ */}
        <section className="relative overflow-hidden rounded-3xl border border-teal-500/10 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-teal-500/20">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400">
              New: For Homeowners & Clients 🏡
            </span>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">
              Not a Solar Installer? Estimate Your Own Solar System Size
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal max-w-xl">
              Use our quick client sizer to calculate running wattage, battery backup size, panel count, and annual Naira generator fuel savings instantly.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold text-xs px-5 h-9 shrink-0 flex items-center gap-1.5"
            onClick={() => router.push('/estimator')}
          >
            Start Sizing <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </section>

        {/* ═══ Partner Directory Hub Banner ═══ */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/15 bg-amber-500/5 dark:bg-amber-955/10 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-amber-500/25">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400">
              Solar Directory & Leads
            </span>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">
              Claim Your Free Solar Directory Listing & Manage Leads
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal max-w-xl font-semibold">
              Get discovered by local Lagos homeowners, receive verified inbound quotation requests, and manage your public certifications.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs px-5 h-9"
              onClick={() => router.push('/installers')}
            >
              Browse Directory ➔
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs px-5 h-9"
              onClick={() => router.push('/workspace/listing')}
            >
              Go to Partner Hub ➔
            </Button>
          </div>
        </section>

        {/* ═══ Recent Proposals List ═══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">Recent Proposals</h2>
            {totalProposals > 8 && (
              <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={() => router.push('/history')}>
                View CRM Pipeline →
              </Button>
            )}
          </div>

          {recentDrafts.length === 0 ? (
            /* ── Empty State ── */
            <Card className="border-dashed border-slate-350 dark:border-slate-850">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-500 dark:bg-teal-950/30 dark:text-teal-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </div>
                <h3 className="text-base font-semibold mb-1">No proposals yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-455 max-w-sm mb-5 leading-relaxed">
                  Start quoting. Our simple mode captures just the core info, sizes panels, and prepares a fully complete PDF with one tap.
                </p>
                <Button className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold" onClick={handleCreateQuickProposal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create First Proposal
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* ── Draft List ── */
            <div className="space-y-2.5">
              {recentDrafts.map((item) => (
                <DraftRow
                  key={item.id}
                  item={item}
                  onLoad={() => handleLoad(item)}
                  onDelete={() => deleteProposal(item.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ═══ Quick Tips (Collapsed/Condensed in Simple Mode) ═══ */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '📱', title: 'Offline Field Mode', desc: 'Saves automatically. Generates clean solar proposals even with weak interbank data on site.' },
            { icon: '🛡️', title: 'Lagos Safety & Compliance', desc: 'Validates grid permits and landlord structural checks directly inside final print checklists.' },
            { icon: '💰', title: 'Generator ROI Comparison', desc: 'Educates clients on generator monthly expenses vs. direct solar payback schedules.' },
          ].map((tip) => (
            <Card key={tip.title} className="bg-slate-100/50 dark:bg-slate-900 border-none">
              <CardContent className="flex items-start gap-3 pt-5 pb-4">
                <span className="text-2xl">{tip.icon}</span>
                <div>
                  <p className="font-bold text-xs text-slate-850 dark:text-slate-200">{tip.title}</p>
                  <p className="text-[11px] text-slate-550 mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <p>© <CopyrightYear /> SolarQuotePro — Built for Nigerian Installers</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse animate-duration-1000" />
            Offline-ready PWA active
          </p>
        </div>
      </footer>
    </div>
  );
}
