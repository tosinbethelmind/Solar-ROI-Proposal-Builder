'use client';

import * as React from 'react';
import { 
  CreditCard, 
  Coins, 
  TrendingUp, 
  Clock, 
  PlusCircle, 
  DollarSign, 
  BadgeCheck, 
  AlertTriangle,
  Settings,
  X,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BillingKPIs {
  totalMRR: number;
  paidCount: number;
  arpu: number;
  totalCompanies: number;
}

interface BillingCompany {
  id: string;
  name: string;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at?: string;
  paystack_subscription_code?: string;
  paystack_customer_id?: string;
  suspended: boolean;
  created_at: string;
}

export default function AdminSubscriptions() {
  const [kpis, setKpis] = React.useState<BillingKPIs | null>(null);
  const [companies, setCompanies] = React.useState<BillingCompany[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Modal states
  const [trialModalOpen, setTrialModalOpen] = React.useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState<BillingCompany | null>(null);
  const [trialDays, setTrialDays] = React.useState('7');
  const [paymentAmount, setPaymentAmount] = React.useState('9900');

  const fetchSubscriptions = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.data) {
        setKpis(data.data.kpis);
        setCompanies(data.data.companies);
      }
    } catch (err) {
      console.error('Failed to load subscriptions statistics:', err);
      toast.error('Failed to load subscriptions register.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleOpenTrial = (company: BillingCompany) => {
    setSelectedCompany(company);
    setTrialDays('7');
    setTrialModalOpen(true);
  };

  const handleOpenPayment = (company: BillingCompany) => {
    setSelectedCompany(company);
    setPaymentAmount('9900');
    setPaymentModalOpen(true);
  };

  const handleSaveTrial = async () => {
    if (!selectedCompany) return;

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          action: 'extend_trial',
          days: parseInt(trialDays, 10)
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Trial for ${selectedCompany.name} successfully extended.`);
        setTrialModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error('Failed to apply trial adjustments.');
    }
  };

  const handleSavePayment = async () => {
    if (!selectedCompany) return;

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          action: 'record_payment',
          amount: parseFloat(paymentAmount)
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`Manual offline payment recorded for ${selectedCompany.name}.`);
        setPaymentModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error('Could not log manual transaction.');
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

  // Filter companies in client side search
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subscription_tier.toLowerCase().includes(search.toLowerCase()) ||
    c.subscription_status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subscriptions & Billing</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Oversight of SaaS commercialization pipeline, paystack nodes, and cash flows.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total MRR */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Recurring Revenue</span>
                <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {formatNaira(kpis?.totalMRR ?? 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              Sum of MRR from all active installer teams
            </p>
          </CardContent>
        </Card>

        {/* Paid Subscriptions */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Paid Subscriptions</span>
                <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {kpis?.paidCount ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-4 leading-relaxed">
              Paying customers, excluding free and trialers
            </p>
          </CardContent>
        </Card>

        {/* ARPU */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Average Revenue Per User</span>
                <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {formatNaira(kpis?.arpu ?? 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-sm shrink-0">
                <Coins className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-4 leading-relaxed">
              ARPU based on active billing contracts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Registry */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden">
        {/* Table Header Filter */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/10">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coins className="h-4.5 w-4.5 text-teal-655" />
            <span>Workspace Subscriptions Ledger</span>
          </h3>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
            <Input
              placeholder="Quick search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9.5 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-505 animate-pulse">Retrieving billing ledgers...</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-16 text-center text-sm font-semibold text-slate-400">
            No active billing registries found matching query filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Paystack Code</th>
                  <th className="px-6 py-4">Trial / Expiration</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredCompanies.map((company) => (
                  <tr 
                    key={company.id} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                      company.suspended ? 'bg-rose-50/30 dark:bg-rose-950/5 opacity-80' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                      {company.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/50 uppercase tracking-wider">
                        {company.subscription_tier || 'Starter'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        company.subscription_status === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50' 
                          : company.subscription_status === 'trial' 
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/50' 
                          : company.subscription_status === 'past_due'
                          ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-250 dark:border-red-900/50'
                          : 'bg-slate-50 dark:bg-slate-900/20 text-slate-655 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {company.subscription_status || 'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-550 dark:text-slate-400">
                      {company.paystack_subscription_code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {company.trial_ends_at ? formatShortDate(company.trial_ends_at) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenTrial(company)}
                          className="h-8.5 rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Clock className="h-4 w-4 text-amber-550" />
                          <span>Trial</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPayment(company)}
                          className="h-8.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          <Coins className="h-4 w-4" />
                          <span>Record Payment</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Trial Extension Modal */}
      {trialModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
          <div 
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setTrialModalOpen(false)}
          />

          <Card className="relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden animate-scale-up mx-4">
            <div className="px-6 py-4.5 bg-slate-900 text-slate-100 flex items-center justify-between">
              <span className="font-black text-base tracking-tight">Extend Onboarding Trial</span>
              <button 
                onClick={() => setTrialModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-semibold text-slate-655 dark:text-slate-400 leading-relaxed">
                Manually extending onboarding trial limits for <strong className="text-slate-800 dark:text-white">{selectedCompany.name}</strong> workspace.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Days to Extend</label>
                <Input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950"
                  min="1"
                />
              </div>

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end gap-2.5">
                <Button 
                  variant="outline"
                  onClick={() => setTrialModalOpen(false)}
                  className="h-10 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveTrial}
                  className="h-10 px-5 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Extend Trial Period
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Offline Payment Modal */}
      {paymentModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
          <div 
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setPaymentModalOpen(false)}
          />

          <Card className="relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden animate-scale-up mx-4">
            <div className="px-6 py-4.5 bg-slate-900 text-slate-100 flex items-center justify-between">
              <span className="font-black text-base tracking-tight">Record Offline Cash Payment</span>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-semibold text-slate-655 dark:text-slate-400 leading-relaxed">
                Log offline subscription payment (e.g. bank transfer or manual cash payout) for <strong className="text-slate-800 dark:text-white">{selectedCompany.name}</strong>.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Amount Received (NGN)</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950"
                  min="1"
                />
              </div>

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end gap-2.5">
                <Button 
                  variant="outline"
                  onClick={() => setPaymentModalOpen(false)}
                  className="h-10 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePayment}
                  className="h-10 px-5 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Log Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
