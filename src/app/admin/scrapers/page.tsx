'use client';

import * as React from 'react';
import { 
  Compass, 
  Settings, 
  Search, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  MapPin,
  ExternalLink,
  Sliders,
  DollarSign,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  Flame,
  UserCheck,
  Zap,
  Save,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LocalConfig {
  googleSpreadsheetId: string;
  apifyToken: string;
  apifyDatasetId: string;
  googlePlacesApiKey: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappTemplateName: string;
  whatsappTemplateLanguageCode: string;
  whatsappDailyCap: number;
  whatsappEnabled: boolean;
  dryRun: boolean;
  businessSignature: string;
}

export default function AdminScrapers() {
  const [activeSubTab, setActiveSubTab] = React.useState<'scrapers' | 'settings' | 'logs'>('scrapers');
  const [config, setConfig] = React.useState<LocalConfig>({
    googleSpreadsheetId: '',
    apifyToken: '',
    apifyDatasetId: '',
    googlePlacesApiKey: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappTemplateName: 'lead_outreach_1',
    whatsappTemplateLanguageCode: 'en_US',
    whatsappDailyCap: 50,
    whatsappEnabled: false,
    dryRun: true,
    businessSignature: 'SolarPro Analytics'
  });
  
  const [logs, setLogs] = React.useState<any[]>([]);
  
  // Scraper Forms
  const [gMapsQuery, setGMapsQuery] = React.useState('Solar Installers Lagos');
  const [gMapsLimit, setGMapsLimit] = React.useState(10);
  const [jijiUrl, setJijiUrl] = React.useState('https://jiji.ng/lagos/solar-energy');
  const [jijiLimit, setJijiLimit] = React.useState(5);
  
  // Loading & progress states
  const [loadingConfig, setLoadingConfig] = React.useState(true);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [scraping, setScraping] = React.useState(false);
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');

  const fetchConfig = React.useCallback(async () => {
    try {
      setLoadingConfig(true);
      const resp = await fetch('/api/apexreach/config');
      const data = await resp.json();
      if (data && !data.error) {
        setConfig(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not load ApexReach scraper config.');
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const fetchLogs = React.useCallback(async () => {
    try {
      setLoadingLogs(true);
      const resp = await fetch('/api/apexreach/logs');
      const data = await resp.json();
      if (Array.isArray(data)) {
        setLogs(data.reverse()); // newest first
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  React.useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, [fetchConfig, fetchLogs]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const resp = await fetch('/api/apexreach/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await resp.json();
      if (data && !data.error) {
        setConfig(data);
        toast.success('Lead engine configuration updated successfully.');
      } else {
        toast.error(`Save failed: ${data.error}`);
      }
    } catch (e: any) {
      toast.error(`Connection failed: ${e.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Scraper execution triggers
  const executeGMapsScraper = async () => {
    if (!config.googlePlacesApiKey) {
      toast.error('Google Places API key is required to run places scraper.');
      return;
    }
    setScraping(true);
    setStatusMessage(`Searching Places API for "${gMapsQuery}"...`);
    try {
      const resp = await fetch(`/api/apexreach/scrape/maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gMapsQuery, limit: gMapsLimit })
      });
      const data = await resp.json();
      if (data.error) {
        toast.error(`Scrape failed: ${data.error}`);
        setStatusMessage(`Error: ${data.error}`);
      } else {
        toast.success(`Google Places search complete! Imported ${data.added} new B2B leads.`);
        setStatusMessage(`Imported ${data.added} leads. Skipped ${data.skipped} duplicates.`);
        fetchLogs();
      }
    } catch (e: any) {
      toast.error(`Execution error: ${e.message}`);
      setStatusMessage(`Error: ${e.message}`);
    } finally {
      setScraping(false);
    }
  };

  const executeJijiCrawler = async () => {
    setScraping(true);
    setStatusMessage(`Launching Playwright headless crawler for Jiji target...`);
    try {
      const resp = await fetch(`/api/apexreach/scrape/jiji`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jijiUrl, limit: jijiLimit })
      });
      const data = await resp.json();
      if (data.error) {
        toast.error(`Crawler failed: ${data.error}`);
        setStatusMessage(`Error: ${data.error}`);
      } else {
        toast.success(`Jiji extraction complete! Imported ${data.added} new leads.`);
        setStatusMessage(`Successfully extracted contact details. Imported ${data.added} leads.`);
        fetchLogs();
      }
    } catch (e: any) {
      toast.error(`Playwright crawler error: ${e.message}`);
      setStatusMessage(`Error: ${e.message}`);
    } finally {
      setScraping(false);
    }
  };

  const executeApifyIngest = async () => {
    if (!config.apifyToken || !config.apifyDatasetId) {
      toast.error('Apify Token and Dataset ID are required.');
      return;
    }
    setScraping(true);
    setStatusMessage(`Importing from Apify dataset ${config.apifyDatasetId}...`);
    try {
      const resp = await fetch(`/api/apexreach/apify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Lagos Businesses', limit: 10 })
      });
      const data = await resp.json();
      if (data.error) {
        toast.error(`Apify ingest failed: ${data.error}`);
        setStatusMessage(`Error: ${data.error}`);
      } else {
        toast.success(`Apify dataset ingestion complete! Ingested ${data.added} new leads.`);
        setStatusMessage(`Dataset import finished. Imported ${data.added} leads.`);
        fetchLogs();
      }
    } catch (e: any) {
      toast.error(`Apify connection error: ${e.message}`);
      setStatusMessage(`Error: ${e.message}`);
    } finally {
      setScraping(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Connecting to ApexReach B2B Engine configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <Compass className="h-4 w-4 shrink-0 animate-spin-slow" />
            <span>ApexReach B2B Integration Engine</span>
          </div>
          <h1 className="text-3xl font-black text-slate-850 dark:text-slate-50 tracking-tight mt-1">Lead Scrapers Console</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Control automated Places API extractors, Playwright browser crawlers, Apify integrations, and WhatsApp B2B outreach settings.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 p-1 rounded-xl">
          {[
            { id: 'scrapers', label: 'Scrapers' },
            { id: 'settings', label: 'Outreach & APIs' },
            { id: 'logs', label: 'Sync Logs' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === t.id 
                  ? 'bg-teal-600 text-white shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-855 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-650 dark:text-teal-400 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="text-xs font-bold">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-xs font-bold hover:text-slate-800 dark:hover:text-slate-200">✕</button>
        </div>
      )}

      {/* ═══ TAB 1: SCRAPERS CONSOLE ═══ */}
      {activeSubTab === 'scrapers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scraper Card 1: Google Maps Places API Scraper */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <MapPin className="h-4.5 w-4.5 text-teal-500" />
                  <span>Google Places API Scrape</span>
                </h3>
                <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/30 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">Automated API</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Leverage Google Places search indexes to extract verified corporate business profiles, location listings, and phone arrays.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Query Keyword</label>
                  <Input 
                    type="text" 
                    value={gMapsQuery} 
                    onChange={e => setGMapsQuery(e.target.value)} 
                    placeholder="e.g. Solar Contractors Abuja"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Results Limit</label>
                  <Input 
                    type="number" 
                    value={gMapsLimit} 
                    onChange={e => setGMapsLimit(Number(e.target.value))} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-xs"
                  />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850/30 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button 
                onClick={executeGMapsScraper} 
                disabled={scraping || !config.googlePlacesApiKey}
                className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-xs px-5 h-9.5 rounded-xl border-none shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <Search className="h-4 w-4" />
                <span>Execute API Scrape</span>
              </Button>
            </div>
          </Card>

          {/* Scraper Card 2: Playwright Headless Browser Jiji Crawler */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Zap className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  <span>Jiji Playwright Crawler</span>
                </h3>
                <Badge className="bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">Browser Automation</Badge>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                Launch a headless Chromium browser instance in the background to automatically target listing arrays and simulate contact detail extraction clicks.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jiji Category Target URL</label>
                  <Input 
                    type="text" 
                    value={jijiUrl} 
                    onChange={e => setJijiUrl(e.target.value)} 
                    placeholder="https://jiji.ng/lagos/..."
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Listings to Click</label>
                  <Input 
                    type="number" 
                    value={jijiLimit} 
                    onChange={e => setJijiLimit(Number(e.target.value))} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-xs"
                  />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850/30 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button 
                onClick={executeJijiCrawler} 
                disabled={scraping}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 h-9.5 rounded-xl border-none shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <Zap className="h-4 w-4" />
                <span>Execute Browser Crawler</span>
              </Button>
            </div>
          </Card>

          {/* Scraper Card 3: Apify Dataset Ingest */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Database className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Apify Dataset Ingest</span>
                </h3>
                <Badge className="bg-indigo-100 text-indigo-850 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/30 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">Cloud Webhook</Badge>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                Synchronize completed cloud execution runs by targeting Apify dataset IDs to seamlessly ingest and process structured lead lists.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apify Target Dataset ID</label>
                  <Input 
                    type="text" 
                    value={config.apifyDatasetId} 
                    onChange={e => setConfig({ ...config, apifyDatasetId: e.target.value })} 
                    placeholder="Enter Apify Dataset ID"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-xs"
                  />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850/30 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button 
                onClick={executeApifyIngest} 
                disabled={scraping || !config.apifyToken || !config.apifyDatasetId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 h-9.5 rounded-xl border-none shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <Database className="h-4 w-4" />
                <span>Execute Ingest Sync</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ TAB 2: GLOBAL OUTREACH & APIS SETTINGS ═══ */}
      {activeSubTab === 'settings' && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4.5 border-b border-slate-200/60 dark:border-slate-805 mb-6 gap-3">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sliders className="h-4.5 w-4.5 text-teal-650" />
                <span>ApexReach B2B Engine Core Settings</span>
              </h3>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Places API Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-teal-500 shrink-0" />
                    <span>Google Places API Key</span>
                  </label>
                  <Input 
                    type="password" 
                    value={config.googlePlacesApiKey} 
                    onChange={e => setConfig({ ...config, googlePlacesApiKey: e.target.value })} 
                    placeholder="Enter API Key"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                  />
                </div>

                {/* Apify Access Token */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>Apify Access Token</span>
                  </label>
                  <Input 
                    type="password" 
                    value={config.apifyToken} 
                    onChange={e => setConfig({ ...config, apifyToken: e.target.value })} 
                    placeholder="Enter Apify Token"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                  />
                </div>

                {/* Google Sheets Spreadsheet ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Google Sheets Spreadsheet ID</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.googleSpreadsheetId} 
                    onChange={e => setConfig({ ...config, googleSpreadsheetId: e.target.value })} 
                    placeholder="Enter Spreadsheet ID"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                  />
                </div>

                {/* Outreach Business Signature */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>WhatsApp Business Signature</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.businessSignature} 
                    onChange={e => setConfig({ ...config, businessSignature: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                  />
                </div>

                {/* WhatsApp Access Token */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Access Token (Cloud API)</span>
                  </label>
                  <Input 
                    type="password" 
                    value={config.whatsappAccessToken} 
                    onChange={e => setConfig({ ...config, whatsappAccessToken: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                  />
                </div>

                {/* WhatsApp Phone ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Phone Number ID</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.whatsappPhoneNumberId} 
                    onChange={e => setConfig({ ...config, whatsappPhoneNumberId: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
                  />
                </div>

                {/* Template Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Template Name</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.whatsappTemplateName} 
                    onChange={e => setConfig({ ...config, whatsappTemplateName: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                  />
                </div>

                {/* Daily Cap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Daily Send Cap</span>
                  </label>
                  <Input 
                    type="number" 
                    value={config.whatsappDailyCap} 
                    onChange={e => setConfig({ ...config, whatsappDailyCap: Number(e.target.value) })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Switches configurations: Enabled/Disabled dry run */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row gap-6 justify-around items-center">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="dryRun" 
                    checked={config.dryRun}
                    onChange={e => setConfig({ ...config, dryRun: e.target.checked })}
                    className="size-4 shrink-0 rounded border-slate-300 text-teal-650 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="dryRun" className="text-xs font-extrabold uppercase tracking-wide cursor-pointer text-slate-700 dark:text-slate-350 select-none">
                    Campaign Dry Run Mode (Simulate Dispatches)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="whatsappEnabled" 
                    checked={config.whatsappEnabled}
                    onChange={e => setConfig({ ...config, whatsappEnabled: e.target.checked })}
                    className="size-4 shrink-0 rounded border-slate-300 text-teal-650 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="whatsappEnabled" className="text-xs font-extrabold uppercase tracking-wide cursor-pointer text-slate-700 dark:text-slate-350 select-none">
                    Enable WhatsApp Outbound Channel
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={savingSettings}
                  className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-xs px-6 h-10 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Lead Engine Settings</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB 3: SYNC LOGS ═══ */}
      {activeSubTab === 'logs' && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                <span>ApexReach Synchronizations Pulse</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status stream of scraping operations and background lead dedupes.</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchLogs} 
              disabled={loadingLogs}
              className="h-8.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Reload Logs</span>
            </Button>
          </div>

          <div className="p-6 bg-slate-950/90 text-slate-200 font-mono text-xs overflow-y-auto max-h-[480px] space-y-2 border-t border-slate-900">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic py-8 text-center">No synchronization logs found in current execution thread.</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="pb-2 border-b border-slate-900/40 last:border-0 flex items-start gap-3">
                  <span className="text-slate-500 select-none">[{new Date(log[1]).toLocaleTimeString()}]</span>
                  <Badge className={`uppercase text-[8px] font-black tracking-wider py-0.5 px-2 rounded-full shrink-0 flex items-center gap-1 ${
                    log[4] === 'ERROR' 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-900/50' 
                      : log[4] === 'SUCCESS' 
                      ? 'bg-emerald-550/10 text-emerald-400 border border-emerald-900/50' 
                      : 'bg-teal-500/10 text-teal-400 border border-teal-900/50'
                  }`}>
                    {log[4]}
                  </Badge>
                  <span className="text-slate-400 font-bold shrink-0">({log[2]}):</span>
                  <span className="text-slate-300 font-semibold">{log[5]}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
