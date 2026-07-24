'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Sun, 
  Zap, 
  BookOpen, 
  TrendingUp, 
  Newspaper, 
  FileText, 
  CheckSquare, 
  Settings, 
  Loader2, 
  Plus, 
  X, 
  ArrowLeft, 
  CheckCircle, 
  Calendar, 
  Info,
  Save,
  Globe,
  Flame,
  Check,
  Edit2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BlogArticle } from '@/lib/blog';

interface NewsItem {
  title: string;
  originalTitle: string;
  link: string;
  pubDate: string;
  source: string;
}

interface ViralIssue {
  id: string;
  title: string;
  description: string;
  hashtag: string;
  sentiment: string;
  reach: string;
}

interface ResearchFact {
  id: string;
  fact: string;
  source: string;
}

export default function BlogAutomationPage() {
  const router = useRouter();

  // Authentication states
  const [googleToken, setGoogleToken] = React.useState<string | null>(null);

  // Scraped source data states
  const [loadingSources, setLoadingSources] = React.useState(true);
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [viralIssues, setViralIssues] = React.useState<ViralIssue[]>([]);
  const [researchFacts, setResearchFacts] = React.useState<ResearchFact[]>([]);

  // Active source tabs: 'news' | 'social' | 'research'
  const [activeSourceTab, setActiveSourceTab] = React.useState<'news' | 'social' | 'research'>('news');

  // Selected prompt details
  const [selectedTopic, setSelectedTopic] = React.useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = React.useState<'news' | 'social' | 'custom'>('custom');
  const [selectedFacts, setSelectedFacts] = React.useState<string[]>([]); // Array of fact IDs

  // Generation parameters
  const [targetAudience, setTargetAudience] = React.useState<string>('Homeowners & Residents');
  const [writingTone, setWritingTone] = React.useState<string>('Calculated & Math-Centric');
  const [widgetType, setWidgetType] = React.useState<'roi-calculator' | 'grid-vs-solar' | 'compliance-checklist'>('roi-calculator');
  const [targetCTA, setTargetCTA] = React.useState<string>('🏡 Open the Solar Sizer Estimator and calculate your home payback period');
  
  const [generatingAI, setGeneratingAI] = React.useState(false);

  // Generated draft / Editor states
  const [draftArticle, setDraftArticle] = React.useState<Partial<BlogArticle> | null>(null);
  const [isEditingDraft, setIsEditingDraft] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  React.useEffect(() => {
    // Read Google OAuth credentials from localStorage
    const token = localStorage.getItem('google_oauth_token');
    const expiresAt = localStorage.getItem('google_oauth_token_expires_at');
    
    if (token) {
      if (expiresAt && new Date().getTime() > parseInt(expiresAt, 10)) {
        localStorage.removeItem('google_oauth_token');
        localStorage.removeItem('google_oauth_token_expires_at');
        setGoogleToken(null);
        toast.warning('Google Services session expired. Please connect again.');
      } else {
        setGoogleToken(token);
      }
    }

    // Fetch live RSS news and curated topics from our backend
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const resp = await fetch('/api/admin/blog-automation/trends');
      const data = await resp.json();
      if (data.success) {
        setNews(data.news || []);
        setViralIssues(data.viralIssues || []);
        setResearchFacts(data.researchFacts || []);
      } else {
        toast.error(data.error || 'Failed to fetch trends data.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to communicate with trends aggregator.');
    } finally {
      setLoadingSources(false);
    }
  };

  const initiateOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';
    const redirectUri = window.location.origin + '/admin/scrapers/callback';
    const scopes = [
      'https://www.googleapis.com/auth/generative-language'
    ].join(' ');
    
    // Set redirect path back here
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent('/admin/blog-automation')}&prompt=consent`;
    window.location.href = oauthUrl;
  };

  // Toggle research fact selection
  const handleToggleFact = (factId: string) => {
    setSelectedFacts(prev => 
      prev.includes(factId) ? prev.filter(id => id !== factId) : [...prev, factId]
    );
  };

  // Select news article as draft topic seed
  const handleSelectNews = (title: string) => {
    setSelectedTopic(title);
    setSelectedSourceType('news');
    toast.info('Loaded news headline as draft topic seed.');
  };

  // Select social issue as draft topic seed
  const handleSelectSocial = (issue: ViralIssue) => {
    setSelectedTopic(`${issue.title} (${issue.hashtag})`);
    setSelectedSourceType('social');
    toast.info('Loaded viral social issue as draft topic seed.');
  };

  // Direct client-side Gemini generation via user Google OAuth token
  const handleGenerateArticle = async () => {
    if (!googleToken) {
      toast.error('Google authorization required. Please click "Connect Google AI" at the top.');
      return;
    }
    if (!selectedTopic.trim()) {
      toast.error('Please select a news headline, social issue, or enter a custom topic first.');
      return;
    }

    setGeneratingAI(true);
    setDraftArticle(null);
    setIsEditingDraft(false);

    try {
      // Find selected research facts contents
      const factsToInject = researchFacts
        .filter(f => selectedFacts.includes(f.id))
        .map(f => `- "${f.fact}" (Source: ${f.source})`)
        .join('\n');

      const systemPrompt = `You are a world-class solar energy consultant, copywriter, and SEO specialist in Nigeria and West Africa.
We are drafting a highly authoritative, conversion-optimized blog post for our Insights Hub.
To guarantee this ranks first on both Google Search (classic SEO) and AI Engine queries (Generative Engine Optimization - GEO), you must follow these rules strictly:
1. Include an "answerFirst" quick-take paragraph at the top that directly summarizes the main response to the topic. It must contain concrete, math-verified metrics or statistics.
2. Maintain high information density and EEAT standards. Include actual solar radiation values, tariff numbers, and battery cycle comparison data.
3. Incorporate the selected verified research facts provided below naturally.
4. Structure the content logically into multiple sections, lists, and FAQs.
5. Do not write generic marketing fluff. Be analytical, quantitative, and local to the Nigerian power landscape.

Topic/Headline: "${selectedTopic}"
Target Audience: "${targetAudience}"
Tone/Style: "${writingTone}" (If Calculated/Math-Centric, make sure to show numbers/equations; if Urgent/Alarmist, focus on grid collapses/fuel costs).
Primary Call-to-Action (CTA): "${targetCTA}"
Interactive Calculator Widget Type: "${widgetType}" (Choose 'roi-calculator' if focus is ROI/Sizing, 'grid-vs-solar' if focus is tariffs/bills, or 'compliance-checklist' if structural safety).

Verified Facts to Inject:
${factsToInject || "No specific facts checked. Use standard certified solar facts about Nigeria."}

Return ONLY raw JSON data conforming exactly to this structure (do not wrap in markdown \`\`\`json or add text prefix/suffix):
{
  "title": "Clear ROI-focused SEO title (max 60 chars)",
  "slug": "url-friendly-slug-related-to-topic",
  "description": "Compelling Meta description for search engines (max 155 chars)",
  "readTime": "5 min read",
  "author": "Engr. Babajide Alao",
  "category": "Solar Education",
  "pillar": "ROI Math",
  "answerFirst": "High-density quick-take RAG summary paragraph addressing the question with numbers",
  "summaryPoints": ["Key takeaway point 1", "Key takeaway point 2", "Key takeaway point 3"],
  "sections": [
    {
      "title": "Heading 1 (H2)",
      "content": [
        "Paragraph 1 text containing detailed explanations, calculations, or advice.",
        "Paragraph 2 text detailing specific requirements or local DisCo metrics."
      ]
    },
    {
      "title": "Heading 2 (H2)",
      "content": [
        "Paragraph 1 text."
      ]
    }
  ],
  "faqs": [
    { "question": "Detailed FAQ Question 1?", "answer": "Clear, concise direct answer to FAQ 1." },
    { "question": "Detailed FAQ Question 2?", "answer": "Clear, concise direct answer to FAQ 2." }
  ],
  "widgetType": "${widgetType}"
}`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google API returned status ${response.status}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error('Empty response from Gemini model.');
      }

      const generatedObj = JSON.parse(rawText.trim());
      
      // Determine Pillar based on category/topic
      let pillar: 'ROI Math' | 'Sizing & Grid' | 'Battery Tech' | 'Lagos Compliance' | 'Installer Growth' = 'ROI Math';
      if (widgetType === 'grid-vs-solar') pillar = 'Sizing & Grid';
      else if (widgetType === 'compliance-checklist') pillar = 'Lagos Compliance';
      else if (selectedTopic.toLowerCase().includes('battery') || selectedTopic.toLowerCase().includes('lithium')) pillar = 'Battery Tech';

      const parsedDraft: Partial<BlogArticle> = {
        title: generatedObj.title || '',
        slug: generatedObj.slug || '',
        description: generatedObj.description || '',
        readTime: generatedObj.readTime || '5 min read',
        author: generatedObj.author || 'Engr. Babajide Alao',
        category: generatedObj.category || 'Solar Tech',
        pillar,
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop',
        answerFirst: generatedObj.answerFirst || '',
        summaryPoints: generatedObj.summaryPoints || [],
        sections: generatedObj.sections || [],
        faqs: generatedObj.faqs || [],
        widgetType: generatedObj.widgetType || widgetType,
        schema: {
          headline: generatedObj.title || '',
          description: generatedObj.description || '',
          faqList: (generatedObj.faqs || []).map((f: any) => ({ q: f.question, a: f.answer }))
        }
      };

      setDraftArticle(parsedDraft);
      setIsEditingDraft(true);
      toast.success('Gemini successfully generated your high-density SEO blog draft!');
    } catch (e: any) {
      console.error(e);
      toast.error(`Gemini Generation failed: ${e.message || 'Check your Google connection token'}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Save the drafted article to the CMS database
  const handlePublishDraft = async () => {
    if (!draftArticle || !draftArticle.title || !draftArticle.slug) {
      toast.error('Title and Slug are required to publish the article.');
      return;
    }

    setPublishing(true);
    try {
      // Ensure schema list is aligned
      const payloadArticle = {
        ...draftArticle,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        schema: {
          headline: draftArticle.title,
          description: draftArticle.description || '',
          faqList: (draftArticle.faqs || []).map(f => ({ q: f.question || '', a: f.answer || '' }))
        }
      };

      const resp = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: payloadArticle })
      });

      const data = await resp.json();
      if (data.success) {
        toast.success('Article published live to Insights Hub successfully!');
        router.push('/admin/content');
      } else {
        toast.error(data.error || 'Failed to publish article.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error publishing article.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <Sparkles className="h-4 w-4 shrink-0 text-teal-500 animate-pulse" />
            <span>AI Copilot Content Engineering</span>
          </div>
          <h1 className="text-3xl font-black text-slate-855 dark:text-slate-50 tracking-tight mt-1">Solar Blog Automation</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Research trending news, select viral hashtags, inject verified academic statistics, and generate SEO/GEO optimized articles.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {!googleToken ? (
            <Button 
              onClick={initiateOAuth}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-2 bg-white dark:bg-slate-900 cursor-pointer text-slate-655 dark:text-slate-350"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.127 4.114a5.856 5.856 0 01-5.856-5.857c0-3.235 2.62-5.856 5.856-5.856 1.454 0 2.784.53 3.806 1.4 l3.056-3.056C18.91 3.23 15.79 2 12.24 2 6.584 2 2 6.584 2 12.24s4.584 10.24 10.24 10.24c6.202 0 10.24-4.364 10.24-10.24 0-.69-.06-1.355-.175-1.955H12.24z"/>
              </svg>
              <span>Connect Google AI</span>
            </Button>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-900/50 uppercase text-[9px] font-black tracking-wider flex items-center gap-1 h-9 px-3 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Connected</span>
            </Badge>
          )}

          <Button
            onClick={() => router.push('/admin/content')}
            variant="ghost"
            size="sm"
            className="h-9 border border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to CMS
          </Button>
        </div>
      </div>

      {/* ═══ Main Split View: Left Sources, Right Parameters ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Research, Trends & Feeds (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
            {/* Sub-tab selection */}
            <div className="grid grid-cols-3 border-b border-slate-150 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20 text-center text-xs font-bold uppercase tracking-wider">
              <button 
                onClick={() => setActiveSourceTab('news')}
                className={`py-3.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeSourceTab === 'news' 
                    ? 'border-teal-555 text-teal-655 dark:text-teal-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>News</span>
              </button>
              <button 
                onClick={() => setActiveSourceTab('social')}
                className={`py-3.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeSourceTab === 'social' 
                    ? 'border-teal-555 text-teal-655 dark:text-teal-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Viral</span>
              </button>
              <button 
                onClick={() => setActiveSourceTab('research')}
                className={`py-3.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeSourceTab === 'research' 
                    ? 'border-teal-555 text-teal-655 dark:text-teal-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Research</span>
              </button>
            </div>

            <CardContent className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingSources ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] uppercase font-bold tracking-wider animate-pulse">Scraping live sources...</span>
                </div>
              ) : activeSourceTab === 'news' ? (
                /* ── NEWS TAB ── */
                <div className="space-y-3.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                    Live solar news headlines scraped from Google News. Select one as the topic seed for your post:
                  </p>
                  {news.map((item, idx) => (
                    <div 
                      key={idx}
                      className="border border-slate-100 dark:border-slate-805 p-3 rounded-2xl space-y-2 hover:border-teal-500/20 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all text-xs relative group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <Badge className="bg-teal-500/10 text-teal-605 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          {item.source}
                        </Badge>
                        <span className="text-[9px] text-slate-400 font-semibold">{new Date(item.pubDate).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-teal-650 dark:group-hover:text-teal-400 transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex justify-end pt-1">
                        <Button 
                          onClick={() => handleSelectNews(item.title)}
                          size="xs"
                          variant="outline"
                          className="h-7 text-[9px] font-black uppercase tracking-wider rounded-lg border-teal-500/20 hover:bg-teal-555 hover:text-white"
                        >
                          Select Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeSourceTab === 'social' ? (
                /* ── VIRAL TAB ── */
                <div className="space-y-3.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                    Curated high-engagement energy discussions across Nigerian social communities:
                  </p>
                  {viralIssues.map((issue) => (
                    <div 
                      key={issue.id}
                      className="border border-slate-100 dark:border-slate-805 p-3 rounded-2xl space-y-2 hover:border-teal-500/20 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-rose-500/20 animate-pulse" /> Viral Reach: {issue.reach}
                        </span>
                        <Badge className="bg-slate-105 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">
                          {issue.hashtag}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200">{issue.title}</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal font-medium">{issue.description}</p>
                      <div className="flex justify-between items-center pt-1.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Sentiment: <strong className="text-teal-650 dark:text-teal-400">{issue.sentiment}</strong></span>
                        <Button 
                          onClick={() => handleSelectSocial(issue)}
                          size="xs"
                          variant="outline"
                          className="h-7 text-[9px] font-black uppercase tracking-wider rounded-lg border-teal-500/20 hover:bg-teal-555 hover:text-white"
                        >
                          Select Topic
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── RESEARCH DATA TAB ── */
                <div className="space-y-3.5">
                  <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-2xl text-[10px] text-teal-650 dark:text-teal-400 font-bold leading-normal flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Check the boxes below to inject verified, cited facts directly into the Gemini writing engine. This guarantees high-EEAT search authority scores.
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {researchFacts.map((fact) => {
                      const isChecked = selectedFacts.includes(fact.id);
                      return (
                        <div 
                          key={fact.id}
                          onClick={() => handleToggleFact(fact.id)}
                          className={`border p-3.5 rounded-2xl transition-all cursor-pointer text-xs select-none flex items-start gap-3 ${
                            isChecked 
                              ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-950/20' 
                              : 'border-slate-100 hover:border-slate-200 dark:border-slate-805 dark:hover:border-slate-800'
                          }`}
                        >
                          <div className={`size-4.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked 
                              ? 'bg-teal-555 border-teal-555 text-white' 
                              : 'border-slate-300 dark:border-slate-700 bg-transparent'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="font-extrabold text-slate-800 dark:text-slate-350 leading-relaxed">
                              {fact.fact}
                            </p>
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Source: {fact.source}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Generation Settings & Parameters (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-slate-855 dark:text-slate-100 text-sm uppercase tracking-wider">
                Writing Parameters & Settings
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Define constraints for your AI content engine.</p>
            </div>
            
            <CardContent className="p-6 space-y-5">
              {/* Topic Seed */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">
                  Draft Topic / Seed Title
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      setSelectedSourceType('custom');
                    }}
                    placeholder="Select a trending news article, social issue, or type a custom topic here..."
                    className="h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950"
                  />
                  {selectedTopic && (
                    <Button 
                      onClick={() => { setSelectedTopic(''); setSelectedSourceType('custom'); }}
                      variant="outline"
                      className="h-10 w-10 p-0 rounded-xl hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Verified Facts badge indicator */}
              <div className="flex items-center justify-between py-1 px-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-805 rounded-xl text-xs">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-605" /> Injected Research Facts
                </span>
                <Badge className="bg-teal-500/10 text-teal-655 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 font-black text-[9px] rounded-full px-2 py-0.5">
                  {selectedFacts.length} Facts Selected
                </Badge>
              </div>

              {/* Tone & Audience Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">
                    Writing Tone
                  </label>
                  <select 
                    value={writingTone}
                    onChange={(e) => setWritingTone(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Calculated & Math-Centric">Calculated & Math-Centric (GEO favorite)</option>
                    <option value="Urgent & Insightful">Urgent & Insightful (Trend matching)</option>
                    <option value="Technical & Educational">Technical & Educational (EEAT builder)</option>
                    <option value="Friendly & Professional">Friendly & Professional (General homeowner)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">
                    Target Audience
                  </label>
                  <select 
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Homeowners & Residents">Homeowners & Residents</option>
                    <option value="Commercial & Business Owners">Commercial & Business Owners</option>
                    <option value="Solar Installers & Contractors">Solar Installers & Contractors</option>
                    <option value="General Public / Energy Decoders">General Public / Energy Decoders</option>
                  </select>
                </div>
              </div>

              {/* Conversion Widget & CTA Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">
                    Embedded Interactive Widget
                  </label>
                  <select 
                    value={widgetType}
                    onChange={(e) => setWidgetType(e.target.value as any)}
                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="roi-calculator">5kVA Solar ROI Modeler Widget</option>
                    <option value="grid-vs-solar">Grid vs Solar cost Comparator</option>
                    <option value="compliance-checklist">LSEB Compliance Checklist Auditor</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">
                    Conversion CTA
                  </label>
                  <select 
                    value={targetCTA}
                    onChange={(e) => setTargetCTA(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="🏡 Open the Solar Sizer Estimator and calculate your home payback period">🏡 Open Solar Sizer Estimator</option>
                    <option value="⚡ Contact a certified installer for a detailed site structural survey">⚡ Contact Certified Survey Installer</option>
                    <option value="📈 Upgrade your corporate grid connection status to solar hybrid today">📈 Request Commercial Solar ROI proposal</option>
                  </select>
                </div>
              </div>

              {/* Draft button trigger */}
              <div className="pt-2">
                <Button 
                  onClick={handleGenerateArticle}
                  disabled={generatingAI || !selectedTopic.trim()}
                  className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-650 hover:to-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      <span>Gemini is modeling fact-dense SEO copy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                      <span>Draft Article with Gemini AI</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ Editor & Preview Display (Appears once generated) ═══ */}
      {isEditingDraft && draftArticle && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-3xl overflow-hidden mt-8">
          <div className="p-5 border-b border-slate-150 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-855 dark:text-slate-100 text-base uppercase tracking-wider">
                Review and Edit Draft
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tweak generated headings, facts, and structure before publishing.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handlePublishDraft}
                disabled={publishing}
                className="bg-emerald-605 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider h-9 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                <span>Publish Live</span>
              </Button>
              <Button 
                onClick={() => { setDraftArticle(null); setIsEditingDraft(false); }}
                variant="outline"
                className="h-9 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-800"
              >
                Discard
              </Button>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Meta Properties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">SEO Post Title</label>
                <Input 
                  value={draftArticle.title || ''}
                  onChange={(e) => setDraftArticle({ ...draftArticle, title: e.target.value })}
                  className="text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">URL Slug</label>
                <Input 
                  value={draftArticle.slug || ''}
                  onChange={(e) => setDraftArticle({ ...draftArticle, slug: e.target.value })}
                  className="text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Reading Duration</label>
                <Input 
                  value={draftArticle.readTime || ''}
                  onChange={(e) => setDraftArticle({ ...draftArticle, readTime: e.target.value })}
                  className="text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Author</label>
                <Input 
                  value={draftArticle.author || ''}
                  onChange={(e) => setDraftArticle({ ...draftArticle, author: e.target.value })}
                  className="text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Category Tag</label>
                <Input 
                  value={draftArticle.category || ''}
                  onChange={(e) => setDraftArticle({ ...draftArticle, category: e.target.value })}
                  className="text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Industry Pillar</label>
                <select 
                  value={draftArticle.pillar}
                  onChange={(e) => setDraftArticle({ ...draftArticle, pillar: e.target.value as any })}
                  className="w-full h-10 px-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 rounded-xl focus:outline-none"
                >
                  <option value="ROI Math">ROI Math</option>
                  <option value="Sizing & Grid">Sizing & Grid</option>
                  <option value="Battery Tech">Battery Tech</option>
                  <option value="Lagos Compliance">Lagos Compliance</option>
                  <option value="Installer Growth">Installer Growth</option>
                </select>
              </div>
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Search Meta Description (SEO Snippet)</label>
              <Input 
                value={draftArticle.description || ''}
                onChange={(e) => setDraftArticle({ ...draftArticle, description: e.target.value })}
                className="text-xs font-bold rounded-xl"
              />
            </div>

            {/* GEO Quick Answer-First */}
            <div className="space-y-1.5 p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl">
              <label className="text-[10px] font-black uppercase text-teal-655 dark:text-teal-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-teal-500/10" /> GEO Answer-First Quick Take (Top of Post RAG snippet)
              </label>
              <textarea 
                value={draftArticle.answerFirst || ''}
                onChange={(e) => setDraftArticle({ ...draftArticle, answerFirst: e.target.value })}
                rows={3}
                className="w-full p-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed text-slate-800 dark:text-slate-200"
                placeholder="Immediate single-paragraph answer containing stats and math..."
              />
            </div>

            {/* Summary Points */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Key Takeaway Bullet Points</label>
              {(draftArticle.summaryPoints || []).map((point, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Badge className="bg-slate-105 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-400 size-6 p-0 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">
                    {index + 1}
                  </Badge>
                  <Input 
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...(draftArticle.summaryPoints || [])];
                      newPoints[index] = e.target.value;
                      setDraftArticle({ ...draftArticle, summaryPoints: newPoints });
                    }}
                    className="text-xs font-bold rounded-xl"
                  />
                </div>
              ))}
            </div>

            {/* Article Body Sections */}
            <div className="space-y-5">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Main Article Body Sections</label>
              {(draftArticle.sections || []).map((section, sIdx) => (
                <div key={sIdx} className="border border-slate-100 dark:border-slate-805 p-4 rounded-2xl space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Section {sIdx + 1} H2 Header</span>
                    <Button 
                      onClick={() => {
                        const newSections = (draftArticle.sections || []).filter((_, idx) => idx !== sIdx);
                        setDraftArticle({ ...draftArticle, sections: newSections });
                      }}
                      variant="ghost"
                      size="xs"
                      className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7"
                    >
                      Delete Section
                    </Button>
                  </div>
                  
                  <Input 
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...(draftArticle.sections || [])];
                      newSections[sIdx] = { ...section, title: e.target.value };
                      setDraftArticle({ ...draftArticle, sections: newSections });
                    }}
                    placeholder="Section Header Title..."
                    className="text-xs font-black rounded-xl"
                  />

                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400">Paragraph Content</span>
                    {section.content.map((pText, pIdx) => (
                      <textarea 
                        key={pIdx}
                        value={pText}
                        onChange={(e) => {
                          const newSections = [...(draftArticle.sections || [])];
                          const newContent = [...section.content];
                          newContent[pIdx] = e.target.value;
                          newSections[sIdx] = { ...section, content: newContent };
                          setDraftArticle({ ...draftArticle, sections: newSections });
                        }}
                        rows={4}
                        className="w-full p-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none leading-relaxed text-slate-700 dark:text-slate-300"
                        placeholder="Type paragraph text..."
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-start">
                <Button 
                  onClick={() => {
                    const newSections = [...(draftArticle.sections || []), { title: 'New Heading', content: [''] }];
                    setDraftArticle({ ...draftArticle, sections: newSections });
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border-dashed border-teal-500/30 text-teal-605"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Body Section
                </Button>
              </div>
            </div>

            {/* FAQs */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Frequently Asked Questions (FAQPage Rich Result Snippets)</label>
              {(draftArticle.faqs || []).map((faq, fIdx) => (
                <div key={fIdx} className="border border-slate-100 dark:border-slate-805 p-4 rounded-2xl space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">FAQ Item {fIdx + 1}</span>
                    <Button 
                      onClick={() => {
                        const newFaqs = (draftArticle.faqs || []).filter((_, idx) => idx !== fIdx);
                        setDraftArticle({ ...draftArticle, faqs: newFaqs });
                      }}
                      variant="ghost"
                      size="xs"
                      className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7"
                    >
                      Delete FAQ
                    </Button>
                  </div>
                  
                  <Input 
                    value={faq.question}
                    onChange={(e) => {
                      const newFaqs = [...(draftArticle.faqs || [])];
                      newFaqs[fIdx] = { ...faq, question: e.target.value };
                      setDraftArticle({ ...draftArticle, faqs: newFaqs });
                    }}
                    placeholder="FAQ Question?"
                    className="text-xs font-extrabold rounded-xl"
                  />

                  <textarea 
                    value={faq.answer}
                    onChange={(e) => {
                      const newFaqs = [...(draftArticle.faqs || [])];
                      newFaqs[fIdx] = { ...faq, answer: e.target.value };
                      setDraftArticle({ ...draftArticle, faqs: newFaqs });
                    }}
                    rows={2}
                    placeholder="FAQ Answer..."
                    className="w-full p-3 text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none leading-relaxed text-slate-700 dark:text-slate-350"
                  />
                </div>
              ))}

              <div className="flex justify-start">
                <Button 
                  onClick={() => {
                    const newFaqs = [...(draftArticle.faqs || []), { question: 'New Question?', answer: '' }];
                    setDraftArticle({ ...draftArticle, faqs: newFaqs });
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border-dashed border-teal-500/30 text-teal-605"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New FAQ Item
                </Button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-805 flex justify-end gap-2.5">
              <Button 
                onClick={handlePublishDraft}
                disabled={publishing}
                className="bg-emerald-605 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider h-10 rounded-xl px-5 flex items-center gap-2 shadow-sm"
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span>Publish Live to Insights Hub</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
