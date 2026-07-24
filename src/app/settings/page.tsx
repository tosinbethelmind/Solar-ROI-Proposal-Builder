'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthButton } from '@/components/auth/AuthButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyrightYear } from '@/components/ui/CopyrightYear';
import { Building, Award, Phone, Mail, Upload, ArrowLeft, Settings, Check, Loader2, Image as ImageIcon, Trash2, Eye, EyeOff, ExternalLink, ShieldCheck, Cpu, Zap, Cloud, Database } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [nercNumber, setNercNumber] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');

  // Integration API Keys (scaling)
  const [resendApiKey, setResendApiKey] = React.useState('');
  const [resendFromEmail, setResendFromEmail] = React.useState('');
  const [cloudflareR2BucketName, setCloudflareR2BucketName] = React.useState('');
  const [cloudflareR2AccountId, setCloudflareR2AccountId] = React.useState('');
  const [cloudflareR2AccessKey, setCloudflareR2AccessKey] = React.useState('');
  const [cloudflareR2SecretKey, setCloudflareR2SecretKey] = React.useState('');
  const [inngestEventKey, setInngestEventKey] = React.useState('');
  const [upstashRedisRestUrl, setUpstashRedisRestUrl] = React.useState('');
  const [upstashRedisRestToken, setUpstashRedisRestToken] = React.useState('');

  // Password visibility states
  const [showResendKey, setShowResendKey] = React.useState(false);
  const [showR2Secret, setShowR2Secret] = React.useState(false);
  const [showInngestKey, setShowInngestKey] = React.useState(false);
  const [showRedisToken, setShowRedisToken] = React.useState(false);

  // Drag and drop helper state
  const [dragActive, setDragActive] = React.useState(false);

  // Load auth session first
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Please sign in to access settings.');
          router.push('/login');
          return;
        }
        setUser(session.user);
        await loadProfile(session.user);
      } catch (err) {
        console.error('Auth check error:', err);
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Load existing profile from Supabase and localStorage fallback
  async function loadProfile(currentUser: any) {
    try {
      // 1. Fetch from installers table
      const { data: installer, error: installerErr } = await supabase
        .from('installers')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (installer) {
        setCompanyName(installer.company_name || '');
        setLogoUrl(installer.logo_url || '');
        setPhone(installer.phone || '');
      }

      // 2. Fetch company association
      const { data: member, error: memberErr } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (member?.company_id) {
        setCompanyId(member.company_id);
        const { data: company, error: companyErr } = await supabase
          .from('companies')
          .select('*')
          .eq('id', member.company_id)
          .maybeSingle();

        if (company) {
          if (company.name) setCompanyName(company.name);
          if (company.logo_url) setLogoUrl(company.logo_url);
          if (company.nerc_number) setNercNumber(company.nerc_number);
          if (company.whatsapp || company.phone) setPhone(company.whatsapp || company.phone);
          if (company.email) setEmail(company.email);
        }
      }

      // 3. Populate business email from auth metadata if empty
      if (!email && currentUser.email) {
        setEmail(currentUser.email);
      }

      // 4. LocalStorage Sync / Pre-populate fallback
      const stored = localStorage.getItem('installerProfile');
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          if (!companyName && profile.companyName) setCompanyName(profile.companyName);
          if (!logoUrl && profile.logo) setLogoUrl(profile.logo);
          if (!nercNumber && profile.nercNumber) setNercNumber(profile.nercNumber);
          if (!phone && profile.whatsAppNumber) setPhone(profile.whatsAppNumber);
          if (!email && profile.businessEmail) setEmail(profile.businessEmail);
        } catch {}
      }

      // Load scaling integrations configuration
      let integrationsLoaded = false;
      
      // A. Try loading from Supabase user metadata
      if (currentUser?.user_metadata?.scalingIntegrations) {
        const i = currentUser.user_metadata.scalingIntegrations;
        setResendApiKey(i.resendApiKey || '');
        setResendFromEmail(i.resendFromEmail || '');
        setCloudflareR2BucketName(i.cloudflareR2BucketName || '');
        setCloudflareR2AccountId(i.cloudflareR2AccountId || '');
        setCloudflareR2AccessKey(i.cloudflareR2AccessKey || '');
        setCloudflareR2SecretKey(i.cloudflareR2SecretKey || '');
        setInngestEventKey(i.inngestEventKey || '');
        setUpstashRedisRestUrl(i.upstashRedisRestUrl || '');
        setUpstashRedisRestToken(i.upstashRedisRestToken || '');
        integrationsLoaded = true;
      }

      // B. Fallback to localStorage
      if (!integrationsLoaded) {
        const storedIntegrations = localStorage.getItem('scalingIntegrations');
        if (storedIntegrations) {
          try {
            const i = JSON.parse(storedIntegrations);
            setResendApiKey(i.resendApiKey || '');
            setResendFromEmail(i.resendFromEmail || '');
            setCloudflareR2BucketName(i.cloudflareR2BucketName || '');
            setCloudflareR2AccountId(i.cloudflareR2AccountId || '');
            setCloudflareR2AccessKey(i.cloudflareR2AccessKey || '');
            setCloudflareR2SecretKey(i.cloudflareR2SecretKey || '');
            setInngestEventKey(i.inngestEventKey || '');
            setUpstashRedisRestUrl(i.upstashRedisRestUrl || '');
            setUpstashRedisRestToken(i.upstashRedisRestToken || '');
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle uploaded logo files
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, or SVG).');
      return;
    }
    
    // Check file size (recommend < 1MB before client-side downscaling)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image is too large. Please select an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create Canvas for downscaling / compression to keep local storage & database records lightweight
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image inside target boundary
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL('image/png', 0.85);
            setLogoUrl(dataUrl);
            toast.success('Logo loaded and optimized successfully!');
          } catch (e) {
            console.error('Canvas dataUrl extraction failed:', e);
            // Fallback to original base64
            setLogoUrl(event.target?.result as string);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const clearLogo = () => {
    setLogoUrl('');
    toast.info('Logo cleared.');
  };

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Company Name is required.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Contact Phone Number is required (for WhatsApp triggers).');
      return;
    }

    setSaving(true);
    try {
      // 1. Update installers database table
      const { error: installerErr } = await supabase
        .from('installers')
        .upsert({
          id: user.id,
          company_name: companyName,
          logo_url: logoUrl,
          phone: phone,
        });

      if (installerErr) {
        console.error('Installer table update error:', installerErr);
      }

      // 2. Update companies database table
      if (companyId) {
        const { error: companyErr } = await supabase
          .from('companies')
          .update({
            name: companyName,
            logo_url: logoUrl,
            nerc_number: nercNumber,
            phone: phone,
            whatsapp: phone,
            email: email,
          })
          .eq('id', companyId);

        if (companyErr) {
          console.error('Companies table update error:', companyErr);
        }
      }

      // 3. Update localStorage installerProfile key
      let currentLocalProfile: any = {};
      const stored = localStorage.getItem('installerProfile');
      if (stored) {
        try {
          currentLocalProfile = JSON.parse(stored);
        } catch {}
      }

      const updatedProfile = {
        ...currentLocalProfile,
        companyName: companyName,
        logo: logoUrl,
        nercNumber: nercNumber,
        whatsAppNumber: phone,
        businessEmail: email,
      };

      localStorage.setItem('installerProfile', JSON.stringify(updatedProfile));

      // 4. Trigger global event for components listening to changes
      window.dispatchEvent(new Event('storage'));

      // 5. Save Scaling Integrations
      const integrations = {
        resendApiKey,
        resendFromEmail,
        cloudflareR2BucketName,
        cloudflareR2AccountId,
        cloudflareR2AccessKey,
        cloudflareR2SecretKey,
        inngestEventKey,
        upstashRedisRestUrl,
        upstashRedisRestToken
      };
      
      localStorage.setItem('scalingIntegrations', JSON.stringify(integrations));
      
      // Sync to Supabase user metadata so it persists across installer devices
      const { error: authErr } = await supabase.auth.updateUser({
        data: { scalingIntegrations: integrations }
      });

      if (authErr) {
        console.error('Failed to sync integrations to user metadata:', authErr);
      }

      toast.success('Installer settings saved successfully!');
      
      // Delay slightly and return to workspace
      setTimeout(() => {
        router.push('/workspace');
      }, 800);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 text-teal-650 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading profile configurations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-350 transition-colors duration-300">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/workspace" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-bold text-base tracking-tight text-slate-855 dark:text-slate-50">SolarQuotePro</span>
            <Badge variant="outline" className="border-teal-500/20 text-teal-650 dark:text-teal-400 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ml-1">Settings</Badge>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800 flex items-center gap-1" onClick={() => router.push('/workspace')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Workspace
            </Button>
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Settings Panel */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100">Installer Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure company metadata, NERC credentials, and branding layout parameters.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Building className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Branding & Core Details</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Provide official identity information utilized for generating proposal branding and PDF summaries.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Company Name *</Label>
                <div className="relative">
                  <Input 
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Solar Solutions"
                    required
                    className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50"
                  />
                </div>
              </div>

              {/* Logo Upload Box */}
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Company Logo (PNG / JPG / SVG)</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* File Uploader Target */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`md:col-span-2 border-2 border-dashed rounded-2xl flex flex-col justify-center items-center p-6 text-center cursor-pointer transition-colors ${
                      dragActive 
                        ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/10' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-teal-500/50 bg-slate-50/40 dark:bg-slate-950/30'
                    }`}
                    onClick={() => document.getElementById('logoFileInput')?.click()}
                  >
                    <input 
                      id="logoFileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-sm mb-3">
                      <Upload className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-teal-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Drag logo file here or <span className="text-teal-600 dark:text-teal-400 underline">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, or SVG up to 2MB. Logo will automatically resize.</p>
                  </div>

                  {/* Logo Preview Container */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25 rounded-2xl p-4 flex flex-col justify-center items-center relative group min-h-[140px]">
                    {logoUrl ? (
                      <>
                        <div className="relative w-full h-24 flex items-center justify-center bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-inner p-2">
                          <img 
                            src={logoUrl} 
                            alt="Logo preview" 
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <Button 
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearLogo}
                          className="mt-2.5 h-7 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold rounded-lg flex items-center gap-1 px-2.5"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear Logo</span>
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <ImageIcon className="h-8 w-8 stroke-[1.5]" />
                        <span className="text-[10px] mt-1.5 font-semibold uppercase tracking-wider">No Logo Configured</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Logo URL Fallback */}
                <div className="mt-3">
                  <Label htmlFor="logoUrl" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Or use Logo Image URL</Label>
                  <Input 
                    id="logoUrl"
                    type="url"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png (fallback URL)"
                    className="mt-1 h-9 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-xs"
                    disabled={logoUrl.startsWith('data:')}
                  />
                  {logoUrl.startsWith('data:') && (
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 font-semibold">✓ Currently using locally uploaded/embedded image logo.</p>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Award className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Certification & Compliance</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Provide official authorization numbers to establish proposal compliance with NERC and local DISCO criteria.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* NERC Number */}
              <div className="space-y-2">
                <Label htmlFor="nercNumber" className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">NERC Installer Certification Number</Label>
                <Input 
                  id="nercNumber"
                  type="text"
                  value={nercNumber}
                  onChange={(e) => setNercNumber(e.target.value)}
                  placeholder="e.g. NERC/CAT-A/2026/089"
                  className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50"
                />
              </div>

            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Contact & Communication channels</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Inputs utilized for connecting communication portals, WhatsApp proposal sharing links, and reply-to messages.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Phone / WhatsApp *</Label>
                  <Input 
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    required
                    className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50"
                  />
                  <p className="text-[10px] text-slate-400">Must include country code (e.g. +234) for WhatsApp redirect integration.</p>
                </div>

                {/* Business Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Business Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@apexsolar.ng"
                    className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <Cpu className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <span>Scaling & API Integrations (Free Tier)</span>
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50 flex items-center gap-1 font-bold text-[10px]">
                  <Zap className="h-3 w-3 fill-current" />
                  <span>100% Free Scale</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Supercharge your proposal engine at zero cost. Connect Resend for emails, Cloudflare R2 for storage, Inngest for queues, and Upstash Redis.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Resend Integration */}
              <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/40 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Resend Email Delivery</span>
                  </div>
                  <a 
                    href="https://resend.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1"
                  >
                    <span>Get Free API Key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resendApiKey" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resend API Key</Label>
                    <div className="relative">
                      <Input 
                        id="resendApiKey"
                        type={showResendKey ? "text" : "password"}
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                        placeholder="re_123456789..."
                        className="h-10 pr-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResendKey(!showResendKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resendFromEmail" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sender Email (e.g. proposals@yourdomain.com)</Label>
                    <Input 
                      id="resendFromEmail"
                      type="email"
                      value={resendFromEmail}
                      onChange={(e) => setResendFromEmail(e.target.value)}
                      placeholder="proposals@yourcompany.com"
                      className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Resend provides 3,000 free emails/month for sending customized proposals directly to clients.</p>
              </div>

              {/* Cloudflare R2 Storage */}
              <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/40 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cloudflare R2 Object Storage</span>
                  </div>
                  <a 
                    href="https://dash.cloudflare.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1"
                  >
                    <span>Get R2 (10GB Free)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cloudflareR2BucketName" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bucket Name</Label>
                    <Input 
                      id="cloudflareR2BucketName"
                      type="text"
                      value={cloudflareR2BucketName}
                      onChange={(e) => setCloudflareR2BucketName(e.target.value)}
                      placeholder="solar-proposals"
                      className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cloudflareR2AccountId" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account ID</Label>
                    <Input 
                      id="cloudflareR2AccountId"
                      type="text"
                      value={cloudflareR2AccountId}
                      onChange={(e) => setCloudflareR2AccountId(e.target.value)}
                      placeholder="e.g. 8a8b8c8d8e8f8g8h8i8j..."
                      className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cloudflareR2AccessKey" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Key ID</Label>
                    <Input 
                      id="cloudflareR2AccessKey"
                      type="text"
                      value={cloudflareR2AccessKey}
                      onChange={(e) => setCloudflareR2AccessKey(e.target.value)}
                      placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                      className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cloudflareR2SecretKey" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Secret Access Key</Label>
                    <div className="relative">
                      <Input 
                        id="cloudflareR2SecretKey"
                        type={showR2Secret ? "text" : "password"}
                        value={cloudflareR2SecretKey}
                        onChange={(e) => setCloudflareR2SecretKey(e.target.value)}
                        placeholder="Secret key..."
                        className="h-10 pr-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowR2Secret(!showR2Secret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showR2Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Cloudflare R2 provides S3-compatible object storage with 10GB free and $0 egress/download fees for proposal assets.</p>
              </div>

              {/* Inngest Background Tasks */}
              <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/40 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Inngest Workflow Key</span>
                  </div>
                  <a 
                    href="https://www.inngest.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1"
                  >
                    <span>Get Inngest (50k Free Runs)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inngestEventKey" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inngest Event Key</Label>
                  <div className="relative">
                    <Input 
                      id="inngestEventKey"
                      type={showInngestKey ? "text" : "password"}
                      value={inngestEventKey}
                      onChange={(e) => setInngestEventKey(e.target.value)}
                      placeholder="e.g. signkey_..."
                      className="h-10 pr-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowInngestKey(!showInngestKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showInngestKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Inngest provides event-driven serverless background queues. Free tier allows 50,000 runs/month for async operations.</p>
              </div>

              {/* Upstash Redis */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Upstash Redis REST Connection</span>
                  </div>
                  <a 
                    href="https://upstash.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1"
                  >
                    <span>Get Upstash (10k Free Q/Day)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="upstashRedisRestUrl" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">REST URL</Label>
                    <Input 
                      id="upstashRedisRestUrl"
                      type="text"
                      value={upstashRedisRestUrl}
                      onChange={(e) => setUpstashRedisRestUrl(e.target.value)}
                      placeholder="https://...upstash.io"
                      className="h-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upstashRedisRestToken" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">REST Token</Label>
                    <div className="relative">
                      <Input 
                        id="upstashRedisRestToken"
                        type={showRedisToken ? "text" : "password"}
                        value={upstashRedisRestToken}
                        onChange={(e) => setUpstashRedisRestToken(e.target.value)}
                        placeholder="Token..."
                        className="h-10 pr-10 border-slate-200 dark:border-slate-800 focus-visible:border-teal-500 dark:bg-slate-950/50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRedisToken(!showRedisToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showRedisToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Upstash Redis handles live API rate-limiting, parallel-market fx cache, and temporary sessions with 10k free requests per day.</p>
              </div>

            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/workspace')}
              className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl h-11 px-6 text-sm"
              disabled={saving}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              className="bg-teal-650 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-bold rounded-xl h-11 px-8 text-sm flex items-center gap-2 shadow-md shadow-teal-650/10"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-450 dark:text-slate-500 bg-white/40 dark:bg-slate-900/10">
        <p>SolarQuotePro Proposal Builder &copy; <CopyrightYear />. All rights reserved.</p>
      </footer>
    </div>
  );
}
