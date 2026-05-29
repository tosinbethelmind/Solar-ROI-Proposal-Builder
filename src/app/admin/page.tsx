'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users2, 
  CreditCard, 
  FileSpreadsheet, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
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
}

interface RecentCompany {
  id: string;
  name: string;
  email: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
}

interface ChartItem {
  date: string;
  signups?: number;
  proposals?: number;
}

export default function AdminOverview() {
  const [kpis, setKpis] = React.useState<KPIState | null>(null);
  const [recentCompanies, setRecentCompanies] = React.useState<RecentCompany[]>([]);
  const [charts, setCharts] = React.useState<{ signups: ChartItem[]; proposals: ChartItem[] }>({ signups: [], proposals: [] });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/admin/overview');
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
        } else if (data.data) {
          setKpis(data.data.kpis);
          setRecentCompanies(data.data.recentCompanies);
          setCharts(data.data.charts);
        }
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        toast.error('Could not connect to overview telemetry service.');
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
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Assembling system overview telemetry...</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Companies',
      value: kpis?.totalCompanies ?? 0,
      icon: Building2,
      color: 'from-blue-500 to-indigo-600',
      description: 'Total tenant organizations registered',
    },
    {
      title: 'Active Subscriptions',
      value: kpis?.activeSubscriptions ?? 0,
      icon: CreditCard,
      color: 'from-emerald-500 to-teal-600',
      description: 'Companies with active billing status',
    },
    {
      title: 'Trial Companies',
      value: kpis?.trialCompanies ?? 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      description: 'Active 7-day trials in system onboarding',
    },
    {
      title: 'Past Due / Suspended',
      value: `${kpis?.pastDueCompanies ?? 0} / ${kpis?.suspendedCompanies ?? 0}`,
      icon: AlertCircle,
      color: 'from-rose-500 to-red-600',
      description: 'Subscriptions lapsed or administratively blocked',
    },
    {
      title: 'Total Proposals',
      value: kpis?.totalProposals ?? 0,
      icon: FileSpreadsheet,
      color: 'from-cyan-500 to-sky-600',
      description: 'Branded solar reports generated',
    },
    {
      title: 'Active Users',
      value: kpis?.totalUsers ?? 0,
      icon: Users2,
      color: 'from-fuchsia-500 to-purple-600',
      description: 'Team estimators & sales accounts',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">SolarPro Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time system telemetry and commercial operations oversight.</p>
        </div>

        {/* Estimated monthly revenue card */}
        <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-teal-500/20 flex flex-col justify-center min-w-[280px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Monthly Run Rate</span>
            <TrendingUp className="h-4.5 w-4.5 text-teal-400 animate-pulse" />
          </div>
          <span className="text-2xl font-black">{formatNaira(kpis?.monthlyRevenue ?? 0)}</span>
          <span className="text-[10px] font-semibold text-slate-400 mt-1">Sum of active subscription plan tiers</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, i) => (
          <Card key={i} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{card.title}</span>
                  <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{card.value}</div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm shrink-0`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 mt-4 leading-relaxed">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Signups */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-500" />
            <span>New Company Signups (Last 30 Days)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.signups} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="signups" 
                  stroke="#0d9488" 
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0d9488' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Proposals */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            <span>Proposals Generated per Day (Last 30 Days)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.proposals} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="proposals" 
                  fill="#059669" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Companies Section */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-indigo-500" />
            <span>Recently Registered Companies</span>
          </h3>
          <Link 
            href="/admin/companies" 
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 group"
          >
            <span>View All Companies</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Owner Email</th>
                <th className="px-6 py-4">Plan Tier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {recentCompanies.map((company) => (
                <tr 
                  key={company.id} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{company.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{company.email || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/50 uppercase tracking-wider">
                      {company.subscription_tier || 'Starter'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      company.subscription_status === 'active' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' 
                        : company.subscription_status === 'trial' 
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' 
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                    }`}>
                      {company.subscription_status || 'Trial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-semibold">
                    {formatShortDate(company.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
