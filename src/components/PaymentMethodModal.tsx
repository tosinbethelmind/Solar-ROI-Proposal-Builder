'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet, Banknote, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string | null;
  planName: string;
  priceFormatted: string;
  onSelectManual: () => void;
  onSelectAutomatic: () => void;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  planId,
  planName,
  priceFormatted,
  onSelectManual,
  onSelectAutomatic
}: PaymentMethodModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-650 dark:text-teal-400">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <DialogTitle className="text-lg font-black text-slate-850 dark:text-slate-50">
            Select Payment Method
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            You are subscribing to the <strong className="text-teal-650">{planName}</strong> plan ({priceFormatted}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Option 1: Paystack Automatic Checkout */}
          <button
            onClick={() => {
              onClose();
              onSelectAutomatic();
            }}
            className="w-full text-left p-4 rounded-2xl border border-teal-500/20 bg-teal-50/20 dark:bg-teal-950/10 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/25 transition-all duration-200 group flex items-start gap-3.5 focus:outline-none"
          >
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="space-y-1 pr-6 relative w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">Paystack Automatic Pay</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-400 font-bold shrink-0">Instant Activation</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Pay instantly using Card, USSD, or Bank App transfer. Upgrades your account immediately.
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-teal-650 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </button>

          {/* Option 2: Automated Moniepoint / OPay Fintech Gateway (Sandbox / Onboarding) */}
          <div className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 opacity-70 cursor-not-allowed flex items-start gap-3.5 relative">
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shrink-0 mt-0.5">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="space-y-1 w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500">Moniepoint & OPay Auto-Checkout</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold shrink-0">Automation Coming Soon</span>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold leading-relaxed">
                Direct fintech portal integration. Onboarding in progress (use option below to pay via Moniepoint/OPay manually today).
              </p>
            </div>
          </div>

          {/* Option 3: Manual Local Bank Transfer (Active) */}
          <button
            onClick={() => {
              onClose();
              onSelectManual();
            }}
            className="w-full text-left p-4 rounded-2xl border border-slate-250 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-all duration-200 group flex items-start gap-3.5 focus:outline-none"
          >
            <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400 shrink-0 mt-0.5">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="space-y-1 pr-6 relative w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">Manual Transfer (Moniepoint, OPay, GTB)</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-400 font-bold shrink-0 flex items-center gap-0.5">
                  <Clock className="w-2 h-2" /> 1-2 Hr Verification
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Direct transfer to our accounts and upload a screenshot receipt. Verification by our local ops team.
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </button>
        </div>

        <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center font-semibold border-t border-slate-100 dark:border-slate-850 pt-3">
          🔒 Secured checkout via bank-grade tokenization & SSL protocols.
        </div>
      </DialogContent>
    </Dialog>
  );
}
