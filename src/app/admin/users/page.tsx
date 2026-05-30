'use client';

import * as React from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Building2, 
  Mail, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck2,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Member {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  active: boolean;
  created_at: string;
  email: string;
  company_name: string;
  status: 'active' | 'deactivated';
}

interface CompanyItem {
  id: string;
  name: string;
}

export default function AdminUsers() {
  const [users, setUsers] = React.useState<Member[]>([]);
  const [companies, setCompanies] = React.useState<CompanyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [companyFilter, setCompanyFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Load companies for the filter dropdown
  React.useEffect(() => {
    async function fetchCompaniesList() {
      try {
        const res = await fetch('/api/admin/companies?limit=100');
        const data = await res.json();
        if (data.data) {
          setCompanies(data.data.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error('Error fetching companies list:', err);
      }
    }
    fetchCompaniesList();
  }, []);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/admin/users?search=${encodeURIComponent(search)}&companyId=${companyFilter}&status=${statusFilter}&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.data) {
        setUsers(data.data);
        setTotalPages(Math.ceil((data.meta?.total || 1) / (data.meta?.limit || 20)));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to query users base.');
    } finally {
      setLoading(false);
    }
  }, [search, companyFilter, statusFilter, page]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCompanyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleStatusToggle = async (member: Member) => {
    const action = member.active !== false ? 'deactivate' : 'activate';
    const confirmMessage = member.active !== false 
      ? `Are you sure you want to DEACTIVATE ${member.email}? This will immediately block their platform access.`
      : `Are you sure you want to RE-ACTIVATE ${member.email}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, action })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(member.active !== false ? 'User account deactivated.' : 'User account activated.');
        fetchUsers();
      }
    } catch (err) {
      toast.error('Could not toggle user activity.');
    }
  };

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
      
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <Users className="h-4 w-4 shrink-0" />
            <span>Operator & Team Access</span>
          </div>
          <h1 className="text-3xl font-black text-slate-850 dark:text-slate-55 tracking-tight mt-1">Users Directory</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Monitor active workspace members, configure administrative team roles, and coordinate user activities.
          </p>
        </div>
      </div>

      {/* ═══ Filters Bar ═══ */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by email, company or role..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 h-10.5 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-slate-50 dark:bg-slate-955 font-bold dark:text-slate-100 text-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Company filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={companyFilter}
                onChange={handleCompanyFilterChange}
                className="w-full sm:w-48 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full sm:w-44 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Users Table ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3 bg-white dark:bg-slate-900">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-500 animate-pulse">Loading platform members...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center gap-2">
            <UserX className="h-10 w-10 text-slate-400" />
            <span className="text-sm font-black text-slate-800 dark:text-slate-100">No Workspace Members Found</span>
            <span className="text-xs font-bold text-slate-500">Try modifying your query constraints or filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800/80">
                  <th className="px-6 py-4.5">Email Address</th>
                  <th className="px-6 py-4.5">Company / Tenant</th>
                  <th className="px-6 py-4.5">Role</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Joined Date</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-805 text-xs font-bold">
                {users.map((member) => (
                  <tr 
                    key={member.id} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors ${
                      member.active === false ? 'bg-red-500/[0.03] dark:bg-red-500/[0.02] opacity-90' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{member.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-655 dark:text-slate-400 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{member.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      {member.role || 'Member'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        member.active !== false 
                          ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50' 
                          : 'bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/50'
                      }`}>
                        {member.active !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{formatShortDate(member.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStatusToggle(member)}
                        className={`h-8.5 rounded-lg flex items-center gap-1 font-bold ${
                          member.active !== false 
                            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30' 
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        {member.active !== false ? (
                          <>
                            <UserX className="h-4 w-4" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            <span>Activate</span>
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
            <span className="text-[11px] font-bold text-slate-500">Page {page} of {totalPages}</span>
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
    </div>
  );
}
