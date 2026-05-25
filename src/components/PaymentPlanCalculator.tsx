'use client';

import * as React from 'react';
import { useWizardStore } from '@/store/wizardStore';

interface PaymentPlanCalculatorProps {
  systemCost: number;
  monthlyGeneratorCost: number;
}

export function PaymentPlanCalculator({ systemCost, monthlyGeneratorCost }: PaymentPlanCalculatorProps) {
  const { proposal, updateProposal } = useWizardStore();
  const plan = proposal.paymentPlan || {
    selectedPlan: 'outright',
    downPaymentPercent: 20,
    interestRatePercent: 0,
    includeInProposal: true,
    markup6Months: 10,
    markup12Months: 15,
    markup24Months: 20
  };

  const getPlanDetails = (planType: 'outright' | '6months' | '12months' | '24months') => {
    if (planType === 'outright') {
      return {
        name: 'Outright Purchase',
        months: 0,
        markupPercent: 0,
        downPayment: systemCost,
        monthlyRepayment: 0,
        totalAmountPayable: systemCost,
      };
    }

    const months = planType === '6months' ? 6 : planType === '12months' ? 12 : 24;
    const markupPercent = planType === '6months' 
      ? (plan.markup6Months ?? 10) 
      : planType === '12months' 
        ? (plan.markup12Months ?? 15) 
        : (plan.markup24Months ?? 20);
    
    const downPayment = systemCost * ((plan.downPaymentPercent ?? 20) / 100);
    const financedAmount = systemCost * (1 - (plan.downPaymentPercent ?? 20) / 100);
    const totalFinanced = financedAmount * (1 + markupPercent / 100);
    const monthlyRepayment = totalFinanced / months;
    const totalAmountPayable = downPayment + totalFinanced;

    return {
      name: `${months}-Month Plan`,
      months,
      markupPercent,
      downPayment,
      monthlyRepayment,
      totalAmountPayable,
    };
  };

  const setPlan = (selectedPlan: 'outright' | '6months' | '12months' | '24months') => {
    updateProposal({
      paymentPlan: {
        ...plan,
        selectedPlan,
        downPaymentPercent: selectedPlan === 'outright' ? 100 : (plan.downPaymentPercent === 100 ? 20 : plan.downPaymentPercent)
      }
    });
  };

  const plansList: Array<'outright' | '6months' | '12months' | '24months'> = [
    'outright',
    '6months',
    '12months',
    '24months',
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            💳 Flexible Payment Plans
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Select a pricing plan to include in your proposal output.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input 
            type="checkbox" 
            checked={plan.includeInProposal} 
            onChange={(e) => updateProposal({ paymentPlan: { ...plan, includeInProposal: e.target.checked } })}
            className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
          />
          Include in Proposal
        </label>
      </div>

      {plan.includeInProposal && (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>⚙️</span> Customize Instalment Terms
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="down-payment-input" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Down Payment (%)
              </label>
              <div className="relative">
                <input
                  id="down-payment-input"
                  type="number"
                  min={0}
                  max={100}
                  value={plan.downPaymentPercent ?? 20}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value)));
                    updateProposal({
                      paymentPlan: {
                        ...plan,
                        downPaymentPercent: val,
                      }
                    });
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="markup-6m-input" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                6-Month Markup (%)
              </label>
              <div className="relative">
                <input
                  id="markup-6m-input"
                  type="number"
                  min={0}
                  value={plan.markup6Months ?? 10}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    updateProposal({
                      paymentPlan: {
                        ...plan,
                        markup6Months: val,
                      }
                    });
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="markup-12m-input" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                12-Month Markup (%)
              </label>
              <div className="relative">
                <input
                  id="markup-12m-input"
                  type="number"
                  min={0}
                  value={plan.markup12Months ?? 15}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    updateProposal({
                      paymentPlan: {
                        ...plan,
                        markup12Months: val,
                      }
                    });
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="markup-24m-input" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                24-Month Markup (%)
              </label>
              <div className="relative">
                <input
                  id="markup-24m-input"
                  type="number"
                  min={0}
                  value={plan.markup24Months ?? 20}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    updateProposal({
                      paymentPlan: {
                        ...plan,
                        markup24Months: val,
                      }
                    });
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plansList.map((planType) => {
          const details = getPlanDetails(planType);
          const isSelected = plan.selectedPlan === planType;
          
          return (
            <div
              key={planType}
              onClick={() => setPlan(planType)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setPlan(planType);
                }
              }}
              role="radio"
              aria-checked={isSelected ? 'true' : 'false'}
              tabIndex={0}
              className={`text-left rounded-2xl border-2 p-5 transition-all flex flex-col justify-between h-full space-y-4 hover:border-teal-500/50 hover:shadow-md cursor-pointer ${
                isSelected 
                  ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm ring-1 ring-teal-500' 
                  : 'border-border bg-card'
              }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100 uppercase">
                    {planType === 'outright' ? 'Outright' : `${details.months} Months`}
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                {details.markupPercent > 0 ? (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    {details.markupPercent}% Markup
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                    0% Extra Fees
                  </span>
                )}
              </div>

              <div className="space-y-2 w-full pt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Down Payment</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    ₦{details.downPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Installment</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {details.monthlyRepayment > 0 
                      ? `₦${Math.round(details.monthlyRepayment).toLocaleString()}` 
                      : '—'}
                  </p>
                </div>

                <div className="pt-2 border-t dark:border-slate-800">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Payable</p>
                  <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                    ₦{Math.round(details.totalAmountPayable).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Comparison Row */}
              <div className="w-full pt-3 border-t dark:border-slate-800 space-y-1 text-center">
                <p className="text-[10px] text-slate-500 font-medium">Solar vs Gen Cost</p>
                {planType === 'outright' ? (
                  <p className="text-[10px] text-emerald-600 font-bold">₦0/mo vs ₦{Math.round(monthlyGeneratorCost).toLocaleString()}/mo</p>
                ) : (
                  <p className={`text-[10px] font-bold ${details.monthlyRepayment < monthlyGeneratorCost ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ₦{Math.round(details.monthlyRepayment).toLocaleString()}/mo vs ₦{Math.round(monthlyGeneratorCost).toLocaleString()}/mo
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
