'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  Copy, 
  Check, 
  Share2, 
  Send,
  MessageSquare, 
  Globe,
  Users,
  Settings,
  Mail,
  Zap,
  Info,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface HomeownerLead {
  id: string;
  name: string;
  phone: string;
  location: string | null;
  running_load_w: number | null;
  kva_recommended: string | null;
  monthly_savings_ngn: number | null;
  monthly_fuel_spend: number | null;
}

export default function SocialOutreachPage() {
  const router = useRouter();

  // Authentication states
  const [googleToken, setGoogleToken] = React.useState<string | null>(null);

  // Sub-tabs: 'copywriter' | 'queue'
  const [activeSubTab, setActiveSubTab] = React.useState<'copywriter' | 'queue'>('copywriter');

  // CRM Leads Queue states
  const [leads, setLeads] = React.useState<HomeownerLead[]>([]);
  const [loadingLeads, setLoadingLeads] = React.useState<boolean>(false);
  const [selectedLead, setSelectedLead] = React.useState<HomeownerLead | null>(null);
  
  // Custom Gateway configurations (localStorage backed)
  const [outreachMethod, setOutreachMethod] = React.useState<'manual' | 'twilio'>('manual');
  const [twilioSid, setTwilioSid] = React.useState<string>('');
  const [twilioToken, setTwilioToken] = React.useState<string>('');
  const [twilioSender, setTwilioSender] = React.useState<string>('');

  // Queue sending states tracking
  const [queueDrafts, setQueueDrafts] = React.useState<Record<string, string>>({});
  const [queueStatus, setQueueStatus] = React.useState<Record<string, 'pending' | 'drafting' | 'ready' | 'sending' | 'sent' | 'failed'>>({});
  const [processingQueue, setProcessingQueue] = React.useState<boolean>(false);

  // Selector states (Original Tab)
  const [channel, setChannel] = React.useState<'nairaland' | 'facebook' | 'whatsapp' | 'linkedin'>('whatsapp');
  const [systemSize, setSystemSize] = React.useState<string>('5kVA');
  const [targetCity, setTargetCity] = React.useState<string>('Lagos');
  const [fuelPrice, setFuelPrice] = React.useState<number>(1250);
  const [hoursPerDay, setHoursPerDay] = React.useState<number>(6);
  const [customLink, setCustomLink] = React.useState<string>('');

  // Generation status (Original Tab)
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [generatedDraft, setGeneratedDraft] = React.useState<string>('');
  const [copied, setCopied] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Read credentials from localStorage
    const token = localStorage.getItem('google_oauth_token');
    const expiresAt = localStorage.getItem('google_oauth_token_expires_at');
    if (token) {
      if (expiresAt && new Date().getTime() > parseInt(expiresAt, 10)) {
        localStorage.removeItem('google_oauth_token');
        localStorage.removeItem('google_oauth_token_expires_at');
        setGoogleToken(null);
        toast.warning('Google Services session expired. Please connect again.');
      } else {
        setGoogleToken(token);
      }
    }

    const savedMethod = localStorage.getItem('social_outreach_method') as 'manual' | 'twilio';
    if (savedMethod) setOutreachMethod(savedMethod);

    setTwilioSid(localStorage.getItem('social_twilio_sid') || '');
    setTwilioToken(localStorage.getItem('social_twilio_token') || '');
    setTwilioSender(localStorage.getItem('social_twilio_sender') || '');

    if (typeof window !== 'undefined') {
      setCustomLink(`${window.location.origin}/start-simple`);
    }
  }, []);

  // Fetch CRM Leads
  const fetchCRMLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/leads/homeowner');
      const json = await res.json();
      if (json.data) {
        // Filter leads that have numbers
        const validLeads = json.data.filter((l: HomeownerLead) => l.phone && l.phone.trim().length > 0);
        setLeads(validLeads);
        if (validLeads.length > 0) {
          setSelectedLead(validLeads[0]);
        }
        
        // Initialize status records
        const initialStatus: Record<string, 'pending'> = {};
        validLeads.forEach((l: HomeownerLead) => {
          initialStatus[l.id] = 'pending';
        });
        setQueueStatus(prev => ({ ...initialStatus, ...prev }));
      }
    } catch (e) {
      toast.error('Failed to load CRM leads.');
    } finally {
      setLoadingLeads(false);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'queue' && leads.length === 0) {
      fetchCRMLeads();
    }
  }, [activeSubTab]);

  // Save Gateway Credentials
  const saveCredentials = () => {
    localStorage.setItem('social_outreach_method', outreachMethod);
    localStorage.setItem('social_twilio_sid', twilioSid);
    localStorage.setItem('social_twilio_token', twilioToken);
    localStorage.setItem('social_twilio_sender', twilioSender);
    toast.success('WhatsApp Gateway settings saved locally!');
  };

  const initiateOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';
    const redirectUri = window.location.origin + '/admin/scrapers/callback';
    const scopes = ['https://www.googleapis.com/auth/generative-language'].join(' ');
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent('/admin/social')}&prompt=consent`;
    window.location.href = oauthUrl;
  };

  // Generate for outreach tab
  const handleGenerateCampaign = async () => {
    if (!googleToken) {
      toast.error('Google authorization required. Please connect your account first.');
      return;
    }
    setGenerating(true);
    setGeneratedDraft('');

    try {
      const monthlyHours = hoursPerDay * 30.4;
      const fuelConsumptionRate = parseFloat(systemSize) >= 7.5 ? 2.2 : (parseFloat(systemSize) >= 5 ? 1.5 : 0.8);
      const estMonthlyFuelCost = Math.round(monthlyHours * fuelConsumptionRate * fuelPrice);
      const estMonthlySolarOM = Math.round((5000000 * 0.01) / 12);
      const estMonthlySavings = Math.max(0, estMonthlyFuelCost - estMonthlySolarOM);

      let channelGuidelines = '';
      if (channel === 'nairaland') {
        channelGuidelines = `Write a comprehensive, engaging thread starter for Nairaland (Science & Technology or Property/Energy section).
        - Use conversational Nigerian English (use a pinch of local slang like 'PHCN / NEPA', 'band A tariffs', 'grid crash', 'generator noise/smoke' naturally where fitting).
        - Break down the mathematics: Show how running a generator for ${hoursPerDay} hours a day at ₦${fuelPrice}/litre compounds to ₦${estMonthlyFuelCost.toLocaleString()}/month in fuel.
        - Showcase how a ${systemSize} hybrid inverter structure pays for itself in less than 24 months.
        - Focus on analytical EEAT details: temperature derating in ${targetCity}, environmental losses, and inverter surge factors.
        - End with a call to action containing this URL: ${customLink} to tell them to audit their home load profiles.
        - Return the content formatted with clean paragraphs since Nairaland doesn't support complex markdown, use bold tags or numbers.`;
      } else if (channel === 'facebook') {
        channelGuidelines = `Write an optimized post for residential estate Facebook groups (e.g. Gbagada Developers, Lekki Residents, Abuja Estates).
        - Address community pain points: Noise pollution, high service charges for diesel plants, and inconsistent grid bands.
        - Detail the financial offset: ₦${estMonthlyFuelCost.toLocaleString()}/month generator fuel charges vs. solar repayment.
        - Invite members to try the free landlord-tenant sizing calculator.
        - Include this URL: ${customLink}
        - Keep comments/replies section friendly and helpful.`;
      } else if (channel === 'whatsapp') {
        channelGuidelines = `Write a short, high-conversion broadcast message for local estate WhatsApp groups.
        - Must be extremely punchy and conversational.
        - Use emojis wisely.
        - Frame it as a community advisory service (e.g., "Hello neighbors...").
        - Highlight: Fuel at ₦${fuelPrice}/L = ₦${estMonthlyFuelCost.toLocaleString()}/mo in generator smoke.
        - Provide the link directly: ${customLink} to calculate their home ROI in 60 seconds.
        - Keep under 180 words.`;
      } else {
        channelGuidelines = `Write a high-authority B2B LinkedIn article matching professional marketing and financial engineering.
        - Frame solar not as an expense, but as a Capital Expenditure (CAPEX) shielding operational expenses (OPEX) from NERC band inflation and FX fuel changes.
        - Detail the financial metrics: Compare Sterling Bank's 24% Green Loan vs. SunFi's 30% APR options against the ₦${estMonthlyFuelCost.toLocaleString()}/mo fuel cost.
        - Discuss energy resilience and productivity in ${targetCity}.
        - Embed link: ${customLink}`;
      }

      const systemPrompt = `You are a legendary Nigerian solar marketing consultant, copywriter, and business developer.
      Write a localized social media outreach piece targeting Nigerian energy users based on these guidelines:
      Target Channel: ${channel.toUpperCase()}
      City Focus: ${targetCity}
      System Capacity: ${systemSize}
      Fuel Baseline: ₦${fuelPrice}/Litre (Petrol)
      Generator usage: ${hoursPerDay} hours/day
      Custom Referral URL: ${customLink}
      Estimated Gen Cost: ₦${estMonthlyFuelCost.toLocaleString()}/month
      Estimated Monthly Savings: ₦${estMonthlySavings.toLocaleString()}/month
      Do NOT add any intro or outro text. Return ONLY the generated copy ready to be shared.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      if (!response.ok) throw new Error(`Google API returned status ${response.status}`);
      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from model.');

      setGeneratedDraft(rawText.trim());
      toast.success('AI campaign generated successfully!');
    } catch (e: any) {
      toast.error(`Outreach generation failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    toast.success('Campaign copy copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handeWhatsAppShare = () => {
    if (!generatedDraft) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedDraft)}`;
    window.open(url, '_blank');
  };

  // Draft copy specifically for a single queued lead
  const handleDraftForLead = async (lead: HomeownerLead) => {
    if (!googleToken) {
      toast.error('Connect Google AI first.');
      return;
    }
    setQueueStatus(prev => ({ ...prev, [lead.id]: 'drafting' }));

    try {
      const systemPrompt = `You are a professional solar engineer & sales consultant in Nigeria for SolarQuotePro.
      Generate a highly-persuasive WhatsApp outreach text for this lead:
      - Client Name: ${lead.name}
      - Recipient Phone: ${lead.phone}
      - Location: ${lead.location || 'Lagos'}
      - Recommended Solar Sizing: ${lead.kva_recommended || '5kVA'}
      - Est. Generator Fuel Cost: ₦${(lead.monthly_fuel_spend || 220000).toLocaleString()}/month
      - Savings with Solar: ₦${(lead.monthly_savings_ngn || 180000).toLocaleString()}/month
      - Referral Estimator Link: ${customLink}

      Rules:
      - Keep it short, personalized, and conversational. Use emojis.
      - Contrast their current generator expenses against solar savings.
      - Add a Call to Action to review their load metrics on the link: ${customLink}.
      - DO NOT add headers, preambles or greetings. Start right into the message.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      if (!response.ok) throw new Error();
      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error();

      setQueueDrafts(prev => ({ ...prev, [lead.id]: rawText.trim() }));
      setQueueStatus(prev => ({ ...prev, [lead.id]: 'ready' }));
      toast.success(`Custom draft made for ${lead.name}`);
    } catch {
      setQueueStatus(prev => ({ ...prev, [lead.id]: 'failed' }));
      toast.error(`Drafting failed for ${lead.name}`);
    }
  };

  // Send campaign copy to a single lead
  const handleSendToLead = async (lead: HomeownerLead) => {
    const draftContent = queueDrafts[lead.id];
    if (!draftContent) {
      toast.error('Draft not created yet. Please click draft first.');
      return;
    }

    if (outreachMethod === 'manual') {
      const url = `https://api.whatsapp.com/send?phone=${lead.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(draftContent)}`;
      window.open(url, '_blank');
      setQueueStatus(prev => ({ ...prev, [lead.id]: 'sent' }));
      toast.info(`Opened WhatsApp chat for ${lead.name}`);
    } else {
      // Backend autosend
      setQueueStatus(prev => ({ ...prev, [lead.id]: 'sending' }));
      try {
        const res = await fetch('/api/admin/social/autosend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'twilio',
            to: lead.phone,
            body: draftContent,
            twilioSid,
            twilioToken,
            twilioSender
          })
        });

        const json = await res.json();
        if (json.success) {
          setQueueStatus(prev => ({ ...prev, [lead.id]: 'sent' }));
          toast.success(`Message autosent successfully to ${lead.name}!`);
        } else {
          setQueueStatus(prev => ({ ...prev, [lead.id]: 'failed' }));
          toast.error(json.error || `Failed to autosend to ${lead.name}`);
        }
      } catch (e: any) {
        setQueueStatus(prev => ({ ...prev, [lead.id]: 'failed' }));
        toast.error('Network gateway error sending request.');
      }
    }
  };

  // Bulk Process Autosend Queue
  const handleBulkAutosend = async () => {
    if (outreachMethod === 'twilio' && (!twilioSid || !twilioToken || !twilioSender)) {
      toast.error('Please configure your Twilio credentials in the settings block first.');
      return;
    }

    const pendingLeads = leads.filter(l => queueStatus[l.id] === 'ready' || queueStatus[l.id] === 'pending');
    if (pendingLeads.length === 0) {
      toast.info('No pending leads ready to send in queue.');
      return;
    }

    setProcessingQueue(true);
    toast.info(`Starting batch run for ${pendingLeads.length} leads. Awaiting AI drafts & delivery triggers...`);

    for (const lead of pendingLeads) {
      try {
        // Step 1: Draft dynamically if not done yet
        if (!queueDrafts[lead.id]) {
          await handleDraftForLead(lead);
        }

        // Delay to allow status hook updates
        await new Promise(r => setTimeout(r, 1200));

        // Step 2: Send message
        await handleSendToLead(lead);
        
        // Wait 2 seconds between SMS/WhatsApp to prevent serverless lockouts
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(err);
      }
    }

    setProcessingQueue(false);
    toast.success('Completed batch campaigns queue run.');
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-205 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <Share2 className="h-4 w-4 shrink-0 text-teal-500 animate-pulse" />
            <span>Outbound Leads & Campaigns</span>
          </div>
          <h1 className="text-3xl font-black text-slate-855 dark:text-slate-50 tracking-tight mt-1">Community Outreach Copilot</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Automate social media positioning and local forum campaigns using real-world Nigerian fuel math.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {!googleToken ? (
            <Button 
              onClick={initiateOAuth}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-2 bg-white dark:bg-slate-900 cursor-pointer text-slate-655"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.127 4.114a5.856 5.856 0 01-5.856-5.857c0-3.235 2.62-5.856 5.856-5.856 1.454 0 2.784.53 3.806 1.4 l3.056-3.056C18.91 3.23 15.79 2 12.24 2 6.584 2 2 6.584 2 12.24s4.584 10.24 10.24 10.24c6.202 0 10.24-4.364 10.24-10.24 0-.69-.06-1.355-.175-1.955H12.24z"/>
              </svg>
              <span>Connect Google AI</span>
            </Button>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-900/50 uppercase text-[9px] font-black tracking-wider flex items-center gap-1 h-9 px-3 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Connected</span>
            </Badge>
          )}

          <Button
            onClick={() => router.push('/admin')}
            variant="ghost"
            size="sm"
            className="h-9 border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-505 hover:text-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('copywriter')}
          className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-colors ${
            activeSubTab === 'copywriter'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📝 Community Copywriter
        </button>
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-colors ${
            activeSubTab === 'queue'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📂 CRM WhatsApp Queue
        </button>
      </div>

      {activeSubTab === 'copywriter' ? (
        /* ==========================================
           TAB 1: ORIGINAL SOCIAL COPYWRITER CONSOLE
           ========================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings Panel */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
              <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 font-extrabold text-xs uppercase tracking-wider">
                Campaign Configuration
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Outreach Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="whatsapp">💬 WhatsApp Group Broadcast</option>
                    <option value="nairaland">🇳🇬 Nairaland Thread (Science/Property)</option>
                    <option value="facebook">👥 Facebook Group Post (Estate Forum)</option>
                    <option value="linkedin">👔 LinkedIn Professional CAPEX Pitch</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Model System Sizing</label>
                  <select
                    value={systemSize}
                    onChange={(e) => setSystemSize(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="3kVA">3kVA System (3 Panels)</option>
                    <option value="5kVA">5kVA System (6 Panels)</option>
                    <option value="7.5kVA">7.5kVA System (9 Panels)</option>
                    <option value="10kVA">10kVA System (12+ Panels)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target City</label>
                    <select
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200"
                    >
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Kano">Kano</option>
                      <option value="Port Harcourt">Port Harcourt</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gen Run Hours/day</label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Math.min(24, Math.max(1, parseInt(e.target.value) || 4)))}
                      className="h-9.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Litre Petrol Price (₦)</label>
                  <Input
                    type="number"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(Math.max(1, parseInt(e.target.value) || 1250))}
                    className="h-9.5 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Referral Sizer Link</label>
                  <Input
                    type="url"
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    className="h-9.5 text-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleGenerateCampaign}
                    disabled={generating || !googleToken}
                    className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Composing Campaign...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Compose Outreach Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Copy Output Panel */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-3xl overflow-hidden min-h-[450px] flex flex-col justify-between">
              <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-955/20 flex justify-between items-center">
                <span className="font-extrabold text-slate-855 dark:text-slate-100 text-xs uppercase tracking-wider">Generated Copy Output</span>
                {generatedDraft && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      size="xs"
                      variant="outline"
                      className="h-8 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-teal-500/20"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                    {channel === 'whatsapp' && (
                      <Button
                        onClick={handeWhatsAppShare}
                        size="xs"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send WhatsApp Group</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                {generatedDraft ? (
                  <textarea
                    value={generatedDraft}
                    onChange={(e) => setGeneratedDraft(e.target.value)}
                    className="w-full flex-1 p-4 border rounded-2xl bg-slate-50 dark:bg-slate-950 font-medium text-xs leading-relaxed text-slate-800 dark:text-slate-350 outline-none resize-none focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-12 space-y-3">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    <div className="max-w-xs space-y-1">
                      <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase animate-pulse">Awaiting Campaign Generation</span>
                      <span className="block text-[11px] text-slate-400">
                        Configure baseline energy parameters on the left and click Compose Outreach.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ==========================================
           TAB 2: CRM LEADS WHATSAPP QUEUE & SEND PANEL
           ========================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Leads Selection list (7/12) */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-855 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-650" /> B2C Sizer Leads Queue
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Leads with phone numbers synced from sizer tools.</p>
                  </div>
                  <Button 
                    onClick={fetchCRMLeads} 
                    variant="outline" 
                    size="xs" 
                    className="h-8 text-[9px] font-black uppercase"
                  >
                    Refresh Leads List
                  </Button>
                </div>

                <div className="p-0 max-h-[500px] overflow-y-auto">
                  {loadingLeads ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Syncing sizer leads...</span>
                    </div>
                  ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2.5">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-semibold">No leads with verified phone numbers found.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/40 border-b text-[9px] text-slate-400 font-bold uppercase tracking-wider select-none">
                          <th className="p-3">Client</th>
                          <th className="p-3">Load Sizing</th>
                          <th className="p-3">Gen Spend</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {leads.map((lead) => {
                          const isSelected = selectedLead?.id === lead.id;
                          const stat = queueStatus[lead.id] || 'pending';
                          const hasDraft = !!queueDrafts[lead.id];
                          
                          return (
                            <tr 
                              key={lead.id} 
                              onClick={() => setSelectedLead(lead)}
                              className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/20 cursor-pointer ${
                                isSelected ? 'bg-teal-50/20 dark:bg-teal-950/10 border-l-2 border-l-teal-500' : ''
                              }`}
                            >
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900 dark:text-slate-100">{lead.name}</div>
                                <div className="text-[9px] text-slate-450 font-semibold">{lead.phone} | {lead.location || 'Lagos'}</div>
                              </td>
                              <td className="p-3 font-semibold">
                                <Badge variant="outline" className="text-[8px] bg-slate-50 font-bold px-1.5 h-4.5">
                                  {lead.kva_recommended || '5kVA'}
                                </Badge>
                              </td>
                              <td className="p-3 font-mono text-[10px]">
                                ₦{(lead.monthly_fuel_spend || 0).toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  stat === 'sent' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                  stat === 'sending' ? 'bg-indigo-100 text-indigo-805 dark:bg-indigo-950/40 dark:text-indigo-400' :
                                  stat === 'failed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-955/40 dark:text-rose-400' :
                                  stat === 'ready' ? 'bg-amber-100 text-amber-808 dark:bg-amber-950/40 dark:text-amber-405' :
                                  'bg-slate-104 text-slate-500 dark:bg-slate-800'
                                }`}>
                                  {stat}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  onClick={() => handleDraftForLead(lead)}
                                  size="xs"
                                  variant="outline"
                                  disabled={stat === 'drafting'}
                                  className="h-7 text-[8px] font-black uppercase rounded-lg border-teal-500/10"
                                >
                                  {stat === 'drafting' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'AI Draft'}
                                </Button>
                                <Button
                                  onClick={() => handleSendToLead(lead)}
                                  size="xs"
                                  disabled={!hasDraft || stat === 'sending'}
                                  className={`h-7 text-[8px] font-black uppercase rounded-lg ${
                                    hasDraft ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {outreachMethod === 'manual' ? 'Launch' : 'Send'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>

              {/* Bulk sending action panel */}
              {leads.length > 0 && (
                <div className="flex gap-4">
                  <Button 
                    onClick={handleBulkAutosend}
                    disabled={processingQueue}
                    className="flex-1 h-11 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-650 hover:to-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {processingQueue ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Bulk Autosender Running Queue...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Bulk Autosend Ready queue</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column: Queue Gateway Configuration & Edit drafts (5/12) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Settings Card */}
              <Card className="border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-950/20 text-slate-805 dark:text-slate-100 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-teal-650" /> Gateway Configurations
                </div>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Outreach Delivery Method</label>
                    <select
                      value={outreachMethod}
                      onChange={(e) => setOutreachMethod(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-850 focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="manual">Manual Redirect (WhatsApp Web Web-Link)</option>
                      <option value="twilio">Twilio Automated Gateway (Instant API)</option>
                    </select>
                  </div>

                  {outreachMethod === 'twilio' && (
                    <div className="space-y-3.5 border-t pt-3.5 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Twilio Account SID</label>
                        <Input
                          type="text"
                          value={twilioSid}
                          onChange={(e) => setTwilioSid(e.target.value)}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="h-9.5 font-mono text-[10px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Twilio Auth Token</label>
                        <Input
                          type="password"
                          value={twilioToken}
                          onChange={(e) => setTwilioToken(e.target.value)}
                          placeholder="••••••••••••••••••••••••••••"
                          className="h-9.5 font-mono text-[10px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Registered WhatsApp Sender Number</label>
                        <Input
                          type="text"
                          value={twilioSender}
                          onChange={(e) => setTwilioSender(e.target.value)}
                          placeholder="+14155238886"
                          className="h-9.5 font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={saveCredentials} 
                    className="w-full h-9 background-slate bg-slate-800 hover:bg-slate-900 dark:bg-slate-950 dark:hover:bg-slate-1000 text-white text-[10px] font-bold uppercase rounded-xl"
                  >
                    Save settings locally
                  </Button>
                </CardContent>
              </Card>

              {/* Individual Lead Draft Preview/Editor Card */}
              {selectedLead && (
                <Card className="border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-3xl overflow-hidden min-h-[300px] flex flex-col justify-between">
                  <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-855 dark:text-slate-100 uppercase tracking-wider">
                      Draft Preview: {selectedLead.name}
                    </span>
                    {queueDrafts[selectedLead.id] && (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold uppercase text-[8px]">
                        Copy Loaded
                      </Badge>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    {queueDrafts[selectedLead.id] ? (
                      <textarea
                        value={queueDrafts[selectedLead.id]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQueueDrafts(prev => ({ ...prev, [selectedLead.id]: val }));
                        }}
                        className="w-full flex-1 p-3 border rounded-2xl bg-slate-50 dark:bg-slate-950 font-medium text-xs leading-relaxed text-slate-800 dark:text-slate-350 outline-none resize-none focus:ring-1 focus:ring-teal-500 min-h-[180px]"
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-8 space-y-2.5">
                        <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        <div className="max-w-xs space-y-1">
                          <span className="block text-[11px] font-bold text-slate-600 uppercase">No Draft Available</span>
                          <span className="block text-[10px] text-slate-400">
                            Click 'AI Draft' in the table row for {selectedLead.name} to generate a personalized calculation proposal.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {queueDrafts[selectedLead.id] && (
                    <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-955/20 text-[10px] text-slate-450 dark:text-slate-400 font-bold flex gap-2">
                       <Info className="w-3.5 h-3.5 text-teal-650 shrink-0" />
                       <span>You can edit the draft copy manually above before hitting Send to customize details.</span>
                    </div>
                  )}
                </Card>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
