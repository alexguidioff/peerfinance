import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Building2, TrendingUp, Home, BarChart3, MapPin, ArrowRight, Info } from 'lucide-react';
import SearchImmobiliare from '@/components/SearchImmobiliare';

// Città in evidenza — nomi esatti come nel DB (case-insensitive via ilike)
const FEATURED_COMUNI = [
  'Milano', 'Roma', 'Bologna', 'Napoli', 'Torino',
  'Firenze', 'Venezia', 'Palermo', 'Genova', 'Bari',
  'Verona', 'Catania',
];

type CityCard = {
  comune: string;
  comune_slug: string;
  rendimento: number;
  prezzoMedio: number;
  affittoMedio: number;
};

export default async function ImmobiliareHub() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Query con comune_slug — ilike case-insensitive, niente filtri manuali
  const { data: rows } = await supabase
    .from('omi_quotazioni')
    .select('comune, comune_slug, vendita_min, vendita_max, affitto_min, affitto_max')
    .in(
      'comune_slug',
      FEATURED_COMUNI.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''))
    )
    .ilike('tipologia', '%abitazion%');

  // Aggrega per comune: media vendita e affitto, calcola rendimento lordo
  const byComune: Record<string, { comune: string; comune_slug: string; vendita: number; affitto: number; count: number }> = {};

  for (const r of rows || []) {
    const slug = r.comune_slug;
    if (!byComune[slug]) {
      byComune[slug] = { comune: r.comune, comune_slug: slug, vendita: 0, affitto: 0, count: 0 };
    }
    byComune[slug].vendita += (r.vendita_min + r.vendita_max) / 2;
    byComune[slug].affitto += (r.affitto_min + r.affitto_max) / 2;
    byComune[slug].count++;
  }

  const displayCities: CityCard[] = Object.values(byComune)
    .map((c) => ({
      comune: c.comune,
      comune_slug: c.comune_slug,
      prezzoMedio: c.vendita / c.count,
      affittoMedio: c.affitto / c.count,
      rendimento: ((c.affitto / c.count) * 12) / (c.vendita / c.count) * 100,
    }))
    .sort((a, b) => b.rendimento - a.rendimento);

  // Medie nazionali per il banner statistiche
  const { data: statsRows } = await supabase
    .from('omi_quotazioni')
    .select('vendita_min, vendita_max, affitto_min, affitto_max')
    .ilike('tipologia', '%abitazion%')
    .limit(2000);

  let mediaVenditaNaz = 0;
  let mediaAffittoNaz = 0;
  if (statsRows && statsRows.length > 0) {
    mediaVenditaNaz = statsRows.reduce((s, r) => s + (r.vendita_min + r.vendita_max) / 2, 0) / statsRows.length;
    mediaAffittoNaz = statsRows.reduce((s, r) => s + (r.affitto_min + r.affitto_max) / 2, 0) / statsRows.length;
  }
  const rendimentoNaz = mediaVenditaNaz > 0
    ? (mediaAffittoNaz * 12) / mediaVenditaNaz * 100
    : 0;

  const fmt = (n: number) =>
    '€' + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Gradiente hero */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/5 via-background to-background -z-10 h-[60vh]" />

      <div className="max-w-5xl mx-auto px-4 pt-16 space-y-20">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
            <BarChart3 className="w-3.5 h-3.5" />
            Dati OMI · Agenzia delle Entrate · 2025H2
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Investimento{' '}
            <span className="text-blue-600">Immobiliare</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Prezzi di vendita e affitto per ogni comune italiano, direttamente
            dai dati ufficiali OMI. Calcola il rendimento lordo prima di investire.
          </p>
        </section>

        {/* ── Search ───────────────────────────────────────────── */}
        <section>
          <SearchImmobiliare />
        </section>

        {/* ── Statistiche nazionali ────────────────────────────── */}
        {mediaVenditaNaz > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Media nazionale (abitazioni)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border rounded-2xl p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Prezzo Acquisto
                </p>
                <p className="text-3xl font-black">{fmt(mediaVenditaNaz)}</p>
                <p className="text-xs text-muted-foreground mt-1">/mq medio</p>
              </div>
              <div className="bg-card border rounded-2xl p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-primary" /> Affitto
                </p>
                <p className="text-3xl font-black">{fmt(mediaAffittoNaz)}</p>
                <p className="text-xs text-muted-foreground mt-1">/mq/mese medio</p>
              </div>
              <div className="bg-slate-900 text-white border rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rendimento Lordo
                </p>
                <p className="text-3xl font-black text-emerald-400 relative z-10">
                  {rendimentoNaz.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-400 mt-1 relative z-10">annuo lordo medio</p>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
              <Info className="w-3 h-3" />
              Rendimento lordo = (affitto mensile × 12) / prezzo acquisto. Non include spese, tasse o vacancy.
            </p>
          </section>
        )}

        {/* ── Città in evidenza ────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Città principali
            </h2>
            <p className="text-sm text-muted-foreground">
              Ordinate per rendimento ↓
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCities.map((city) => {
              const isTopYield = city.rendimento >= displayCities[0].rendimento * 0.9;
              return (
                <Link
                  href={`/immobiliare/${city.comune_slug}`}
                  key={city.comune_slug}
                  className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-primary/40 transition-all hover:-translate-y-0.5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                      <Home className="w-5 h-5" />
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                        isTopYield
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      {city.rendimento.toFixed(1)}%
                    </div>
                  </div>

                  {/* Nome */}
                  <h3 className="text-2xl font-black capitalize mb-4">{city.comune}</h3>

                  {/* Dati sintetici */}
                  <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Acquisto
                      </p>
                      <p className="font-bold">{fmt(city.prezzoMedio)}<span className="text-xs text-muted-foreground font-normal">/mq</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Affitto
                      </p>
                      <p className="font-bold">
                        {city.affittoMedio.toLocaleString('it-IT', { maximumFractionDigits: 1 })}
                        <span className="text-xs text-muted-foreground font-normal">€/mq</span>
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-1 mt-4 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Vedi analisi completa <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────── */}
        <section className="border-t border-border pt-8">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            I dati provengono dalle quotazioni OMI (Osservatorio del Mercato Immobiliare)
            dell'Agenzia delle Entrate, semestre 2025H2. I rendimenti sono calcolati al lordo
            di imposte, spese condominiali, vacancy e commissioni. Non costituiscono
            consulenza finanziaria o d'investimento.
          </p>
        </section>

      </div>
    </main>
  );
}
