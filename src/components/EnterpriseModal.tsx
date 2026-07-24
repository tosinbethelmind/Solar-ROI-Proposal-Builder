'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Building2, Mail, User, Phone, ArrowRight, Layers } from 'lucide-react';

interface EnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnterpriseModal({ isOpen, onClose }: EnterpriseModalProps) {
  const [companyName, setCompanyName] = React.useState('');
  const [contactPerson, setContactPerson] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [teamSize, setTeamSize] = React.useState('');
  const [currentWorkflow, setCurrentWorkflow] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !companyName.trim() || 
      !contactPerson.trim() || 
      !email.trim() || 
      !phone.trim() || 
      !teamSize || 
      !currentWorkflow.trim()
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const formattedScope = `Team Size: ${teamSize}\nWorkflow/Bottlenecks: ${currentWorkflow.trim()}`;

    try {
      const response = await fetch('/api/leads/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_person: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim(),
          project_scope: formattedScope
        })
      });

      if (response.ok) {
        toast.success('Consultation request sent successfully!');
        
        // Construct WhatsApp link with pre-filled message
        const whatsappMsg = `Hello SolarQuotePro, I would like to request an Enterprise Consultation.

Company Name: ${companyName.trim()}
Full Name: ${contactPerson.trim()}
Work Email: ${email.trim()}
WhatsApp Number: ${phone.trim()}
Team Size: ${teamSize}
Current Workflow/Bottlenecks: ${currentWorkflow.trim()}`;

        const whatsappUrl = `https://wa.me/2349022634353?text=${encodeURIComponent(whatsappMsg)}`;
        
        // Clear form
        setCompanyName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setTeamSize('');
        setCurrentWorkflow('');
        
        onClose();
        
        // Redirect to WhatsApp
        window.open(whatsappUrl, '_blank');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to submit request.');
      }
    } catch (err) {
      console.error('Error submitting enterprise lead:', err);
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-650 dark:text-teal-400">
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          <DialogTitle className="text-lg font-black text-slate-850 dark:text-slate-50">
            Request Enterprise Consultation
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Get custom engineering, multi-user seats, and commercial EPC partner pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Company Name *</label>
            <div className="relative flex items-center">
              <Building2 className="absolute left-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                required
                placeholder="e.g. Dangote Group"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-9 rounded-xl border-slate-250 dark:border-slate-800 dark:bg-slate-950 font-medium text-xs focus-visible:ring-teal-500 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Full Name *</label>
            <div className="relative flex items-center">
              <User className="absolute left-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                required
                placeholder="e.g. Kola Aluko"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="pl-9 rounded-xl border-slate-250 dark:border-slate-800 dark:bg-slate-950 font-medium text-xs focus-visible:ring-teal-500 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Work Email *</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                required
                placeholder="e.g. contact@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 rounded-xl border-slate-250 dark:border-slate-800 dark:bg-slate-950 font-medium text-xs focus-visible:ring-teal-500 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">WhatsApp Number *</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3 h-4 w-4 text-slate-400" />
              <Input
                type="tel"
                required
                placeholder="e.g. +234 801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 rounded-xl border-slate-250 dark:border-slate-800 dark:bg-slate-950 font-medium text-xs focus-visible:ring-teal-500 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Team Size *</label>
            <div className="relative flex items-center">
              <Layers className="absolute left-3 h-4 w-4 text-slate-400 z-10" />
              <select
                required
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full pl-9 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-teal-500 h-10 font-medium cursor-pointer appearance-none"
              >
                <option value="" disabled>Select Team Size</option>
                <option value="1-5">1-5</option>
                <option value="6-15">6-15</option>
                <option value="16-50">16-50</option>
                <option value="50+">50+</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Workflow &amp; Bottlenecks *</label>
            <textarea
              required
              placeholder="e.g. Currently generating proposals manually in Excel, takes 2 hours per client. Sizing calculations are prone to human errors..."
              value={currentWorkflow}
              onChange={(e) => setCurrentWorkflow(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-xs transition-colors outline-none placeholder:text-slate-450 focus-visible:ring-teal-500 min-h-[80px] font-medium"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 border-none h-10 cursor-pointer shadow-md"
            >
              <span>{loading ? 'Submitting...' : 'Request Enterprise Consultation'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
