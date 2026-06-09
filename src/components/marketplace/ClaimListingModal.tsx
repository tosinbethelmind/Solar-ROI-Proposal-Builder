'use client';

import * as React from 'react';
import { X, Check, ShieldCheck, Mail, Phone, ArrowRight, ArrowLeft, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useRouter } from 'next/navigation';

interface ClaimListingModalProps {
  installerId: string;
  onClose: () => void;
}

export function ClaimListingModal({ installerId, onClose }: ClaimListingModalProps) {
  const router = useRouter();
  const { installers, claimListing } = useMarketplaceStore();
  const targetInstaller = installers.find(i => i.id === installerId);

  // Form states
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [otpError, setOtpError] = React.useState('');
  
  // Loading simulated states
  const [isSendingCode, setIsSendingCode] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);

  if (!targetInstaller) return null;

  const handleNextStep2 = () => {
    setStep(2);
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) return;
    
    setIsSendingCode(true);
    // Simulate API delay for OTP sending
    setTimeout(() => {
      setIsSendingCode(false);
      setStep(3);
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') {
      setOtpError('Invalid verification code. Please enter 123456 to verify.');
      return;
    }
    
    setOtpError('');
    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      setIsVerifying(false);
      // Persist the claimed status in store
      claimListing(targetInstaller.id, email, phone);
      setStep(4);
    }, 1500);
  };

  const handleGoToWorkspace = () => {
    onClose();
    router.push('/workspace/listing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge className="bg-teal-500/10 text-teal-655 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                📢 Seeded Listing Partner Program
              </Badge>
              <h2 className="text-xl font-black text-slate-850 dark:text-slate-50 leading-tight">
                Claim {targetInstaller.business_name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                This listing was automatically pre-populated based on public installer registries in Lagos. Claim this listing now to manage your profile and start acquiring leads.
              </p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">What you get when you claim:</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                  <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Official Partner Badge</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Showcase compliance and increase trust metrics for Lagos residential clients.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                  <div className="size-8 rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Instant Lead Dispatch</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Receive immediate quotes and WhatsApp routing from homeowners sizing their generator offsets.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="text-xs rounded-xl font-bold h-10 px-5 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNextStep2}
                className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-black text-xs h-10 px-6 border-none flex items-center gap-1.5"
              >
                Claim This Profile <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="space-y-2">
              <Badge className="bg-indigo-500/10 text-indigo-650 border border-indigo-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                🔒 Security Verification
              </Badge>
              <h2 className="text-xl font-black text-slate-850 dark:text-slate-50 leading-tight">
                Installer Credentials
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide your corporate contact details. We will transmit a secure OTP code to authorize ownership.
              </p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. info@company.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-455">Corporate Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(1)}
                className="text-xs rounded-xl font-bold h-10 px-5 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button 
                type="submit" 
                disabled={isSendingCode}
                className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-black text-xs h-10 px-6 border-none flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSendingCode ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending PIN...
                  </>
                ) : (
                  <>
                    Send Verification PIN <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <Badge className="bg-indigo-500/10 text-indigo-650 border border-indigo-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                🔑 Authorization Check
              </Badge>
              <h2 className="text-xl font-black text-slate-850 dark:text-slate-50 leading-tight">
                Enter Verification Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter the 6-digit verification code transmitted to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
              </p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-455">6-Digit Verification PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setOtpError('');
                    }}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none tracking-[0.2em] font-black text-center"
                  />
                </div>
                {otpError ? (
                  <p className="text-[10px] text-red-500 font-bold">{otpError}</p>
                ) : (
                  <p className="text-[9px] text-slate-400 font-bold">ℹ️ Test simulation code: <span className="underline font-black text-teal-650">123456</span></p>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(2)}
                className="text-xs rounded-xl font-bold h-10 px-5 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button 
                type="submit" 
                disabled={isVerifying}
                className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-black text-xs h-10 px-8 border-none flex items-center gap-1.5 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Profile...
                  </>
                ) : (
                  'Verify & Claim Profile'
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-850 dark:text-slate-50">Profile Successfully Claimed!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                You have authorized ownership of <strong className="text-slate-700 dark:text-slate-200">{targetInstaller.business_name}</strong>. Your partner account is now linked and setup.
              </p>
            </div>

            <div className="pt-4 max-w-xs mx-auto">
              <Button 
                onClick={handleGoToWorkspace} 
                className="w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-black text-xs h-11 flex items-center justify-center gap-2 border-none shadow-md"
              >
                Go to Partner Hub Workspace <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
