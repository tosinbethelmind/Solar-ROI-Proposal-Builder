'use client';

import * as React from 'react';
import { X, Check, ShieldCheck, Mail, Phone, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceStore } from '@/store/marketplaceStore';

interface LeadSubmissionModalProps {
  installerId: string | null;
  onClose: () => void;
}

export function LeadSubmissionModal({ installerId, onClose }: LeadSubmissionModalProps) {
  const { submitLead, installers } = useMarketplaceStore();
  const targetInstaller = installerId ? installers.find(i => i.id === installerId) : null;

  // Form states
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [state, setState] = React.useState('Lagos');
  const [city, setCity] = React.useState('Lekki');
  const [propertyType, setPropertyType] = React.useState<'residential' | 'commercial'>('residential');
  const [monthlySpend, setMonthlySpend] = React.useState<number>(120000);
  const [powerSource, setPowerSource] = React.useState<'grid' | 'generator' | 'mixed'>('mixed');
  const [interestType, setInterestType] = React.useState<'bill_savings' | 'backup_power' | 'full_solar'>('full_solar');
  const [budgetRange, setBudgetRange] = React.useState('₦1.5M - ₦3M');
  const [preferredContact, setPreferredContact] = React.useState<'WhatsApp' | 'Phone Call' | 'Email'>('WhatsApp');
  const [timeline, setTimeline] = React.useState<'Immediate' | '1-3 Months' | 'Researching'>('Immediate');
  const [note, setNote] = React.useState('');

  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !city) return;

    submitLead({
      name,
      phone,
      email,
      state,
      city,
      property_type: propertyType,
      monthly_spend: monthlySpend,
      power_source: powerSource,
      interest_type: interestType,
      budget_range: budgetRange,
      preferred_contact: preferredContact,
      timeline,
      note,
      request_source: installerId ? 'direct_profile' : 'general'
    }, installerId || undefined);

    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-850 dark:text-slate-50">Quote Request Submitted Successfully!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              {targetInstaller 
                ? `Your request has been routed directly to ${targetInstaller.business_name}. They usually respond within ${targetInstaller.response_speed.toLowerCase()}.`
                : 'Your requirements have been dispatched to our top matching verified partners. Keep an eye on your WhatsApp or phone!'
              }
            </p>
            <div className="pt-4">
              <Button onClick={onClose} className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold text-xs h-10 px-8">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Badge className="bg-teal-500/10 text-teal-655 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                🔒 Secured Lead Route
              </Badge>
              <h2 className="text-lg sm:text-xl font-black text-slate-850 dark:text-slate-50">
                {targetInstaller 
                  ? `Request Quote from ${targetInstaller.business_name}`
                  : 'Request Custom Sizing Quotes'
                }
              </h2>
              <p className="text-[11px] text-slate-400 leading-normal">
                Submit your household requirements. Match with verified installers who adhere to wind permitting guidelines.
              </p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Information */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kola Adewale"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 803..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[9px] font-black uppercase text-slate-455">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kola@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                </div>
              </div>

              {/* Location details */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Rivers">Rivers</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">City / Area</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lekki Phase 1"
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>

              {/* Energy spend details */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Current Power Source</label>
                <select
                  value={powerSource}
                  onChange={(e) => setPowerSource(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="mixed">Mixed (Grid + Gen)</option>
                  <option value="generator">100% Generator</option>
                  <option value="grid">100% Grid Power</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Est. Monthly Fuel/Electricity Bill</label>
                <input
                  type="number"
                  required
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(Number(e.target.value))}
                  placeholder="e.g. 150000"
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>

              {/* Preferences */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Budget Range</label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Under ₦1.5M">Under ₦1.5M</option>
                  <option value="₦1.5M - ₦3M">₦1.5M - ₦3M</option>
                  <option value="₦3M - ₦6M">₦3M - ₦6M</option>
                  <option value="Above ₦6M">Above ₦6M</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Timeline</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="Immediate">Immediate (under 2 weeks)</option>
                  <option value="1-3 Months">1 to 3 Months</option>
                  <option value="Researching">Just researching ROI</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Preferred Contact Method</label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Email">Email Address</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                >
                  <option value="residential">Residential Household</option>
                  <option value="commercial">Commercial Office</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[9px] font-black uppercase text-slate-455">Additional notes / Energy goals</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Need backup power to run ACs during generator hours."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none h-16 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="text-xs rounded-xl font-bold h-10 px-5 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-black text-xs h-10 px-8 border-none"
              >
                🚀 Submit Request
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
