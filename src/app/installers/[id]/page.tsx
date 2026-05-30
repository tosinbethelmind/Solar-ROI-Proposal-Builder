'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Star, 
  Phone, 
  Mail, 
  Share2, 
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { LeadSubmissionModal } from '@/components/marketplace/LeadSubmissionModal';

export default function InstallerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { installers, serviceAreas, subscriptions } = useMarketplaceStore();
  const installer = installers.find(i => i.id === id);

  // Lead modal state
  const [showLeadModal, setShowLeadModal] = React.useState(false);

  if (!installer) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Installer Profile Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The installer profile you requested could not be retrieved from the database.</p>
        <Link href="/installers">
          <Button variant="outline" className="text-xs rounded-xl">
            Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const sub = subscriptions.find(s => s.installer_id === installer.id);
  const isPremiumPlus = sub?.tier === 'verified_partner_plus';
  const matchingSa = serviceAreas.filter(sa => sa.installer_id === installer.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/installers" className="flex items-center gap-1.5 text-xs font-black text-slate-655 hover:text-teal-650 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Link>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowLeadModal(true)}
              size="sm" 
              className="bg-teal-650 text-white hover:bg-teal-700 font-extrabold text-[11px] rounded-xl h-8 border-none"
            >
              Request Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Summary & Primary CTAs */}
        <div className="space-y-6 md:col-span-2">
          
          {/* Header Card */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {installer.is_verified ? (
                    <Badge className={`text-[8px] font-black uppercase py-0.5 px-2 border-none ${
                      isPremiumPlus 
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm' 
                        : 'bg-emerald-500/10 text-emerald-650'
                    }`}>
                      🛡️ SolarPro Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase">
                      Basic Listing
                    </Badge>
                  )}
                  
                  {isPremiumPlus && (
                    <Badge className="bg-teal-500/15 text-teal-655 border border-teal-500/20 text-[8px] font-black uppercase py-0.5 px-2">
                      ⭐ Elite Member
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl sm:text-3xl font-black text-slate-850 dark:text-slate-50 leading-tight">
                  {installer.business_name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{installer.rating_average > 0 ? installer.rating_average : '4.8'} ({installer.rating_count > 0 ? installer.rating_count : '8'} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Responds {installer.response_speed.toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {/* Logo / Initial Avatar */}
              <div className="size-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 flex items-center justify-center text-teal-650 font-black text-2xl border border-teal-500/20 shadow-inner">
                {installer.business_name.charAt(0)}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-3">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-100">About the Installer</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {installer.description}
              </p>
            </div>
          </Card>

          {/* Specialties & Technical Brands */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-100 flex items-center gap-2">
              🛠️ Technical Qualifications &amp; Brands
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Specialty Badges</span>
                <div className="flex flex-wrap gap-1.5">
                  {installer.specialty_tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-slate-100 dark:bg-slate-850 text-slate-655 dark:text-slate-350 text-[10px] py-1 px-3 border-none rounded-xl">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Inverters &amp; Batteries Deployed</span>
                <div className="flex flex-wrap gap-1.5">
                  {installer.brands_handled.map((brand, idx) => (
                    <Badge key={idx} variant="outline" className="text-teal-655 dark:text-teal-400 text-[10px] py-1 px-3 rounded-xl border-teal-500/25 bg-teal-500/5">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Sizing process / Roadmap */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-100">
              What happens after you request a quote?
            </h3>
            
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6 py-2">
              {[
                { title: "Requirements Evaluation", desc: "Your fuel and NEPA bills are securely forwarded to the partner. They evaluate battery sizing presets." },
                { title: "Direct WhatsApp Contact", desc: "A solar advisor will reach out to your selected contact method with a simple, high-fidelity option proposal in under 4 hours." },
                { title: "Lagos Wind Shear Audit", desc: "An structural compliance audit is scheduled to ensure aluminum roof weights remain strictly under 15kg/sqm." }
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[35px] top-0 flex size-6 items-center justify-center rounded-full bg-teal-655 text-white font-extrabold text-[10px] shadow-sm">
                    {idx + 1}
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Trust Info & Lead Sidebar */}
        <div className="space-y-6">
          {/* Trust Checklists Card */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-855 bg-slate-900 text-white p-6 sm:p-8 space-y-6">
            <h3 className="font-extrabold text-sm text-teal-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" /> Permitting Trust Annex
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              This installer adheres strictly to local regulatory structures and SolarPro premium wind permitted specifications.
            </p>
            <div className="h-px bg-white/10" />
            <div className="space-y-3">
              {[
                "Lagos wind permitting deflection compliance certified",
                "Waterproof SikaPolyurethane purlin mount sealants only",
                "Gel / Lithium lifecycle warranty validation checked",
                "CAC Business Registration details verified in file"
              ].map((text, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats sidebar */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Locations Covered</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {matchingSa.map((sa, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-350 text-[10px] flex items-center gap-1 py-0.5 px-2 border-none">
                    <MapPin className="w-3 h-3 text-slate-400" /> {sa.city}, {sa.state}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Response Speed</span>
              <p className="text-xs text-slate-800 dark:text-slate-100 font-extrabold flex items-center gap-1">
                ⚡ {installer.response_speed}
              </p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Communication Preferences</span>
              <p className="text-xs text-slate-800 dark:text-slate-100 font-extrabold flex items-center gap-1">
                💬 Direct via {installer.contact_preference}
              </p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <Button 
              onClick={() => setShowLeadModal(true)}
              className="w-full bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs h-10 border-none"
            >
              🚀 Request Custom Quote
            </Button>
          </Card>
        </div>
      </main>

      {/* lead intake popup modal */}
      {showLeadModal && (
        <LeadSubmissionModal 
          installerId={installer.id} 
          onClose={() => setShowLeadModal(false)} 
        />
      )}
    </div>
  );
}
