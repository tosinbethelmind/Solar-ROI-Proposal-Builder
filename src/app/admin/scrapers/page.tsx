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
  FileText,
  FileSpreadsheet,
  Sparkles,
  Loader2
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

  // Outscraper state
  const [outscraperApiKey, setOutscraperApiKey] = React.useState('');
  const [outscraperQuery, setOutscraperQuery] = React.useState('Solar Contractors Lagos');
  const [outscraperLimit, setOutscraperLimit] = React.useState(10);

  // Apify Launcher state
  const [apifyActorSelection, setApifyActorSelection] = React.useState<'linkedin' | 'facebook' | 'instagram' | 'google-maps'>('linkedin');
  const [apifyActorQuery, setApifyActorQuery] = React.useState('Solar Energy Nigeria');
  const [apifyActorLimit, setApifyActorLimit] = React.useState(10);
  const [apifyActorUrl, setApifyActorUrl] = React.useState('');
  
  // Loading & progress states
  const [loadingConfig, setLoadingConfig] = React.useState(true);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [scraping, setScraping] = React.useState(false);
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');

  // Scraper options toggles
  const [onlyWithPhone, setOnlyWithPhone] = React.useState<boolean>(true);
  const [verifyWebsite, setVerifyWebsite] = React.useState<boolean>(false);
  const [outscraperExtractEmails, setOutscraperExtractEmails] = React.useState<boolean>(true);
  const [outscraperExtractPhones, setOutscraperExtractPhones] = React.useState<boolean>(true);
  const [outscraperOnlyWithEmails, setOutscraperOnlyWithEmails] = React.useState<boolean>(false);
  const [jijiOnlyWhatsApp, setJijiOnlyWhatsApp] = React.useState<boolean>(false);
  const [jijiDeepScan, setJijiDeepScan] = React.useState<boolean>(false);
  const [apifySkipDuplicates, setApifySkipDuplicates] = React.useState<boolean>(true);
  const [apifyCleanItems, setApifyCleanItems] = React.useState<boolean>(true);

  // Google OAuth & automation states
  const [googleToken, setGoogleToken] = React.useState<string | null>(null);
  const [syncingSheets, setSyncingSheets] = React.useState(false);
  const [analyzingLeads, setAnalyzingLeads] = React.useState(false);
  const [leadReport, setLeadReport] = React.useState<string>('');

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
    // Load local Outscraper API Key
    const localOutKey = localStorage.getItem('outscraper_api_key');
    if (localOutKey) {
      setOutscraperApiKey(localOutKey);
    }
  }, []);

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

  const initiateOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';
    const redirectUri = window.location.origin + '/admin/scrapers/callback';
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/generative-language'
    ].join(' ');
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent('/admin/scrapers')}&prompt=consent`;
    window.location.href = oauthUrl;
  };

  const disconnectGoogle = () => {
    localStorage.removeItem('google_oauth_token');
    localStorage.removeItem('google_oauth_token_expires_at');
    setGoogleToken(null);
    toast.success('Disconnected from Google Services.');
  };

  // Google Sheets Direct Client-Side Sync using Access Token
  const handleSheetsSync = async () => {
    if (!googleToken) {
      toast.error('Google authorization required.');
      return;
    }
    if (!config.googleSpreadsheetId) {
      toast.error('Please specify a Spreadsheet ID in the settings tab first.');
      return;
    }

    setSyncingSheets(true);
    setStatusMessage('Exporting leads to Google Sheets...');
    
    try {
      // 1. Fetch current homeowner leads
      const leadsResp = await fetch('/api/leads/homeowner');
      const leadsJson = await leadsResp.json();
      const leadsList = leadsJson.data || [];

      if (leadsList.length === 0) {
        toast.error('No B2C leads in database to export.');
        setSyncingSheets(false);
        setStatusMessage('');
        return;
      }

      // Convert lead fields to string rows
      const sheetRows = leadsList.map((lead: any) => [
        lead.name,
        lead.phone,
        lead.email || 'N/A',
        lead.location || 'N/A',
        lead.kva_recommended || 'N/A',
        lead.running_load_w ? `${lead.running_load_w} W` : 'N/A',
        lead.monthly_fuel_spend ? `₦${lead.monthly_fuel_spend.toLocaleString()}` : 'N/A',
        lead.monthly_savings_ngn ? `₦${lead.monthly_savings_ngn.toLocaleString()}` : 'N/A',
        new Date(lead.created_at).toLocaleDateString()
      ]);

      // Add Headers Row
      const values = [
        ['Lead Name', 'Phone Number', 'Email Address', 'Location', 'Recommended Capacity', 'Calculated Load', 'Monthly Fuel Cost', 'Estimated Savings', 'Captured Date'],
        ...sheetRows
      ];

      // 2. Clear spreadsheet then write current dataset
      const spreadsheetId = config.googleSpreadsheetId;
      const range = 'Sheet1!A1:I500';

      const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!updateResponse.ok) {
        const errJson = await updateResponse.json();
        throw new Error(errJson.error?.message || 'Google Sheets API error.');
      }

      toast.success('Successfully synchronized B2C leads to Google Sheet!');
      setStatusMessage('Google Sheets Sync complete.');
    } catch (e: any) {
      console.error(e);
      toast.error(`Google Sheets Export failed: ${e.message}`);
      setStatusMessage(`Sync Error: ${e.message}`);
    } finally {
      setSyncingSheets(false);
    }
  };

  // Direct client-side Gemini Lead Intelligence Analytics using Access Token
  const handleGeminiAnalytics = async () => {
    if (!googleToken) {
      toast.error('Google authorization required.');
      return;
    }

    setAnalyzingLeads(true);
    setLeadReport('');
    setStatusMessage('Analyzing leads data with Gemini AI...');

    try {
      const leadsResp = await fetch('/api/leads/homeowner');
      const leadsJson = await leadsResp.json();
      const leadsList = leadsJson.data || [];

      if (leadsList.length === 0) {
        throw new Error('No homeowner leads database available to analyze.');
      }

      const promptText = `Analyze this list of captured homeowner leads for a solar installer company in Nigeria. 
      Generate a professional marketing insights report summarizing geographic distribution, load profile statistics, fuel outlay brackets, and recommendations on which specific regions or capacities represent the highest closing value.
      Leads Dataset JSON: ${JSON.stringify(leadsList)}`;

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
      const reportText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!reportText) {
        throw new Error('Empty intelligence report returned from Gemini.');
      }

      setLeadReport(reportText.trim());
      toast.success('Gemini Lead Diagnostics complete!');
      setStatusMessage('Gemini Intelligence diagnostics loaded.');
    } catch (e: any) {
      console.error(e);
      toast.error(`Gemini Analytics failed: ${e.message}`);
      setStatusMessage(`Diagnostics Error: ${e.message}`);
    } finally {
      setAnalyzingLeads(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      localStorage.setItem('outscraper_api_key', outscraperApiKey);
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
        body: JSON.stringify({ 
          query: gMapsQuery, 
          limit: gMapsLimit,
          onlyWithPhone,
          verifyWebsite
        })
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
        body: JSON.stringify({ 
          url: jijiUrl, 
          limit: jijiLimit,
          onlyWhatsApp: jijiOnlyWhatsApp,
          deepScan: jijiDeepScan
        })
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

  const executeOutscraperSync = async () => {
    if (!outscraperApiKey) {
      toast.error('Outscraper API Key is required. Please add it in settings.');
      return;
    }
    setScraping(true);
    setStatusMessage(`Querying Outscraper Google Maps for "${outscraperQuery}"...`);
    try {
      const url = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(outscraperQuery)}&limit=${outscraperLimit}&async=false`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': outscraperApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Outscraper returned status: ${response.status}`);
      }
      
      const json = await response.json();
      const results = json.data?.[0] || [];
      
      if (results.length === 0) {
        toast.warning('No results returned from Outscraper.');
        setStatusMessage('Outscraper search complete: 0 results.');
        return;
      }
      
      setStatusMessage(`Syncing ${results.length} Outscraper leads into local database...`);
      let added = 0;
      
      for (const item of results) {
        let email = item.email || (Array.isArray(item.emails) && item.emails[0]) || '';
        let phone = item.phone || (Array.isArray(item.phones) && item.phones[0]) || '';
        
        if (!outscraperExtractEmails) email = '';
        if (!outscraperExtractPhones) phone = '';
        if (outscraperOnlyWithEmails && !email) continue;
        
        const saveResp = await fetch('/api/leads/homeowner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name || 'Unknown Company',
            phone: phone || '08000000000',
            email: email || null,
            location: item.city || item.state || item.full_address || 'Nigeria',
            running_load_w: 5000,
            kva_recommended: '7.5 kVA',
            monthly_fuel_spend: 250000,
            monthly_savings_ngn: 200000
          })
        });
        if (saveResp.ok) added++;
      }
      
      toast.success(`Outscraper sync complete! Imported ${added} new leads.`);
      setStatusMessage(`Completed Outscraper sync. Loaded ${added} leads.`);
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      toast.error(`Outscraper failed: ${err.message}`);
      setStatusMessage(`Outscraper Error: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  const executeApifyLaunchAndSync = async () => {
    if (!config.apifyToken) {
      toast.error('Apify Access Token is required.');
      return;
    }
    
    setScraping(true);
    setStatusMessage(`Triggering Apify Cloud Runner for ${apifyActorSelection}...`);
    
    try {
      let actorId = '';
      let payload: any = {};
      
      switch (apifyActorSelection) {
        case 'linkedin':
          actorId = 'apify/linkedin-people-finder-scraper';
          payload = {
            searchQueries: [apifyActorQuery],
            limit: apifyActorLimit
          };
          break;
        case 'facebook':
          actorId = 'apify/facebook-pages-scraper';
          payload = {
            startUrls: [{ url: apifyActorUrl || 'https://www.facebook.com/search/pages/?q=' + encodeURIComponent(apifyActorQuery) }],
            maxResults: apifyActorLimit
          };
          break;
        case 'instagram':
          actorId = 'apify/instagram-scraper';
          payload = {
            search: apifyActorQuery,
            resultsLimit: apifyActorLimit
          };
          break;
        case 'google-maps':
          actorId = 'apify/google-maps-scraper';
          payload = {
            searchStrings: [apifyActorQuery],
            maxCrawledPlacesPerSearch: apifyActorLimit
          };
          break;
      }
      
      const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${config.apifyToken}`;
      const runResp = await fetch(runUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!runResp.ok) {
        throw new Error(`Apify Actor Run failed to start. Status ${runResp.status}`);
      }
      
      const runJson = await runResp.json();
      const datasetId = runJson.data?.defaultDatasetId;
      
      if (!datasetId) {
        throw new Error('No dataset ID returned.');
      }
      
      setConfig(prev => ({ ...prev, apifyDatasetId: datasetId }));
      toast.success(`Actor Run Launched! Assigned Dataset ID: ${datasetId}`);
      setStatusMessage(`Scraper active in cloud. Monitor or Ingest Dataset: ${datasetId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Apify Launch Failed: ${err.message}`);
      setStatusMessage(`Apify Error: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  const executeApifyIngestClient = async () => {
    if (!config.apifyToken || !config.apifyDatasetId) {
      toast.error('Apify Token and Dataset ID are required.');
      return;
    }
    
    setScraping(true);
    setStatusMessage(`Importing dataset ${config.apifyDatasetId} from Apify...`);
    
    try {
      const itemsUrl = `https://api.apify.com/v2/datasets/${config.apifyDatasetId}/items?token=${config.apifyToken}${apifyCleanItems ? '&clean=true' : ''}`;
      const itemsResp = await fetch(itemsUrl);
      
      if (!itemsResp.ok) {
        throw new Error(`Dataset download failed. Status ${itemsResp.status}`);
      }
      
      const items = await itemsResp.json();
      if (!Array.isArray(items) || items.length === 0) {
        toast.warning('No items returned from dataset.');
        setStatusMessage('Ingestion complete: 0 items.');
        return;
      }
      
      setStatusMessage(`Ingesting ${items.length} items from cloud dataset...`);
      let added = 0;
      
      for (const item of items) {
        const name = item.fullName || item.name || item.title || item.username || item.companyName || item.bizName || item.ownerName || 'Unknown Contact';
        
        let phone = item.phone || item.phoneNumber || item.telephone || item.mobile || item.contactPhone || '';
        if (!phone && Array.isArray(item.phoneNumbers) && item.phoneNumbers.length > 0) {
          phone = item.phoneNumbers[0];
        } else if (!phone && Array.isArray(item.phones) && item.phones.length > 0) {
          phone = item.phones[0];
        }
        
        let email = item.email || item.emailAddress || item.contactEmail || '';
        if (!email && Array.isArray(item.emails) && item.emails.length > 0) {
          email = item.emails[0];
        }
        
        if (apifySkipDuplicates && !phone && !email) continue;
        
        const location = item.location || item.city || item.address || item.country || 'Nigeria';
        
        const saveResp = await fetch('/api/leads/homeowner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            phone: phone || '08000000000',
            email: email || null,
            location: location,
            running_load_w: 3000,
            kva_recommended: '5 kVA',
            monthly_fuel_spend: 180000,
            monthly_savings_ngn: 150000
          })
        });
        if (saveResp.ok) added++;
      }
      
      toast.success(`Client-side Apify Sync complete! Ingested ${added} leads.`);
      setStatusMessage(`Successfully imported ${added} Apify leads.`);
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      toast.error(`Apify Ingestion failed: ${err.message}`);
      setStatusMessage(`Ingestion Error: ${err.message}`);
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
          <h1 className="text-3xl font-black text-slate-855 dark:text-slate-50 tracking-tight mt-1">Lead Scrapers Console</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Control automated Places API extractors, Playwright browser crawlers, Apify integrations, and WhatsApp B2B outreach settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!googleToken ? (
            <Button 
              onClick={initiateOAuth}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer text-slate-750 dark:text-slate-350"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.127 4.114a5.856 5.856 0 01-5.856-5.857c0-3.235 2.62-5.856 5.856-5.856 1.454 0 2.784.53 3.806 1.4 l3.056-3.056C18.91 3.23 15.79 2 12.24 2 6.584 2 2 6.584 2 12.24s4.584 10.24 10.24 10.24c6.202 0 10.24-4.364 10.24-10.24 0-.69-.06-1.355-.175-1.955H12.24z"/>
              </svg>
              <span>Connect Google Services</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-900/50 uppercase text-[9px] font-black tracking-wider flex items-center gap-1 h-9 px-3 rounded-xl">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Services Connected</span>
              </Badge>
              <Button 
                onClick={disconnectGoogle} 
                variant="ghost" 
                size="sm"
                className="h-9 px-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              >
                Disconnect
              </Button>
            </div>
          )}

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
                    ? 'bg-teal-650 text-white shadow-sm font-black' 
                    : 'text-slate-500 hover:text-slate-855 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-650 dark:text-teal-400 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="text-xs font-bold">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-xs font-bold hover:text-slate-855 dark:hover:text-slate-200">✕</button>
        </div>
      )}

      {/* ═══ GOOGLE AUTOMATION PANEL ═══ */}
      {googleToken && activeSubTab === 'scrapers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-3xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-emerald-650 dark:text-emerald-450 pb-2 border-b border-slate-100 dark:border-slate-850">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span>Google Sheets Exporter</span>
            </div>
            <p className="text-xs text-slate-550 leading-relaxed font-semibold">
              Push all currently captured homeowner leads database directly to the spreadsheet target config in a single click without server-side keys.
            </p>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Target Spreadsheet ID</span>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-350 truncate max-w-[200px]" title={config.googleSpreadsheetId}>
                {config.googleSpreadsheetId || 'Not configured in settings'}
              </span>
            </div>
            <Button
              onClick={handleSheetsSync}
              disabled={syncingSheets || !config.googleSpreadsheetId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl border-none shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {syncingSheets ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>Sync B2C Leads to Sheet</span>
            </Button>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-3xl overflow-hidden p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-teal-650 dark:text-teal-450 pb-2 border-b border-slate-100 dark:border-slate-850">
                <Sparkles className="w-5 h-5 text-teal-500" />
                <span>Gemini Lead Analytics</span>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold mt-3">
                Run zero-key Gemini flash algorithms client-side over your leads dataset to extract regional sales hubs and yield profiles.
              </p>
            </div>
            <Button
              onClick={handleGeminiAnalytics}
              disabled={analyzingLeads}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl border-none shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              {analyzingLeads ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Run AI Leads Diagnostics</span>
            </Button>
          </Card>

          {leadReport && (
            <Card className="md:col-span-2 border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 shadow-lg rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-400 border-b border-slate-900 pb-2.5">
                <ShieldCheck className="w-4.5 h-4.5 text-teal-400" />
                <span>Gemini AI Lead Intelligence Report</span>
              </div>
              <div className="text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2">
                {leadReport}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ TAB 1: SCRAPERS CONSOLE ═══ */}
      {activeSubTab === 'scrapers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Scraper Card 1: Google Places API Scraper */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-855 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <MapPin className="h-4.5 w-4.5 text-teal-500" />
                  <span>Google Places API Scrape</span>
                </h3>
                <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/30 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">Automated API</Badge>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
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
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Results Limit</label>
                  <Input 
                    type="number" 
                    value={gMapsLimit} 
                    onChange={e => setGMapsLimit(Number(e.target.value))} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={onlyWithPhone} 
                      onChange={e => setOnlyWithPhone(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-teal-650 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Only With Phone</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={verifyWebsite} 
                      onChange={e => setVerifyWebsite(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-teal-650 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Verify Website</span>
                  </label>
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

          {/* Scraper Card 2: Outscraper Maps & Web Contacts (NEW) */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-855 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Sliders className="h-4.5 w-4.5 text-amber-500" />
                  <span>Outscraper Maps & Emails</span>
                </h3>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">B2B + Web Contacts</Badge>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                Extracts Google Maps listings and crawls their corporate websites for public email addresses, phone numbers, and social links.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maps Search Query</label>
                  <Input 
                    type="text" 
                    value={outscraperQuery} 
                    onChange={e => setOutscraperQuery(e.target.value)} 
                    placeholder="e.g. Solar Companies Lagos"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Results Limit</label>
                  <Input 
                    type="number" 
                    value={outscraperLimit} 
                    onChange={e => setOutscraperLimit(Number(e.target.value))} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={outscraperExtractEmails} 
                      onChange={e => setOutscraperExtractEmails(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Emails</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={outscraperExtractPhones} 
                      onChange={e => setOutscraperExtractPhones(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Phones</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={outscraperOnlyWithEmails} 
                      onChange={e => setOutscraperOnlyWithEmails(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Only Emails</span>
                  </label>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850/30 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button 
                onClick={executeOutscraperSync} 
                disabled={scraping || !outscraperApiKey}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 h-9.5 rounded-xl border-none shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Execute Outscraper Sync</span>
              </Button>
            </div>
          </Card>

          {/* Scraper Card 3: Jiji Playwright Crawler */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-855 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Zap className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
                  <span>Jiji Playwright Crawler</span>
                </h3>
                <Badge className="bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/30 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">Browser Automation</Badge>
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
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Listings to Click</label>
                  <Input 
                    type="number" 
                    value={jijiLimit} 
                    onChange={e => setJijiLimit(Number(e.target.value))} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-880">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={jijiOnlyWhatsApp} 
                      onChange={e => setJijiOnlyWhatsApp(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">WhatsApp Only</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={jijiDeepScan} 
                      onChange={e => setJijiDeepScan(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Deep Scan</span>
                  </label>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850/30 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button 
                onClick={executeJijiCrawler} 
                disabled={scraping}
                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-5 h-9.5 rounded-xl border-none shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <Zap className="h-4 w-4" />
                <span>Execute Browser Crawler</span>
              </Button>
            </div>
          </Card>

          {/* Scraper Card 4: Apify Social Cloud Launcher (NEW) */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between md:col-span-2 lg:col-span-3">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850">
                <h3 className="font-extrabold text-slate-855 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Database className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Apify Cloud Scraper (LinkedIn, Meta & Maps)</span>
                </h3>
                <Badge className="bg-indigo-100 text-indigo-850 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/30 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">Apify Cloud Integration</Badge>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                Launch serverless cloud scraper actors directly on Apify to securely crawl LinkedIn profiles, Facebook pages, or Instagram accounts without IP blocks, and ingest completed datasets.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Platform</label>
                  <select
                    value={apifyActorSelection}
                    onChange={e => setApifyActorSelection(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="linkedin">LinkedIn People Search</option>
                    <option value="facebook">Facebook Pages Search</option>
                    <option value="instagram">Instagram Hashtag/Profile</option>
                    <option value="google-maps">Google Maps Scraper</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {apifyActorSelection === 'facebook' ? 'Optional Facebook Target URL' : 'Search Keywords / Keywords Array'}
                  </label>
                  <Input 
                    type="text" 
                    value={apifyActorSelection === 'facebook' ? apifyActorUrl : apifyActorQuery} 
                    onChange={e => {
                      if (apifyActorSelection === 'facebook') {
                        setApifyActorUrl(e.target.value);
                      } else {
                        setApifyActorQuery(e.target.value);
                      }
                    }} 
                    placeholder={apifyActorSelection === 'facebook' ? "https://www.facebook.com/..." : "e.g. Solar Contractors Nigeria"}
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Results Limit</label>
                  <Input 
                    type="number" 
                    value={apifyActorLimit} 
                    onChange={e => setApifyActorLimit(Number(e.target.value))} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apify Ingest Dataset ID</label>
                  <Input 
                    type="text" 
                    value={config.apifyDatasetId} 
                    onChange={e => setConfig({ ...config, apifyDatasetId: e.target.value })} 
                    placeholder="Enter completed run dataset ID"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-bold text-xs"
                  />
                </div>
                <div className="md:col-span-3 flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={apifyCleanItems} 
                      onChange={e => setApifyCleanItems(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Clean Dataset Fields</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={apifySkipDuplicates} 
                      onChange={e => setApifySkipDuplicates(e.target.checked)} 
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Skip Empty Contacts</span>
                  </label>
                </div>
              </div>
            </CardContent>
            
            <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850/30 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-3 justify-end items-center">
              <Button 
                onClick={executeApifyLaunchAndSync} 
                disabled={scraping || !config.apifyToken}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 font-extrabold text-xs px-5 h-9.5 rounded-xl border-none shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Launch Cloud Run</span>
              </Button>
              <Button 
                onClick={executeApifyIngestClient} 
                disabled={scraping || !config.apifyToken || !config.apifyDatasetId}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 h-9.5 rounded-xl border-none shadow-sm flex items-center gap-1.5 cursor-pointer mt-4"
              >
                <Database className="h-4 w-4" />
                <span>Ingest Dataset Leads</span>
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
              <h3 className="font-extrabold text-slate-855 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sliders className="h-4.5 w-4.5 text-teal-650" />
                <span>ApexReach B2B Engine Core Settings</span>
              </h3>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Places API Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-teal-500 shrink-0" />
                    <span>Google Places API Key</span>
                  </label>
                  <Input 
                    type="password" 
                    value={config.googlePlacesApiKey} 
                    onChange={e => setConfig({ ...config, googlePlacesApiKey: e.target.value })} 
                    placeholder="Enter API Key"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-mono text-xs font-bold"
                  />
                </div>

                {/* Apify Access Token */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>Apify Access Token</span>
                  </label>
                  <Input 
                    type="password" 
                    value={config.apifyToken} 
                    onChange={e => setConfig({ ...config, apifyToken: e.target.value })} 
                    placeholder="Enter Apify Token"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-mono text-xs font-bold"
                  />
                </div>

                {/* Google Sheets Spreadsheet ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Google Sheets Spreadsheet ID</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.googleSpreadsheetId} 
                    onChange={e => setConfig({ ...config, googleSpreadsheetId: e.target.value })} 
                    placeholder="Enter Spreadsheet ID"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-mono text-xs font-bold"
                  />
                </div>

                {/* Outscraper API Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Outscraper API Key</span>
                  </label>
                  <Input 
                    type="password" 
                    value={outscraperApiKey} 
                    onChange={e => setOutscraperApiKey(e.target.value)} 
                    placeholder="Enter Outscraper API Key"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 font-mono text-xs font-bold"
                  />
                </div>

                {/* Outreach Business Signature */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>WhatsApp Business Signature</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.businessSignature} 
                    onChange={e => setConfig({ ...config, businessSignature: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-xs font-bold"
                  />
                </div>

                {/* WhatsApp Access Token */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Access Token (Cloud API)</span>
                  </label>
                  <Input 
                    type="password" 
                    value={config.whatsappAccessToken} 
                    onChange={e => setConfig({ ...config, whatsappAccessToken: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-955 font-mono text-xs font-bold"
                  />
                </div>

                {/* WhatsApp Phone ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Phone Number ID</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.whatsappPhoneNumberId} 
                    onChange={e => setConfig({ ...config, whatsappPhoneNumberId: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-955 font-mono text-xs font-bold"
                  />
                </div>

                {/* Template Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Template Name</span>
                  </label>
                  <Input 
                    type="text" 
                    value={config.whatsappTemplateName} 
                    onChange={e => setConfig({ ...config, whatsappTemplateName: e.target.value })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-955 text-xs font-bold"
                  />
                </div>

                {/* Daily Cap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-550 flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>WhatsApp Daily Send Cap</span>
                  </label>
                  <Input 
                    type="number" 
                    value={config.whatsappDailyCap} 
                    onChange={e => setConfig({ ...config, whatsappDailyCap: Number(e.target.value) })} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-955 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Switches configurations: Enabled/Disabled dry run */}
              <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row gap-6 justify-around items-center">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="dryRun" 
                    checked={config.dryRun}
                    onChange={e => setConfig({ ...config, dryRun: e.target.checked })}
                    className="size-4 shrink-0 rounded border-slate-350 text-teal-650 focus:ring-teal-500 cursor-pointer"
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
                    className="size-4 shrink-0 rounded border-slate-355 text-teal-655 focus:ring-teal-500 cursor-pointer"
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
              <h3 className="text-sm font-extrabold text-slate-855 dark:text-slate-50 uppercase tracking-wider flex items-center gap-2">
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

          <div className="p-6 bg-slate-955/90 text-slate-200 font-mono text-xs overflow-y-auto max-h-[480px] space-y-2 border-t border-slate-900">
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
                      ? 'bg-emerald-555/10 text-emerald-400 border border-emerald-900/50' 
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
