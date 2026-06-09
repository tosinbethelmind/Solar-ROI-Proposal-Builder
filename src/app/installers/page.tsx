'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  SlidersHorizontal,
  Wrench,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { LeadSubmissionModal } from '@/components/marketplace/LeadSubmissionModal';
import { ClaimListingModal } from '@/components/marketplace/ClaimListingModal';

export default function InstallersDirectoryPage() {
  const { installers, serviceAreas, subscriptions } = useMarketplaceStore();
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedState, setSelectedState] = React.useState('All States');
  const [selectedCity, setSelectedCity] = React.useState('All Cities');
  const [selectedSpecialty, setSelectedSpecialty] = React.useState('All Specialties');
  const [onlyVerified, setOnlyVerified] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  
  // Lead Intake Modal State
  const [selectedInstallerId, setSelectedInstallerId] = React.useState<string | null>(null);
  const [showLeadModal, setShowLeadModal] = React.useState(false);

  // Claim Listing Modal State
  const [selectedClaimId, setSelectedClaimId] = React.useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = React.useState(false);

  // States/Cities options from Service Areas
  const availableStates = Array.from(new Set(serviceAreas.map(sa => sa.state)));
  const filteredCities = Array.from(
    new Set(
      serviceAreas
        .filter(sa => selectedState === 'All States' || sa.state === selectedState)
        .map(sa => sa.city)
    )
  );

  // Specialties list
  const availableSpecialties = Array.from(
    new Set(installers.flatMap(inst => inst.specialty_tags))
  );

  // Filter Logic
  const filteredInstallers = installers.filter(inst => {
    // 1. Search term match
    const matchesSearch = 
      inst.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. State & City service area match
    const matchingSa = serviceAreas.filter(sa => sa.installer_id === inst.id);
    const matchesState = 
      selectedState === 'All States' || 
      matchingSa.some(sa => sa.state === selectedState);
    const matchesCity = 
      selectedCity === 'All Cities' || 
      matchingSa.some(sa => sa.city === selectedCity);
    
    // 3. Specialty match
    const matchesSpecialty = 
      selectedSpecialty === 'All Specialties' || 
      inst.specialty_tags.includes(selectedSpecialty);
    
    // 4. Verified match
    const matchesVerified = !onlyVerified || inst.is_verified;

    return matchesSearch && matchesState && matchesCity && matchesSpecialty && matchesVerified;
  });

  // Sort based on paid subscription tier placement rules
  const sortedInstallers = [...filteredInstallers].sort((a, b) => {
    const subA = subscriptions.find(s => s.installer_id === a.id);
    const subB = subscriptions.find(s => s.installer_id === b.id);
    
    const priorityA = subA?.tier === 'verified_partner_plus' ? 2 : subA?.tier === 'verified_partner' ? 1 : 0;
    const priorityB = subB?.tier === 'verified_partner_plus' ? 2 : subB?.tier === 'verified_partner' ? 1 : 0;
    
    return priorityB - priorityA;
  });

  const handleOpenLeadModal = (installerId?: string) => {
    setSelectedInstallerId(installerId || null);
    setShowLeadModal(true);
  };

  const handleOpenClaimModal = (installerId: string) => {
    setSelectedClaimId(installerId);
    setShowClaimModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
            </div>
            <span className="font-black text-slate-850 dark:text-slate-200 text-sm tracking-tight">SolarPro</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-xs font-bold hover:text-teal-650 transition-colors">Pricing</Link>
            <Link href="/workspace">
              <Button size="sm" className="bg-teal-650 text-white hover:bg-teal-700 font-extrabold text-[11px] rounded-xl h-8">
                Installer Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-550/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <Badge className="bg-teal-500/20 text-teal-350 border border-teal-500/30 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
            🇳🇬 Nigeria Solar Partner Directory
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Find SolarPro Verified Solar Installers
          </h1>
          <p className="text-xs sm:text-sm text-slate-350 max-w-lg mx-auto leading-relaxed">
            Discover premium, vetted solar professionals in Lagos and major urban markets. Request custom site estimates, compare battery configurations, and enjoy seamless local warranty setups.
          </p>

          <Button 
            onClick={() => handleOpenLeadModal()}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-750 hover:to-emerald-750 text-white rounded-xl font-black text-xs px-6 py-2.5 shadow-md h-10 border-none mt-2"
          >
            🚀 Request Custom Quotes from Top Matches
          </Button>
        </div>
      </section>

      {/* Directory & Filters Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Search Bar & Toggle Filter Mobile */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search installers by name or specialties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs font-bold rounded-xl h-9 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </Button>
            <Button
              onClick={() => setOnlyVerified(!onlyVerified)}
              variant={onlyVerified ? 'default' : 'outline'}
              className={`text-xs font-bold rounded-xl h-9 ${onlyVerified ? 'bg-teal-650 hover:bg-teal-700 text-white border-none' : 'border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
            >
              🛡️ Verified Only
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm mt-3 animate-in fade-in duration-200">
            {/* State filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity('All Cities');
                }}
                className="w-full p-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
              >
                <option value="All States">All States</option>
                {availableStates.map((st, idx) => (
                  <option key={idx} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* City filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">City</label>
              <select
                value={selectedCity}
                disabled={selectedState === 'All States'}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none disabled:opacity-50"
              >
                <option value="All Cities">All Cities</option>
                {filteredCities.map((ct, idx) => (
                  <option key={idx} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

            {/* Specialty filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
              >
                <option value="All Specialties">All Specialties</option>
                {availableSpecialties.map((spec, idx) => (
                  <option key={idx} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {sortedInstallers.length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-4">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-750 dark:text-slate-100">No matching installers found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Try widening your state/city search or removing some specific specialty filters to discover other local partners.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('All States');
                  setSelectedCity('All Cities');
                  setSelectedSpecialty('All Specialties');
                  setOnlyVerified(false);
                }}
                variant="outline" 
                className="text-xs rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            sortedInstallers.map((inst) => {
              const sub = subscriptions.find(s => s.installer_id === inst.id);
              const isPremiumPlus = sub?.tier === 'verified_partner_plus';
              
              return (
                <Card 
                  key={inst.id}
                  className={`rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col justify-between hover:shadow-md overflow-hidden ${
                    isPremiumPlus 
                      ? 'border-teal-500 dark:border-teal-500/40 ring-1 ring-teal-500/10' 
                      : 'border-slate-200 dark:border-slate-850'
                  }`}
                >
                  {!inst.is_claimed && (
                    <div className="bg-amber-500/10 border-b border-amber-500/10 px-6 py-2 flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      <span>⚠️ Unclaimed Seeded Profile</span>
                      <button 
                        onClick={() => handleOpenClaimModal(inst.id)}
                        className="hover:underline font-extrabold text-teal-650 dark:text-teal-400"
                      >
                        Claim Profile ➔
                      </button>
                    </div>
                  )}
                  <CardHeader className="p-6 pb-2 space-y-3 relative">
                    {/* Badge Treatment */}
                    <div className="flex items-center justify-between">
                      {inst.is_verified ? (
                        <Badge className={`text-[8px] font-black uppercase py-0.5 px-2 border-none ${
                          isPremiumPlus 
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white' 
                            : 'bg-emerald-500/10 text-emerald-650'
                        }`}>
                          🛡️ SolarPro Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase">
                          Basic Listing
                        </Badge>
                      )}

                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{inst.rating_average > 0 ? inst.rating_average : '4.7'} ({inst.rating_count > 0 ? inst.rating_count : '6'})</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <CardTitle className="text-sm sm:text-base font-black text-slate-850 dark:text-slate-100 leading-snug">
                        {inst.business_name}
                      </CardTitle>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-slate-400" /> {inst.response_speed}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-2 pb-4 space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                      {inst.description}
                    </p>

                    <div className="space-y-3 pt-2">
                      {/* Specializations */}
                      <div className="flex flex-wrap gap-1">
                        {inst.specialty_tags.map((tag, tIdx) => (
                          <Badge key={tIdx} variant="secondary" className="bg-slate-100 dark:bg-slate-850 text-slate-655 dark:text-slate-350 text-[9px] py-0 px-2 border-none">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Brands handled */}
                      <div className="text-[10px] font-semibold text-slate-455">
                        <span className="font-bold text-slate-600 dark:text-slate-300">Brands: </span>
                        {inst.brands_handled.join(', ')}
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-850 flex gap-2 pt-4">
                    <Link href={`/installers/${inst.id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-[10px] font-black rounded-xl h-9 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700">
                        View Profile
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => handleOpenLeadModal(inst.id)}
                      className="flex-1 bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-black text-[10px] h-9 border-none"
                    >
                      Request Quote ➔
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* lead intake popup modal */}
      {showLeadModal && (
        <LeadSubmissionModal 
          installerId={selectedInstallerId} 
          onClose={() => setShowLeadModal(false)} 
        />
      )}

      {/* claim listing popup modal */}
      {showClaimModal && selectedClaimId && (
        <ClaimListingModal 
          installerId={selectedClaimId} 
          onClose={() => setShowClaimModal(false)} 
        />
      )}
    </div>
  );
}
