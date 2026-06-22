'use client';

import * as React from 'react';
import { Play, Calculator, LayoutDashboard, Share2, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TABS = [
  {
    id: 'calculator',
    title: '1. Load Calculator',
    icon: Calculator,
    description: 'Calculate electrical loads, estimate payback periods, and size solar arrays in real time.',
  },
  {
    id: 'workspace',
    title: '2. Professional Workspace',
    icon: LayoutDashboard,
    description: 'Build custom bills of materials, set markups, and structure Lagos-compliant safety specs.',
  },
  {
    id: 'export',
    title: '3. One-Click PDF Export',
    icon: Share2,
    description: 'Generate a branded URL proposal or high-fidelity PDF, shared directly over WhatsApp.',
  }
];

const NARRATION_CUES = [
  { time: 1.0, text: "Welcome to SolarQuotePro! Let's calculate the perfect hybrid solar system size for your home." },
  { time: 6.5, text: "First, let's select our home appliances. We will add a Smart TV and Sound System to our daily loads." },
  { time: 13.5, text: "Now, we toggle the heavy loads switch to show larger power appliances, like deep freezers and air conditioners." },
  { time: 20.0, text: "Next, let's add one deep freezer to our sizing configuration." },
  { time: 25.5, text: "We are ready to proceed to the next step, where we configure our power usage and generator expenses." },
  { time: 31.5, text: "Here, we will enter our current monthly generator fuel spend. Let's set it to 150,000 Naira to evaluate generator displacement ROI." },
  { time: 39.5, text: "Now we click Calculate Recommendations to evaluate the options. This brings up the lead capture form." },
  { time: 46.0, text: "Let's fill out our contact email to receive a detailed PDF proposal and claim a 120,000 Naira discount bundle." },
  { time: 52.5, text: "We submit the details to generate our instant solar savings audit report." },
  { time: 59.0, text: "Success! We can see our customized hybrid solar recommendation report. Let's scroll down to view our estimated energy offset and carbon metrics." },
  { time: 70.0, text: "Now, let's transition to the Installer Workspace. Installers use their secure dashboard to manage client proposals and monitor pipeline metrics." },
  { time: 80.5, text: "Here is the simple mode workspace. We can easily toggle to Pro Mode to reveal live KPI stats like average system size, quoted revenue, and active plans." },
  { time: 92.0, text: "Now, we will build a comprehensive, high-fidelity solar proposal using the 5-step installer wizard." },
  { time: 99.5, text: "In Step 1, we compile the client's energy profile. Let's add an LED TV and a fridge-freezer to our system." },
  { time: 106.0, text: "Step 2 allows us to specify current energy pricing parameters. We'll set petrol to 1,250 Naira, diesel to 1,750 Naira, and monthly legacy bills to calculate utility displacement." },
  { time: 116.0, text: "In Step 3, we select the hardware tier. We'll proceed with the Economy solar package which automatically compiles the Bill of Materials." },
  { time: 124.5, text: "In Step 4, we configure installer margins, transport logistics, and taxes. Let's set our installation labor to 90,000, logistics to 30,000, and profit margin to 20 percent." },
  { time: 136.0, text: "We will check the VAT option to apply the standard seven point five percent VAT." },
  { time: 142.5, text: "Finally, in Step 5, we input client details and customize the installer branding tagline. Let's name the client Lagos Heights Apartments." },
  { time: 150.0, text: "Let's expand the installer branding section and add our customized company slogan: Reliable Clean Power for Nigeria." },
  { time: 159.0, text: "Now, let's generate the official PDF proposal for the client." },
  { time: 165.5, text: "The high-fidelity solar proposal has been generated! Let's scroll down to inspect the clean layout, standard equipment BOM, and payback calculations." },
  { time: 176.5, text: "Let's check the CRM and proposal history log to see all our saved proposal drafts." },
  { time: 182.5, text: "Here we can see our saved Lagos Heights proposal, its status, and action logs." },
  { time: 188.5, text: "Now, let's check the pricing plans available for solar installers on our platform." },
  { time: 194.5, text: "Installers can choose between Free, Starter, Pro, or Enterprise plans depending on their sizing volume and lead outreach needs." },
  { time: 202.5, text: "Next, we transition to the Admin Console to view system telemetry and lead engagement analytics." },
  { time: 209.5, text: "The Admin Dashboard displays key operational statistics, monthly recurring revenue, platform signups, and service health logs." },
  { time: 218.0, text: "Let's navigate to the Companies manager to view and authorize active installer companies." },
  { time: 225.0, text: "Here we can review and manage subscriptions, edit member limits, or toggle suspended status for partner firms." },
  { time: 233.0, text: "We also have a built-in scraper engine to identify commercial prospects on Google Maps and Jiji who need solar installations." },
  { time: 240.0, text: "Administrators can initiate localized scrapers to populate the installer sales pipelines automatically." },
  { time: 247.0, text: "Finally, let's inspect the lead database and check the AI Sales Outreach Copilot." },
  { time: 254.0, text: "We can click on our captured lead to open the AI sales outreach workspace." },
  { time: 261.0, text: "The AI Copilot has generated a personalized WhatsApp pitch using the customer's solar payback calculation." },
  { time: 268.5, text: "Let's toggle to the Email tab to view the generated email campaign pitch." },
  { time: 274.5, text: "And finally, we view the Call Outreach tab to inspect the interactive cold-call phone script." },
  { time: 280.5, text: "This completes the end-to-end walkthrough of the SolarQuotePro platform. Thank you!" }
];

export default function VideoDemo() {
  const [activeTab, setActiveTab] = React.useState('calculator');
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef(null);
  const lastCueIndexRef = React.useRef(-1);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSeeking = () => {
    lastCueIndexRef.current = -1;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    lastCueIndexRef.current = -1;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleTimeUpdate = (e) => {
    const time = e.currentTarget.currentTime;
    
    // Find matching cue index
    const cueIndex = NARRATION_CUES.findIndex((c, i) => 
      time >= c.time && (i === NARRATION_CUES.length - 1 || time < NARRATION_CUES[i + 1].time)
    );
    
    if (cueIndex !== -1 && cueIndex !== lastCueIndexRef.current) {
      lastCueIndexRef.current = cueIndex;
      const cue = NARRATION_CUES[cueIndex];
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cue.text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <section className="py-16 bg-slate-950 text-white relative overflow-hidden border-t border-slate-900 video-demo">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-3 mb-10">
          <span className="inline-block bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full">
            💻 See the Tool in Action
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Watch SolarQuotePro in Action
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-lg mx-auto">
            Take a 60-second interactive tour of the proposal builder and Naira ROI modeler.
          </p>
        </div>

        {/* Video Placeholder Container */}
        <div className="max-w-4xl mx-auto mb-16 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative group video-placeholder">
          <div className="aspect-video w-full bg-slate-955 relative flex items-center justify-center">
            <video 
              ref={videoRef}
              poster="/assets/video-thumbnail.png" 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-60'}`}
              controls
              preload="none"
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onEnded={handleEnded}
            >
              <source src="/assets/solarquotepro-demo.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
            
            {!isPlaying && (
              <button 
                onClick={handlePlayClick}
                aria-label="Play video demo"
                className="absolute inset-0 flex items-center justify-center bg-slate-950/40 group-hover:bg-slate-950/20 transition-all duration-300 play-btn"
              >
                <span className="flex items-center justify-center size-16 rounded-full bg-teal-500 text-white shadow-xl shadow-teal-500/35 hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </span>
              </button>
            )}
          </div>
          <p className="p-4 bg-slate-950/80 border-t border-slate-850 text-center text-xs text-slate-400 font-bold">
            See: Calculator demo → Workspace walkthrough → PDF export → WhatsApp share
          </p>
        </div>

        <div className="text-center space-y-2 mb-6">
          <h3 className="text-lg font-extrabold text-white">Interactive Feature Tour</h3>
          <p className="text-xs text-slate-400 font-medium">Click the tabs below to explore individual features live.</p>
        </div>

        {/* Interactive Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs font-black tracking-wide transition-all duration-300 ${
                  isActive 
                    ? 'bg-teal-650 hover:bg-teal-700 text-white border-teal-500 shadow-lg shadow-teal-500/15 scale-[1.02]' 
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.title}
              </button>
            );
          })}
        </div>

        {/* Browser Mockup Frame */}
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Browser Header Bar */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-850 flex items-center gap-2 select-none">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
            </div>
            <div className="mx-auto max-w-[280px] sm:max-w-md w-full bg-slate-900 rounded-lg py-1 px-3 text-[10px] text-slate-500 font-bold text-center border border-slate-800/80 truncate">
              https://solar-quotepro.app/workspace/proposal-builder
            </div>
          </div>

          {/* Tab Content Preview Area */}
          <div className="p-6 sm:p-10 bg-slate-900/60 min-h-[380px] flex flex-col justify-between">
            {activeTab === 'calculator' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-lg font-black text-white">Load Calculator &amp; Energy Audit</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Input household appliances to auto-calculate battery/inverter sizes.</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Real-time Naira ROI
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Load items */}
                  <div className="space-y-3">
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-white">Inverter AC (1.5 HP)</div>
                        <div className="text-[10px] text-slate-500 font-medium">Quantity: 2 &bull; 6 Hours daily</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-white">1,800 Watts</div>
                        <span className="text-[9px] text-teal-400 font-bold">Solar Priority</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-white">Double-Door Freezer</div>
                        <div className="text-[10px] text-slate-500 font-medium">Quantity: 1 &bull; 24 Hours daily</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-white">250 Watts</div>
                        <span className="text-[9px] text-amber-500 font-bold">Continuous load</span>
                      </div>
                    </div>
                  </div>

                  {/* ROI Chart simulation */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Calculated Payback Period</div>
                      <div className="text-3xl font-black text-teal-400 mt-1">22 Months</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                        Generator fuel offset saves ₦185,100 monthly against initial solar investment.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                        <div className="text-[8px] text-slate-500 font-bold uppercase">Inverter Size</div>
                        <div className="text-xs font-black text-white">5 kVA</div>
                      </div>
                      <div className="flex-1 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                        <div className="text-[8px] text-slate-500 font-bold uppercase">Battery Capacity</div>
                        <div className="text-xs font-black text-white">10 kWh LFP</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workspace' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-lg font-black text-white">Professional proposal workspace</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Customize quotes, add margin percentages, and verify safety checklists.</p>
                  </div>
                  <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-black uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shrink-0">
                    LSEB Compliant
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs font-black pb-2 border-b border-slate-900 text-slate-400">
                    <span>Hardware Item / Bill of Materials</span>
                    <span>Cost / Pricing</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-white">6x 550W Jinko N-Type Mono Solar Panels</span>
                      <span className="text-white">₦1,320,000</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-white">1x 5kVA Felicity Hybrid Solar Inverter</span>
                      <span className="text-white">₦820,000</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-teal-400">
                      <span>Standard markup margin (+18% markup)</span>
                      <span>+₦385,200</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex justify-between items-center">
                    <span className="text-xs font-black text-white">Lagos Roof Safety Compliance</span>
                    <span className="text-[10px] text-emerald-450 font-black flex items-center gap-1 bg-emerald-500/15 py-0.5 px-2.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3 stroke-[3]" /> Passed (&lt; 15kg/sqm weight)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-lg font-black text-white">Instant WhatsApp proposal share</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Push high-fidelity Naira ROI PDF quotes to your client via WhatsApp in one tap.</p>
                  </div>
                  <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-black uppercase tracking-wider py-1 px-3 rounded-full shrink-0">
                    No PDF watermark
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Phone simulator */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Client WhatsApp Chat</div>
                    
                    <div className="bg-teal-650/10 border border-teal-500/25 p-3 rounded-2xl rounded-tr-none text-xs ml-8 space-y-2 text-right">
                      <p className="text-slate-200 font-medium">Hello Chief, here is the solar installation proposal for your duplex. It breaks down the ₦185,100 monthly fuel savings.</p>
                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-left flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center font-black text-xs shrink-0">PDF</div>
                        <div className="truncate">
                          <div className="text-[10px] font-bold text-white truncate">SolarQuotePro_5kVA_Proposal.pdf</div>
                          <div className="text-[8px] text-slate-500 font-semibold">1.4 MB &bull; Naira ROI &amp; Specs</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="flex flex-col justify-center space-y-4">
                    <h5 className="font-extrabold text-sm text-white">Close contracts in under 48 hours</h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Instead of standard emails, clients receive clear pricing charts, Naira payback cycles, and official safety compliant declarations directly to their WhatsApp messages.
                    </p>
                    <Button className="bg-emerald-650 hover:bg-emerald-700 text-white font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 self-start shadow-md">
                      Share via WhatsApp <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
