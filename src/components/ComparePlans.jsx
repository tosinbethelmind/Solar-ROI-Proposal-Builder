'use client';

import * as React from 'react';
import { Check, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLAN_KEYS = ['free', 'starter', 'professional', 'enterprise'];

const PLAN_HEADERS = {
  free: { name: 'Free Starter Plan', price: '₦0', label: 'Homeowners' },
  starter: { name: 'Starter Plan', price: '₦15,000', label: 'Solo Installers' },
  professional: { name: 'Professional', price: '₦35,000', label: 'Growing Teams' },
  enterprise: { name: 'Enterprise Plan', price: '₦95,000', label: 'EPC Firms' }
};

const COMPARE_ROWS = [
  { group: 'Core Sizing & Proposals', label: 'Proposals / Month', free: '2 Proposals', starter: '10 Proposals', professional: '40 Proposals', enterprise: 'Unlimited' },
  { group: 'Core Sizing & Proposals', label: 'Watermark-free PDF export', free: false, starter: true, professional: true, enterprise: true },
  { group: 'Core Sizing & Proposals', label: 'WhatsApp direct sharing', free: false, starter: true, professional: true, enterprise: true },
  { group: 'Core Sizing & Proposals', label: 'Offline field mode cache', free: true, starter: true, professional: true, enterprise: true },
  
  { group: 'Naira ROI Engine', label: 'Live FX Interbank sync', free: false, starter: true, professional: true, enterprise: true },
  { group: 'Naira ROI Engine', label: 'Full load capacity sizing', free: false, starter: false, professional: true, enterprise: true },
  { group: 'Naira ROI Engine', label: 'Generator ROI fuel offset charts', free: false, starter: false, professional: true, enterprise: true },
  { group: 'Naira ROI Engine', label: 'Custom markups & dynamic VAT', free: false, starter: false, professional: true, enterprise: true },
  
  { group: 'Branding & Teams', label: 'Team seats', free: '1 User', starter: '1 User', professional: '3 Users', enterprise: 'Unlimited' },
  { group: 'Branding & Teams', label: 'White-label custom domain', free: false, starter: false, professional: false, enterprise: true },
  { group: 'Branding & Teams', label: 'LSEB Lagos compliance permits', free: false, starter: true, professional: true, enterprise: true },
  { group: 'Branding & Teams', label: 'Landlord Consent templates', free: false, starter: true, professional: true, enterprise: true },
  
  { group: 'Support & Management', label: 'Support level', free: 'Community', starter: 'Standard Email', professional: 'Priority 24/7', enterprise: 'Dedicated SLA' },
  { group: 'Support & Management', label: 'Dedicated Account Manager', free: false, starter: false, professional: false, enterprise: true }
];

export default function ComparePlans() {
  const [isOpen, setIsOpen] = React.useState(false);

  // Group rows by section
  const groupedRows = COMPARE_ROWS.reduce((acc, row) => {
    if (!acc[row.group]) acc[row.group] = [];
    acc[row.group].push(row);
    return acc;
  }, {});

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating comparison button next to pricing section */}
      <div className="flex justify-center mt-6">
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl border border-slate-700 dark:border-slate-300 shadow-md flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02]"
        >
          📊 Compare Detailed Plans &amp; Features
        </Button>
      </div>

      {/* Comparison Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm z-20">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  Plan Feature Matrix
                </h3>
                <p className="text-xs text-slate-400 font-medium">Compare plans and find the perfect tier for your solar business operations.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-905 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Table */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-4 text-xs font-black text-slate-450 uppercase tracking-wider w-1/3">Features &amp; Limits</th>
                    {PLAN_KEYS.map((key) => (
                      <th key={key} className="py-4 px-4 text-center border-l border-slate-100 dark:border-slate-900 w-1/6">
                        <span className="block text-xs font-black text-slate-900 dark:text-slate-100">{PLAN_HEADERS[key].name}</span>
                        <span className="block text-[9px] text-slate-450 mt-0.5">{PLAN_HEADERS[key].label}</span>
                        <span className="block text-sm font-black text-teal-600 dark:text-teal-400 mt-2">{PLAN_HEADERS[key].price}</span>
                        <span className="block text-[8px] text-slate-400">/ month</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedRows).map((groupName) => (
                    <React.Fragment key={groupName}>
                      {/* Section Header */}
                      <tr className="bg-slate-50 dark:bg-slate-900/40">
                        <td colSpan={5} className="py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 border-t border-b border-slate-150 dark:border-slate-850">
                          {groupName}
                        </td>
                      </tr>
                      {/* Section Rows */}
                      {groupedRows[groupName].map((row, idx) => (
                        <tr 
                          key={idx} 
                          className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-350">{row.label}</td>
                          {PLAN_KEYS.map((key) => {
                            const val = row[key];
                            return (
                              <td key={key} className="py-3.5 px-4 text-center border-l border-slate-100 dark:border-slate-900">
                                {typeof val === 'boolean' ? (
                                  val ? (
                                    <div className="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-650 dark:text-red-400">
                                      <X className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  )
                                ) : (
                                  <span className="text-xs font-black text-slate-850 dark:text-slate-205">{val}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] text-slate-450 leading-relaxed font-semibold flex items-center gap-1.5 max-w-md">
                <Info className="w-4 h-4 text-slate-400 shrink-0" /> Note: Starter plan allows 10 proposals monthly, Professional includes full load calculators for multi-AC houses.
              </span>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => setIsOpen(false)}
                  variant="outline" 
                  className="text-xs font-bold rounded-xl flex-1 sm:flex-none border-slate-300 dark:border-slate-700"
                >
                  Close Matrix
                </Button>
                <a href="/pricing" className="flex-1 sm:flex-none">
                  <Button className="bg-teal-650 hover:bg-teal-700 text-white text-xs font-black rounded-xl w-full">
                    View Pricing Plans
                  </Button>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
