import * as React from 'react';
import BlogArticleClient from './BlogArticleClient';
import { BLOG_ARTICLES } from '@/lib/blog';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export default function Page({ params }: PageProps) {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-905 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-555 mx-auto"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading article...</p>
        </div>
      </div>
    }>
      <BlogArticlePageContent params={params} />
    </React.Suspense>
  );
}

async function BlogArticlePageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogArticleClient slug={slug} />;
}
