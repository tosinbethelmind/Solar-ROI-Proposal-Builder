'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users2, 
  CreditCard, 
  FileSpreadsheet, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle,
  HelpCircle,
  Briefcase,
  Zap,
  Sparkles,
  ShieldCheck,
  Search,
  Bell,
  CheckCircle2,
  XCircle,
  Layers,
  MoreVertical,
  ChevronRight,
  ShieldAlert,
  Settings2,
  DollarSign
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';

interface KPIState {
  totalCompanies: number;
  activeSubscriptions: number;
  trialCompanies: number;
  pastDueCompanies: number;
  suspendedCompanies: number;
  totalProposals: number;
  totalUsers: number;
  monthlyRevenue: number;
  billingRisk: number;
}

interface RecentCompany {
  id: string;
  name: string;
  email: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
}

interface ActionFlagged {
  id: string;
  name: string;
  email: string;
  reason: string;
  severity: 'critical' | 'warn';
}

interface ActionOverdue {
  id: string;
  name: string;
  tier: string;
  amount: number;
}

interface ActionTrial {
  id: string;
  name: string;
  daysRemaining: number;
  hoursRemaining: number;
  created_at: string;
}

interface LandmarkProposal {
  id: string;
  customer_name: string;
  value: number;
  company_name: string;
  created_at: string;
}

interface SystemIssue {
  id: string;
  title: string;
  status: string;
  desc: string;
}

interface OverviewData {
  kpis: KPIState;
  charts: {
    signups: Array<{ date: string; signups: number }>;
    proposals: Array<{ date: string; proposals: number }>;
    fxRateTrend: Array<{ date: string; official: number; parallel: number; customOverride: number }>;
  };
  actionCenter: {
    flaggedCompanies: ActionFlagged[];
    overdueSubscriptions: ActionOverdue[];
    trialExpiringSoon: ActionTrial[];
    latestProposals: LandmarkProposal[];
    systemIssues: SystemIssue[];
  };
  recentCompanies: RecentCompany[];
}

