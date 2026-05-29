'use client';

import * as React from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Building2, 
  Mail, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter
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
      {/* Title & Stats */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Users Directory</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Monitor active workspace members, team roles, and platform permissions.</p>
      </div>

      {/* Filters Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur-md rounded-2xl">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <Input
              placeholder="Search by email, company or role..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 h-10.5 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Company filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={companyFilter}
                onChange={handleCompanyFilterChange}
                className="w-full sm:w-48 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full sm:w-44 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 bg-white dark:bg-slate-900/10">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading platform members...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
            <UserX className="h-10 w-10 text-slate-400" />
            <span className="text-base font-bold text-slate-700 dark:text-slate-300">No workspace members found</span>
            <span className="text-xs font-semibold text-slate-500">Try modifying your query constraints or filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5">Email Address</th>
                  <th className="px-6 py-4.5">Company / Tenant</th>
                  <th className="px-6 py-4.5">Role</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Joined Date</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {users.map((member) => (
                  <tr 
                    key={member.id} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                      member.active === false ? 'bg-red-50/30 dark:bg-red-950/5 opacity-85' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-450" />
                      <span>{member.email}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-655 dark:text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-4 w-4 text-slate-450" />
                      <span>{member.company_name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-450 font-semibold uppercase tracking-wider text-xs">
                      {member.role || 'Member'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        member.active !== false 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-255 dark:border-emerald-900/50' 
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-255 dark:border-rose-900/50'
                      }`}>
                        {member.active !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-4 w-4 text-slate-450" />
                      <span>{formatShortDate(member.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStatusToggle(member)}
                        className={`h-8.5 rounded-lg flex items-center gap-1 font-bold ${
                          member.active !== false 
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30' 
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
    </div>
  );
}
