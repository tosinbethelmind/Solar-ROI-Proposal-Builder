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
  Inbox
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceStore } from '@/store/marketplaceStore';

export default function AdminMarketplaceDashboard() {
  const { 
    installers, 
    serviceAreas, 
    subscriptions, 
    leads, 
    leadAssignments,
    moderateListing,
    moderateListingSubscription,
    submitLead
  } = useMarketplaceStore();

  const [activeSubTab, setActiveSubTab] = React.useState<'installers' | 'leads'>('installers');

  // Trigger Manual Override Routing
  const handleManualOverride = (leadId: string, installerId: string) => {
    // Locate the lead
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    submitLead({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      state: lead.state,
      city: lead.city,
      property_type: lead.property_type,
      monthly_spend: lead.monthly_spend,
      power_source: lead.power_source,
      interest_type: lead.interest_type,
      budget_range: lead.budget_range,
      preferred_contact: lead.preferred_contact,
      timeline: lead.timeline,
      note: `(Manual Override) ${lead.note || ''}`,
      request_source: 'general'
    }, installerId);

    alert('Success! Manual lead override assignment dispatched successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b bg-slate-900 text-white border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-white transition-colors">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Admin Board
            </Link>
            <div className="w-px h-4 bg-slate-800" />
            <span className="text-xs font-black tracking-tight text-teal-400 uppercase">Marketplace Center</span>
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
          </div>
        </div>
      </header>

      {/* Main panel content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Analytics teaser rows */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Partners", count: installers.length, color: "text-slate-850 dark:text-slate-100" },
            { label: "Verified Ratio", count: `${Math.round((installers.filter(i => i.is_verified).length / installers.length) * 100)}%`, color: "text-teal-655" },
            { label: "Partner Plus Members", count: subscriptions.filter(s => s.tier === 'verified_partner_plus').length, color: "text-amber-500" },
            { label: "Global Routed Leads", count: leads.length, color: "text-indigo-600 dark:text-indigo-400" }
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
                        <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase">
                          ID: {inst.id}
                        </Badge>
                        <Badge className={`text-[8px] font-black uppercase border-none ${
                          sub?.tier === 'verified_partner_plus' 
                            ? 'bg-amber-500/10 text-amber-600' 
                            : sub?.tier === 'verified_partner' 
                            ? 'bg-teal-500/10 text-teal-650' 
                            : 'bg-slate-100 text-slate-500'
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
                          <Badge key={cIdx} variant="secondary" className="bg-slate-50 text-[9px] py-0 px-2 border-none">
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
                          onClick={() => moderateListing(inst.id, !inst.is_verified)}
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
                          value={sub?.tier || 'basic'}
                          onChange={(e) => moderateListingSubscription(inst.id, e.target.value as any)}
                          className="p-1 rounded-md border text-[9px] font-black bg-white dark:bg-slate-900 text-teal-655"
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
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  When homeowners submit requests in the directory sizers, they will display here with matching statuses.
                </p>
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
                            <h4 className="font-black text-sm sm:text-base text-slate-850 dark:text-slate-50">{lead.name}</h4>
                            <p className="text-[10px] text-slate-455 font-bold">
                              📞 {lead.phone} | ✉️ {lead.email} | 📍 {lead.city}, {lead.state}
                            </p>
                          </div>
                          <Badge className="bg-indigo-500/10 text-indigo-650 border-none text-[8px] font-black uppercase py-0.5 px-2">
                            Source: {lead.request_source}
                          </Badge>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                        {/* Assignments trace */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Routing Traces</span>
                          <div className="space-y-1.5">
                            {assignments.map((asg) => {
                              const inst = installers.find(i => i.id === asg.installer_id);
                              return (
                                <div key={asg.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-[10px] border">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                    Routed to: {inst?.business_name || 'Unknown'}
                                  </span>
                                  <Badge className="bg-slate-100 text-teal-655 text-[8px] font-bold py-0.5 px-2">
                                    {asg.status.toUpperCase()} (Exclusive: {asg.is_exclusive ? 'YES' : 'NO'})
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Manual override dispatch interface */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Manual Override Routing Dispatch</span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {installers.map((instOption) => (
                              <Button
                                key={instOption.id}
                                size="sm"
                                onClick={() => handleManualOverride(lead.id, instOption.id)}
                                className="bg-slate-100 text-slate-800 hover:bg-slate-200 text-[9px] font-bold rounded-lg h-7 px-3 border-none"
                              >
                                Route to {instOption.business_name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
