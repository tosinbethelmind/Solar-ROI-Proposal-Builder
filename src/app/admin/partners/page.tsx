'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users2, 
  Handshake, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle,
  Zap,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Filter,
  DollarSign,
  ChevronDown,
  Info,
  Calendar,
  MessageSquare,
  BadgeAlert
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Partner {
  id: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  whatsapp_number?: string;
  categories: string[];
  regions: string[];
  commission_model: 'percentage_of_sale' | 'flat_fee_per_won_referral' | 'custom';
  commission_rate: number;
  active: boolean;
  notes?: string;
  created_at: string;
}

interface Referral {
  id: string;
  proposal_id?: string;
  company_id: string;
  user_id?: string;
  customer_name?: string;
  equipment_summary?: string;
  system_size?: string;
  preferred_supplier_id?: string;
  preferred_contact_method?: string;
  location?: string;
  status: 'new' | 'assigned' | 'sent_to_supplier' | 'supplier_responded' | 'quoted' | 'won' | 'lost' | 'cancelled';
  expected_commission: number;
  actual_commission: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'waived';
  payout_date?: string;
  latest_note?: string;
  created_at: string;
  updated_at: string;
  companies?: { name: string };
  supplier_partners?: { company_name: string };
}

export default function SupplierPartnersAdmin() {
  const router = useRouter();
  
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = React.useState<'referrals' | 'partners' | 'commissions'>('referrals');
  
  // Loading & Data states
  const [loading, setLoading] = React.useState(true);
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [referrals, setReferrals] = React.useState<Referral[]>([]);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  
  // CRUD Modal States (Partner)
  const [partnerModalOpen, setPartnerModalOpen] = React.useState(false);
  const [editingPartner, setEditingPartner] = React.useState<Partner | null>(null);
  const [pCompanyName, setPCompanyName] = React.useState('');
  const [pContactPerson, setPContactPerson] = React.useState('');
  const [pPhone, setPPhone] = React.useState('');
  const [pEmail, setPEmail] = React.useState('');
  const [pWhatsapp, setPWhatsapp] = React.useState('');
  const [pCategories, setPCategories] = React.useState<string[]>(['panels', 'batteries', 'inverters']);
  const [pRegions, setPRegions] = React.useState<string[]>(['Lagos']);
  const [pCommModel, setPCommModel] = React.useState<'percentage_of_sale' | 'flat_fee_per_won_referral' | 'custom'>('percentage_of_sale');
  const [pCommRate, setPCommRate] = React.useState('5');
  const [pActive, setPActive] = React.useState(true);
  const [pNotes, setPNotes] = React.useState('');

  // Referral Update Drawer/Modal States
  const [referralModalOpen, setReferralModalOpen] = React.useState(false);
  const [selectedReferral, setSelectedReferral] = React.useState<Referral | null>(null);
  const [refStatus, setRefStatus] = React.useState<Referral['status']>('new');
  const [refSupplierId, setRefSupplierId] = React.useState('');
  const [refExpectedComm, setRefExpectedComm] = React.useState('');
  const [refActualComm, setRefActualComm] = React.useState('');
  const [refCommStatus, setRefCommStatus] = React.useState<Referral['commission_status']>('pending');
  const [refPayoutDate, setRefPayoutDate] = React.useState('');
  const [refLatestNote, setRefLatestNote] = React.useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [partnersRes, referralsRes] = await Promise.all([
        fetch('/api/supplier/partners'),
        fetch('/api/supplier/referral')
      ]);

      const partnersJson = await partnersRes.json();
      const referralsJson = await referralsRes.json();

      if (partnersJson.data) setPartners(partnersJson.data);
      if (referralsJson.data) setReferrals(referralsJson.data);
    } catch (err) {
      console.error('Failed to load partnership telemetry:', err);
      toast.error('Could not connect to the Supabase partner sync network.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAllData();
  }, []);

  const formatNaira = (value: number) =>
    `₦${Math.round(value).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Create or Update Partner Form Action
  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pCompanyName) {
      toast.error('Partner company name is required');
      return;
    }

    const payload = {
      id: editingPartner?.id,
      company_name: pCompanyName,
      contact_person: pContactPerson,
      phone: pPhone,
      email: pEmail,
      whatsapp_number: pWhatsapp,
      categories: pCategories,
      regions: pRegions,
      commission_model: pCommModel,
      commission_rate: parseFloat(pCommRate) || 0,
      active: pActive,
      notes: pNotes
    };

    const method = editingPartner ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/supplier/partners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(editingPartner ? 'Supplier partner updated!' : 'New supplier partner created!');
        setPartnerModalOpen(false);
        fetchAllData();
      }
    } catch (err) {
      toast.error('Failed to store supplier partner settings.');
    }
  };

  const openEditPartner = (p: Partner) => {
    setEditingPartner(p);
    setPCompanyName(p.company_name);
    setPContactPerson(p.contact_person || '');
    setPPhone(p.phone || '');
    setPEmail(p.email || '');
    setPWhatsapp(p.whatsapp_number || '');
    setPCategories(p.categories || []);
    setPRegions(p.regions || []);
    setPCommModel(p.commission_model);
    setPCommRate(String(p.commission_rate));
    setPActive(p.active);
    setPNotes(p.notes || '');
    setPartnerModalOpen(true);
  };

  const openNewPartner = () => {
    setEditingPartner(null);
    setPCompanyName('');
    setPContactPerson('');
    setPPhone('');
    setPEmail('');
    setPWhatsapp('');
    setPCategories(['panels', 'batteries', 'inverters']);
    setPRegions(['Lagos']);
    setPCommModel('percentage_of_sale');
    setPCommRate('5');
    setPActive(true);
    setPNotes('');
    setPartnerModalOpen(true);
  };

  // Update Referral Action
  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;

    const payload = {
      id: selectedReferral.id,
      status: refStatus,
      preferred_supplier_id: refSupplierId || null,
      expected_commission: refExpectedComm || 0,
      actual_commission: refActualComm || 0,
      commission_status: refCommStatus,
      payout_date: refPayoutDate || null,
      latest_note: refLatestNote
    };

    try {
      const res = await fetch('/api/supplier/referral', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Supplier referral updated successfully!');
        setReferralModalOpen(false);
        fetchAllData();
      }
    } catch (err) {
      toast.error('Failed to save referral updates.');
    }
  };

  const openEditReferral = (r: Referral) => {
    setSelectedReferral(r);
    setRefStatus(r.status);
    setRefSupplierId(r.preferred_supplier_id || '');
    setRefExpectedComm(String(r.expected_commission));
    setRefActualComm(String(r.actual_commission));
    setRefCommStatus(r.commission_status);
    setRefPayoutDate(r.payout_date || '');
    setRefLatestNote(r.latest_note || '');
    setReferralModalOpen(true);
  };

  // WhatsApp Pitch Draft Builder
  const triggerWhatsAppDraft = (r: Referral) => {
    const supplier = partners.find(p => p.id === r.preferred_supplier_id);
    const phoneNum = supplier?.whatsapp_number || supplier?.phone || '';
    if (!phoneNum) {
      toast.error('No WhatsApp number configured for this partner.');
      return;
    }

    const message = `Hi ${supplier?.contact_person || supplier?.company_name},\n\nWe have a new customer referral for quote from SolarQuotePro:\n\n- Sizing: ${r.system_size || 'N/A'}\n- Component Request: ${r.equipment_summary || 'N/A'}\n- Installation Location: ${r.location || 'Lagos'}\n- Referral ID: ${r.id.substring(0, 8)}\n\nPlease review inventory and send our rep a wholesale quote. Thanks!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNum.replace(/\+/g, '')}?text=${encoded}`, '_blank');
  };

  // Dynamic KPI Card Sizing Calculations
  const stats = React.useMemo(() => {
    const total = referrals.length;
    const won = referrals.filter(r => r.status === 'won').length;
    const expected = referrals.reduce((acc, r) => acc + (r.expected_commission || 0), 0);
    const paid = referrals.reduce((acc, r) => acc + (r.commission_status === 'paid' ? r.actual_commission : 0), 0);

    return { total, won, expected, paid };
  }, [referrals]);

  // Filtering Logic
  const filteredReferrals = React.useMemo(() => {
    return referrals.filter(r => {
      const matchSearch = 
        r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.companies?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [referrals, searchQuery, statusFilter]);

  const filteredCommissions = React.useMemo(() => {
    return referrals.filter(r => {
      const matchSearch = 
        r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.supplier_partners?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch && r.status === 'won';
    });
  }, [referrals, searchQuery]);

  const filteredPartners = React.useMemo(() => {
    return partners.filter(p => 
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [partners, searchQuery]);

  return (
    <div className="space-y-8">
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <Handshake className="h-4.5 w-4.5 shrink-0" />
            <span>Revenue Partnerships Center</span>
          </div>
          <h1 className="text-3xl font-black text-slate-855 dark:text-slate-55 tracking-tight mt-1">Supplier Referrals & Commissions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Track equipment sourcing requests, assign distributor partners, and capture high-margin won commission audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={openNewPartner} className="bg-teal-650 hover:bg-teal-700 text-white text-xs font-bold rounded-xl h-10 px-4 flex items-center gap-1.5 shadow-sm border border-transparent">
            <Plus className="w-4 h-4" /> Add Supplier Partner
          </Button>
        </div>
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sourcing Requests', value: stats.total, desc: 'Installer referrals logged', color: 'text-indigo-650 bg-indigo-500/10' },
          { label: 'Won Conversions', value: stats.won, desc: `${stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0}% Conversion Rate`, color: 'text-emerald-650 bg-emerald-500/10' },
          { label: 'Expected Pipeline', value: formatNaira(stats.expected), desc: 'Pending admin review', color: 'text-amber-650 bg-amber-500/10' },
          { label: 'Paid Commissions', value: formatNaira(stats.paid), desc: 'Naira cash received', color: 'text-teal-650 bg-teal-500/10' }
        ].map((kpi, idx) => (
          <Card key={idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-widest leading-none">{kpi.label}</p>
                <h3 className="text-2xl font-black tracking-tight text-slate-855 dark:text-slate-50 mt-2.5">{kpi.value}</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                <span className={`inline-block size-1.5 rounded-full ${kpi.color.split(' ')[0]} animate-pulse`} />
                {kpi.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Sub-Tabs Controls ═══ */}
      <div className="flex border-b border-slate-250 dark:border-slate-800">
        {[
          { id: 'referrals', label: 'Supplier Referrals' },
          { id: 'partners', label: 'Supplier Partners' },
          { id: 'commissions', label: 'Commission Tracking' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setSearchQuery('');
            }}
            className={`py-3 px-6 text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all cursor-pointer ${
              activeSubTab === tab.id 
                ? 'border-teal-500 text-teal-650 dark:text-teal-400 font-sans' 
                : 'border-transparent text-slate-455 hover:text-slate-800 dark:hover:text-slate-350'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Filter Bar ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'referrals' ? 'Search by client, location, or workspace...' :
              activeSubTab === 'partners' ? 'Search by partner name or contact...' :
              'Search commissions by client or supplier...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full text-xs font-bold bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none focus:border-teal-500/50 transition-all text-slate-855 dark:text-slate-100"
          />
        </div>

        {activeSubTab === 'referrals' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-bold p-2.5 w-full md:w-48 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl focus:outline-none"
            >
              <option value="ALL">All Referrals</option>
              <option value="new">New Requests</option>
              <option value="assigned">Assigned</option>
              <option value="sent_to_supplier">Sent To Supplier</option>
              <option value="supplier_responded">Supplier Responded</option>
              <option value="quoted">Quoted</option>
              <option value="won">Won Deals</option>
              <option value="lost">Lost Deals</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* ═══ Main Telemetry Table Views ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="size-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* View A: Referrals Ledger */}
            {activeSubTab === 'referrals' && (
              <div className="overflow-x-auto">
                {filteredReferrals.length === 0 ? (
                  <div className="py-16 text-center text-slate-455 text-xs italic">No sourcing referrals matched the filter settings.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-550 dark:text-slate-455 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4">Client Project</th>
                        <th className="px-6 py-4">Workspace Rep</th>
                        <th className="px-6 py-4">Required Kit BOM</th>
                        <th className="px-6 py-4">Target Supplier</th>
                        <th className="px-6 py-4">Referral Status</th>
                        <th className="px-6 py-4 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                      {filteredReferrals.map(ref => (
                        <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-855 dark:text-slate-100">
                            <div>{ref.customer_name || 'Unnamed Client'}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{ref.location || 'Lagos'}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-555 dark:text-slate-400">
                            <div>{ref.companies?.name || 'Installer'}</div>
                            <div className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{ref.preferred_contact_method || 'whatsapp'} sync</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-slate-350">{ref.system_size || 'Custom Size'}</div>
                            <div className="text-[10px] text-slate-455 truncate max-w-[200px]" title={ref.equipment_summary || ''}>{ref.equipment_summary || 'Component list...'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {ref.supplier_partners?.company_name ? (
                              <Badge className="bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/50 font-extrabold text-[9px] py-0.5 rounded-full">
                                {ref.supplier_partners.company_name}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-amber-500 font-black flex items-center gap-1">
                                <BadgeAlert className="w-3.5 h-3.5" /> Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                              ref.status === 'won' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250' :
                              ref.status === 'new' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-250' :
                              ref.status === 'lost' || ref.status === 'cancelled' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border-rose-250' :
                              'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250'
                            }`}>
                              {ref.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" className="h-8.5 rounded-xl text-xs font-bold" onClick={() => openEditReferral(ref)}>
                                Process
                              </Button>
                              <Button size="sm" className="bg-emerald-650 hover:bg-emerald-700 text-white h-8.5 rounded-xl text-xs font-bold border border-transparent" onClick={() => triggerWhatsAppDraft(ref)}>
                                WhatsApp Partner
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* View B: Partners Dashboard */}
            {activeSubTab === 'partners' && (
              <div className="overflow-x-auto">
                {filteredPartners.length === 0 ? (
                  <div className="py-16 text-center text-slate-455 text-xs italic">No supplier partners registered.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-550 dark:text-slate-455 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4">Supplier Company</th>
                        <th className="px-6 py-4">Categories Supplied</th>
                        <th className="px-6 py-4">Active Territory</th>
                        <th className="px-6 py-4">Commission Model</th>
                        <th className="px-6 py-4">Partnership Status</th>
                        <th className="px-6 py-4 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                      {filteredPartners.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-855 dark:text-slate-100">
                            <div>{p.company_name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.contact_person || 'No owner logged'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {p.categories?.map((cat, i) => (
                                <Badge key={i} variant="outline" className="text-[8px] uppercase tracking-wider font-extrabold border-slate-300">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-555 dark:text-slate-400 font-semibold">{p.regions?.join(', ') || 'All Regions'}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-slate-300">
                              {p.commission_model === 'percentage_of_sale' ? `${p.commission_rate}% Of Sale` :
                               p.commission_model === 'flat_fee_per_won_referral' ? `${formatNaira(p.commission_rate)} / Won` :
                               'Custom Model'}
                            </div>
                            <div className="text-[10px] text-slate-455 mt-0.5 uppercase tracking-wider font-extrabold">{p.commission_model.replace(/_/g, ' ')}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={p.active ? 'bg-emerald-100 text-emerald-800 border-none' : 'bg-slate-200 text-slate-555 border-none'}>
                              {p.active ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" className="h-8.5 rounded-xl text-xs font-bold" onClick={() => openEditPartner(p)}>
                              Edit Configuration
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* View C: Commission Tracking Ledger */}
            {activeSubTab === 'commissions' && (
              <div className="overflow-x-auto">
                {filteredCommissions.length === 0 ? (
                  <div className="py-16 text-center text-slate-455 text-xs italic">No won conversions found to audit commissions.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-550 dark:text-slate-455 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Won Supplier Partner</th>
                        <th className="px-6 py-4">Expected Margin</th>
                        <th className="px-6 py-4">Actual Commission Received</th>
                        <th className="px-6 py-4">Payout Date</th>
                        <th className="px-6 py-4">Commission Status</th>
                        <th className="px-6 py-4 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                      {filteredCommissions.map(ref => (
                        <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-855 dark:text-slate-100">
                            <div>{ref.customer_name || 'Project'}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Ref ID: {ref.id.substring(0, 8)}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-555 dark:text-slate-400 font-semibold">{ref.supplier_partners?.company_name || 'N/A'}</td>
                          <td className="px-6 py-4 text-slate-800 dark:text-slate-330 font-bold">{formatNaira(ref.expected_commission)}</td>
                          <td className="px-6 py-4 text-emerald-650 dark:text-emerald-400 font-black">{formatNaira(ref.actual_commission)}</td>
                          <td className="px-6 py-4 text-slate-455 font-bold">{ref.payout_date ? formatShortDate(ref.payout_date) : 'Pending Cashout'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                              ref.commission_status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250' :
                              ref.commission_status === 'waived' ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200' :
                              'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250'
                            }`}>
                              {ref.commission_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" className="h-8.5 rounded-xl text-xs font-bold" onClick={() => openEditReferral(ref)}>
                              Update Payout
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ CRUD MODAL: Supplier Partner Creator/Editor ═══ */}
      {partnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-805 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-base font-black text-slate-855 dark:text-slate-50 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                {editingPartner ? 'Modify Supplier Partner Configuration' : 'Register New Equipment Supplier'}
              </h3>
              <button onClick={() => setPartnerModalOpen(false)} className="text-slate-400 hover:text-slate-655 font-bold text-xs">✕ Close</button>
            </div>
            
            <form onSubmit={handlePartnerSubmit} className="p-6 space-y-4.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Company Registered Name</label>
                  <input type="text" required value={pCompanyName} onChange={e => setPCompanyName(e.target.value)} placeholder="e.g. Gennex Technologies Ltd" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Primary contact person</label>
                  <input type="text" value={pContactPerson} onChange={e => setPContactPerson(e.target.value)} placeholder="e.g. Ademola Alabi" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Phone number</label>
                  <input type="tel" value={pPhone} onChange={e => setPPhone(e.target.value)} placeholder="e.g. +234..." className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">WhatsApp Delivery Number</label>
                  <input type="tel" value={pWhatsapp} onChange={e => setPWhatsapp(e.target.value)} placeholder="e.g. +234..." className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Corporate Email</label>
                  <input type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} placeholder="name@supplier.com" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Preferred Commission Model</label>
                  <select value={pCommModel} onChange={e => setPCommModel(e.target.value as any)} className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none">
                    <option value="percentage_of_sale">Percentage of Sale %</option>
                    <option value="flat_fee_per_won_referral">Flat Fee per won referral (₦)</option>
                    <option value="custom">Custom/Manual setting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Commission rate (Rate/Value)</label>
                  <input type="number" step="any" value={pCommRate} onChange={e => setPCommRate(e.target.value)} placeholder="e.g. 5" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Partnership active</label>
                  <select value={pActive ? 'true' : 'false'} onChange={e => setPActive(e.target.value === 'true')} className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none">
                    <option value="true">Active Partnership</option>
                    <option value="false">Suspended / Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Active Sourcing Territory (Comma Separated)</label>
                  <input type="text" value={pRegions.join(', ')} onChange={e => setPRegions(e.target.value.split(',').map(s => s.trim()))} placeholder="e.g. Lagos, Abuja, Port Harcourt" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Equipment Supplied (Comma Separated)</label>
                  <input type="text" value={pCategories.join(', ')} onChange={e => setPCategories(e.target.value.split(',').map(s => s.trim()))} placeholder="panels, batteries, inverters, accessories" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Operational Notes & T&C Details</label>
                <textarea rows={2} value={pNotes} onChange={e => setPNotes(e.target.value)} placeholder="e.g. standard 5% hardware discount, clears from Apapa port..." className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-950 focus:outline-none resize-none" />
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-slate-200 dark:border-slate-805">
                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setPartnerModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-teal-650 hover:bg-teal-700 text-white h-10 rounded-xl px-6 border border-transparent">
                  {editingPartner ? 'Apply Configuration' : 'Onboard Partner'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ═══ REFERRAL DETAIL & COMMISSION UPDATE DRAWER/MODAL ═══ */}
      {referralModalOpen && selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-805 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-black text-slate-855 dark:text-slate-555">Process Sourcing Request</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Assigned to: {selectedReferral.companies?.name}</p>
              </div>
              <button onClick={() => setReferralModalOpen(false)} className="text-slate-400 hover:text-slate-655 font-bold text-xs">✕ Close</button>
            </div>

            <form onSubmit={handleReferralSubmit} className="p-6 space-y-4.5 text-xs">
              
              {/* Sizing & Components details prefilled */}
              <div className="bg-slate-50 dark:bg-slate-955 p-4 border border-slate-250 dark:border-slate-805 rounded-2xl space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Target Kit: {selectedReferral.system_size || 'Custom'}</span>
                  <span className="text-slate-500">Location: {selectedReferral.location || 'Lagos'}</span>
                </div>
                <div className="text-slate-600 truncate text-[11px] leading-relaxed">
                  <strong>Specs:</strong> {selectedReferral.equipment_summary || 'No granular specs parsed.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Assign Partner Supplier</label>
                  <select 
                    value={refSupplierId} 
                    onChange={e => setRefSupplierId(e.target.value)} 
                    className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-955 focus:outline-none"
                  >
                    <option value="">-- Choose Partner Importer --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.company_name} ({p.commission_model === 'percentage_of_sale' ? `${p.commission_rate}%` : 'Flat'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Referral Sourcing Status</label>
                  <select 
                    value={refStatus} 
                    onChange={e => setRefStatus(e.target.value as any)} 
                    className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-955 focus:outline-none"
                  >
                    <option value="new">New Sourcing Request</option>
                    <option value="assigned">Assigned</option>
                    <option value="sent_to_supplier">Sent to Supplier Partner</option>
                    <option value="supplier_responded">Supplier Responded</option>
                    <option value="quoted">Quoted</option>
                    <option value="won">Won Conversion (Paid)</option>
                    <option value="lost">Lost</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Expected Commission (₦)</label>
                  <input type="number" value={refExpectedComm} onChange={e => setRefExpectedComm(e.target.value)} placeholder="0" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-955 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Actual Commission Received (₦)</label>
                  <input type="number" value={refActualComm} onChange={e => setRefActualComm(e.target.value)} placeholder="0" className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-955 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Payout Status</label>
                  <select 
                    value={refCommStatus} 
                    onChange={e => setRefCommStatus(e.target.value as any)} 
                    className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-955 focus:outline-none"
                  >
                    <option value="pending">Pending Payment</option>
                    <option value="approved">Approved & Audited</option>
                    <option value="paid">Paid (Cash received)</option>
                    <option value="waived">Waived/Displaced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Payout Date</label>
                  <input type="date" value={refPayoutDate} onChange={e => setRefPayoutDate(e.target.value)} className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-955 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-455 font-bold mb-1 uppercase tracking-wider">Latest Operational Notes</label>
                <input type="text" value={refLatestNote} onChange={e => setRefLatestNote(e.target.value)} placeholder="e.g. Gennex matching pricing, invoice dispatched to installer..." className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-955 focus:outline-none" />
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-slate-200 dark:border-slate-805">
                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setReferralModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-teal-650 hover:bg-teal-700 text-white h-10 rounded-xl px-6 border border-transparent">
                  Save Referral State
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
