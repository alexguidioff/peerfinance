// app/sitemap.ts
// app/sitemap.ts
export const revalidate = 86400; // cache 24h

import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://peerfinance.vercel.app'; // ← cambia con il tuo dominio

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ── Route statiche ────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/redditi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/redditi/mappa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/immobiliare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/immobiliare/mappaimmobiliare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/demografia`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/demografia/piramide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/score`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // /report, /strategy, /grazie escluse — sono pagine post-form,
    // non ha senso indicizzarle sui motori di ricerca
  ];

  // ── Route dinamiche: /redditi/[comune] ───────────────────────────────────
  const { data: comuniRedditi } = await supabase
    .from('mef_redditi_comuni')
    .select('comune_slug')
    .not('comune_slug', 'is', null);

  const redditiRoutes: MetadataRoute.Sitemap = (comuniRedditi || []).map((r) => ({
    url: `${BASE_URL}/redditi/${r.comune_slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  // ── Route dinamiche: /immobiliare/[comune] ───────────────────────────────
  const { data: comuniImmobiliare } = await supabase
    .from('omi_quotazioni')
    .select('comune_slug')
    .not('comune_slug', 'is', null);

  // Deduplica — omi_quotazioni ha più righe per comune
  const slugsImmobiliare = [...new Set((comuniImmobiliare || []).map((r) => r.comune_slug))];

  const immobiliareRoutes: MetadataRoute.Sitemap = slugsImmobiliare.map((slug) => ({
    url: `${BASE_URL}/immobiliare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  // ── Route dinamiche: /demografia/[eta] ───────────────────────────────────
  // Le fasce età sono statiche — non vengono dal DB
  const fasceEta = ['15-24', '25-34', '35-44', '45-54', '55-64', 'oltre-64'];

  const demografiaRoutes: MetadataRoute.Sitemap = fasceEta.map((eta) => ({
    url: `${BASE_URL}/demografia/${eta}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...redditiRoutes,
    ...immobiliareRoutes,
    ...demografiaRoutes,
  ];
}