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
  Filter,
  Copy,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import LeadStatusSelect from '@/components/LeadStatusSelect';

interface HomeownerLead {
  status?: string;
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

interface EnterpriseLead {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  project_scope: string | null;
  status: string;
  created_at: string;
}

export default function AdminLeads() {
  const [activeTab, setActiveTab] = React.useState<'homeowner' | 'enterprise'>('homeowner');
  const [leads, setLeads] = React.useState<HomeownerLead[]>([]);
  const [enterpriseLeads, setEnterpriseLeads] = React.useState<EnterpriseLead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCapacity, setSelectedCapacity] = React.useState<string>('all');
  const [selectedLocation, setSelectedLocation] = React.useState<string>('all');
  const [selectedCity, setSelectedCity] = React.useState<string>('lagos');

  // AI Outreach states
  const [selectedLead, setSelectedLead] = React.useState<HomeownerLead | null>(null);
  const [selectedEnterpriseLead, setSelectedEnterpriseLead] = React.useState<EnterpriseLead | null>(null);
  const [googleToken, setGoogleToken] = React.useState<string | null>(null);
  const [scriptStyle, setScriptStyle] = React.useState<'whatsapp' | 'email' | 'call'>('whatsapp');
  const [generatedScript, setGeneratedScript] = React.useState<string>('');
  const [generatingScript, setGeneratingScript] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    fetchLeads();
    fetchEnterpriseLeads();
    
