'use client';

import * as React from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  X, 
  Building2, 
  User, 
  Calendar, 
  Coins, 
  BadgeCheck, 
  AlertTriangle,
  FolderLock,
  ArrowRight,
  Eye,
  CheckCircle,
  FileText,
  CreditCard,
  Ban,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  tagline?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  cac_number?: string;
  nerc_number?: string;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at?: string;
  paystack_customer_id?: string;
  paystack_subscription_code?: string;
  suspended: boolean;
  created_at: string;
  owner_email: string;
  proposals_count: number;
  members_count: number;
  members: any[];
}

export default function AdminCompanies() {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  
  // Drawer state
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerProposals, setDrawerProposals] = React.useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = React.useState(false);
  
  // Modal state
  const [overrideModalOpen, setOverrideModalOpen] = React.useState(false);
  const [overrideCompany, setOverrideCompany] = React.useState<Company | null>(null);
  const [selectedTier, setSelectedTier] = React.useState('starter');
  const [selectedStatus, setSelectedStatus] = React.useState('trial');

  const fetchCompanies = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/admin/companies?search=${encodeURIComponent(search)}&plan=${planFilter}&status=${statusFilter}&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.data) {
        setCompanies(data.data);
        setTotalPages(Math.ceil((data.meta?.total || 1) / (data.meta?.limit || 20)));
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      toast.error('Failed to load companies database.');
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, statusFilter, page]);

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePlanFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlanFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleViewDetails = async (company: Company) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
    setLoadingProposals(true);
    setDrawerProposals([]);

    try {
      // Fetch latest 10 proposals for this company
      const res = await fetch(`/api/admin/proposals?companyId=${company.id}`);
      const data = await res.json();
      if (data.data) {
        setDrawerProposals(data.data.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching proposals for drawer:', err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleSuspensionToggle = async (company: Company) => {
    const action = company.suspended ? 'unsuspend' : 'suspend';
    const confirmMessage = company.suspended 
      ? `Are you sure you want to reinstate ${company.name}?` 
      : `Are you sure you want to SUSPEND ${company.name}? All team members will be locked out immediately.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, action })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(company.suspended ? `${company.name} reinstated.` : `${company.name} suspended.`);
        fetchCompanies();
        if (selectedCompany?.id === company.id) {
          setSelectedCompany(prev => prev ? { ...prev, suspended: !company.suspended } : null);
        }
      }
    } catch (err) {
      toast.error('Suspension command failed.');
    }
  };

  const handleOpenOverride = (company: Company) => {
    setOverrideCompany(company);
    setSelectedTier(company.subscription_tier);
    setSelectedStatus(company.subscription_status);
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!overrideCompany) return;

    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: overrideCompany.id,
          action: 'change_plan',
          plan_tier: selectedTier,
          subscription_status: selectedStatus
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Subscription overrides applied to ${overrideCompany.name}.`);
        setOverrideModalOpen(false);
        fetchCompanies();
        if (selectedCompany?.id === overrideCompany.id) {
          setSelectedCompany(prev => prev ? { ...prev, subscription_tier: selectedTier, subscription_status: selectedStatus } : null);
        }
      }
    } catch (err) {
      toast.error('Plan modification failed.');
    }
  };

  const formatNaira = (value: number) =>
    `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Companies Registry</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage corporate workspaces, billing limits, and tenant accounts.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur-md rounded-2xl">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <Input
              placeholder="Search by company name or owner email..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 h-10.5 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Plan filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={planFilter}
                onChange={handlePlanFilterChange}
                className="w-full sm:w-44 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Plan Tiers</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full sm:w-44 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Statuses</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 bg-white dark:bg-slate-900/10">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading workspace tenants...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
            <Building2 className="h-10 w-10 text-slate-400" />
            <span className="text-base font-bold text-slate-700 dark:text-slate-300">No workspace tenants found</span>
            <span className="text-xs font-semibold text-slate-500">Try adjusting your search queries or filter categories.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5">Company Name</th>
                  <th className="px-6 py-4.5">Owner / Contact</th>
                  <th className="px-6 py-4.5">Plan Tier</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Proposals</th>
                  <th className="px-6 py-4.5">Registered</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {companies.map((company) => (
                  <tr 
                    key={company.id} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                      company.suspended ? 'bg-rose-50/30 dark:bg-rose-950/5 opacity-80' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-slate-800 dark:text-slate-100">{company.name}</span>
                        {company.suspended && (
                          <span className="text-[10px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{company.owner_email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/50 uppercase tracking-wider">
                        {company.subscription_tier || 'Starter'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        company.subscription_status === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' 
                          : company.subscription_status === 'trial' 
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' 
                          : company.subscription_status === 'past_due'
                          ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                          : 'bg-slate-50 dark:bg-slate-900/20 text-slate-655 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {company.subscription_status || 'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-bold">{company.proposals_count}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-semibold">{formatShortDate(company.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(company)}
                          className="h-8.5 rounded-lg text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenOverride(company)}
                          className="h-8.5 rounded-lg text-teal-650 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Plan</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSuspensionToggle(company)}
                          className={`h-8.5 rounded-lg flex items-center gap-1 font-bold ${
                            company.suspended 
                              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' 
                              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                          }`}
                        >
                          <Ban className="h-4 w-4" />
                          <span>{company.suspended ? 'Reinstate' : 'Suspend'}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
            <span className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="h-8 rounded-lg cursor-pointer flex items-center gap-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="h-8 rounded-lg cursor-pointer flex items-center gap-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over View Drawer */}
      {drawerOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800">
              {/* Header */}
              <div className="px-6 py-5 bg-slate-900 text-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-teal-400" />
                  <div>
                    <h2 className="text-lg font-black tracking-tight">{selectedCompany.name}</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Company Workspace Profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 text-slate-800 dark:text-slate-250">
                {/* Visual Identity banner */}
                <div 
                  className="rounded-2xl p-5 border text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, ${selectedCompany.brand_primary_color || '#01696f'} 0%, ${selectedCompany.brand_secondary_color || '#01414a'} 100%)` 
                  }}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full tracking-wider border border-white/10">Visual branding</span>
                    <h3 className="text-xl font-extrabold tracking-tight">{selectedCompany.name}</h3>
                    <p className="text-xs font-medium text-white/80">{selectedCompany.tagline || 'No tagline set'}</p>
                  </div>

                  <div className="flex flex-col gap-2 font-bold text-xs bg-slate-950/20 backdrop-blur-md rounded-xl p-3 border border-white/10 min-w-[200px]">
                    <div className="flex justify-between gap-4 text-white/70">
                      <span>Primary:</span>
                      <span className="font-mono uppercase">{selectedCompany.brand_primary_color || '#01696F'}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-white/70">
                      <span>Secondary:</span>
                      <span className="font-mono uppercase">{selectedCompany.brand_secondary_color || '#01414A'}</span>
                    </div>
                  </div>
                </div>

                {/* Company parameters section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Registration Details</h4>
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl text-sm font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">CAC Number:</span>
                        <span className="text-slate-800 dark:text-slate-100">{selectedCompany.cac_number || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">NERC Certification:</span>
                        <span className="text-slate-800 dark:text-slate-100">{selectedCompany.nerc_number || 'Not certified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">Contact Phone:</span>
                        <span className="text-slate-800 dark:text-slate-100">{selectedCompany.phone || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">Contact Email:</span>
                        <span className="text-slate-800 dark:text-slate-100">{selectedCompany.email || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing settings */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Billing Settings</h4>
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl text-sm font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">Active Tier:</span>
                        <span className="text-slate-800 dark:text-slate-100 uppercase tracking-wide">{selectedCompany.subscription_tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">Status:</span>
                        <span className="text-slate-850 dark:text-slate-100 font-bold capitalize">{selectedCompany.subscription_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">Paystack ID:</span>
                        <span className="text-slate-800 dark:text-slate-100 font-mono text-xs truncate max-w-[120px]" title={selectedCompany.paystack_subscription_code ?? ''}>
                          {selectedCompany.paystack_subscription_code || 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 dark:text-slate-400">Trial Ends:</span>
                        <span className="text-slate-850 dark:text-slate-100">
                          {selectedCompany.trial_ends_at ? formatShortDate(selectedCompany.trial_ends_at) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4 text-teal-650" />
                    <span>Workspace Members ({selectedCompany.members?.length || 0})</span>
                  </h4>
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850/40 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold">
                        {selectedCompany.members?.map((member, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{member.email}</td>
                            <td className="px-4 py-3 text-slate-500 uppercase tracking-wide">{member.role}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                                member.active !== false 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200' 
                                  : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200'
                              }`}>
                                {member.active !== false ? 'Active' : 'Deactivated'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Proposals History */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <span>Latest Proposals (Last 10)</span>
                  </h4>
                  {loadingProposals ? (
                    <div className="flex justify-center p-6 gap-2">
                      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Querying proposal vaults...</span>
                    </div>
                  ) : drawerProposals.length === 0 ? (
                    <div className="p-6 border border-dashed rounded-2xl text-center text-xs font-semibold text-slate-450 dark:text-slate-550 bg-slate-50/30">
                      No proposals created in this workspace.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-850/40 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-3">Client / Name</th>
                            <th className="px-4 py-3">Quoted Value</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold">
                          {drawerProposals.map((prop, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <td className="px-4 py-3 font-bold text-slate-850 dark:text-slate-100">{prop.customer_name}</td>
                              <td className="px-4 py-3 text-slate-655 dark:text-slate-350">{formatNaira(prop.final_quoted_price_ngn)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                                  prop.status === 'sent' 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250' 
                                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250'
                                }`}>
                                  {prop.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-500">{formatShortDate(prop.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="px-6 py-4.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <Button 
                  variant="outline"
                  onClick={() => handleSuspensionToggle(selectedCompany)}
                  className={`h-10 rounded-xl font-bold cursor-pointer shadow-sm ${
                    selectedCompany.suspended 
                      ? 'border-emerald-200 hover:bg-emerald-50 text-emerald-700' 
                      : 'border-red-200 hover:bg-red-50 text-red-655'
                  }`}
                >
                  <Ban className="h-4 w-4" />
                  <span>{selectedCompany.suspended ? 'Reinstate Tenant' : 'Suspend Tenant'}</span>
                </Button>

                <Button 
                  onClick={() => handleOpenOverride(selectedCompany)}
                  className="h-10 px-5 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Settings className="h-4.5 w-4.5" />
                  <span>Override Subscription</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Override Subscription Modal */}
      {overrideModalOpen && overrideCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
          <div 
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setOverrideModalOpen(false)}
          />

          <Card className="relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden animate-scale-up mx-4">
            <div className="px-6 py-4.5 bg-slate-900 text-slate-100 flex items-center justify-between">
              <span className="font-black text-base tracking-tight">Manual Plan Override</span>
              <button 
                onClick={() => setOverrideModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-5">
              <div className="text-sm font-semibold text-slate-655 dark:text-slate-400">
                Adjusting billing specifications for <strong className="text-slate-800 dark:text-white">{overrideCompany.name}</strong> workspace.
              </div>

              {/* Plan Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Subscription Tier</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="starter">Starter Plan (₦0 / limited 3 proposals)</option>
                  <option value="pro">Pro Plan (₦9,900 / month)</option>
                  <option value="business">Business Plan (₦24,900 / month)</option>
                  <option value="enterprise">Enterprise Plan (₦59,900 / month)</option>
                </select>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Subscription Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="trial">Trialing</option>
                  <option value="active">Active (Good Standing)</option>
                  <option value="past_due">Past Due (Delinquent)</option>
                  <option value="cancelled">Cancelled (Closed)</option>
                </select>
              </div>

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end gap-2.5">
                <Button 
                  variant="outline"
                  onClick={() => setOverrideModalOpen(false)}
                  className="h-10 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveOverride}
                  className="h-10 px-5 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Apply Override
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
