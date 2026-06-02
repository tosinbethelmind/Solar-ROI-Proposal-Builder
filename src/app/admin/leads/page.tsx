'use client';

import * as React from 'react';
import { 
  UserCheck, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Download, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  Inbox, 
  Trash2, 
  ArrowUpRight, 
  Zap, 
  RefreshCw,
  Building2,
  ShieldCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface HomeownerLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  running_load_w: number | null;
  kva_recommended: string | null;
  monthly_savings_ngn: number | null;
  monthly_fuel_spend: number | null;
  created_at: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = React.useState<HomeownerLead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCapacity, setSelectedCapacity] = React.useState<string>('all');
  const [selectedLocation, setSelectedLocation] = React.useState<string>('all');

  const fetchLeads = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch('/api/leads/homeowner');
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else if (json.data) {
        setLeads(json.data);
      }
    } catch (err) {
      console.error('Failed to load B2C homeowner leads:', err);
      toast.error('Could not connect to lead persistence service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchLeads();
  }, []);

  const formatNaira = (value: number | null) => {
    if (value === null) return '₦0';
    return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // WhatsApp link creator
  const getWhatsAppLink = (lead: HomeownerLead) => {
    let cleanPhone = lead.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    const message = `Hello ${lead.name},\n\nThis is the SolarPro Admin Team following up on your solar sizing report. We calculated that you could save up to ${formatNaira(lead.monthly_savings_ngn)}/mo on fuel by deploying a custom ${lead.kva_recommended || 'solar'} solution.\n\nLet's schedule a free engineering inspection call to review your property?`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // CSV Export
  const exportToCSV = () => {
    if (!filteredLeads.length) {
      toast.error('No leads found to export.');
      return;
    }
    const headers = ['Name', 'Phone', 'Email', 'Location', 'Running Load (W)', 'Recommended Size', 'Monthly Spend (NGN)', 'Estimated Savings (NGN)', 'Date Captured'];
    const rows = filteredLeads.map(l => [
      l.name,
      l.phone,
      l.email || '',
      l.location || '',
      l.running_load_w || '',
      l.kva_recommended || '',
      l.monthly_fuel_spend || '',
      l.monthly_savings_ngn || '',
      new Date(l.created_at).toLocaleString('en-NG')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solarpro_B2C_homeowner_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads database exported successfully to CSV!');
  };

  // Dynamic filter lists
  const locations = React.useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.location) set.add(l.location.trim());
    });
    return Array.from(set).sort();
  }, [leads]);

  const filteredLeads = React.useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = 
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.location && l.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.phone.includes(searchQuery);

      const matchesCapacity = selectedCapacity === 'all' || l.kva_recommended === selectedCapacity;
      const matchesLoc = selectedLocation === 'all' || l.location === selectedLocation;

      return matchesSearch && matchesCapacity && matchesLoc;
    });
  }, [leads, searchQuery, selectedCapacity, selectedLocation]);

  // KPI states calculated dynamically
  const stats = React.useMemo(() => {
    const total = leads.length;
    const totalSavings = leads.reduce((acc, curr) => acc + (curr.monthly_savings_ngn || 0), 0);
    const totalFuelSpend = leads.reduce((acc, curr) => acc + (curr.monthly_fuel_spend || 0), 0);
    const highValueCount = leads.filter(l => (l.monthly_fuel_spend || 0) >= 150000).length;
    
    const leadsWithLoad = leads.filter(l => l.running_load_w !== null);
    const avgLoad = leadsWithLoad.length 
      ? Math.round(leadsWithLoad.reduce((acc, curr) => acc + (curr.running_load_w || 0), 0) / leadsWithLoad.length)
      : 0;

    return { total, totalSavings, totalFuelSpend, highValueCount, avgLoad };
  }, [leads]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"></div>
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>B2C Homeowner Lead Pipelines</span>
          </div>
          <h1 className="text-3xl font-black text-slate-855 dark:text-slate-50 tracking-tight mt-1">Sizer Capture Console</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Auditing prospects captured via the Step 2 sizing calculator intercept sizer bundle.
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button 
            aria-label="Refresh leads data"
            variant="outline" 
            size="sm" 
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="h-9.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button 
            onClick={exportToCSV}
            size="sm" 
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl h-9.5 border-none shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Ledger</span>
          </Button>
        </div>
      </div>

      {/* ═══ KPI Cards Summary Row ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Captured Leads', 
            value: stats.total, 
            desc: 'B2C Homeowner profiles',
            icon: UserCheck, 
            color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
          },
          { 
            label: 'Est. Combined Savings', 
            value: formatNaira(stats.totalSavings), 
            desc: 'Calculated monthly savings',
            icon: TrendingUp, 
            color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
          },
          { 
            label: 'High-Value Prospects', 
            value: stats.highValueCount, 
            desc: 'Monthly fuel spend ≥ ₦150k',
            icon: Sparkles, 
            color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
          },
          { 
            label: 'Avg Running Load', 
            value: `${stats.avgLoad.toLocaleString()} W`, 
            desc: 'Calculated building loads',
            icon: Zap, 
            color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10'
          }
        ].map((stat, idx) => (
          <Card key={idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-xl ${stat.color} shrink-0`}>
                  <stat.icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-xl font-black tracking-tight text-slate-855 dark:text-slate-50 mt-0.5">{stat.value}</h3>
                <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-1 leading-none">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ Main Table & Filtering View ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Table Filters with Search */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-slate-855 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="h-4.5 w-4.5 text-indigo-500" />
              <span>Captured Leads Database</span>
            </h3>
            <p className="text-xs text-slate-500">Live grid of prospects containing sizing profiles and fuel spending indicators.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-stretch sm:items-center">
            {/* Search input */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[240px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-455" />
              <input
                type="text"
                placeholder="Search leads by name, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9.5 pr-4 py-2 w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500/50 transition-all dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* kVA Capacity dropdown filter */}
            <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5 text-slate-450" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Size:</span>
              <select
                aria-label="Filter leads by system size"
                value={selectedCapacity}
                onChange={e => setSelectedCapacity(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-slate-700 dark:text-slate-350 pr-1 text-xs font-bold"
              >
                <option value="all" className="dark:bg-slate-950">All Capacities</option>
                <option value="3 kVA" className="dark:bg-slate-950">3 kVA</option>
                <option value="5 kVA" className="dark:bg-slate-950">5 kVA</option>
                <option value="10 kVA" className="dark:bg-slate-950">10 kVA</option>
              </select>
            </div>

            {/* Location dropdown filter */}
            <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5 text-slate-450" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Location:</span>
              <select
                aria-label="Filter leads by city"
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-slate-700 dark:text-slate-350 pr-1 max-w-[140px] text-xs font-bold"
              >
                <option value="all" className="dark:bg-slate-950">All Cities</option>
                {locations.map(loc => (
                  <option key={loc} value={loc} className="dark:bg-slate-950">{loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Capacity Quick Tags Selection */}
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mr-1.5">Quick Sizes:</span>
          {[
            { id: 'all', label: 'All Capacities' },
            { id: '3 kVA', label: '3 kVA' },
            { id: '5 kVA', label: '5 kVA' },
            { id: '10 kVA', label: '10 kVA' }
          ].map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedCapacity(tag.id)}
              className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border tracking-wider transition-all cursor-pointer ${
                selectedCapacity === tag.id
                  ? 'bg-teal-500/15 border-teal-500/35 text-teal-650 dark:text-teal-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
              <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-xs text-slate-450 italic font-bold">No homeowner prospects matched your query terms.</p>
              {leads.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => { setSearchQuery(''); setSelectedCapacity('all'); setSelectedLocation('all'); }}
                  className="text-xs font-bold text-teal-600"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-550 dark:text-slate-455 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 select-none">
                  <th className="px-6 py-4">Homeowner Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Building Location</th>
                  <th className="px-6 py-4">Calculated Load Profile</th>
                  <th className="px-6 py-4">Monthly Spend / Savings</th>
                  <th className="px-6 py-4">Captured Date</th>
                  <th className="px-6 py-4 text-right">Outreach Shortcuts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                {filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                  >
                    {/* User profile with initials */}
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/15 to-emerald-600/15 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-xs shadow-sm">
                          {lead.name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span>{lead.name}</span>
                          <span className="text-[10px] text-slate-450 font-medium lowercase tracking-normal mt-0.5 truncate max-w-[130px]" title={lead.email || ''}>
                            {lead.email || 'no email logged'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact detail lists */}
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-350">
                      <div className="flex flex-col gap-1">
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-teal-655 transition-colors text-xs font-extrabold">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{lead.phone}</span>
                        </a>
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-teal-655 transition-colors text-[10px] text-slate-400 font-bold">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>Email prospect</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Location detail */}
                    <td className="px-6 py-4">
                      {lead.location ? (
                        <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400 font-semibold">
                          <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                          <span>{lead.location}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic">None logged</span>
                      )}
                    </td>

                    {/* Recommended kVA & Load details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-750 dark:bg-slate-800 dark:text-slate-330 border border-slate-200 dark:border-slate-750 uppercase text-[9px] font-black px-2 py-0.5 rounded-lg tracking-wider">
                            {lead.kva_recommended || 'Unknown'}
                          </Badge>
                        </div>
                        {lead.running_load_w && (
                          <span className="text-[10px] text-slate-455 dark:text-slate-500 font-bold">
                            Running Load: {lead.running_load_w.toLocaleString()} W
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fuel spend & Savings */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 font-bold">
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Spend:</span>
                          <span className="tabular-nums font-black">{formatNaira(lead.monthly_fuel_spend)}</span>
                        </span>
                        <span className="text-emerald-650 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Save:</span>
                          <span className="tabular-nums font-black">{formatNaira(lead.monthly_savings_ngn)}</span>
                        </span>
                      </div>
                    </td>

                    {/* Timestamps */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-550 font-bold">
                      <div className="flex flex-col">
                        <span>{formatShortDate(lead.created_at)}</span>
                        <span className="text-[9px] text-slate-405 dark:text-slate-600 mt-0.5 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{formatTime(lead.created_at)}</span>
                        </span>
                      </div>
                    </td>

                    {/* CTA Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end items-center">
                        <a 
                          href={getWhatsAppLink(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp chat with formatted sizing details"
                        >
                          <Button 
                            aria-label={`Open WhatsApp chat with ${lead.name}`}
                            size="sm" 
                            variant="ghost" 
                            className="h-8.5 rounded-xl border border-emerald-200/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:border-emerald-955/20 dark:text-emerald-450 dark:hover:bg-emerald-955/30 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5 fill-emerald-500/5" />
                            <span>WhatsApp</span>
                          </Button>
                        </a>

                        <a href={`tel:${lead.phone}`} title="Call homeowner prospect">
                          <Button 
                            aria-label={`Call ${lead.name}`}
                            size="sm" 
                            variant="ghost" 
                            className="h-8.5 w-8.5 rounded-xl p-0 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center cursor-pointer shadow-sm"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                        </a>
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
