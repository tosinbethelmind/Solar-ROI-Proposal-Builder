'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { CopyrightYear } from '@/components/ui/CopyrightYear';
import {
  BookOpen,
  Clock,
  User,
  ArrowRight,
  Zap,
  Search,
  ListFilter,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Coins,
  TrendingUp,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { BlogArticle } from '@/lib/blog';

export default function BlogHubPage() {
  const [selectedPillar, setSelectedPillar] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);

  // Fetch articles from the admin content API on mount
  React.useEffect(() => {
    async function loadArticles() {
      try {
        const res = await fetch('/api/admin/content');
        const json = await res.json();
        if (json.data) {
          setArticles(json.data);
        } else {
          console.error('Failed to load articles', json.error);
        }
      } catch (e) {
        console.error('Error fetching articles', e);
      }
    }
    loadArticles();
  }, []);

  // Interactive Slider State (₦ Generator Displacement Calculator)
  const [genSpend, setGenSpend] = React.useState<number>(150000);
  const [gridBill, setGridBill] = React.useState<number>(45000);

  const pillars = [
    { id: 'All', label: 'All Insights' },
    { id: 'ROI Math', label: '📊 ROI & Generator Displacement' },
    { id: 'Sizing & Grid', label: '⚡ Sizing & Band A Tariffs' },
    { id: 'Battery Tech', label: '🔋 Battery Lifecycles' },
    { id: 'Lagos Compliance', label: '📜 Lagos Permitting & Codes' },
    { id: 'Installer Growth', label: '💼 Business & Sales Growth' }
  ];

  // Dynamic Pillar Article Counts
  const getPillarCount = React.useCallback((pillarId: string) => {
    if (pillarId === 'All') return articles.length;
    return articles.filter(a => a.pillar === pillarId).length;
  }, [articles]);

  const filteredArticles = React.useMemo(() => {
    return articles.filter((article) => {
      const matchesPillar = selectedPillar === 'All' || article.pillar === selectedPillar;
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPillar && matchesSearch;
    });
  }, [articles, selectedPillar, searchQuery]);

  // Derived Interactive Savings Metrics
  const calculatedMonthlySavings = Math.round(genSpend * 0.95 + gridBill * 0.55);
  const estimatedPaybackMonths = calculatedMonthlySavings > 0 ? Math.round(4800000 / calculatedMonthlySavings) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarPro</span>
            <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shrink-0">Insights</Badge>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/estimator">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-655 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800">
                🏡 Sizer Estimator
              </Button>
            </Link>
            <Link href="/workspace">
              <Button variant="outline" size="sm" className="text-xs font-bold border-teal-500/20 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl">
                Open Installer Workspace
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Hero Title */}
        <section className="text-center">
          <h1 className="text-4xl font-extrabold mb-4">SolarPro Insights Hub</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Stay ahead with data‑driven solar calculations, industry updates, and actionable guides.
          </p>
        </section>
        {/* Pillar Filters */}
        <section className="flex flex-wrap gap-2 justify-center">
          {pillars.map(p => (
            <Button
              key={p.id}
              variant={selectedPillar === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPillar(p.id)}
            >
              {p.label} ({getPillarCount(p.id)})
            </Button>
          ))}
        </section>
        {/* Search Bar */}
        <section className="flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-teal-500"
            />
          </div>
        </section>
        {/* Articles Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <Card key={article.slug} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <img src={article.image} alt={article.title} className="w-full h-40 object-cover rounded-md mb-3" />
                <h3 className="font-bold text-lg mb-1">{article.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{article.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{article.date}</span>
                  <Badge variant="secondary">{article.pillar}</Badge>
                </div>
                <Link href={`/blog/${article.slug}`}>
                  <Button variant="link" className="mt-2 p-0 text-teal-600 hover:underline">
                    Read more <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>
        {/* Savings Calculator (demo) */}
        <section className="bg-teal-50 dark:bg-teal-950 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Generator Displacement Savings (Demo)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Generator Spend (₦)</label>
              <input
                type="range"
                min={50000}
                max={300000}
                step={1000}
                value={genSpend}
                onChange={e => setGenSpend(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-center mt-1">{genSpend.toLocaleString()}</div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Grid Bill (₦)</label>
              <input
                type="range"
                min={20000}
                max={100000}
                step={500}
                value={gridBill}
                onChange={e => setGridBill(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-center mt-1">{gridBill.toLocaleString()}</div>
            </div>
          </div>
          <p className="mt-4 text-sm">
            Estimated monthly savings: <strong>₦{calculatedMonthlySavings.toLocaleString()}</strong>
            <br />
            Approx. payback period: <strong>{estimatedPaybackMonths} months</strong>
          </p>
        </section>
      </main>
      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © <CopyrightYear /> SolarPro Insights. All rights reserved.
      </footer>
    </div>
  );
}
