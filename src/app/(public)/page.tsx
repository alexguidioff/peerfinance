// app/page.tsx
import { createClient } from '@supabase/supabase-js';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Statistiche nazionali — campione dal DB
  const [{ data: mefRows }, { data: shiwRows }, { data: shiwAffitto }] = await Promise.all([
    supabase
      .from('mef_redditi_comuni')
      .select('reddito_medio_euro')
      .limit(2000),
    supabase
      .from('shiw_benchmarks')
      .select('debito_medio, attivita_finanziarie')
      .eq('tipo_categoria', 'eta'),
    supabase
      .from('shiw_benchmarks')
      .select('perc_affitto')
      .eq('tipo_categoria', 'eta'),
  ]);

  // Reddito medio nazionale
  const mediaReddito = mefRows && mefRows.length > 0
    ? mefRows.reduce((s, r) => s + Number(r.reddito_medio_euro), 0) / mefRows.length
    : 26000;

  // Debito medio nazionale (media delle fasce età)
  const mediaDebito = shiwRows && shiwRows.length > 0
    ? shiwRows.reduce((s, r) => s + Number(r.debito_medio), 0) / shiwRows.length
    : 54000;

  // % in affitto (media fasce età)
  const mediaAffitto = shiwAffitto && shiwAffitto.length > 0
    ? shiwAffitto.reduce((s, r) => s + Number(r.perc_affitto), 0) / shiwAffitto.length
    : 22;

  // Risparmio medio ISTAT ~10%
  const mediaRisparmio = 10.3;

  const stats = {
    mediaReddito: Math.round(mediaReddito),
    mediaDebito: Math.round(mediaDebito),
    mediaAffitto: Math.round(mediaAffitto * 10) / 10,
    mediaRisparmio,
  };

  return <HomeClient stats={stats} />;
}