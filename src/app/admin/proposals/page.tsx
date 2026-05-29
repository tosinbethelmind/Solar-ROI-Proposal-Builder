'use client';

import * as React from 'react';
import { 
  Search, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  Coins, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Proposal {
  id: string;
  customer_name: string;
  customer_email?: string;
  system_name?: string;
  system_size_kwp?: number;
  final_quoted_price_ngn: number;
  status: string;
  created_at: string;
  company_name: string;
}

export default function AdminProposals() {
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const fetchProposals = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/admin/proposals?search=${encodeURIComponent(search)}&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.data) {
        setProposals(data.data);
        setTotalPages(Math.ceil((data.meta?.total || 1) / (data.meta?.limit || 20)));
      }
    } catch (err) {
      console.error('Failed to load proposals:', err);
      toast.error('Failed to query proposals catalog.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  React.useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
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
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Proposals Vault</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Platform-wide overview of all commercial solar reports and ROI structures generated.</p>
      </div>

      {/* Filters Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur-md rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <Input
              placeholder="Search by client name, system name..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950"
            />
          </div>
          <span className="text-xs font-semibold text-slate-450 hidden sm:block">Querying live database indexes</span>
        </CardContent>
      </Card>

      {/* Proposals Ledger Table */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 bg-white dark:bg-slate-900/10">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-500 animate-pulse">Retrieving proposal ledgers...</span>
          </div>
        ) : proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
            <FileText className="h-10 w-10 text-slate-400 animate-bounce" />
            <span className="text-base font-bold text-slate-700 dark:text-slate-350">No proposals found</span>
            <span className="text-xs font-semibold text-slate-500">Workspace estimators have not logged any proposals matching your query.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5">Client / Customer</th>
                  <th className="px-6 py-4.5">Tenant Company</th>
                  <th className="px-6 py-4.5">System Spec</th>
                  <th className="px-6 py-4.5">Quoted Value</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {proposals.map((prop) => (
                  <tr 
                    key={prop.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                          <User className="h-4 w-4 text-slate-450" />
                          <span>{prop.customer_name}</span>
                        </div>
                        {prop.customer_email && (
                          <div className="text-xs font-semibold text-slate-500 font-mono pl-5">{prop.customer_email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-655 dark:text-slate-350 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-slate-450" />
                        <span>{prop.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-655 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
                      {prop.system_name || 'Standard Solar Spec'} {prop.system_size_kwp ? `(${prop.system_size_kwp} kWp)` : ''}
                    </td>
                    <td className="px-6 py-4 text-teal-655 dark:text-teal-400 font-extrabold flex items-center gap-1.5 mt-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>{formatNaira(prop.final_quoted_price_ngn)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        prop.status === 'sent' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50' 
                          : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/50'
                      }`}>
                        {prop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500 font-semibold flex items-center gap-1.5 mt-2">
                      <Calendar className="h-4 w-4 text-slate-450" />
                      <span>{formatShortDate(prop.created_at)}</span>
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
