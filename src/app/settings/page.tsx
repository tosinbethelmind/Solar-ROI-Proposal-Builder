'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Phone,
  Upload,
  Palette,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export interface InstallerProfile {
  companyName: string;
  cacNumber: string;
  nercNumber: string;
  yearsInBusiness: string;
  whatsAppNumber: string;
  socialHandle: string;
  companyLogo: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
}

const DEFAULT_PROFILE: InstallerProfile = {
  companyName: '',
  cacNumber: '',
  nercNumber: '',
  yearsInBusiness: '',
  whatsAppNumber: '',
  socialHandle: '',
  companyLogo: '',
  primaryColor: '#01696f',
  secondaryColor: '#01414a',
  tagline: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<InstallerProfile>(DEFAULT_PROFILE);
  const [mounted, setMounted] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('installerProfile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfile({ ...DEFAULT_PROFILE, ...parsed });
        } catch {
          // ignore
        }
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (key: keyof InstallerProfile, val: string) => {
    setProfile((prev) => ({ ...prev, [key]: val }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 1.5MB for offline localStorage)
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Logo must be under 1.5MB to ensure offline storage is fast and reliable.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        handleChange('companyLogo', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem('installerProfile', JSON.stringify(profile));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handlePresetColor = (primary: string, secondary: string) => {
    setProfile((prev) => ({ ...prev, primaryColor: primary, secondaryColor: secondary }));
  };

  // Determine if profile has essential branding filled out
  const isProfileComplete = profile.companyName.trim() !== '' && profile.whatsAppNumber.trim() !== '';

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col transition-colors duration-300">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              </div>
              <span className="font-bold text-base tracking-tight">SolarPro</span>
            </Link>
            {isProfileComplete ? (
              <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1 text-[10px] py-0.5 rounded-full uppercase tracking-wider font-bold">
                <CheckCircle2 className="w-3 h-3" /> Profile Complete ✓
              </Badge>
            ) : (
              <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-450 border-amber-200 dark:border-amber-900/30 text-[10px] py-0.5 rounded-full uppercase tracking-wider font-bold">
                Profile Incomplete
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-muted transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Installer Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Branded settings, official certifications, and company identity credentials.</p>
          </div>
          <Button onClick={handleSave} className="bg-teal-650 hover:bg-teal-700 text-white font-bold px-6 shadow-md hover:shadow-lg transition-all rounded-xl">
            Save Settings
          </Button>
        </div>

        {savedMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 text-sm font-semibold rounded-2xl animate-in slide-in-from-top-3 duration-200 flex items-center gap-2 shadow-sm shadow-emerald-500/5">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span>Profile settings saved successfully! Official branding has been updated automatically on all PDF proposals.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Company Profile */}
            <Card className="border overflow-hidden">
              <div className="border-b bg-card/40 px-5 py-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-base">Company Profile</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Company Name</label>
                    <Input
                      placeholder="e.g. Alaba Solar Ltd"
                      value={profile.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tagline / Slogan</label>
                    <Input
                      placeholder="e.g. Reliable power for everyone"
                      value={profile.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Years in Business</label>
                    <Input
                      placeholder="e.g. 5"
                      type="number"
                      value={profile.yearsInBusiness}
                      onChange={(e) => handleChange('yearsInBusiness', e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Company Logo</label>
                    <div className="flex gap-3 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl flex items-center gap-2 shrink-0"
                      >
                        <Upload className="w-4 h-4" /> Upload Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {profile.companyLogo ? (
                        <div className="relative size-10 rounded-lg overflow-hidden border bg-white shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={profile.companyLogo}
                            alt="Logo preview"
                            className="object-contain size-full"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground truncate">No logo selected (default placeholder used)</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Legal Credentials & Certificates */}
            <Card className="border overflow-hidden">
              <div className="border-b bg-card/40 px-5 py-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-base">Legal Credentials &amp; Verification</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 text-amber-800 dark:text-amber-300 text-xs rounded-xl flex items-start gap-2.5">
                  <Award className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Nigerian Legal Trust Verification</span>
                    <span>Displaying your CAC number and NERC (Nigerian Electricity Regulatory Commission) credentials directly on the PDF footer immediately distinguishes you from roadside freelancers.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">CAC RC Number</label>
                    <Input
                      placeholder="e.g. RC 1234567"
                      value={profile.cacNumber}
                      onChange={(e) => handleChange('cacNumber', e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">NERC / SON License Number</label>
                    <Input
                      placeholder="e.g. NERC/INSTALL/2026-90"
                      value={profile.nercNumber}
                      onChange={(e) => handleChange('nercNumber', e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Color Branding & Contact Info */}
            <Card className="border overflow-hidden">
              <div className="border-b bg-card/40 px-5 py-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-base">Color Branding &amp; Contact</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> WhatsApp Phone Number
                    </label>
                    <Input
                      placeholder="e.g. +2348031234567"
                      value={profile.whatsAppNumber}
                      onChange={(e) => handleChange('whatsAppNumber', e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Must include country code (e.g. +234) for WhatsApp links.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                      <InstagramIcon className="w-3.5 h-3.5" /> Social Handle (Instagram/FB)
                    </label>
                    <Input
                      placeholder="e.g. @alabasolar"
                      value={profile.socialHandle}
                      onChange={(e) => handleChange('socialHandle', e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Custom Brand Palette</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Primary Color</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={profile.primaryColor}
                          onChange={(e) => handleChange('primaryColor', e.target.value)}
                          className="w-12 h-10 p-1 rounded-xl shrink-0 cursor-pointer border-slate-200 dark:border-slate-800"
                        />
                        <Input
                          value={profile.primaryColor}
                          onChange={(e) => handleChange('primaryColor', e.target.value)}
                          className="rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Secondary Color</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={profile.secondaryColor}
                          onChange={(e) => handleChange('secondaryColor', e.target.value)}
                          className="w-12 h-10 p-1 rounded-xl shrink-0 cursor-pointer border-slate-200 dark:border-slate-800"
                        />
                        <Input
                          value={profile.secondaryColor}
                          onChange={(e) => handleChange('secondaryColor', e.target.value)}
                          className="rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground">Or pick a curated premium palette:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Eco Teal', primary: '#01696f', secondary: '#01414a' },
                        { name: 'Solar Amber', primary: '#d97706', secondary: '#78350f' },
                        { name: 'Deep Royal', primary: '#1d4ed8', secondary: '#1e3a8a' },
                        { name: 'Classic Gold', primary: '#ca8a04', secondary: '#451a03' },
                        { name: 'Lekki Ocean', primary: '#0ea5e9', secondary: '#0369a1' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handlePresetColor(preset.primary, preset.secondary)}
                          className="flex items-center gap-1 text-[11px] border px-2.5 py-1 rounded-lg hover:bg-muted font-medium transition-colors"
                        >
                          <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: preset.primary }} />
                          <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: preset.secondary }} />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branded PDF Proposal Mock Preview Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Live Brand Proposal Mock
              </h3>

              {/* Branded PDF Mockup Card */}
              <div className="rounded-2xl border shadow-xl bg-white text-slate-900 overflow-hidden font-sans aspect-[1/1.3] flex flex-col p-6 space-y-6 text-xs transform hover:scale-[1.01] transition-transform">
                {/* Proposal Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    {profile.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.companyLogo} alt="Logo" className="max-h-8 max-w-[120px] object-contain mb-1.5" />
                    ) : (
                      <div className="size-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm mb-1.5 shadow-sm">
                        {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                    <h4 className="font-extrabold text-[13px] tracking-tight" style={{ color: profile.primaryColor }}>
                      {profile.companyName || 'SolarPro Solutions'}
                    </h4>
                    <p className="text-[9px] text-slate-500 italic mt-0.5">{profile.tagline || 'Reliable Clean Energy Systems'}</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-bold uppercase tracking-wider text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-650">
                      Proposal #082
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="space-y-1">
                  <p className="font-bold text-slate-500 text-[9px] uppercase tracking-wide">Client Profile</p>
                  <p className="font-semibold text-slate-800 text-[11px]">Hon. Babajide Kolawole</p>
                  <p className="text-slate-550 text-[9px]">Lekki Phase 1, Lagos, Nigeria</p>
                </div>

                {/* Sizing Details */}
                <div className="rounded-xl p-3 text-white space-y-1.5 shadow-md flex justify-between items-center" style={{ backgroundColor: profile.primaryColor }}>
                  <div>
                    <h5 className="font-extrabold text-xs">5.0 kVA Smart Hybrid System</h5>
                    <p className="text-[10px] opacity-90 font-medium">Economic Tier Sizing Sized</p>
                  </div>
                  <span className="text-[13px] font-extrabold" style={{ color: profile.secondaryColor === '#01414a' ? '#ffffff' : profile.secondaryColor }}>
                    ₦4,650,000
                  </span>
                </div>

                {/* BOM Preview */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-500 text-[9px] uppercase tracking-wide mb-1">Component BOM</p>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between border-b pb-1">
                        <span>1x Growatt 5kVA Inverter (SON)</span>
                        <span className="font-semibold">✓</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>2x Felicity Lithium 48V (SON)</span>
                        <span className="font-semibold">✓</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>6x Jinko 550W Panels (SON)</span>
                        <span className="font-semibold">✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Cert Badge Nudge */}
                  <div className="flex justify-center py-1">
                    <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] py-0.5 rounded-full flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      SON-Certified Components Used
                    </Badge>
                  </div>
                </div>

                {/* Footer Signature */}
                <div className="border-t pt-3 flex justify-between items-center text-[9px] text-slate-500">
                  <div className="space-y-0.5">
                    {profile.cacNumber && <p className="font-mono">CAC: {profile.cacNumber}</p>}
                    {profile.nercNumber && <p className="font-mono">NERC: {profile.nercNumber}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: profile.primaryColor }}>
                      {profile.whatsAppNumber || '+234 803 000 0000'}
                    </p>
                    {profile.socialHandle && <p>{profile.socialHandle}</p>}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border p-3.5 rounded-xl leading-relaxed">
                🚀 <strong>Auto-Sizing integration:</strong> Once you fill out these details, they are permanently locked into your local profile. Newly created proposals instantly read and inject this custom styling and company verification credentials into Step 5 final summaries and print PDFs!
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t py-6 bg-muted/20 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} SolarPro — Built for Nigerian Installers</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Offline-ready PWA
          </p>
        </div>
      </footer>
    </div>
  );
}
