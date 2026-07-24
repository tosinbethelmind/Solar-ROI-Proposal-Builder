'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Building, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Inbox, 
  CheckCircle,
  Sliders,
  DollarSign,
  Plus,
  Trash2,
  ExternalLink,
  Kanban,
  Award,
  Layers,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { isEligibleForPremiumListing } from '@/utils/subscriptionRules';
import ngStatesData from '@/data/ng_states.json';

export default function InstallerListingDashboard() {
  const { 
    installers, 
    serviceAreas, 
    subscriptions, 
    leads, 
    leadAssignments,
    updateInstallerProfile,
    addServiceArea,
    removeServiceArea,
    updateLeadPipelineStatus,
    moderateListingSubscription,
    currentInstallerId
  } = useMarketplaceStore();

  const { tier: softwareTier } = useSubscriptionStore();

  const installer = installers.find(i => i.id === currentInstallerId) || installers[0];
  const installerSub = subscriptions.find(s => s.installer_id === installer?.id);
  const myServiceAreas = serviceAreas.filter(sa => sa.installer_id === installer?.id);
  
  // Filter leads assigned to me
  const myLeadAssignments = leadAssignments.filter(la => la.installer_id === installer?.id);
  const myLeads = myLeadAssignments.map(la => {
    const lead = leads.find(l => l.id === la.lead_id);
    return {
      ...lead,
      assignmentId: la.id,
      assignmentStatus: la.status,
      assignedAt: la.assigned_at
    };
  }).filter(l => l.id !== undefined);

  // Profile Form State
  const [businessName, setBusinessName] = React.useState(installer?.business_name || '');
  const [description, setDescription] = React.useState(installer?.description || '');
  const [cacNumber, setCacNumber] = React.useState(installer?.cac_number || '');
  const [contactPreference, setContactPreference] = React.useState<'WhatsApp' | 'Phone Call' | 'Email'>(installer?.contact_preference || 'WhatsApp');
  const [responseSpeed, setResponseSpeed] = React.useState(installer?.response_speed || 'Usually under 2 hours');
  const [specialtyInput, setSpecialtyInput] = React.useState('');
  const [brandInput, setBrandInput] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'profile' | 'leads' | 'billing'>('leads');

  // Sync state when installer changes
  React.useEffect(() => {
    if (installer) {
      setBusinessName(installer.business_name);
      setDescription(installer.description);
      setCacNumber(installer.cac_number || '');
      setContactPreference(installer.contact_preference || 'WhatsApp');
      setResponseSpeed(installer.response_speed || 'Usually under 2 hours');
    }
  }, [installer]);

  // Predefined states and cities lookup
  const statesAndCities = ngStatesData as Record<string, string[]>;
  const statesList = Object.keys(statesAndCities);

  // Service Area Form State
  const [newState, setNewState] = React.useState(statesList[0] || 'Lagos');
  const [newCity, setNewCity] = React.useState(statesAndCities[statesList[0]]?.[0] || '');

  const handleStateChange = (state: string) => {
    setNewState(state);
    const cities = statesAndCities[state] || [];
    setNewCity(cities[0] || '');
  };

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installer) return;
    updateInstallerProfile(installer.id, {
      business_name: businessName,
      description,
      cac_number: cacNumber,
      contact_preference: contactPreference,
      response_speed: responseSpeed
    });
    alert('Listing Profile updated successfully!');
  };

  // Add Specialty
  const handleAddSpecialty = () => {
    if (!specialtyInput) return;
    const updatedSpecialties = Array.from(new Set([...installer.specialty_tags, specialtyInput]));
    updateInstallerProfile(installer.id, { specialty_tags: updatedSpecialties });
    setSpecialtyInput('');
  };

  // Add Brand
  const handleAddBrand = () => {
    if (!brandInput) return;
    const updatedBrands = Array.from(new Set([...installer.brands_handled, brandInput]));
    updateInstallerProfile(installer.id, { brands_handled: updatedBrands });
    setBrandInput('');
  };

  // Remove Specialty
  const handleRemoveSpecialty = (tag: string) => {
    const updatedSpecialties = installer.specialty_tags.filter(t => t !== tag);
    updateInstallerProfile(installer.id, { specialty_tags: updatedSpecialties });
  };

  // Add Service Area
  const handleAddArea = () => {
    if (!newCity) return;
    const success = addServiceArea(installer.id, newState, newCity);
    if (!success) {
      alert('⚠️ Unable to add service area.\n- Make sure the area is not already added.\n- Ensure you haven\'t exceeded the limit of 10 service areas.');
    }
  };

  // Handle Listing Upgrade
  const handleUpgradeListing = (tier: 'basic' | 'verified_partner' | 'verified_partner_plus') => {
    // Entitlement Rule Check: Must be on active Pro subscription to select a premium listing tier
    const isEligible = isEligibleForPremiumListing(softwareTier, tier);

    if (!isEligible) {
      alert(`⚠️ Listing Tier Restriction:\nTo purchase a Premium Listing subscription, your core proposal software plan must be upgraded to "Pro Workspace" (or above). Currently on: ${softwareTier.toUpperCase()}`);
      return;
    }

    moderateListingSubscription(installer.id, tier);
    alert(`Success! Listing upgraded to: ${tier.toUpperCase().replace(/_/g, ' ')}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Workspace Subheader */}
      <header className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="space-y-0.5">
            <h1 className="text-base font-black text-slate-850 dark:text-slate-100 tracking-tight">Installer Partner Hub</h1>
            <p className="text-[10px] text-slate-455">Manage your lead directory profiles and listing upgrades.</p>
          </div>

          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
            {(['leads', 'profile', 'billing'] as const).map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black uppercase rounded-lg px-4 h-7 ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-655' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-850 dark:text-slate-50">Marketplace Leads Inbox</h2>
                <p className="text-xs text-slate-500 leading-normal">
                  Track routed qualified leads, check contact details, and log conversions.
                </p>
              </div>

              {/* Status indicator widget */}
              <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex items-center gap-4 shadow-sm">
                <div className="space-y-0.5 text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Active Leads</span>
                  <p className="text-lg font-black text-teal-655">{myLeads.length}</p>
                </div>
                <div className="w-px h-8 bg-slate-150 dark:bg-slate-800" />
                <div className="space-y-0.5 text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Conversion Rate</span>
                  <p className="text-lg font-black text-emerald-650">84%</p>
                </div>
              </Card>
            </div>

            {/* Leads Table view */}
            {myLeads.length === 0 ? (
              <div className="py-16 text-center space-y-4 border border-dashed rounded-3xl border-slate-250 bg-white dark:bg-slate-900">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-700 dark:text-slate-200">No leads in inbox</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Homeowner requests matching your service cities will display here instantly. Consider upgrading to a high visibility plan to bypass delay buffers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myLeads.map((lead: any) => (
                  <Card key={lead.id} className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 space-y-4 flex flex-col justify-between hover:shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-teal-500/10 text-teal-650 border-none text-[8px] font-black uppercase py-0.5 px-2">
                          📍 {lead.city}, {lead.state}
                        </Badge>
                        <span className="text-[9px] font-bold text-slate-400">
                          {new Date(lead.assignedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-sm sm:text-base text-slate-850 dark:text-slate-50">{lead.name}</h4>
                        <p className="text-[10px] text-slate-455 flex items-center gap-1 font-semibold">
                          📞 {lead.phone} | ✉️ {lead.email}
                        </p>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      {/* Lead Specs grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <div>
                          <span className="text-slate-400 font-bold block">Property / System</span>
                          <span className="font-extrabold text-slate-850 dark:text-slate-200 uppercase">{lead.property_type}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Est. Budget</span>
                          <span className="font-extrabold text-slate-850 dark:text-teal-400">{lead.budget_range}</span>
                        </div>
                        <div className="pt-2">
                          <span className="text-slate-400 font-bold block">Power Source</span>
                          <span className="font-extrabold text-slate-850 dark:text-slate-200 uppercase">{lead.power_source}</span>
                        </div>
                        <div className="pt-2">
                          <span className="text-slate-400 font-bold block">Monthly Fuel Spend</span>
                          <span className="font-extrabold text-slate-850 dark:text-slate-200">₦{lead.monthly_spend.toLocaleString()}</span>
                        </div>
                      </div>

                      {lead.note && (
                        <p className="text-[10px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-200/20">
                          &quot;{lead.note}&quot;
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-455">Workflow Status</span>
                        <select
                          value={lead.assignmentStatus}
                          onChange={(e) => updateLeadPipelineStatus(lead.assignmentId, e.target.value as any)}
                          className="p-1 rounded-md border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-teal-655 focus:outline-none"
                        >
                          <option value="New">New Lead</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Won">Won (Closed)</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        {/* WhatsApp template trigger */}
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.name)},%20this%20is%20${encodeURIComponent(installer.business_name)}%20from%20SolarQuotePro.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] h-9 border-none">
                            💬 Chat on WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Editor */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 md:col-span-2">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-50">Edit Listing Profile</h3>
                <p className="text-[10px] text-slate-455">Manage details shown on your public homeowner-facing profile card.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400">Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400">Company Overview</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400">CAC Registration Number</label>
                    <input
                      type="text"
                      value={cacNumber}
                      onChange={(e) => setCacNumber(e.target.value)}
                      placeholder="e.g. RC-1234567"
                      className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none font-semibold text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400">Preferred Contact Method</label>
                    <select
                      value={contactPreference}
                      onChange={(e) => setContactPreference(e.target.value as any)}
                      className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="Email">Email Address</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400">Response Speed</label>
                    <select
                      value={responseSpeed}
                      onChange={(e) => setResponseSpeed(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <option value="Usually under 1 hour">Usually under 1 hour</option>
                      <option value="Usually under 2 hours">Usually under 2 hours</option>
                      <option value="Usually under 4 hours">Usually under 4 hours</option>
                      <option value="Usually within 24 hours">Usually within 24 hours</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-black text-xs h-9 px-6 border-none">
                    Save Profile Details
                  </Button>
                </div>
              </form>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Specialties Setup */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100">Specialty Tags</h4>
                  <p className="text-[9px] text-slate-455">Add skills and certifications to help homeowners search.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Lithium Storage"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    className="p-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                  <Button onClick={handleAddSpecialty} size="sm" className="bg-slate-100 dark:bg-slate-800 text-slate-800 hover:bg-slate-200 text-[10px] font-bold rounded-lg h-8 px-4 border-none">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {installer?.specialty_tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-slate-100 dark:bg-slate-850 text-slate-700 text-[10px] flex items-center gap-1.5 rounded-lg py-0.5 px-2 border-none">
                      {tag}
                      <Trash2 onClick={() => handleRemoveSpecialty(tag)} className="w-3 h-3 text-slate-400 hover:text-red-500 cursor-pointer shrink-0" />
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Service Areas sidebar */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-50">Coverage Service Areas</h3>
                <p className="text-[10px] text-slate-455">Add states and cities where your crew operates.</p>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400">State</label>
                  <select
                    value={newState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full p-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border focus:outline-none"
                  >
                    {statesList.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400">City / Area Name</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border focus:outline-none"
                  >
                    {(statesAndCities[newState] || []).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <Button onClick={handleAddArea} className="w-full bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-[10px] font-black h-8 border-none">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Service City
                </Button>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Active Coverage Cities</span>
                <div className="space-y-1.5">
                  {myServiceAreas.map((sa) => (
                    <div key={sa.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-850 p-2 rounded-lg text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        📍 {sa.city}, {sa.state}
                      </span>
                      <Trash2 onClick={() => removeServiceArea(sa.id)} className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 cursor-pointer" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1 text-center">
              <Badge className="bg-teal-500/10 text-teal-655 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                💰 Marketplace Upgrades
              </Badge>
              <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-50">Marketplace Directory Listing Tiers</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                Upgrade your company listing tier separately from your proposal software plan. Get routed leads in real-time.
              </p>
            </div>
            {/* Core Software Plan Toggle (Demo Controls) */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-50 flex items-center gap-1.5">
                    ⚙️ Demo Control: Core Software Tier
                  </h3>
                  <p className="text-[10px] text-slate-455">
                    Your current proposal software tier is: <span className="font-black text-teal-655 dark:text-teal-400 capitalize">{softwareTier}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['free', 'starter', 'pro'] as const).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={softwareTier === t ? 'default' : 'outline'}
                      onClick={() => {
                        const { setSubscription } = useSubscriptionStore.getState();
                        setSubscription(t);
                      }}
                      className={`text-[10px] font-black uppercase rounded-xl h-8 ${
                        softwareTier === t
                          ? 'bg-teal-655 text-white hover:bg-teal-700 border-none shadow-sm'
                          : 'border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Set to {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-slate-455 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/25 dark:border-amber-500/15 p-3 rounded-2xl flex items-start gap-2">
                <span className="shrink-0">💡</span>
                <span>
                  <strong>Entitlement Gating Rule:</strong> Upgrading to a premium directory listing requires a <strong>Pro</strong> core software plan or above. Toggle the plan to <strong>Free</strong> or <strong>Starter</strong> to test the validation blockage, or to <strong>Pro</strong> to unlock upgrades.
                </span>
              </div>
            </Card>

            {/* Current Active Listing status */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-900 text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-teal-350 uppercase tracking-widest block">Active Listing Plan</span>
                <h3 className="font-black text-lg capitalize text-white">
                  {installerSub?.tier.replace(/_/g, ' ') || 'Basic Free Listing'}
                </h3>
                <p className="text-[10px] text-slate-350">
                  Status: <span className="text-emerald-450 font-bold uppercase">{installerSub?.status || 'Active'}</span> | Expires: 2027-01-01
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link href={`/installers/${installer.id}`} target="_blank">
                  <Button variant="outline" className="text-[10px] font-black rounded-xl h-9 border-white/20 hover:bg-white/10 text-white">
                    Preview Public Profile <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Directory Tiers Pricing Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: "basic",
                  name: "Free Basic",
                  price: "₦0",
                  desc: "Essential business profile discoverable via state search.",
                  benefits: [
                    "Basic location directory listing",
                    "List inverter/battery brands",
                    "Basic search visibility",
                    "Manual homeowner inquiry routing"
                  ]
                },
                {
                  id: "verified_partner",
                  name: "Verified Partner",
                  price: "₦25,000",
                  period: "/ month",
                  desc: "Ideal for growing solar operations aiming to stand out in the local market.",
                  benefits: [
                    "🛡️ Standard verified partner badge",
                    "Higher priority search placement",
                    "Shared real-time homeowner leads",
                    "Response speed badge",
                    "WhatsApp template messaging tools"
                  ]
                },
                {
                  id: "verified_partner_plus",
                  name: "Partner Plus",
                  price: "₦75,000",
                  period: "/ month",
                  desc: "Premium routing tier for absolute visibility in core cities.",
                  benefits: [
                    "⭐ Premium Elite partner badge",
                    "Top organic search placement",
                    "Exclusive 4-hour lead matching window",
                    "Real-time SMS & email notifications",
                    "Dedicated profile optimization advice"
                  ]
                }
              ].map((tierCard) => {
                const isActive = installerSub?.tier === tierCard.id;
                
                return (
                  <Card 
                    key={tierCard.id}
                    className={`rounded-3xl border bg-white dark:bg-slate-900 p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 ${
                      isActive 
                        ? 'border-teal-500 dark:border-teal-500/40 ring-1 ring-teal-500/10' 
                        : 'border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">{tierCard.name}</h4>
                        <p className="text-[10px] text-slate-500 leading-snug">{tierCard.desc}</p>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-50">{tierCard.price}</span>
                        {tierCard.period && <span className="text-[10px] text-slate-400 font-bold">{tierCard.period}</span>}
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      <div className="space-y-2.5">
                        {tierCard.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-550 dark:text-slate-400 leading-normal">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-655 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      {isActive ? (
                        <Button disabled className="w-full bg-slate-100 dark:bg-slate-800 text-slate-455 dark:text-slate-500 rounded-xl text-xs font-black h-9 border-none">
                          Current Subscription
                        </Button>
                      ) : !isEligibleForPremiumListing(softwareTier, tierCard.id as any) ? (
                        <Button 
                          onClick={() => handleUpgradeListing(tierCard.id as any)}
                          className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-650 dark:text-red-400 rounded-xl text-[10px] font-black h-9 border border-red-500/20 shadow-none"
                        >
                          🔒 Requires Pro Software
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleUpgradeListing(tierCard.id as any)}
                          className="w-full bg-teal-655 hover:bg-teal-700 text-white rounded-xl text-xs font-black h-9 border-none shadow-sm"
                        >
                          Upgrade Plan
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
