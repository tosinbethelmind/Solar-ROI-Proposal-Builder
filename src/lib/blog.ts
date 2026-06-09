import articlesJson from '@/utils/blogArticles.json';

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  pillar: 'ROI Math' | 'Sizing & Grid' | 'Battery Tech' | 'Lagos Compliance' | 'Installer Growth';
  image: string;
  answerFirst: string;
  summaryPoints: string[];
  sections: {
    title: string;
    content: string[];
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  widgetType: 'roi-calculator' | 'grid-vs-solar' | 'compliance-checklist';
  schema: {
    headline: string;
    description: string;
    faqList: { q: string; a: string }[];
  };
}

export const BLOG_ARTICLES = articlesJson as BlogArticle[];
