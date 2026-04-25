// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/report', '/strategy', '/grazie'],
    },
    sitemap: 'https://www.tuodominio.it/sitemap.xml',
  };
}