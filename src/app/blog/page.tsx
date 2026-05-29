'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { BLOG_ARTICLES } from '@/lib/blog';
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowRight, 
  Zap, 
  Search, 
  ListFilter 
} from 'lucide-react';

export default function BlogHubPage() {
  const [selectedPillar, setSelectedPillar] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const pillars = ['All', 'ROI Math', 'Sizing & Grid', 'Battery Tech', 'Lagos Compliance', 'Installer Growth'];

  const filteredArticles = React.useMemo(() => {
    return BLOG_ARTICLES.filter((article) => {
      const matchesPillar = selectedPillar === 'All' || article.pillar === selectedPillar;
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPillar && matchesSearch;
    });
  }, [selectedPillar, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
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

      {/* ═══ Main content ═══ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* ═══ Hero Title ═══ */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-500/15 to-emerald-500/15 text-teal-650 dark:text-teal-400 border border-teal-500/10 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> SolarPro Energy Insights
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-850 dark:text-slate-50 leading-tight">
            Nigerian Solar Economics &amp; Tech Sizing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
            Clear, data-driven mathematical breakdowns of generator fuel costs, electricity tariffs, lithium life cycle economics, and Lagos mounting compliance guidelines.
          </p>
        </section>

        {/* ═══ Search & Category Filters ═══ */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 dark:text-slate-350"
            />
          </div>

          {/* Pillars filter buttons */}
          <div className="flex flex-wrap gap-1.5 items-center justify-center md:justify-end w-full md:w-auto">
            <ListFilter className="w-4 h-4 text-slate-400 mr-1.5 hidden sm:inline" />
            {pillars.map((pillar) => (
              <button
                key={pillar}
                onClick={() => setSelectedPillar(pillar)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  selectedPillar === pillar
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {pillar}
              </button>
            ))}
          </div>
        </section>

        {/* ═══ Articles Grid ═══ */}
        <section>
          {filteredArticles.length === 0 ? (
            <Card className="border-dashed border-slate-250 dark:border-slate-850 py-16 text-center">
              <CardContent className="space-y-3">
                <span className="text-3xl block">🔍</span>
                <h3 className="text-base font-bold">No articles match your query</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try checking another category pillar or refining your search parameters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card 
                  key={article.slug} 
                  className="group relative overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between rounded-3xl"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header items */}
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                      <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/10 rounded-full font-extrabold text-[9px] px-2 py-0.5">
                        {article.pillar}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {article.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <Link href={`/blog/${article.slug}`}>
                      <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-50 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                      {article.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-550 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-450" /> {article.author}
                    </div>

                    <Link href={`/blog/${article.slug}`}>
                      <Button variant="ghost" size="sm" className="text-xs font-black text-teal-650 group-hover:bg-teal-500/10 rounded-xl flex items-center gap-1">
                        Read Breakdown <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ═══ Large Public Estimator Promo ═══ */}
        <section className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white shadow-lg p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3 relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-350 border border-teal-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> High-Accuracy Solar Sizer
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Size Your Power and Estimate Monthly Fuel Savings Instantly
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              Put the ROI math of our insights team to work on your specific appliances. Define your residential appliances, grid blackout frequency, and monthly petrol budget to get a detailed specification sheet.
            </p>
          </div>
          <Link href="/estimator" className="relative z-10 shrink-0">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-750 text-white rounded-2xl font-black text-sm px-6 h-12 shadow-md flex items-center gap-2">
              🏡 Launch Free Client Sizer <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 bg-white dark:bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-700 dark:text-slate-300">SolarPro Insights</span>
            <span>·</span>
            <Link href="/" className="hover:text-slate-650">Home</Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-slate-650">Insights</Link>
            <span>·</span>
            <Link href="/estimator" className="hover:text-slate-650">Sizer</Link>
          </div>
          <p>© {new Date().getFullYear()} SolarPro. Dedicated to Nigerian energy independence.</p>
        </div>
      </footer>
    </div>
  );
}
