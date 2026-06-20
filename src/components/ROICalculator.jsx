'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PlanROILabel({ planId }) {
  if (planId === 'pro') {
    return (
      <div className="mt-3 bg-teal-500/10 border border-teal-500/20 text-teal-650 dark:text-teal-400 p-2.5 rounded-xl text-[10px] font-black text-center uppercase tracking-wider leading-snug">
        📈 Invest ₦45K/mo, close ₦2M deal = <span className="font-black underline">44x ROI</span>
      </div>
    );
  }
  if (planId === 'enterprise') {
    return (
      <div className="mt-3 bg-amber-500/10 border border-amber-400/20 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl text-[10px] font-black text-center uppercase tracking-wider leading-snug">
        💎 Unlimited proposals = <span className="font-black underline">₦5M+ annual revenue potential</span>
      </div>
    );
  }
  return null;
}

export default function ROICalculator() {
  const [avgDealSize, setAvgDealSize] = React.useState(2500000); // ₦2.5M
  const [proposalsPerMonth, setProposalsPerMonth] = React.useState(15);
  const [closeRateWithSolarQuotePro, setCloseRateWithSolarQuotePro] = React.useState(35); // 35%

  const baseCloseRate = 15; // 15% without SolarQuotePro
  const baselineDeals = Math.round(proposalsPerMonth * (baseCloseRate / 100));
  const newDeals = Math.round(proposalsPerMonth * (closeRateWithSolarQuotePro / 100));
  
  const additionalDeals = Math.max(0, newDeals - baselineDeals);
  const monthlyRevenueGain = additionalDeals * avgDealSize;
  const yearlyRevenueGain = monthlyRevenueGain * 12;
  
  // Cost of Professional plan = 45,000 / month
  const planCost = 45000;
  const roiMultiplier = monthlyRevenueGain > 0 ? Math.round(monthlyRevenueGain / planCost) : 0;

  return (
    <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
      <Card className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-block bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2 rounded-full">
              💰 Installer Revenue Calculator
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              Calculate Your Solar Pro ROI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              See how increasing your proposal speed and close rates translates to extra revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Controls */}
            <div className="space-y-6">
              {/* Slider 1: Average Deal Size */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-350">₦ Average Solar Project Value:</span>
                  <span className="text-teal-650 dark:text-teal-400 font-extrabold text-sm">
                    ₦{(avgDealSize / 1000000).toFixed(1)}M
                  </span>
                </div>
                <input 
                  type="range" 
                  min="500000" 
                  max="10000000" 
                  step="500000"
                  value={avgDealSize}
                  onChange={(e) => setAvgDealSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>₦500K</span>
                  <span>₦10M</span>
                </div>
              </div>

              {/* Slider 2: Proposals sent per month */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-350">📋 Proposals Sent Monthly:</span>
                  <span className="text-teal-650 dark:text-teal-400 font-extrabold text-sm">
                    {proposalsPerMonth}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="50" 
                  step="1"
                  value={proposalsPerMonth}
                  onChange={(e) => setProposalsPerMonth(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>2</span>
                  <span>50</span>
                </div>
              </div>

              {/* Slider 3: Close Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-350">🎯 Target Close Rate (with SolarQuotePro):</span>
                  <span className="text-teal-650 dark:text-teal-400 font-extrabold text-sm">
                    {closeRateWithSolarQuotePro}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="16" 
                  max="60" 
                  step="1"
                  value={closeRateWithSolarQuotePro}
                  onChange={(e) => setCloseRateWithSolarQuotePro(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-250 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>16%</span>
                  <span>60%</span>
                </div>
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">Estimated Monthly Revenue Lift</span>
                <div className="text-2xl font-black text-slate-850 dark:text-slate-50 tracking-tight leading-none">
                  +₦{monthlyRevenueGain.toLocaleString('en-NG')}
                </div>
                <span className="text-[10px] text-slate-500 font-bold block">
                  ({additionalDeals} extra deal{additionalDeals !== 1 ? 's' : ''} closed / month)
                </span>
              </div>

              <div className="border-t border-teal-500/20 pt-3 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-655 dark:text-slate-350">Annual Revenue Lift:</span>
                <span className="text-emerald-650 dark:text-emerald-400 font-black text-sm">₦{yearlyRevenueGain.toLocaleString('en-NG')}</span>
              </div>

              <div className="border-t border-teal-500/20 pt-3 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-655 dark:text-slate-350">SolarQuotePro Cost ROI Multiplier:</span>
                <span className="text-emerald-650 dark:text-emerald-400 font-black text-sm">{roiMultiplier}x ROI</span>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                * Based on a baseline {baseCloseRate}% close rate. Disclaimer: This is an illustrative scenario representing potential savings and closing metrics; actual installer results may vary.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
