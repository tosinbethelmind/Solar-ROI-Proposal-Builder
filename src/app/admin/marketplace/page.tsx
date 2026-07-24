'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Building, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Settings, 
  Lock,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Mail,
  Phone,
  CheckCircle,
  Inbox,
  Database,
  Sparkles,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Search,
  Coins,
  Clock,
  ExternalLink,
  FileText,
  Check,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminMarketplaceDashboard() {
  const [activeSubTab, setActiveSubTab] = React.useState<'installers' | 'leads' | 'automation' | 'team'>('installers');
  const [googleToken, setGoogleToken] = React.useState<string | null>(null);
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = React.useState('');
  
  // Real Database State
  const [installers, setInstallers] = React.useState<any[]>([]);
  const [serviceAreas, setServiceAreas] = React.useState<any[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<any[]>([]);
  const [leads, setLeads] = React.useState<any[]>([]);
  const [leadAssignments, setLeadAssignments] = React.useState<any[]>([]);
  const [telemetryLogs, setTelemetryLogs] = React.useState<any[]>([]);
  const [teamAdmins, setTeamAdmins] = React.useState<any[]>([]);
  const [adminRole, setAdminRole] = React.useState<'superadmin' | 'operations' | 'billing' | 'read_only'>('read_only');
  const [loading, setLoading] = React.useState(true);

  // Syncing state
  const [syncingInstallers, setSyncingInstallers] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  
  // AI CAC state
  const [cacingInstallerId, setCacingInstallerId] = React.useState<string | null>(null);
  const [cacVerdicts, setCacVerdicts] = React.useState<Record<string, { verdict: string; report: string }>>({});

  // OCR state
  const [analyzingReceipt, setAnalyzingReceipt] = React.useState(false);
  const [selectedReceiptText, setSelectedReceiptText] = React.useState('');
  const [receiptAnalysis, setReceiptAnalysis] = React.useState<{
    depositorName: string;
    amount: number;
    reference: string;
    suggestedTier: 'verified_partner' | 'verified_partner_plus';
    matchedInstallerId: string | null;
  } | null>(null);
  const [upgradingFromOcr, setUpgradingFromOcr] = React.useState(false);

  // New admin state
  const [newAdminEmail, setNewAdminEmail] = React.useState('');
  const [newAdminRole, setNewAdminRole] = React.useState<'superadmin' | 'operations' | 'billing' | 'read_only'>('read_only');
  const [addingAdmin, setAddingAdmin] = React.useState(false);

  // Load everything on mount
  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Directory Listings
      const instRes = await fetch('/api/admin/marketplace/installers');
      const instJson = await instRes.json();
      if (instJson && !instJson.error) {
        setInstallers(instJson.installers || []);
        setServiceAreas(instJson.serviceAreas || []);
        setSubscriptions(instJson.subscriptions || []);
        if (instJson.role) {
          setAdminRole(instJson.role);
        }
      }

      // 2. Fetch Leads
      const leadsRes = await fetch('/api/admin/marketplace/leads');
      const leadsJson = await leadsRes.json();
      if (leadsJson && !leadsJson.error) {
        setLeads(leadsJson.leads || []);
        setLeadAssignments(leadsJson.leadAssignments || []);
      }

      // 3. Fetch Telemetry
      const telRes = await fetch('/api/admin/marketplace/telemetry');
      const telJson = await telRes.json();
      if (telJson && !telJson.error) {
        setTelemetryLogs(telJson);
      }

      // 4. Fetch Admins
      const teamRes = await fetch('/api/admin/marketplace/team');
      const teamJson = await teamRes.json();
      if (teamJson && !teamJson.error) {
        setTeamAdmins(teamJson.admins || []);
      }

    } catch (e: any) {
      toast.error('Failed to load marketplace admin directory data.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
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

    // Load config to get googleSpreadsheetId
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/apexreach/config');
        const json = await res.json();
        if (json && !json.error && json.googleSpreadsheetId) {
          setGoogleSpreadsheetId(json.googleSpreadsheetId);
        }
      } catch (err) {
        console.error('Failed to load config spreadsheet ID', err);
      }
    };
    
    loadConfig();
    fetchMarketplaceData();
  }, []);

  // Set Dev Cookie Override Role
  const handleRoleSimulation = async (simRole: typeof adminRole) => {
    document.cookie = `bypass_auth=solar-quotepro-e2e-secret-key-2026; path=/`;
    document.cookie = `bypass_admin_role=${simRole}; path=/`;
    toast.success(`Role simulated: ${simRole.toUpperCase()}. Reloading directory...`);
    setAdminRole(simRole);
    await fetchMarketplaceData();
  };

  // Google Sheets Direct Server-Side Sync
  const handleInstallersSheetsSync = async () => {
    if (!googleSpreadsheetId) {
      toast.error('Please configure a Google Spreadsheet ID first.');
      return;
    }

    setSyncingInstallers(true);
    setStatusMessage('Syncing B2B directory listings via background server route...');

    try {
      const res = await fetch('/api/admin/marketplace/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: googleToken,
          spreadsheetId: googleSpreadsheetId
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Server sync error.');
      }

      toast.success('Successfully synchronized B2B directory listings to Google Sheet!');
      setStatusMessage('Sync complete.');
      fetchMarketplaceData(); // Refresh logs
    } catch (e: any) {
      console.error(e);
      toast.error(`Sync failed: ${e.message}`);
      setStatusMessage(`Sync Error: ${e.message}`);
    } finally {
      setSyncingInstallers(false);
    }
  };

  // Server-Side AI-Assisted CAC Verification
  const handleAiCacVerification = async (installerId: string) => {
    const inst = installers.find(i => i.id === installerId);
    if (!inst) return;

    setCacingInstallerId(installerId);
    try {
      const res = await fetch('/api/admin/marketplace/verify-cac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: googleToken,
          installerId,
          businessName: inst.business_name,
          cacNumber: inst.cac_number,
          description: inst.description
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'CAC Verification failed.');
      }

      const { verdict, report } = json;

      if (verdict === 'APPROVED') {
        // Optimistic UI updates
        setInstallers(prev => prev.map(i => i.id === installerId ? { ...i, is_verified: true } : i));
        toast.success(`AI Verification Successful! ${inst.business_name} is approved.`);
      } else {
        toast.error(`AI Verification failed for ${inst.business_name}: Credentials rejected.`);
      }

      setCacVerdicts(prev => ({
        ...prev,
        [installerId]: { verdict, report }
      }));
      fetchMarketplaceData(); // Refresh logs
    } catch (err: any) {
      console.error(err);
      toast.error(`AI Check failed: ${err.message}`);
    } finally {
      setCacingInstallerId(null);
    }
  };

  // Server-Side Offline Bank Transfer Receipt OCR & Match
  const handleReceiptOcrAnalysis = async () => {
    if (!selectedReceiptText.trim()) {
      toast.error('Please paste or select a receipt transcript to analyze.');
      return;
    }

    setAnalyzingReceipt(true);
    setReceiptAnalysis(null);

    try {
      const res = await fetch('/api/admin/marketplace/reconcile-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: googleToken,
          receiptText: selectedReceiptText,
          installers
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Server receipt analysis failed.');
      }

      setReceiptAnalysis(json.analysis);
      toast.success('Receipt analyzed and mapped successfully!');
      fetchMarketplaceData(); // Refresh logs
    } catch (err: any) {
      console.error(err);
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzingReceipt(false);
    }
  };

  const handleApplyOcrUpgrade = async () => {
    if (!receiptAnalysis || !receiptAnalysis.matchedInstallerId) return;

    setUpgradingFromOcr(true);
    try {
      // 1. Update verified status
      const verifyRes = await fetch('/api/admin/marketplace/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_verified',
          installerId: receiptAnalysis.matchedInstallerId,
          isVerified: true
        })
      });

      // 2. Update subscription tier
      const subRes = await fetch('/api/admin/marketplace/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tier',
          installerId: receiptAnalysis.matchedInstallerId,
          tier: receiptAnalysis.suggestedTier
        })
      });

      if (!verifyRes.ok || !subRes.ok) {
        throw new Error('Failed to update listing in database.');
      }

      toast.success(`Success! Listing upgraded and verified.`);
      setReceiptAnalysis(null);
      setSelectedReceiptText('');
      fetchMarketplaceData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to apply upgrade.');
    } finally {
      setUpgradingFromOcr(false);
    }
  };

  // Moderate Installer Profile Status directly
  const handleModerateListing = async (installerId: string, verifiedStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/marketplace/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_verified',
          installerId,
          isVerified: verifiedStatus
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update verification status.');
      }

      setInstallers(prev => prev.map(i => i.id === installerId ? { ...i, is_verified: verifiedStatus } : i));
      toast.success(`Listing ${verifiedStatus ? 'verified' : 'unverified'} successfully.`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Moderate Installer Subscription Tier directly
  const handleModerateListingSubscription = async (installerId: string, tier: string) => {
    try {
      const res = await fetch('/api/admin/marketplace/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tier',
          installerId,
          tier
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update subscription tier.');
      }

      setSubscriptions(prev => prev.map(s => s.installer_id === installerId ? { ...s, tier } : s));
      toast.success(`Listing tier updated to ${tier.replace(/_/g, ' ').toUpperCase()}.`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Trigger Manual Override Routing
  const handleManualOverride = async (leadId: string, installerId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    try {
      const res = await fetch('/api/admin/marketplace/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_lead',
          lead: {
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            phone: lead.phone,
            state: lead.state,
            city: lead.city,
            average_monthly_bill_ngn: lead.average_monthly_bill_ngn,
            generator_hours_daily: lead.generator_hours_daily,
            notes: `(Manual Override) ${lead.notes || ''}`
          },
          targetInstallerId: installerId
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Manual routing override failed.');
      }

      toast.success('Manual lead override assignment dispatched successfully.');
      fetchMarketplaceData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Add new admin user
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAddingAdmin(true);
    try {
      const res = await fetch('/api/admin/marketplace/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_admin',
          email: newAdminEmail.trim(),
          role: newAdminRole
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to register admin role.');
      }

      toast.success(`Registered ${newAdminEmail} as ${newAdminRole.toUpperCase()}`);
      setNewAdminEmail('');
      fetchMarketplaceData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingAdmin(false);
    }
  };

  // Delete/Remove admin
  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke admin permissions for this team member?')) return;

    try {
      const res = await fetch('/api/admin/marketplace/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_admin',
          userId
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to revoke admin role.');
      }

      toast.success('Admin permissions revoked successfully.');
      fetchMarketplaceData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Update existing admin's role
  const handleUpdateAdminRole = async (userId: string, targetRole: string) => {
    try {
      const res = await fetch('/api/admin/marketplace/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          userId,
          targetRole
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to change admin role.');
      }

      toast.success(`Role changed to ${targetRole.toUpperCase()}`);
      fetchMarketplaceData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Permission Gating Helpers
  const canModifyProfiles = adminRole === 'superadmin' || adminRole === 'operations';
  const canModifySubscriptions = adminRole === 'superadmin' || adminRole === 'billing';
  const canRunAutomation = adminRole !== 'read_only';
  const isSuperAdmin = adminRole === 'superadmin';

  // Mock receipt presets
  const MOCK_RECEIPT_PRESETS = [
    {
      label: "Lekki Clean Energy - N99,000 Verified Partner Plus receipt",
      text: `--------------------------------------------------
ACCESS BANK NIGERIA - TRANSACTION RECEIPTS
--------------------------------------------------
Transaction Date: 12-Jul-2026 14:15:32
Session ID: 000013260712141532009874510
Reference Code: TXN/2026/894028591

Sender: Lekki Clean Energy Ltd
Sender Account: 104****892

Beneficiary: SOLARQUOTEPRO NIGERIA
Beneficiary Account: 0192837465
Beneficiary Bank: Sterling Bank

Amount: NGN 99,000.00
Status: SUCCESSFUL
Remarks: Upgrade to Partner Plus directory listing
--------------------------------------------------`
    },
    {
      label: "Gbagada Solar Systems - N45,000 Verified Partner receipt",
      text: `--------------------------------------------------
GTBANK PLC - TRANSFERS RECEIPT
--------------------------------------------------
Reference: 09/GTB/TF/60295819/SOLAR
Date/Time: 13-Jul-2026 09:30:11

Account Name: Gbagada Solar Systems Ltd
Beneficiary: SOLARQUOTEPRO TECH
Account Number: 9028193859

Amount: NGN 45,000.00
Response: Approved / Success
Narrative: subscription payment verified partner tier
--------------------------------------------------`
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-xs font-black uppercase text-slate-400">Loading Marketplace Operations Board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Dev Bypass / Role Simulation Toolbar */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-[10px] py-1.5 px-4 font-bold flex justify-between items-center text-amber-700 dark:text-amber-400">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Role Bypass Tool:</span>
        </span>
        <div className="flex gap-2">
          {(['superadmin', 'operations', 'billing', 'read_only'] as const).map(roleOption => (
            <button
              key={roleOption}
              onClick={() => handleRoleSimulation(roleOption)}
              className={`px-2 py-0.5 rounded border transition-all ${
                adminRole === roleOption 
                  ? 'bg-amber-600 border-amber-700 text-white font-black scale-105' 
                  : 'bg-transparent border-amber-500/35 hover:bg-amber-500/25'
              }`}
            >
              {roleOption.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b bg-slate-900 text-white border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-white transition-colors">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Admin Board
            </Link>
            <div className="w-px h-4 bg-slate-800" />
            <span className="text-xs font-black tracking-tight text-teal-400 uppercase">Marketplace Center</span>
            <Badge className="bg-teal-650/10 text-teal-400 border border-teal-500/20 text-[8px] font-black uppercase rounded py-0.5 px-2">
              Role: {adminRole.toUpperCase()}
            </Badge>
          </div>

          <div className="flex gap-1 bg-slate-850 p-0.5 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => setActiveSubTab('installers')}
              className={`text-[9px] font-black uppercase rounded-md px-3 h-6 ${
                activeSubTab === 'installers' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Installers
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveSubTab('leads')}
              className={`text-[9px] font-black uppercase rounded-md px-3 h-6 ${
                activeSubTab === 'leads' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Leads Control
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveSubTab('automation')}
              className={`text-[9px] font-black uppercase rounded-md px-3 h-6 ${
                activeSubTab === 'automation' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Operations Automation
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveSubTab('team')}
              className={`text-[9px] font-black uppercase rounded-md px-3 h-6 ${
                activeSubTab === 'team' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚙️ Team & Security
            </Button>
          </div>
        </div>
      </header>

      {/* Main panel content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Analytics teaser rows */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Partners", count: installers.length, color: "text-slate-850 dark:text-slate-100" },
            { label: "Verified Ratio", count: installers.length > 0 ? `${Math.round((installers.filter(i => i.is_verified).length / installers.length) * 100)}%` : '0%', color: "text-teal-650" },
            { label: "Partner Plus Members", count: subscriptions.filter(s => s.tier === 'verified_partner_plus').length, color: "text-amber-500" },
            { label: "Global Routed Leads", count: leads.length, color: "text-indigo-650 dark:text-indigo-400" }
          ].map((stat, idx) => (
            <Card key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <p className={`text-xl sm:text-2xl font-black mt-2 ${stat.color}`}>{stat.count}</p>
            </Card>
          ))}
        </div>

        {/* INSTALLERS CONTROL TAB */}
        {activeSubTab === 'installers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Marketplace Directory Listings Moderation</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Approve solar business profiles, change verified badge statuses, and inspect coverage service areas.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {installers.map((inst) => {
                const sub = subscriptions.find(s => s.installer_id === inst.id);
                const coverages = serviceAreas.filter(sa => sa.installer_id === inst.id);

                return (
                  <Card key={inst.id} className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-base text-slate-850 dark:text-slate-50">{inst.business_name}</h3>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none text-[8px] font-black uppercase">
                          ID: {inst.id}
                        </Badge>
                        <Badge className={`text-[8px] font-black uppercase border-none ${
                          sub?.tier === 'verified_partner_plus' 
                            ? 'bg-amber-500/10 text-amber-600' 
                            : sub?.tier === 'verified_partner' 
                            ? 'bg-teal-500/10 text-teal-650' 
                            : 'bg-slate-100 dark:bg-slate-850 text-slate-500'
                        }`}>
                          {sub?.tier.replace(/_/g, ' ') || 'Basic'}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                        {inst.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase mr-1 mt-0.5">Cities:</span>
                        {coverages.map((c, cIdx) => (
                          <Badge key={cIdx} variant="secondary" className="bg-slate-50 dark:bg-slate-950 text-[9px] py-0 px-2 border-none">
                            📍 {c.city}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      {/* Verification Status toggles */}
                      <div className="flex gap-1.5 items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-455">Directory Status</span>
                        <Button
                          size="sm"
                          disabled={!canModifyProfiles}
                          onClick={() => handleModerateListing(inst.id, !inst.is_verified)}
                          className={`text-[9px] font-black uppercase rounded-lg h-7 px-3 border-none ${
                            inst.is_verified 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                          }`}
                        >
                          {inst.is_verified ? '🛡️ Verified' : '❌ Unverified'}
                        </Button>
                      </div>

                      {/* Subscription Overrides */}
                      <div className="flex gap-1.5 items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-455">Listing Subscription</span>
                        <select
                          disabled={!canModifySubscriptions}
                          value={sub?.tier || 'basic'}
                          onChange={(e) => handleModerateListingSubscription(inst.id, e.target.value as any)}
                          className="p-1 rounded-md border text-[9px] font-black bg-white dark:bg-slate-900 text-teal-650"
                        >
                          <option value="basic">Basic Listing</option>
                          <option value="verified_partner">Verified Partner</option>
                          <option value="verified_partner_plus">Partner Plus</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* LEADS CONTROL TAB */}
        {activeSubTab === 'leads' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Lead Routing Control Console</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Inspect homeowner submissions and perform dynamic manual override routing to specific verified installers.
              </p>
            </div>

            {leads.length === 0 ? (
              <div className="py-16 text-center space-y-4 border border-dashed rounded-3xl border-slate-250 bg-white dark:bg-slate-900">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-455">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-700 dark:text-slate-200">No leads submitted yet</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {leads.map((lead) => {
                  const assignments = leadAssignments.filter(la => la.lead_id === lead.id);

                  return (
                    <Card key={lead.id} className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between hover:shadow-sm">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-1">
                            <h4 className="font-black text-sm sm:text-base text-slate-850 dark:text-slate-50">
                              {lead.first_name} {lead.last_name}
                            </h4>
                            <p className="text-[10px] text-slate-455 font-bold">
                              📞 {lead.phone} | ✉️ {lead.email} | 📍 {lead.city}, {lead.state}
                            </p>
                          </div>
                          <Badge className="bg-indigo-500/10 text-indigo-655 border-none text-[8px] font-black uppercase py-0.5 px-2">
                            Source: {lead.request_source || 'direct_profile'}
                          </Badge>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                        {/* Assignments trace */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Routing Traces</span>
                          {assignments.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">Unassigned (Matching algorithm resulted in 0 candidates)</p>
                          ) : (
                            <div className="space-y-1.5">
                              {assignments.map((asg) => {
                                const inst = installers.find(i => i.id === asg.installer_id);
                                return (
                                  <div key={asg.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-[10px] border">
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                      Routed to: {inst?.business_name || 'Unknown'}
                                    </span>
                                    <Badge className="bg-slate-100 dark:bg-slate-800 text-teal-650 text-[8px] font-bold py-0.5 px-2">
                                      {asg.status.toUpperCase()} (Exclusive: {asg.is_exclusive ? 'YES' : 'NO'})
                                    </Badge>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Manual override dispatch interface */}
                        {canModifyProfiles && (
                          <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border">
                            <span className="text-[9px] font-black text-slate-400 uppercase block">Manual Override Routing Dispatch</span>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {installers.map((instOption) => (
                                <Button
                                  key={instOption.id}
                                  size="sm"
                                  onClick={() => handleManualOverride(lead.id, instOption.id)}
                                  className="bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 hover:bg-slate-200 text-[9px] font-bold rounded-lg h-7 px-3 border-none"
                                >
                                  Route to {instOption.business_name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* OPERATIONS AUTOMATION TAB */}
        {activeSubTab === 'automation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">⚡ Operations & Verification Automation Queue</h2>
                <p className="text-xs text-slate-500 leading-normal">
                  Reconcile offline bank transfers, auto-verify registered businesses via AI, and synchronize installer database to Google Sheets.
                </p>
              </div>
              
              {/* Google Integration Status */}
              <div className="flex items-center gap-2">
                {googleToken ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase py-1 px-2.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Google Connected
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-black uppercase py-1 px-2.5 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Sandbox / Offline Mode
                  </Badge>
                )}
              </div>
            </div>

            {/* Connection Warning if Sandbox */}
            {!googleToken && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <div className="space-y-1 leading-normal">
                  <p className="font-extrabold">Sandbox Mode Active</p>
                  <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80">
                    Google OAuth token is not active. The operations center will use **Local Simulated Intelligence Fallbacks** for CAC Registry audits and bank receipt analysis. To connect live Google APIs and export to Google Sheets, authorize Google Services in the **Scrapers settings tab**.
                  </p>
                </div>
              </div>
            )}

            {/* Main Automation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT SIDE: Google Sheets Sync & OCR Receipts (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Google Sheets Sync */}
                <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-650 shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100">B2B Directory Listings Sheets Sync</CardTitle>
                        <CardDescription className="text-[10px] font-medium text-slate-400">Sync all registered installers to a secondary Google Spreadsheet tab</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border text-[11px] space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350">
                        <span>Spreadsheet Sync ID</span>
                        <Badge variant="secondary" className="font-black text-[9px] uppercase bg-slate-200 dark:bg-slate-800">
                          {googleSpreadsheetId ? "Configured" : "Not Found"}
                        </Badge>
                      </div>
                      <input
                        type="text"
                        placeholder="Google Spreadsheet ID"
                        value={googleSpreadsheetId}
                        onChange={(e) => setGoogleSpreadsheetId(e.target.value)}
                        className="w-full px-3 py-2 text-[11px] font-mono rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <Button
                      onClick={handleInstallersSheetsSync}
                      disabled={syncingInstallers || !googleSpreadsheetId || !canRunAutomation}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl h-9"
                    >
                      {syncingInstallers ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          {statusMessage || 'Synchronizing...'}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-2" />
                          Sync Registered Installers
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* 2. Receipt OCR OCR & Match */}
                <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-655 shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100">Offline Bank Transfer Receipt Analyzer</CardTitle>
                        <CardDescription className="text-[10px] font-medium text-slate-400">Reconcile manual payments and match them to installer profiles using OCR</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Presets */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Mock Receipts Presets (Quick Audit Test)</span>
                      <div className="flex flex-col gap-1.5">
                        {MOCK_RECEIPT_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedReceiptText(preset.text)}
                            className="text-left text-[10px] font-bold py-1.5 px-3 rounded-lg border bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors flex justify-between items-center"
                          >
                            <span>{preset.label}</span>
                            <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-650 px-1.5 py-0.5 rounded">LOAD MOCK</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Receipt Text Area */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Raw Receipt Transcript / SMS Alert Text</label>
                      <textarea
                        value={selectedReceiptText}
                        onChange={(e) => setSelectedReceiptText(e.target.value)}
                        placeholder="Paste Nigerian Bank Transfer receipt description or SMS transaction notification here..."
                        rows={5}
                        className="w-full p-3 font-mono text-[10px] rounded-xl border bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-normal"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReceiptOcrAnalysis}
                        disabled={analyzingReceipt || !selectedReceiptText.trim() || !canRunAutomation}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-black uppercase tracking-wider rounded-xl h-9"
                      >
                        {analyzingReceipt ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Analyzing Receipt...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            Run AI OCR Extraction
                          </>
                        )}
                      </Button>
                      
                      {selectedReceiptText && (
                        <Button
                          variant="outline"
                          onClick={() => { setSelectedReceiptText(''); setReceiptAnalysis(null); }}
                          className="text-[9px] font-bold uppercase rounded-xl h-9 px-4 border-slate-200"
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* OCR Results Display */}
                    {receiptAnalysis && (
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-indigo-500/10 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                        <h4 className="text-[10px] font-black text-indigo-650 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Extracted Payment Details
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed">
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                            <span className="text-slate-400 block font-bold">Depositor Name</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{receiptAnalysis.depositorName}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                            <span className="text-slate-400 block font-bold">Amount Extracted</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">₦{receiptAnalysis.amount.toLocaleString()}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                            <span className="text-slate-400 block font-bold">Reference Code</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-[9px]">{receiptAnalysis.reference}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                            <span className="text-slate-400 block font-bold">Suggested Upgrade Tier</span>
                            <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-black uppercase mt-0.5">
                              {receiptAnalysis.suggestedTier.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>

                        {/* Matching Partner Alert */}
                        <div className="p-3 rounded-xl border border-dashed flex justify-between items-center text-[10px]">
                          {receiptAnalysis.matchedInstallerId ? (
                            <>
                              <div className="space-y-0.5">
                                <span className="text-emerald-600 font-black flex items-center gap-1">
                                  ✅ Partner Match Identified
                                </span>
                                <span className="font-extrabold text-slate-700 dark:text-slate-350">
                                  {installers.find(i => i.id === receiptAnalysis.matchedInstallerId)?.business_name}
                                </span>
                              </div>
                              <Button
                                onClick={handleApplyOcrUpgrade}
                                disabled={upgradingFromOcr || !canModifySubscriptions}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase rounded-lg h-7 px-3"
                              >
                                {upgradingFromOcr ? "Upgrading..." : "Confirm & Upgrade"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="space-y-0.5">
                                <span className="text-amber-500 font-black flex items-center gap-1">
                                  ⚠️ Match Failed
                                </span>
                                <span className="text-slate-500">
                                  No installer found matching "{receiptAnalysis.depositorName}"
                                </span>
                              </div>
                              <select
                                onChange={(e) => setReceiptAnalysis(prev => prev ? { ...prev, matchedInstallerId: e.target.value } : null)}
                                className="text-[9px] font-black border rounded p-1 bg-white dark:bg-slate-900"
                              >
                                <option value="">Select manually...</option>
                                {installers.map(inst => (
                                  <option key={inst.id} value={inst.id}>{inst.business_name}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* RIGHT SIDE: AI CAC Verification Queue (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100">AI CAC Registry Verification Queue</CardTitle>
                        <CardDescription className="text-[10px] font-medium text-slate-400">Validate business name alignments and CAC registration formats automatically</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[400px] space-y-4">
                    {installers.map((inst) => {
                      const verdict = cacVerdicts[inst.id];
                      const isWorking = cacingInstallerId === inst.id;

                      return (
                        <div key={inst.id} className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-950 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-extrabold text-[11px] text-slate-850 dark:text-slate-100 leading-tight">
                                {inst.business_name}
                              </h4>
                              <p className="text-[9px] text-slate-455 font-bold mt-0.5">
                                CAC: <span className="font-mono text-teal-655">{inst.cac_number || "NOT SUBMITTED"}</span>
                              </p>
                            </div>
                            
                            <Badge className={`text-[8px] font-black uppercase border-none py-0.5 px-2 ${
                              inst.is_verified 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {inst.is_verified ? '🛡️ Verified' : '❌ Unverified'}
                            </Badge>
                          </div>

                          {/* Audit actions */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-850/60">
                            <span className="text-[9px] text-slate-400 font-bold">Registry Verification Check</span>
                            
                            {inst.is_verified ? (
                              <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Approved & Listed
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isWorking || !inst.cac_number || !canModifyProfiles}
                                onClick={() => handleAiCacVerification(inst.id)}
                                className="bg-indigo-600 hover:bg-indigo-750 text-white text-[9px] font-black uppercase rounded-lg h-7 px-2.5"
                              >
                                {isWorking ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Verifying...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Verify via AI
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          {/* Verdict Report */}
                          {verdict && (
                            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border text-[9px] leading-relaxed font-semibold text-slate-600 dark:text-slate-450 animate-in fade-in duration-200">
                              <div className="flex justify-between items-center border-b pb-1 mb-1 font-black">
                                <span className="text-slate-400 uppercase tracking-wider">Verification Report</span>
                                <span className={verdict.verdict === 'APPROVED' ? 'text-emerald-600' : 'text-red-500'}>
                                  {verdict.verdict}
                                </span>
                              </div>
                              <div className="whitespace-pre-line text-[9px] leading-normal font-mono text-slate-700 dark:text-slate-350">
                                {verdict.report}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

              </div>

            </div>

            {/* TELEMETRY AUDIT LOG HISTORY TABLE */}
            <div className="pt-4">
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100">Operations Telemetry Audit Trail</CardTitle>
                      <CardDescription className="text-[10px] font-medium text-slate-400">Database-backed execution logs for sheets synchronization, CAC registry verification, and OCR audits</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-t">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-black uppercase text-[8px] tracking-wider border-b">
                          <th className="py-3 px-4">Action Type</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Response/Details</th>
                          <th className="py-3 px-4">Executed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {telemetryLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 italic">No telemetry runs registered in audit database table.</td>
                          </tr>
                        ) : (
                          telemetryLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 font-black">
                                <Badge variant="secondary" className="font-mono text-[9px] bg-slate-100 dark:bg-slate-850">
                                  {log.action_type}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={`text-[8px] font-black uppercase py-0.5 px-2 ${
                                  log.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {log.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-400">{log.duration_ms}ms</td>
                              <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400 font-medium" title={log.response_details}>
                                {log.response_details}
                              </td>
                              <td className="py-3 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* TEAM & ACCESS CONTROL SETTINGS */}
        {activeSubTab === 'team' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Team & Access Control Settings</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Manage administrative staff accounts and delegate access levels using Role-Based Access Control (RBAC).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add New Team Member Form (restricted to SuperAdmin) */}
              <div className="lg:col-span-4">
                <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-black">Add Team Member</CardTitle>
                    <CardDescription className="text-[10px]">Invite an existing user as an administrative staff member.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isSuperAdmin ? (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border text-[11px] text-slate-400 italic text-center">
                        <Lock className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                        Only SuperAdmin staff can add or manage team roles.
                      </div>
                    ) : (
                      <form onSubmit={handleAddAdmin} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">User Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="staff@solarquotepro.com"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="w-full px-3 py-2 text-[11px] rounded-lg border bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Assigned Permission Role</label>
                          <select
                            value={newAdminRole}
                            onChange={(e: any) => setNewAdminRole(e.target.value)}
                            className="w-full p-2 text-[11px] border rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none"
                          >
                            <option value="superadmin">SuperAdmin (Full Permissions)</option>
                            <option value="operations">Operations (Verify CAC, Edit Directory)</option>
                            <option value="billing">Billing (Receipt OCR, Change Plan Tiers)</option>
                            <option value="read_only">Read-Only (View Dashboard Only)</option>
                          </select>
                        </div>

                        <Button
                          type="submit"
                          disabled={addingAdmin}
                          className="w-full bg-teal-650 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl h-9"
                        >
                          {addingAdmin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Register Staff Member"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Admins Directory List (8 cols) */}
              <div className="lg:col-span-8">
                <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-black">Platform Administrators</CardTitle>
                    <CardDescription className="text-[10px]">Active team members and their administrative scopes.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-t">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-black uppercase text-[8px] tracking-wider border-b">
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">User ID</th>
                            <th className="py-3 px-4">Scope Role</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {teamAdmins.map((admin) => (
                            <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 font-bold">{admin.email}</td>
                              <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{admin.user_id}</td>
                              <td className="py-3 px-4">
                                {isSuperAdmin ? (
                                  <select
                                    value={admin.role}
                                    onChange={(e) => handleUpdateAdminRole(admin.user_id, e.target.value)}
                                    className="p-1 rounded border text-[9px] font-black bg-white dark:bg-slate-900 text-teal-650"
                                  >
                                    <option value="superadmin">SuperAdmin</option>
                                    <option value="operations">Operations</option>
                                    <option value="billing">Billing</option>
                                    <option value="read_only">Read-Only</option>
                                  </select>
                                ) : (
                                  <Badge className="bg-slate-100 dark:bg-slate-850 text-slate-600 border-none text-[8px] font-black uppercase">
                                    {admin.role.toUpperCase()}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isSuperAdmin && admin.user_id !== 'dev-admin-id' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRemoveAdmin(admin.user_id)}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-bold rounded-lg h-7 px-3 border-none"
                                  >
                                    Revoke
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Protected</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