export default function AdminOverview() {
  const router = useRouter();
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'signups' | 'proposals' | 'fx'>('signups');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/admin/overview');
        const json = await res.json();
        if (json.error) {
          toast.error(json.error);
        } else if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        toast.error('Could not connect to operations telemetry service.');
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  const formatNaira = (value: number) =>
    `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const handleActionClick = (actionName: string) => {
    toast.success(`Action initiated: ${actionName}`);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Loading Skeleton */}
        <div className="flex justify-between items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
          <div className="h-16 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>

        {/* KPIs Loading Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"></div>
          ))}
        </div>

        {/* Charts Loading Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const charts = data?.charts;
  const actionCenter = data?.actionCenter;
  const recentCompanies = data?.recentCompanies || [];

  const filteredCompanies = recentCompanies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      
      {/* ═══ Header Title / Overview Segment ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-650 dark:text-teal-400 uppercase tracking-widest">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Operational Command Overview</span>
          </div>
          <h1 className="text-3xl font-black text-slate-850 dark:text-slate-50 tracking-tight mt-1">SolarPro Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
            Real-time telemetry, currency index rates, and multi-tenant standing analysis.
          </p>
        </div>

        {/* MRR Snapshot Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm flex items-center gap-4.5 min-w-[280px]">
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Estimated Run Rate</p>
            <p className="text-2xl font-black tracking-tight text-slate-850 dark:text-slate-50 mt-0.5">
              {formatNaira(kpis?.monthlyRevenue ?? 0)}
            </p>
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>● System Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Top KPI Row (6 elements) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { 
            label: 'Monthly Revenue', 
            value: formatNaira(kpis?.monthlyRevenue ?? 0), 
            icon: DollarSign, 
            color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
            desc: 'Paid subscriptions'
          },
          { 
            label: 'Active Workspaces', 
            value: String((kpis?.activeSubscriptions ?? 0) + (kpis?.trialCompanies ?? 0)), 
            icon: Building2, 
            color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
            desc: 'Total installer companies'
          },
          { 
            label: 'Active Paid Plans', 
            value: String(kpis?.activeSubscriptions ?? 0), 
            icon: CreditCard, 
            color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
            desc: 'Onboarded companies'
          },
          { 
            label: 'Proposal Volume', 
            value: String(kpis?.totalProposals ?? 0), 
            icon: FileSpreadsheet, 
            color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
            desc: 'Reports sizing complete'
          },
          { 
            label: 'Active Estimators', 
            value: String(kpis?.totalUsers ?? 0), 
            icon: Users2, 
            color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10',
            desc: 'Registered user seats'
          },
          { 
            label: 'At-Risk Billing', 
            value: formatNaira(kpis?.billingRisk ?? 0), 
            icon: AlertTriangle, 
            color: 'text-rose-600 dark:text-rose-455 bg-rose-500/10',
            desc: 'Lapsed or past due MRR'
          }
        ].map((kpi, idx) => (
          <Card key={idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4.5 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-2.5">
                <div className={`p-2 rounded-xl ${kpi.color} shrink-0`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">{kpi.label}</p>
                <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-50 mt-0.5 truncate">{kpi.value}</h3>
                <p className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 mt-1 leading-none truncate">{kpi.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Trend & Telemetry Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Analytics (Signups, Proposals, FX Rate tab switch) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                <span>Performance & Commercial Telemetry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical overview of platform usage and exchange indicators.</p>
            </div>

            {/* Tab Controllers */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 p-1 rounded-xl">
              {[
                { id: 'signups', label: 'Signups' },
                { id: 'proposals', label: 'Proposals' },
                { id: 'fx', label: 'FX Index' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    activeTab === t.id 
                      ? 'bg-teal-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-855 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'signups' ? (
                <AreaChart data={charts?.signups} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="signups" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" />
                </AreaChart>
              ) : activeTab === 'proposals' ? (
                <BarChart data={charts?.proposals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '11px' }} />
                  <Bar dataKey="proposals" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={charts?.fxRateTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '11px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  <Line type="monotone" name="Official CBN" dataKey="official" stroke="#94a3b8" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" name="Parallel Market" dataKey="parallel" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" name="Custom Override" dataKey="customOverride" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Platform Gateway & System Audit Statuses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span>Gateway Health & Sync Pulse</span>
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-500 mt-0.5">Real-time gateway integrity & integration services state.</p>
          </div>

          <div className="space-y-3.5">
            {actionCenter?.systemIssues.map(issue => (
              <div key={issue.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">{issue.title}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{issue.desc}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 uppercase tracking-wider font-extrabold text-[8px] py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <span className="size-1 rounded-full bg-emerald-500 shrink-0" />
                  Online
                </Badge>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl h-9" onClick={() => handleActionClick('Flush Session Cache')}>
              🧹 Flush Cache
            </Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl h-9" onClick={() => handleActionClick('Re-sync Paystack Gateway')}>
              🔄 Trigger Sync
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Action Center Row (3 categories) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flagged Accounts / Suspicious standing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />
              <span>Flagged & Suspended Accounts</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tenant accounts flagged by operators or auto-delinquency checks.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {actionCenter?.flaggedCompanies.length === 0 ? (
              <p className="text-xs text-slate-450 italic text-center py-6">No flagged accounts currently detected.</p>
            ) : (
              actionCenter?.flaggedCompanies.map(item => (
                <div key={item.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-855 dark:text-slate-250 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.email}</p>
                    </div>
                    <Badge className={`uppercase text-[8px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      item.severity === 'critical' 
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-250' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-250'
                    }`}>
                      {item.reason}
                    </Badge>
                  </div>
                  <div className="flex gap-2 justify-end mt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    <Button size="sm" variant="ghost" className="h-7.5 px-3 rounded-lg text-[10px] font-bold text-slate-550" onClick={() => router.push(`/admin/companies`)}>
                      Open Ledger
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7.5 px-3 rounded-lg text-[10px] font-bold text-teal-655 bg-teal-500/10 hover:bg-teal-500/20" onClick={() => handleActionClick(`Resolve flags on ${item.name}`)}>
                      Resolve Flags
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trials expiring in <48h */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-amber-500" />
              <span>Expiring Trials (&lt;72 Hours)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Active sizer trials in onboarding pipeline expiring soon.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {actionCenter?.trialExpiringSoon.length === 0 ? (
              <p className="text-xs text-slate-450 italic text-center py-6">No expiring trials detected this week.</p>
            ) : (
              actionCenter?.trialExpiringSoon.map(item => (
                <div key={item.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-855 dark:text-slate-250 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Registered: {formatShortDate(item.created_at)}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 uppercase text-[8px] font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <span className="size-1 rounded-full bg-amber-500 animate-pulse" />
                      {item.daysRemaining}d {item.hoursRemaining}h left
                    </Badge>
                  </div>
                  <div className="flex gap-2 justify-end mt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    <Button size="sm" variant="ghost" className="h-7.5 px-3 rounded-lg text-[10px] font-bold text-slate-550" onClick={() => handleActionClick(`Email trial user of ${item.name}`)}>
                      ✉️ Email Installer
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7.5 px-3 rounded-lg text-[10px] font-bold text-emerald-650 bg-emerald-500/10 hover:bg-emerald-500/20" onClick={() => handleActionClick(`Extend trial for ${item.name}`)}>
                      ➕ Extend 7 Days
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Value Landmarks Proposals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
              <span>Landmark High-Value Proposals</span>
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-500 mt-0.5">System-wide landmark quotes of significant monetary size.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {actionCenter?.latestProposals.length === 0 ? (
              <p className="text-xs text-slate-450 italic text-center py-6">No custom quotes found in platform ledger.</p>
            ) : (
              actionCenter?.latestProposals.map(item => (
                <div key={item.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">{item.customer_name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">By {item.company_name}</p>
                    </div>
                    <span className="text-xs font-black text-teal-650 dark:text-teal-400 tabular-nums shrink-0">{formatNaira(item.value)}</span>
                  </div>
                  <div className="flex gap-2 justify-end mt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    <Button size="sm" variant="ghost" className="h-7.5 px-3 rounded-lg text-[10px] font-bold text-slate-550" onClick={() => router.push(`/admin/proposals`)}>
                      🔎 Inspect Ledger
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ═══ Bottom Section: Recent Registered Companies table with actions ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Table Header with Search Controls */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-550 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-indigo-500" />
              <span>Workspace Directory & Action Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Direct admin overrides for subscription statuses and suspend states.</p>
          </div>

          <div className="relative min-w-[260px] w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies or owners..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500/50 transition-all dark:text-slate-100"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          {filteredCompanies.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-slate-450 italic">No companies matched your query terms.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-455 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Workspace Name</th>
                  <th className="px-6 py-4">Contact Owner</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Status & Standing</th>
                  <th className="px-6 py-4">Onboarding Date</th>
                  <th className="px-6 py-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                {filteredCompanies.map(company => (
                  <tr 
                    key={company.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-xs shadow-sm">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-550 dark:text-slate-400 font-semibold">{company.email || 'None logged'}</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-750 uppercase text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider">
                        {company.subscription_tier || 'Starter'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                        company.subscription_status === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/40' 
                          : company.subscription_status === 'trial' 
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/40' 
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border-rose-250 dark:border-rose-900/40'
                      }`}>
                        {company.subscription_status || 'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-bold">
                      {formatShortDate(company.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-3 text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-650 dark:bg-slate-800 dark:hover:bg-slate-750 font-bold rounded-xl"
                          onClick={() => router.push(`/admin/companies`)}
                        >
                          Manage Workspace
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
