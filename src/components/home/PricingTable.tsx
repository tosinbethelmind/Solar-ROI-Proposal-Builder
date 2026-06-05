'use client';
import * as React from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Cycle = 'monthly' | 'annual';

const PLANS = [
  {
    id: 'free', name: 'Free Plan', audience: 'Homeowners', monthlyPrice: 0, annualPrice: 0,
    btnText: 'Start Free', btnLink: '/estimator', highlight: false, border: 'border-slate-300 dark:border-slate-700',
    features: { proposals: '1', watermark: false, fx: false, fullLoad: false, genRoi: false, whatsapp: false, whiteLabel: false, users: '1', accountMgr: false, offline: true },
  },
  {
    id: 'starter', name: 'Starter', audience: 'Solo Installers', monthlyPrice: 18000, annualPrice: 14400,
    btnText: 'Upgrade Starter', btnLink: '/pricing', highlight: false, border: 'border-slate-300 dark:border-slate-700',
    features: { proposals: '10', watermark: true, fx: true, fullLoad: false, genRoi: false, whatsapp: true, whiteLabel: false, users: '1', accountMgr: false, offline: true },
  },
  {
    id: 'pro', name: 'Professional', audience: 'Growing Teams', monthlyPrice: 45000, annualPrice: 36000,
    btnText: 'Go Pro — 7-Day Trial', btnLink: '/pricing', highlight: true, border: 'border-teal-500',
    badge: '⭐ MOST POPULAR',
    features: { proposals: '40', watermark: true, fx: true, fullLoad: true, genRoi: true, whatsapp: true, whiteLabel: false, users: '3', accountMgr: false, offline: true },
  },
  {
    id: 'enterprise', name: 'Enterprise', audience: 'EPC Firms', monthlyPrice: 120000, annualPrice: 96000,
    btnText: 'Go Enterprise', btnLink: '/pricing', highlight: false, border: 'border-amber-400',
    badge: 'FOR EPC FIRMS',
    features: { proposals: 'Unlimited', watermark: true, fx: true, fullLoad: true, genRoi: true, whatsapp: true, whiteLabel: true, users: 'Unlimited', accountMgr: true, offline: true },
  },
];

const ROWS: { key: keyof typeof PLANS[0]['features']; label: string }[] = [
  { key: 'proposals', label: 'Proposals / month' },
  { key: 'watermark', label: 'Watermark-free PDF' },
  { key: 'fx', label: 'Live FX interbank sync' },
  { key: 'fullLoad', label: 'Full load calculator' },
  { key: 'genRoi', label: 'Generator ROI charts' },
  { key: 'whatsapp', label: 'WhatsApp share' },
  { key: 'whiteLabel', label: 'White-label branding' },
  { key: 'users', label: 'Team users' },
  { key: 'accountMgr', label: 'Dedicated account manager' },
  { key: 'offline', label: 'Offline field mode' },
];

function Cell({ val }: { val: boolean | string }) {
  if (typeof val === 'boolean') return val
    ? <Check className="w-4 h-4 text-teal-500 mx-auto" />
    : <span className="text-slate-400 mx-auto block text-center">—</span>;
  return <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center block">{val}</span>;
}

export function PricingTable({ cycle }: { cycle: Cycle }) {
  return (
    <div className="pricing-table-wrapper rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full border-collapse bg-white dark:bg-slate-900">
        <thead>
          <tr>
            <th className="text-left p-4 text-xs font-black text-slate-500 uppercase tracking-wider w-44 border-b border-slate-200 dark:border-slate-800">Feature</th>
            {PLANS.map((p) => (
              <th key={p.id} className={`p-4 border-b border-l border-slate-200 dark:border-slate-800 ${p.highlight ? 'bg-teal-500/5 border-t-2 border-t-teal-500' : p.id === 'enterprise' ? 'bg-amber-500/5 border-t-2 border-t-amber-400' : ''}`}>
                {p.badge && (
                  <span className={`block text-[9px] font-black uppercase tracking-wider mb-1 ${p.highlight ? 'text-teal-600' : 'text-amber-600'}`}>{p.badge}</span>
                )}
                <span className="block font-black text-sm text-slate-800 dark:text-slate-100">{p.name}</span>
                <span className="block text-[10px] text-slate-400 font-medium mb-2">{p.audience}</span>
                <span className="block font-black text-lg text-slate-800 dark:text-white">
                  {(cycle === 'monthly' ? p.monthlyPrice : p.annualPrice) === 0 ? '₦0' : `₦${(cycle === 'monthly' ? p.monthlyPrice : p.annualPrice).toLocaleString('en-NG')}`}
                </span>
                <span className="block text-[10px] text-slate-400">/month</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={row.key} className={i % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-900/50' : ''}>
              <td className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">{row.label}</td>
              {PLANS.map((p) => (
                <td key={p.id} className={`p-3 border-b border-l border-slate-100 dark:border-slate-800 ${p.highlight ? 'bg-teal-500/3' : p.id === 'enterprise' ? 'bg-amber-500/3' : ''}`}>
                  <Cell val={p.features[row.key]} />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="p-3" />
            {PLANS.map((p) => (
              <td key={p.id} className={`p-3 border-l border-slate-100 dark:border-slate-800 ${p.highlight ? 'bg-teal-500/5' : p.id === 'enterprise' ? 'bg-amber-500/5' : ''}`}>
                <Link href={p.btnLink} className="block">
                  <Button size="sm" className={`w-full text-xs font-black rounded-xl ${p.highlight ? 'bg-teal-600 hover:bg-teal-700 text-white border-none' : 'border border-slate-300 dark:border-slate-700 bg-transparent'}`}>
                    {p.btnText}
                  </Button>
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
