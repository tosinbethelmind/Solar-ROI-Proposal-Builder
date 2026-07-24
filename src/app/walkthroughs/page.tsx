'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  BookOpen, 
  Home, 
  Calculator, 
  Layout, 
  WifiOff, 
  Printer, 
  Sparkles,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Step {
  title: string;
  desc: string;
  narration: string;
}

interface Walkthrough {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: any;
  src: string;
  steps: Step[];
}

const WALKTHROUGHS: Walkthrough[] = [
  {
    id: 'homepage',
    title: '1. Homepage & Sizing Hub',
    description: 'High-end landing page, dark mode toggle, CTA buttons, and partner badges.',
    duration: '15s',
    icon: Home,
    src: '/assets/walkthrough_homepage.webp',
    steps: [
      {
        title: 'Land on Homepage',
        desc: 'Experience a premium, responsive landing page with custom branding and typography.',
        narration: 'This walkthrough shows the SolarQuotePro homepage experience. We start by landing on the premium dark-themed homepage, showcasing trust badges and active stats.'
      },
      {
        title: 'Call to Actions',
        desc: 'Observe the clear CTA buttons for starting the sizer tool and opening the installer workspace.',
        narration: 'Next, we hover over start sizing free and installer workspace buttons to see the hover effects.'
      },
      {
        title: 'Fluid Theme Toggle',
        desc: 'Switch between light and dark modes instantly to check the responsive CSS variables.',
        narration: 'Finally, we toggle the theme switch to shift between dark mode and light mode, showcasing the fluid responsive layout.'
      }
    ]
  },
  {
    id: 'quick_sizer',
    title: '2. B2C Quick Sizer',
    description: 'Load sizing calculator and contact lead capture for residential users.',
    duration: '22s',
    icon: Calculator,
    src: '/assets/walkthrough_quick_sizer.webp',
    steps: [
      {
        title: 'Load Estimator',
        desc: 'Residential users select household appliances like TVs, fridges, and lighting.',
        narration: 'This walkthrough shows the residential load sizer and lead submission. We navigate to the sizing estimator tool.'
      },
      {
        title: 'Real-time Payback',
        desc: 'Adjust quantity and wattage sliders to watch recommendation metrics calculate dynamically.',
        narration: 'Next, we select household appliances like lighting and televisions, adjusting quantities to see live sizing changes.'
      },
      {
        title: 'Lead Capture Submission',
        desc: 'Fill contact details and submit to obtain a detailed Naira ROI report.',
        narration: 'Then, we fill out the contact fields and submit the lead form to get a detailed solar audit report.'
      }
    ]
  },
  {
    id: 'pro_proposal',
    title: '3. Professional Proposal',
    description: 'B2B system configuration, hardware selection, and real-time NGN/USD currency toggle.',
    duration: '45s',
    icon: Layout,
    src: '/assets/walkthrough_pro_proposal.webp',
    steps: [
      {
        title: 'Initialize B2B Wizard',
        desc: 'Select a customer profile from the registry to automatically pull client metadata.',
        narration: 'This walkthrough shows the Professional Proposal Builder. We open a new proposal form and select our customer, Lagos Heights Apartments.'
      },
      {
        title: 'Configure Hardware Specs',
        desc: 'Add specific solar arrays, select premium inverter tiers, and specify battery bank capacity.',
        narration: 'Then, we customize hardware tiers, inverters, and battery specs to fit the system requirements.'
      },
      {
        title: 'Adjust Margins and Taxes',
        desc: 'Input transport costs, logistics, installer labor, and apply standard VAT.',
        narration: 'Next, we adjust the installer\'s profit margins, transportation costs, and apply the standard VAT rate.'
      },
      {
        title: 'NGN / USD Currency Toggle',
        desc: 'Switch between currencies instantly to present ROI values in localized rates.',
        narration: 'We toggle between Naira and US Dollar currencies to view updated pricing metrics in real time.'
      },
      {
        title: 'Apply Slogan & Save',
        desc: 'Input custom installer branding tagline and commit the proposal card.',
        narration: 'Finally, we save the proposal, adding our custom branding slogan: Reliable Clean Power for Nigeria.'
      }
    ]
  },
  {
    id: 'offline_sync',
    title: '4. Offline Sync & PWA',
    description: 'Emulated network drop, local caching, and background database synchronization.',
    duration: '18s',
    icon: WifiOff,
    src: '/assets/walkthrough_offline_sync.webp',
    steps: [
      {
        title: 'Monitor Connectivity',
        desc: 'Observe the live connection status badge in the header displaying Online.',
        narration: 'This walkthrough shows the offline synchronization system. We see the network status is currently online.'
      },
      {
        title: 'Offline Mode Activated',
        desc: 'Emulate a network disconnect; system shifts smoothly into offline cache mode.',
        narration: 'Next, we simulate a connection drop. The status changes to Offline Mode, indicating that local changes are being safely cached.'
      },
      {
        title: 'Edit & Save Offline',
        desc: 'Perform capacity adjustments and save the proposal directly to browser storage.',
        narration: 'We modify system parameters and save the proposal. The proposal is successfully stored in IndexedDB.'
      },
      {
        title: 'Reconnection Synchronization',
        desc: 'Re-establish network connectivity to automatically push cached edits online.',
        narration: 'Finally, when the connection is restored, the service worker automatically synchronizes the proposal to the remote server.'
      }
    ]
  },
  {
    id: 'proposal_print',
    title: '5. PDF Document Export',
    description: 'Dynamic proposal document formatted with clean print-media stylesheets.',
    duration: '12s',
    icon: Printer,
    src: '/assets/walkthrough_proposal_print.webp',
    steps: [
      {
        title: 'Open Proposal Template',
        desc: 'Load a compiled system design displaying full branding, charts, and BOM tables.',
        narration: 'This walkthrough shows the PDF proposal export and print styling. We open our saved solar proposal.'
      },
      {
        title: 'Launch System Print',
        desc: 'Click the Save as PDF button to open the system dialog with optimized page breaks.',
        narration: 'Next, we click Print or Save as PDF. This loads the custom print stylesheet, which formats the document cleanly for physical printing.'
      }
    ]
  },
  {
    id: 'admin_dashboard',
    title: '6. Administrative Console',
    description: 'Telemetry metrics, subscription queues, scraper engines, and AI outreach templates.',
    duration: '35s',
    icon: Sparkles,
    src: '/assets/walkthrough_admin_dashboard.webp',
    steps: [
      {
        title: 'Command telemetry dashboard',
        desc: 'Review total revenue, subscription active counts, and platform audit logs.',
        narration: 'This walkthrough shows the Administrator Console. We start on the main metrics overview dashboard.'
      },
      {
        title: 'Installer Partner Registry',
        desc: 'Manage company limits, status toggles, and verify registration requests.',
        narration: 'We check the companies registry page, where active partner subscription states can be managed.'
      },
      {
        title: 'Scraper Engine Controls',
        desc: 'Configure automated scrapers targeting Jiji and Google Maps listings.',
        narration: 'Next, we navigate to the lead scrapers console to monitor Google Maps and Jiji search routines.'
      },
      {
        title: 'AI Outreach Copilot',
        desc: 'Open sizer lead entries to instantly generate WhatsApp pitch scripts and cold calls.',
        narration: 'Finally, we open the B2C leads grid and select a lead, triggering the AI Sales Outreach Copilot to compile cold-outreach templates.'
      }
    ]
  }
];