    // Check Google Auth token
    const token = localStorage.getItem('google_oauth_token');
    const expiresAt = localStorage.getItem('google_oauth_token_expires_at');
    if (token) {
      if (expiresAt && new Date().getTime() > parseInt(expiresAt, 10)) {
        localStorage.removeItem('google_oauth_token');
        localStorage.removeItem('google_oauth_token_expires_at');
        setGoogleToken(null);
      } else {
        setGoogleToken(token);
      }
    }
  }, []);

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
        if (json.data.length > 0 && !selectedLead) {
          setSelectedLead(json.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load B2C homeowner leads:', err);
      toast.error('Could not connect to lead persistence service.');
    } finally {
      if (activeTab === 'homeowner') {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const fetchEnterpriseLeads = async (isSilent = false) => {
    if (!isSilent && activeTab === 'enterprise') setLoading(true);
    else if (activeTab === 'enterprise') setRefreshing(true);

    try {
      const res = await fetch('/api/leads/enterprise');
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else if (json.data) {
        setEnterpriseLeads(json.data);
        if (json.data.length > 0 && !selectedEnterpriseLead) {
          setSelectedEnterpriseLead(json.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load B2B enterprise leads:', err);
      toast.error('Could not connect to B2B leads service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'homeowner') {
      await fetchLeads(true);
    } else {
      await fetchEnterpriseLeads(true);
    }
    setRefreshing(false);
  };

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

  const initiateOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';
    const redirectUri = window.location.origin + '/admin/scrapers/callback';
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/generative-language'
    ].join(' ');
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent('/admin/leads')}&prompt=consent`;
    window.location.href = oauthUrl;
  };

  const handleGenerateScript = async () => {
    if (activeTab === 'homeowner' && !selectedLead) {
      toast.error('Please select a lead first.');
      return;
    }
    if (activeTab === 'enterprise' && !selectedEnterpriseLead) {
      toast.error('Please select an enterprise lead first.');
      return;
    }
    if (!googleToken) {
      toast.error('Google authorization required.');
      return;
    }

    setGeneratingScript(true);
    setGeneratedScript('');
    
    try {
      let promptText = '';
      if (activeTab === 'homeowner' && selectedLead) {
        promptText = `You are a professional solar engineer & sales consultant in Nigeria for SolarQuotePro. 
        Generate a customized outreach script for a homeowner lead with these details:
        - Name: ${selectedLead.name}
        - Phone: ${selectedLead.phone}
        - Location: ${selectedLead.location || 'Lagos'}
        - Recommended Solar Inverter size: ${selectedLead.kva_recommended || '5kVA'}
        - Running Load Profile: ${selectedLead.running_load_w || 2500} W
        - Monthly Petrol/Diesel spend: ${formatNaira(selectedLead.monthly_fuel_spend)}
        - Estimated solar monthly savings: ${formatNaira(selectedLead.monthly_savings_ngn)}
        
        Generate a highly-persuasive outreach script in the style: "${scriptStyle.toUpperCase()}". 
        Keep it punchy, focus on Naira fuel offset and payback period. 
        Include call-to-actions to book a roof structural assessment. 
        Do NOT write any meta preamble, start directly with the outreach message content.`;
      } else if (activeTab === 'enterprise' && selectedEnterpriseLead) {
        promptText = `You are a professional commercial solar engineer & sales consultant in Nigeria for SolarQuotePro. 
        Generate a customized corporate proposal pitch or outreach message for an enterprise lead with these details:
        - Company Name: ${selectedEnterpriseLead.company_name}
        - Contact Person: ${selectedEnterpriseLead.contact_person}
        - Phone: ${selectedEnterpriseLead.phone || 'N/A'}
        - Email: ${selectedEnterpriseLead.email}
        - Target City: ${selectedCity}
        - Project Scope: ${selectedEnterpriseLead.project_scope || 'Commercial solar installation'}
        
        Generate a highly-persuasive corporate outreach script in the style: "${scriptStyle.toUpperCase()}". 
        Focus on business electricity tariff offset, operational reliability, backup power, payback period, and corporate sustainability.
        Include call-to-actions to schedule a site energy audit. 
        Do NOT write any meta preamble, start directly with the outreach message content.`;
      }

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const json = await response.json();
      const scriptText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!scriptText) {
        throw new Error('No script returned from Gemini.');
      }
      
      setGeneratedScript(scriptText.trim());
      toast.success('Outreach script generated successfully!');
    } catch (e: any) {
      console.error(e);
      toast.error(`AI Generation failed: ${e.message || 'Check your Google connection token'}`);
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleCopyScript = () => {
    if (!generatedScript) return;
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    toast.success('Copied script text to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const activeLead = activeTab === 'homeowner' ? selectedLead : selectedEnterpriseLead;
    if (!activeLead) return;
    let cleanPhone = (activeLead.phone || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }

    const recipientName = activeTab === 'homeowner' 
      ? (selectedLead?.name || 'Customer')
      : (selectedEnterpriseLead?.contact_person || 'Partner');

    const text = generatedScript || `Hello ${recipientName}, following up on your SolarQuotePro sizing report...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getWhatsAppLink = (lead: HomeownerLead) => {
    let cleanPhone = lead.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    const message = `Hello ${lead.name},\n\nThis is the SolarQuotePro Admin Team following up on your solar sizing report. We calculated that you could save up to ${formatNaira(lead.monthly_savings_ngn)}/mo on fuel by deploying a custom ${lead.kva_recommended || 'solar'} solution.\n\nLet's schedule a free engineering inspection call to review your property?`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getEnterpriseWhatsAppLink = (lead: EnterpriseLead) => {
    let cleanPhone = (lead.phone || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    const message = `Hello ${lead.contact_person},\n\nThis is the SolarQuotePro Enterprise Team. We received your request regarding a commercial solar proposal for ${lead.company_name}.\n\nLet's schedule a brief call to align on scope and complete the grid-compliance review?`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // CSV Export for Homeowner
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
    link.setAttribute("download", `solarquotepro_B2C_homeowner_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads database exported successfully to CSV!');
  };

  // CSV Export for Enterprise
  const exportEnterpriseToCSV = () => {
    if (!filteredEnterpriseLeads.length) {
      toast.error('No B2B enterprise leads found to export.');
      return;
    }
    const headers = ['Company Name', 'Contact Person', 'Email', 'Phone', 'Project Scope', 'Status', 'Date Captured'];
    const rows = filteredEnterpriseLeads.map(l => [
      l.company_name,
      l.contact_person,
      l.email,
      l.phone || '',
      l.project_scope || '',
      l.status,
      new Date(l.created_at).toLocaleString('en-NG')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solarquotepro_B2B_enterprise_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Enterprise leads database exported successfully to CSV!');
  };

  const handleUpdateEnterpriseStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/leads/enterprise', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus })
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        toast.success('Enterprise lead status updated');
        setEnterpriseLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        if (selectedEnterpriseLead?.id === leadId) {
          setSelectedEnterpriseLead(curr => curr ? { ...curr, status: newStatus } : null);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update enterprise lead status');
    }
  };

  const handleDownloadCompliancePDF = (leadId: string) => {
    window.open(`/api/admin/leads/export-pdf?leadId=${leadId}&leadType=enterprise&city=${selectedCity}`, '_blank');
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

  const filteredEnterpriseLeads = React.useMemo(() => {
    return enterpriseLeads.filter(l => {
      const matchesSearch = 
        l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.project_scope && l.project_scope.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.phone && l.phone.includes(searchQuery));

      const matchesStatus = selectedLocation === 'all' || l.status === selectedLocation;

      return matchesSearch && matchesStatus;
    });
  }, [enterpriseLeads, searchQuery, selectedLocation]);

  // KPI stats calculated dynamically
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

  const enterpriseStats = React.useMemo(() => {
    const total = enterpriseLeads.length;
    const newCount = enterpriseLeads.filter(l => l.status === 'new').length;
    const contactedCount = enterpriseLeads.filter(l => l.status === 'contacted').length;
    const wonCount = enterpriseLeads.filter(l => l.status === 'won').length;

    return { total, newCount, contactedCount, wonCount };
  }, [enterpriseLeads]);

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
            {activeTab === 'homeowner' ? (
              <>
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>B2C Homeowner Lead Pipelines</span>
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 shrink-0" />
                <span>B2B Enterprise Compliance & Leads</span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-855 dark:text-slate-50 tracking-tight mt-1">
            {activeTab === 'homeowner' ? 'Sizer Capture Console' : 'Enterprise Sizer & Compliance Dashboard'}
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            {activeTab === 'homeowner' 
              ? 'Auditing prospects captured via the Step 2 sizing calculator intercept sizer bundle.'
              : 'Managing commercial solar prospects, landlord consent agreements, and local grid compliance.'}
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button 
            aria-label="Refresh leads data"
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button 
            onClick={activeTab === 'homeowner' ? exportToCSV : exportEnterpriseToCSV}
            size="sm" 
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl h-9.5 border-none shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Ledger</span>
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('homeowner');
            setSearchQuery('');
            setSelectedLocation('all');
            setSelectedCapacity('all');
            setGeneratedScript('');
          }}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'homeowner'
              ? 'border-teal-500 text-teal-650 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          B2C Homeowner Leads
        </button>
        <button
          onClick={() => {
            setActiveTab('enterprise');
            setSearchQuery('');
            setSelectedLocation('all');
            setSelectedCapacity('all');
            setGeneratedScript('');
          }}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'enterprise'
              ? 'border-teal-500 text-teal-650 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          B2B Enterprise Leads
        </button>
      </div>

      {/* ═══ KPI Cards Summary Row ═══ */}
      {activeTab === 'homeowner' ? (
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
                  <p className="text-[10px] font-semibold text-slate-455 dark:text-slate-500 mt-1 leading-none">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: 'Total Enterprise Leads', 
              value: enterpriseStats.total, 
              desc: 'B2B Enterprise accounts',
              icon: Building2, 
              color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
            },
            { 
              label: 'New Applications', 
              value: enterpriseStats.newCount, 
              desc: 'Awaiting first call review',
              icon: Inbox, 
              color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
            },
            { 
              label: 'Contacted Leads', 
              value: enterpriseStats.contactedCount, 
              desc: 'In compliance validation',
              icon: MessageSquare, 
              color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
            },
            { 
              label: 'Closed / Won Accounts', 
              value: enterpriseStats.wonCount, 
              desc: 'Grid-compliance certified',
              icon: ShieldCheck, 
              color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
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
                  <p className="text-[10px] font-semibold text-slate-455 dark:text-slate-500 mt-1 leading-none">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ AI OUTREACH COPILOT PANEL ═══ */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-855 dark:text-slate-100 text-sm uppercase tracking-wider">
                {activeTab === 'homeowner' ? 'AI Sales Outreach Copilot' : 'AI Enterprise Pitch Copilot'}
              </h3>
            </div>
            {!googleToken ? (
              <Button 
                onClick={initiateOAuth}
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.127 4.114a5.856 5.856 0 01-5.856-5.857c0-3.235 2.62-5.856 5.856-5.856 1.454 0 2.784.53 3.806 1.4 l3.056-3.056C18.91 3.23 15.79 2 12.24 2 6.584 2 2 6.584 2 12.24s4.584 10.24 10.24 10.24c6.202 0 10.24-4.364 10.24-10.24 0-.69-.06-1.355-.175-1.955H12.24z"/>
                </svg>
                <span>Authorize Google AI</span>
              </Button>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-900/40 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">
                Google Authorized
              </Badge>
            )}
          </div>

          {activeTab === 'homeowner' ? (
            selectedLead ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-805 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Recipient</span>
                      <h4 className="text-base font-black text-slate-850 dark:text-slate-50">{selectedLead.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedLead.phone} | {selectedLead.location || 'Nigeria'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Target Inverter</span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedLead.kva_recommended || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Calculated Load</span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedLead.running_load_w ? `${selectedLead.running_load_w} W` : 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Fuel Outlay</span>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatNaira(selectedLead.monthly_fuel_spend)}/mo</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-455 font-extrabold uppercase tracking-wide text-emerald-500">Solar ROI Offset</span>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatNaira(selectedLead.monthly_savings_ngn)}/mo</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outreach Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'whatsapp', label: 'WhatsApp' },
                        { id: 'email', label: 'Email' },
                        { id: 'call', label: 'Call Script' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setScriptStyle(style.id as any)}
                          className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
                            scriptStyle === style.id
                              ? 'bg-teal-500/15 border-teal-500/35 text-teal-650 dark:text-teal-400'
                              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-550'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateScript}
                    disabled={generatingScript || !googleToken}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl border-none shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {generatingScript ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                    <span>Generate Customized Script</span>
                  </Button>
                </div>

                <div className="lg:col-span-7 flex flex-col h-full justify-between gap-3">
                  <div className="relative flex-grow">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Generated Outreach Output</span>
                    <textarea
                      rows={7}
                      readOnly
                      value={generatedScript || 'Click "Generate Customized Script" to run AI model diagnostics...'}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none resize-none font-mono"
                    />
                  </div>

                  {generatedScript && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyScript}
                        variant="outline"
                        className="flex-grow h-10 rounded-xl border-slate-200 dark:border-slate-805 text-xs font-bold flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer text-slate-750 dark:text-slate-350"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                      </Button>

                      <Button
                        onClick={handleOpenWhatsApp}
                        className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl border-none shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Send over WhatsApp</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 font-bold">
                No lead selected. Select a lead in the database grid below to unlock AI outreach generation.
              </div>
            )
          ) : (
            selectedEnterpriseLead ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-805 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Corporate Lead</span>
                      <h4 className="text-base font-black text-slate-850 dark:text-slate-50">{selectedEnterpriseLead.company_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedEnterpriseLead.contact_person} | {selectedEnterpriseLead.phone || 'No Phone'}</p>
                    </div>
                    
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Project Scope Outline</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">{selectedEnterpriseLead.project_scope || 'Commercial solar installation'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide block">Select Target Compliance City</label>
                      <select 
                        value={selectedCity} 
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="text-xs w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold"
                      >
                        <option value="lagos">Lagos (Eko)</option>
                        <option value="lagos-ikeja">Lagos (Ikeja)</option>
                        <option value="abuja">Abuja (AEDC)</option>
                        <option value="port-harcourt">Port Harcourt (PHED)</option>
                        <option value="kano">Kano (KEDCO)</option>
                        <option value="ibadan">Ibadan (IBEDC)</option>
                        <option value="enugu">Enugu (EEDC)</option>
                        <option value="benin">Benin (BEDC)</option>
                        <option value="jos">Jos (JEDC)</option>
                        <option value="kaduna">Kaduna (KAEDCO)</option>
                        <option value="yola">Yola (YEDC)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outreach Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'whatsapp', label: 'WhatsApp' },
                        { id: 'email', label: 'Email' },
                        { id: 'call', label: 'Pitch Script' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setScriptStyle(style.id as any)}
                          className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
                            scriptStyle === style.id
                              ? 'bg-teal-500/15 border-teal-500/35 text-teal-650 dark:text-teal-400'
                              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-550'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleGenerateScript}
                      disabled={generatingScript || !googleToken}
                      className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-[10px] uppercase h-10 rounded-xl border-none shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {generatingScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>Generate Pitch</span>
                    </Button>

                    <Button
                      onClick={() => handleDownloadCompliancePDF(selectedEnterpriseLead.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase h-10 rounded-xl border-none shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Download PDF Report</span>
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col h-full justify-between gap-3">
                  <div className="relative flex-grow">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Generated Outreach Output</span>
                    <textarea
                      rows={7}
                      readOnly
                      value={generatedScript || 'Click "Generate Pitch" to run B2B commercial diagnostics...'}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none resize-none font-mono"
                    />
                  </div>

                  {generatedScript && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyScript}
                        variant="outline"
                        className="flex-grow h-10 rounded-xl border-slate-200 dark:border-slate-850 text-xs font-bold flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer text-slate-750 dark:text-slate-350"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                      </Button>

                      <Button
                        onClick={handleOpenWhatsApp}
                        className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl border-none shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Send over WhatsApp</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 font-bold">
                No enterprise lead selected. Select a lead in the grid below to unlock AI pitch templates and compliance reports.
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* ═══ Main Table & Filtering View ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Table Filters with Search */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-slate-855 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="h-4.5 w-4.5 text-indigo-500" />
              <span>{activeTab === 'homeowner' ? 'Captured B2C Leads Database' : 'B2B Enterprise Leads Registry'}</span>
            </h3>
            <p className="text-xs text-slate-550">
              {activeTab === 'homeowner' 
                ? 'Live grid of prospects containing sizing profiles and fuel spending indicators.'
                : 'Enterprise prospects mapped to company profiles, project scale, and compliance approvals.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-stretch sm:items-center">
            {/* Search input */}
            <div className="relative flex-1 sm:flex-none sm:min-w-[240px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-455" />
              <input
                type="text"
                placeholder={activeTab === 'homeowner' ? "Search leads by name, phone..." : "Search enterprise leads by company, contact..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9.5 pr-4 py-2 w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500/50 transition-all dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {activeTab === 'homeowner' && (
              <>
                {/* kVA Capacity dropdown filter */}
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                  <Filter className="h-3.5 w-3.5 text-slate-450" />
                  <span className="text-[10px] text-slate-455 dark:text-slate-500">Size:</span>
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
                  <MapPin className="h-3.5 w-3.5 text-slate-455" />
                  <span className="text-[10px] text-slate-455 dark:text-slate-500">Location:</span>
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
              </>
            )}

            {activeTab === 'enterprise' && (
              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                <Filter className="h-3.5 w-3.5 text-slate-450" />
                <span className="text-[10px] text-slate-455 dark:text-slate-500">Status:</span>
                <select
                  aria-label="Filter leads by status"
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-slate-700 dark:text-slate-355 pr-1 text-xs font-bold"
                >
                  <option value="all" className="dark:bg-slate-950">All Statuses</option>
                  <option value="new" className="dark:bg-slate-950">New</option>
                  <option value="contacted" className="dark:bg-slate-950">Contacted</option>
                  <option value="quoted" className="dark:bg-slate-950">Quoted</option>
                  <option value="won" className="dark:bg-slate-950">Won</option>
                  <option value="lost" className="dark:bg-slate-950">Lost</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Capacity Quick Tags Selection (Only for homeowner) */}
        {activeTab === 'homeowner' && (
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
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}

        {/* Leads Table */}
        <div className="overflow-x-auto">
          {activeTab === 'homeowner' ? (
            filteredLeads.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p className="text-xs text-slate-450 italic font-bold">No homeowner prospects matched your query terms.</p>
                {leads.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => { setSearchQuery(''); setSelectedCapacity('all'); setSelectedLocation('all'); }}
                    className="text-xs font-bold text-teal-655"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse border-none">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-550 dark:text-slate-455 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 select-none">
                    <th className="px-6 py-4">Homeowner Name</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Building Location</th>
                    <th className="px-6 py-4">Calculated Load Profile</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Monthly Spend / Savings</th>
                    <th className="px-6 py-4">Captured Date</th>
                    <th className="px-6 py-4 text-right">Outreach Shortcuts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                  {filteredLeads.map(lead => (
                    <tr 
                      key={lead.id} 
                      onClick={() => {
                        setSelectedLead(lead);
                        setGeneratedScript('');
                      }}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer ${
                        selectedLead?.id === lead.id ? 'bg-teal-500/5 dark:bg-teal-500/10 border-l-2 border-l-teal-500' : ''
                      }`}
                    >
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

                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-355">
                        <div className="flex flex-col gap-1">
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-teal-655 transition-colors text-xs font-extrabold">
                            <Phone className="h-3.5 w-3.5 text-slate-405" />
                            <span>{lead.phone}</span>
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-teal-655 transition-colors text-[10px] text-slate-405 font-bold">
                              <Mail className="h-3 w-3 text-slate-405" />
                              <span>Email prospect</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {lead.location ? (
                          <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400 font-semibold">
                            <MapPin className="h-3.5 w-3.5 text-slate-455 shrink-0" />
                            <span>{lead.location}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic">None logged</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-750 dark:bg-slate-800 dark:text-slate-330 border border-slate-205 dark:border-slate-750 uppercase text-[9px] font-black px-2 py-0.5 rounded-lg tracking-wider">
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

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <LeadStatusSelect leadId={lead.id} currentStatus={lead.status ?? 'new'} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 font-bold">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Spend:</span>
                            <span className="tabular-nums font-black">{formatNaira(lead.monthly_fuel_spend)}</span>
                          </span>
                          <span className="text-emerald-655 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Save:</span>
                            <span className="tabular-nums font-black">{formatNaira(lead.monthly_savings_ngn)}</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-500 dark:text-slate-555 font-bold">
                        <div className="flex flex-col">
                          <span>{formatShortDate(lead.created_at)}</span>
                          <span className="text-[9px] text-slate-405 dark:text-slate-600 mt-0.5 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{formatTime(lead.created_at)}</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
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
                              className="h-8.5 w-8.5 rounded-xl p-0 border border-slate-200 dark:border-slate-800 text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center cursor-pointer shadow-sm"
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
            )
          ) : (
            filteredEnterpriseLeads.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p className="text-xs text-slate-450 italic font-bold">No B2B enterprise leads matched your query terms.</p>
                {enterpriseLeads.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => { setSearchQuery(''); setSelectedLocation('all'); }}
                    className="text-xs font-bold text-teal-655"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse border-none">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-550 dark:text-slate-455 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 select-none">
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Project Scope</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Captured Date</th>
                    <th className="px-6 py-4 text-right">Outreach & Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                  {filteredEnterpriseLeads.map(lead => (
                    <tr 
                      key={lead.id} 
                      onClick={() => {
                        setSelectedEnterpriseLead(lead);
                        setGeneratedScript('');
                      }}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors cursor-pointer ${
                        selectedEnterpriseLead?.id === lead.id ? 'bg-teal-500/5 dark:bg-teal-500/10 border-l-2 border-l-teal-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/15 to-teal-600/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs shadow-sm">
                            {lead.company_name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span>{lead.company_name}</span>
                            <span className="text-[10px] text-slate-450 font-medium tracking-normal mt-0.5 truncate max-w-[150px]" title={lead.contact_person}>
                              Attn: {lead.contact_person}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-355">
                        <div className="flex flex-col gap-1">
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-teal-655 transition-colors text-xs font-extrabold">
                              <Phone className="h-3.5 w-3.5 text-slate-405" />
                              <span>{lead.phone}</span>
                            </a>
                          )}
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-teal-655 transition-colors text-[10px] text-slate-405 font-bold">
                            <Mail className="h-3 w-3 text-slate-405" />
                            <span>{lead.email}</span>
                          </a>
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-[240px]">
                        <p className="text-slate-550 dark:text-slate-400 font-semibold truncate" title={lead.project_scope || ''}>
                          {lead.project_scope || <span className="text-slate-400 dark:text-slate-600 italic">No scope described</span>}
                        </p>
                      </td>

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateEnterpriseStatus(lead.id, e.target.value)}
                          className="w-28 text-xs p-1 h-8 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none font-bold"
                        >
                          {['new', 'contacted', 'quoted', 'won', 'lost'].map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 text-slate-500 dark:text-slate-555 font-bold">
                        <div className="flex flex-col">
                          <span>{formatShortDate(lead.created_at)}</span>
                          <span className="text-[9px] text-slate-405 dark:text-slate-600 mt-0.5 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{formatTime(lead.created_at)}</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end items-center">
                          <a 
                            href={getEnterpriseWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open WhatsApp chat with corporate template"
                          >
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8.5 rounded-xl border border-emerald-200/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:border-emerald-955/20 dark:text-emerald-450 dark:hover:bg-emerald-955/30 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm"
                            >
                              <MessageSquare className="h-3.5 w-3.5 fill-emerald-500/5" />
                              <span>WhatsApp</span>
                            </Button>
                          </a>

                          <Button
                            onClick={() => handleDownloadCompliancePDF(lead.id)}
                            size="sm" 
                            variant="ghost" 
                            className="h-8.5 w-8.5 rounded-xl p-0 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/40 flex items-center justify-center cursor-pointer shadow-sm"
                            title="Generate and download Landlord Consent & Safety Compliance PDF"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
