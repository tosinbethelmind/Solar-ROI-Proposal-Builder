import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/history/', '/workspace/settings'],
    },
    sitemap: 'https://solarquotepro.ng/sitemap.xml',
  };
}