export default function WalkthroughAcademy() {
  const [selectedTour, setSelectedTour] = React.useState<Walkthrough>(WALKTHROUGHS[0]);
  const [currentStepIdx, setCurrentStepIdx] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = React.useState<boolean>(false);
  const speechTimeoutRef = React.useRef<any>(null);

  // Stop any playing speech and reset state
  const stopTour = () => {
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
  };

  // Run the speech synthesis loop step by step
  const speakStep = (walkthrough: Walkthrough, stepIdx: number) => {
    if (stepIdx >= walkthrough.steps.length) {
      // Tour completed
      setIsPlaying(false);
      setCurrentStepIdx(0);
      return;
    }

    setCurrentStepIdx(stepIdx);
    const step = walkthrough.steps[stepIdx];

    if (!isAudioMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(step.narration);
      utterance.rate = 1.0;
      
      utterance.onend = () => {
        // Wait 1.5 seconds and move to next step
        speechTimeoutRef.current = setTimeout(() => {
          speakStep(walkthrough, stepIdx + 1);
        }, 1500);
      };

      utterance.onerror = () => {
        // Fallback if SpeechSynthesis encounters an issue
        speechTimeoutRef.current = setTimeout(() => {
          speakStep(walkthrough, stepIdx + 1);
        }, 6000);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // If audio is muted, auto-advance step by step using static delay
      speechTimeoutRef.current = setTimeout(() => {
        speakStep(walkthrough, stepIdx + 1);
      }, 6000);
    }
  };

  const startTour = () => {
    stopTour();
    setIsPlaying(true);
    speakStep(selectedTour, 0);
  };

  const jumpToStep = (idx: number) => {
    stopTour();
    setCurrentStepIdx(idx);
    if (isPlaying) {
      setIsPlaying(true);
      speakStep(selectedTour, idx);
    } else {
      // Just speak single step
      if (!isAudioMuted && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(selectedTour.steps[idx].narration);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  React.useEffect(() => {
    stopTour();
    setCurrentStepIdx(0);
  }, [selectedTour]);

  React.useEffect(() => {
    return () => {
      stopTour();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-200">SolarQuotePro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-655 hover:bg-slate-150 dark:text-slate-350">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* Title Section */}
        <div className="space-y-3">
          <Badge className="bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
            🎓 Product Academy
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none">
            Interactive Walkthrough Academy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            Explore high-fidelity interactive recordings of SolarQuotePro features. Toggle the voice narration switch below to hear the platform guide explain each step out loud.
          </p>
        </div>

        {/* Main Interface Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Panel (1/3 width) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-2 px-1">Choose Feature Walkthrough</h2>
            <div className="space-y-2">
              {WALKTHROUGHS.map((tour) => {
                const Icon = tour.icon;
                const isSelected = selectedTour.id === tour.id;
                return (
                  <button
                    key={tour.id}
                    onClick={() => setSelectedTour(tour)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-teal-500 shadow-md scale-[1.01]'
                        : 'bg-white/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isSelected ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-905 dark:text-slate-105 truncate">{tour.title}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">{tour.duration}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-semibold">
                        {tour.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Display Panel (2/3 width) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Walkthrough Visual Frame */}
            <Card className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
              {/* Browser Header Bar */}
              <div className="px-4 py-3 bg-slate-200/50 dark:bg-slate-950 border-b border-slate-300/40 dark:border-slate-850 flex justify-between items-center select-none">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
                </div>
                
                {/* Audio controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="h-8 px-2 rounded-lg text-slate-550 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    title={isAudioMuted ? "Unmute Guide Voice" : "Mute Guide Voice"}
                  >
                    {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-teal-500" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={isPlaying ? stopTour : startTour}
                    className={`h-8 text-xs font-black px-4 rounded-xl flex items-center gap-1.5 shadow-sm border-none ${
                      isPlaying 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" /> Stop Tour
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Play Tour
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* WebP Display Area */}
              <div className="aspect-video w-full bg-slate-955 relative flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                <img 
                  src={selectedTour.src} 
                  alt={selectedTour.title}
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Tour Steps Timeline Stepper */}
              <div className="p-6 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Audio-Guided Timeline</h3>
                  {isPlaying && (
                    <span className="text-[10px] text-teal-650 dark:text-teal-400 font-extrabold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Speaking Step {currentStepIdx + 1}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedTour.steps.map((step, idx) => {
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => jumpToStep(idx)}
                        className={`text-left p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-teal-500/5 dark:bg-teal-500/10 border-teal-500 shadow-sm scale-[1.01]'
                            : 'bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950 border-slate-100 dark:border-slate-850'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isCurrent ? 'text-teal-500' : 'text-slate-400'}`}>
                            Step {idx + 1}
                          </span>
                          {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />}
                        </div>
                        <div className="space-y-1 mt-2">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">{step.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                            {step.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

        </div>

      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} SolarQuotePro. All rights reserved.</p>
      </footer>

    </div>
  );
}
