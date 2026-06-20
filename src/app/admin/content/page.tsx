'use client';

import * as React from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Sparkles, 
  Clock, 
  User, 
  Tag, 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  ChevronRight, 
  Info,
  Calendar,
  Save,
  Globe,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BlogArticle } from '@/lib/blog';

export default function AdminContentEditor() {
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentArticle, setCurrentArticle] = React.useState<Partial<BlogArticle> | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [googleToken, setGoogleToken] = React.useState<string | null>(null);
  
  // AI Generator state
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [generatingAI, setGeneratingAI] = React.useState(false);

  React.useEffect(() => {
    fetchArticles();
    const token = localStorage.getItem('google_oauth_token');
    const expiresAt = localStorage.getItem('google_oauth_token_expires_at');
    
    if (token) {
      if (expiresAt && new Date().getTime() > parseInt(expiresAt, 10)) {
        localStorage.removeItem('google_oauth_token');
        localStorage.removeItem('google_oauth_token_expires_at');
        setGoogleToken(null);
      } else {
        setGoogleToken(token);
      }
    }
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/content');
      const data = await resp.json();
      if (data.data) {
        setArticles(data.data);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Failed to load blog database.');
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id';
    const redirectUri = window.location.origin + '/admin/scrapers/callback';
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/generative-language'
    ].join(' ');
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent('/admin/content')}&prompt=consent`;
    window.location.href = oauthUrl;
  };

  const handleEdit = (article: BlogArticle) => {
    setCurrentArticle(JSON.parse(JSON.stringify(article)));
    setIsNew(false);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setCurrentArticle({
      slug: '',
      title: '',
      description: '',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      readTime: '5 min read',
      author: 'SolarQuotePro Editor',
      category: 'Solar ROI',
      pillar: 'ROI Math',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop',
      answerFirst: '',
      summaryPoints: ['', ''],
      sections: [{ title: 'Introduction', content: [''] }],
      faqs: [{ question: '', answer: '' }],
      widgetType: 'roi-calculator',
      schema: {
        headline: '',
        description: '',
        faqList: []
      }
    });
    setIsNew(true);
    setIsEditing(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this article? This will permanently delete the source file content.')) return;
    
    try {
      const resp = await fetch(`/api/admin/content?slug=${slug}`, { method: 'DELETE' });
      const data = await resp.json();
      if (data.success) {
        toast.success('Article deleted successfully.');
        fetchArticles();
      } else {
        toast.error(data.error || 'Failed to delete article.');
      }
    } catch (e) {
      toast.error('Network error deleting article.');
    }
  };

  const handleSave = async () => {
    if (!currentArticle?.title || !currentArticle?.slug) {
      toast.error('Title and Slug are required properties.');
      return;
    }

    // Set schema fields based on title and description
    if (currentArticle.schema) {
      currentArticle.schema.headline = currentArticle.title;
      currentArticle.schema.description = currentArticle.description || '';
      currentArticle.schema.faqList = (currentArticle.faqs || []).map(f => ({ q: f.question, a: f.answer }));
    }

    try {
      const endpoint = '/api/admin/content';
      const method = isNew ? 'POST' : 'PUT';
      const payload = isNew 
        ? { article: currentArticle }
        : { slug: currentArticle.slug, article: currentArticle };

      const resp = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.success) {
        toast.success(isNew ? 'Article published successfully!' : 'Article updated successfully!');
        setIsEditing(false);
        setCurrentArticle(null);
        fetchArticles();
      } else {
        toast.error(data.error || 'Failed to save article.');
      }
    } catch (e) {
      toast.error('Error saving article data.');
    }
  };

  // Direct client-side Gemini generation via user OAuth Token
  const handleGenerateAI = async () => {
    if (!googleToken) {
      toast.error('Google authorization required. Please connect your Google account.');
      return;
    }
    if (!aiPrompt.trim()) {
      toast.error('Please specify a topic or keyword to generate.');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Write a high-quality solar engineering blog post targeted at homeowners or installers in Nigeria. Prompt topic: "${aiPrompt}". Provide structured content matching this JSON layout format. Return ONLY raw JSON data conforming exactly to this structure:
              {
                "title": "Clear ROI-focused article title",
                "slug": "url-friendly-slug",
                "description": "Short search meta description",
                "readTime": "e.g. 5 min read",
                "author": "Engr. Babajide Alao",
                "category": "Solar ROI",
                "pillar": "ROI Math",
                "answerFirst": "Immediate single-paragraph answer answering the core user query containing specific math statistics",
                "summaryPoints": ["Key point 1", "Key point 2", "Key point 3"],
                "sections": [
                  { "title": "Heading 1", "content": ["Paragraph 1 text", "Paragraph 2 text"] }
                ],
                "faqs": [
                  { "question": "FAQ Question 1", "answer": "FAQ Answer 1" }
                ],
                "widgetType": "roi-calculator"
              }`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error('Empty response from Gemini API.');
      }

      const generatedObj = JSON.parse(rawText.trim());
      
      setCurrentArticle({
        ...currentArticle,
        title: generatedObj.title || '',
        slug: generatedObj.slug || '',
        description: generatedObj.description || '',
        readTime: generatedObj.readTime || '5 min read',
        author: generatedObj.author || 'Gemini AI',
        category: generatedObj.category || 'Solar ROI',
        pillar: generatedObj.pillar || 'ROI Math',
        answerFirst: generatedObj.answerFirst || '',
        summaryPoints: generatedObj.summaryPoints || [],
        sections: generatedObj.sections || [{ title: 'Introduction', content: [''] }],
        faqs: generatedObj.faqs || [{ question: '', answer: '' }],
        widgetType: generatedObj.widgetType || 'roi-calculator',
        schema: {
          headline: generatedObj.title || '',
          description: generatedObj.description || '',
          faqList: (generatedObj.faqs || []).map((f: any) => ({ q: f.question, a: f.answer }))
        }
      });

      toast.success('Successfully drafted solar article using Gemini!');
    } catch (e: any) {
      console.error(e);
      toast.error(`Gemini Generation failed: ${e.message || 'Check your Google connection token'}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <FileText className="h-4 w-4 shrink-0" />
            <span>Local Codebase Content Portal</span>
          </div>
          <h1 className="text-3xl font-black text-slate-855 dark:text-slate-50 tracking-tight mt-1">Insights Blog Manager</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Publish SEO-optimized articles, manage structural schema graphs, and draft pieces using Google-authenticated Gemini automation.
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

          {!isEditing && (
            <Button 
              onClick={handleCreateNew}
              size="sm"
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl h-9 border-none shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Article</span>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin text-teal-600" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">Loading static articles catalog...</p>
        </div>
      ) : isEditing && currentArticle ? (
        /* ═══ EDITOR FORM ═══ */
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg rounded-3xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            {/* Editor Top Bar */}
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-805 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-855 dark:text-slate-100 text-base uppercase tracking-wider">
                  {isNew ? 'Draft New Solar Article' : `Editing: ${currentArticle.title}`}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Source file will compile directly to statically served pathways.</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setIsEditing(false); setCurrentArticle(null); }}
                className="h-8 w-8 rounded-lg p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* AI Copilot Section */}
            {googleToken && (
              <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Draft with Gemini AI Assistant</span>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter topic: e.g. How to size an inverter AC on 10kVA solar for a Victoria Island flat"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    disabled={generatingAI}
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold focus:ring-teal-500 flex-grow"
                  />
                  <Button 
                    onClick={handleGenerateAI}
                    disabled={generatingAI || !aiPrompt.trim()}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs h-10 px-5 rounded-xl border-none shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Generate Draft</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Core Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Article Title</label>
                <Input 
                  value={currentArticle.title || ''}
                  onChange={e => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                  placeholder="e.g. Sizing a 5kVA solar system"
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">URL Slug</label>
                <Input 
                  value={currentArticle.slug || ''}
                  onChange={e => setCurrentArticle({ ...currentArticle, slug: e.target.value })}
                  placeholder="e.g. sizing-5kva-solar-system"
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Author Name</label>
                <Input 
                  value={currentArticle.author || ''}
                  onChange={e => setCurrentArticle({ ...currentArticle, author: e.target.value })}
                  placeholder="e.g. Engr. Babajide Alao"
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category Tag</label>
                <Input 
                  value={currentArticle.category || ''}
                  onChange={e => setCurrentArticle({ ...currentArticle, category: e.target.value })}
                  placeholder="e.g. Solar ROI"
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pillar Classification</label>
                <select 
                  value={currentArticle.pillar || 'ROI Math'}
                  onChange={e => setCurrentArticle({ ...currentArticle, pillar: e.target.value as any })}
                  className="h-10 w-full rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {['ROI Math', 'Sizing & Grid', 'Battery Tech', 'Lagos Compliance', 'Installer Growth'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated Reading Time</label>
                <Input 
                  value={currentArticle.readTime || ''}
                  onChange={e => setCurrentArticle({ ...currentArticle, readTime: e.target.value })}
                  placeholder="e.g. 6 min read"
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Meta Search Description</label>
                <Input 
                  value={currentArticle.description || ''}
                  onChange={e => setCurrentArticle({ ...currentArticle, description: e.target.value })}
                  placeholder="A clear mathematical summary of the article contents for search snippet displays."
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Embedded Sizer Widget Option</label>
                <select 
                  value={currentArticle.widgetType || 'roi-calculator'}
                  onChange={e => setCurrentArticle({ ...currentArticle, widgetType: e.target.value as any })}
                  className="h-10 w-full rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="roi-calculator">ROI Payback Calculator</option>
                  <option value="grid-vs-solar">Grid vs Solar LCOE Analyzer</option>
                  <option value="compliance-checklist">LSEB Structural Checklist</option>
                </select>
              </div>
            </div>

            {/* Answer First Paragraph */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                <span>Executive Sizer Answer-First (Highlighted Summary Box)</span>
              </label>
              <textarea 
                rows={3}
                value={currentArticle.answerFirst || ''}
                onChange={e => setCurrentArticle({ ...currentArticle, answerFirst: e.target.value })}
                placeholder="Specify the direct, single-paragraph response that immediately addresses the article search intent."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Summary Bullet Points */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highlights Bullet Array</label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentArticle({ ...currentArticle, summaryPoints: [...(currentArticle.summaryPoints || []), ''] })}
                  className="h-7 rounded-lg text-[10px] font-extrabold uppercase px-2 bg-transparent cursor-pointer"
                >
                  + Add Bullet
                </Button>
              </div>
              <div className="space-y-2">
                {(currentArticle.summaryPoints || []).map((pt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                    <Input 
                      value={pt}
                      onChange={e => {
                        const copy = [...(currentArticle.summaryPoints || [])];
                        copy[idx] = e.target.value;
                        setCurrentArticle({ ...currentArticle, summaryPoints: copy });
                      }}
                      placeholder="Highlight point text"
                      className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-950 flex-grow"
                    />
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const copy = [...(currentArticle.summaryPoints || [])];
                        copy.splice(idx, 1);
                        setCurrentArticle({ ...currentArticle, summaryPoints: copy });
                      }}
                      className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Body Sections */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-850">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550">Article Core Body Sections</label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentArticle({ ...currentArticle, sections: [...(currentArticle.sections || []), { title: '', content: [''] }] })}
                  className="h-8 rounded-xl text-[10px] font-extrabold uppercase px-3 bg-transparent cursor-pointer"
                >
                  + Add Section Block
                </Button>
              </div>

              <div className="space-y-6">
                {(currentArticle.sections || []).map((sec, secIdx) => (
                  <div key={secIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-805 space-y-3 relative">
                    <div className="absolute right-3 top-3 flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const copy = JSON.parse(JSON.stringify(currentArticle.sections || []));
                          copy[secIdx].content.push('');
                          setCurrentArticle({ ...currentArticle, sections: copy });
                        }}
                        className="h-7 text-[9px] font-bold px-2 rounded-lg bg-transparent cursor-pointer"
                      >
                        + Add Paragraph
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          const copy = [...(currentArticle.sections || [])];
                          copy.splice(secIdx, 1);
                          setCurrentArticle({ ...currentArticle, sections: copy });
                        }}
                        className="h-7 text-rose-500 hover:bg-rose-500/10 px-2 rounded-lg"
                      >
                        Delete Block
                      </Button>
                    </div>

                    <div className="space-y-1.5 max-w-[70%]">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section Title</label>
                      <Input 
                        value={sec.title}
                        onChange={e => {
                          const copy = JSON.parse(JSON.stringify(currentArticle.sections || []));
                          copy[secIdx].title = e.target.value;
                          setCurrentArticle({ ...currentArticle, sections: copy });
                        }}
                        placeholder="e.g. Step 1: Evaluating the load profile"
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {sec.content.map((para, paraIdx) => (
                        <div key={paraIdx} className="flex gap-2 items-start">
                          <span className="text-[10px] font-mono text-slate-400 pt-3">P{paraIdx + 1}</span>
                          <textarea 
                            rows={3}
                            value={para}
                            onChange={e => {
                              const copy = JSON.parse(JSON.stringify(currentArticle.sections || []));
                              copy[secIdx].content[paraIdx] = e.target.value;
                              setCurrentArticle({ ...currentArticle, sections: copy });
                            }}
                            placeholder="Type paragraph content here..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-teal-500"
                          />
                          <Button 
                            variant="ghost"
                            onClick={() => {
                              const copy = JSON.parse(JSON.stringify(currentArticle.sections || []));
                              copy[secIdx].content.splice(paraIdx, 1);
                              setCurrentArticle({ ...currentArticle, sections: copy });
                            }}
                            className="h-9 w-9 p-0 text-slate-400 hover:text-rose-500 shrink-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550">Schema FAQ Accordions</label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentArticle({ ...currentArticle, faqs: [...(currentArticle.faqs || []), { question: '', answer: '' }] })}
                  className="h-8 rounded-xl text-[10px] font-extrabold uppercase px-3 bg-transparent cursor-pointer"
                >
                  + Add FAQ
                </Button>
              </div>

              <div className="space-y-4">
                {(currentArticle.faqs || []).map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-805 space-y-3 relative">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const copy = [...(currentArticle.faqs || [])];
                        copy.splice(idx, 1);
                        setCurrentArticle({ ...currentArticle, faqs: copy });
                      }}
                      className="absolute right-3 top-3 h-8 text-xs text-rose-500 hover:bg-rose-500/10 px-2 rounded-lg"
                    >
                      Delete
                    </Button>
                    
                    <div className="space-y-1.5 max-w-[80%]">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Question Text</label>
                      <Input 
                        value={faq.question}
                        onChange={e => {
                          const copy = JSON.parse(JSON.stringify(currentArticle.faqs || []));
                          copy[idx].question = e.target.value;
                          setCurrentArticle({ ...currentArticle, faqs: copy });
                        }}
                        placeholder="e.g. How long does standard installation take?"
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Answer Text</label>
                      <textarea 
                        rows={2}
                        value={faq.answer}
                        onChange={e => {
                          const copy = JSON.parse(JSON.stringify(currentArticle.faqs || []));
                          copy[idx].answer = e.target.value;
                          setCurrentArticle({ ...currentArticle, faqs: copy });
                        }}
                        placeholder="Provide the detailed response..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setIsEditing(false); setCurrentArticle(null); }}
                className="h-10 rounded-xl text-xs font-bold px-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-650 hover:to-emerald-700 text-white font-extrabold text-xs h-10 px-6 rounded-xl shadow-md border-none flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="h-4.5 w-4.5" />
                <span>Publish Article</span>
              </Button>
            </div>

          </CardContent>
        </Card>
      ) : (
        /* ═══ ARTICLES LIST CATALOG ═══ */
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => (
              <Card key={art.slug} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                    <div>
                      <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md">
                        {art.pillar}
                      </Badge>
                      <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm tracking-tight mt-1.5 leading-snug line-clamp-1">
                        {art.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0 pt-0.5">{art.date}</span>
                  </div>

                  <p className="text-xs text-slate-550 leading-relaxed font-semibold line-clamp-2">
                    {art.description}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{art.readTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{art.author}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>{art.category}</span>
                    </span>
                  </div>
                </CardContent>

                <div className="p-5 pt-0 border-t border-slate-50 dark:border-slate-850/40 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center gap-3">
                  <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-[9px] font-mono tracking-wider text-slate-400 px-2 py-0.5 rounded-md">
                    /{art.slug}
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(art)}
                      className="h-8 w-8 p-0 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:text-teal-650 cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(art.slug)}
                      className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-550/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {articles.length === 0 && (
            <Card className="border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl py-12 flex flex-col items-center justify-center gap-2.5">
              <FileText className="h-8 w-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-500">No blog posts found in current repository JSON database.</p>
              <Button size="sm" onClick={handleCreateNew} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold mt-2">
                Create First Article
              </Button>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
