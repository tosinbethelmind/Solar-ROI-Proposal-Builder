import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';
import fs from 'fs';
import path from 'path';
import { BlogArticle } from '@/lib/blog';

const getJsonPath = () => {
  return path.join(process.cwd(), 'src', 'utils', 'blogArticles.json');
};

const readArticles = (): BlogArticle[] => {
  const filePath = getJsonPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as BlogArticle[];
};

const writeArticles = (articles: BlogArticle[]) => {
  const filePath = getJsonPath();
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(articles, null, 2), 'utf-8');
};

// GET: Return all articles
export async function GET() {
  try {
    const articles = readArticles();
    return NextResponse.json({ data: articles });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to read articles: ${err.message}` }, { status: 500 });
  }
}

// POST: Add new article
export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 });
  }

  try {
    const body = await request.json();
    const newArticle: BlogArticle = body.article;

    if (!newArticle || !newArticle.slug || !newArticle.title) {
      return NextResponse.json({ error: 'Slug and Title are required' }, { status: 400 });
    }

    const articles = readArticles();
    const exists = articles.some(a => a.slug === newArticle.slug);
    if (exists) {
      return NextResponse.json({ error: `Article with slug "${newArticle.slug}" already exists` }, { status: 400 });
    }

    // Default dates and structural properties if not provided
    if (!newArticle.date) {
      newArticle.date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (!newArticle.image) {
      newArticle.image = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=800&auto=format&fit=crop';
    }

    articles.unshift(newArticle); // Insert at the beginning of the list
    writeArticles(articles);

    return NextResponse.json({ success: true, data: newArticle });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to add article: ${err.message}` }, { status: 500 });
  }
}

// PUT: Update existing article
export async function PUT(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 });
  }

  try {
    const body = await request.json();
    const updatedArticle: BlogArticle = body.article;
    const targetSlug: string = body.slug;

    if (!targetSlug || !updatedArticle || !updatedArticle.slug) {
      return NextResponse.json({ error: 'Target slug and updated article payload are required' }, { status: 400 });
    }

    let articles = readArticles();
    const index = articles.findIndex(a => a.slug === targetSlug);
    if (index === -1) {
      return NextResponse.json({ error: `Article with slug "${targetSlug}" not found` }, { status: 404 });
    }

    // Check if new slug conflicts with another article
    if (updatedArticle.slug !== targetSlug) {
      const slugConflict = articles.some((a, idx) => idx !== index && a.slug === updatedArticle.slug);
      if (slugConflict) {
        return NextResponse.json({ error: `Slug "${updatedArticle.slug}" is already used by another article` }, { status: 400 });
      }
    }

    // Preserve original date if not provided
    if (!updatedArticle.date) {
      updatedArticle.date = articles[index].date;
    }

    articles[index] = { ...articles[index], ...updatedArticle };
    writeArticles(articles);

    return NextResponse.json({ success: true, data: updatedArticle });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to update article: ${err.message}` }, { status: 500 });
  }
}

// DELETE: Remove article
export async function DELETE(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Article slug query parameter is required' }, { status: 400 });
    }

    let articles = readArticles();
    const index = articles.findIndex(a => a.slug === slug);
    if (index === -1) {
      return NextResponse.json({ error: `Article with slug "${slug}" not found` }, { status: 404 });
    }

    articles.splice(index, 1);
    writeArticles(articles);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to delete article: ${err.message}` }, { status: 500 });
  }
}
