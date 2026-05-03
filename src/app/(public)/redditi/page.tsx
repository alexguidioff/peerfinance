import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Users,
  MapPin,
  ArrowRight,
  HandCoins,
  Map,
  Trophy,
} from 'lucide-react';
import SearchRedditi from '@/components/SearchRedditi';

// Mapping comune_slug → macro-area per il calcolo Nord/Centro/Sud
// Usiamo sigla_provincia come proxy più affidabile
const NORD_PROVINCE = new Set([
  'TO','VC','NO','CN','AT','AL','BI','VB',       // Piemonte
  'AO',                                           // Valle d'Aosta
  'GE','SV','IM','SP',                           // Liguria
  'MI','BG','BS','CO','CR','LC','LO','MN','MB','PV','SO','VA', // Lombardia
  'BZ','TN',                                     // Trentino
  'VR','VI','BL','TV','VE','PD','RO',            // Veneto
  'UD','GO','TS','PN',                           // FVG
  'BO','FE','FC','MO','PR','PC','RA','RE','RN',  // Emilia
]);
const CENTRO_PROVINCE = new Set([
  'FI','AR','GR','LI','LU','MS','PI','PT','PO','SI', // Toscana
  'PG','TR',                                          // Umbria
  'AN','AP','FM','MC','PU',                          // Marche
  'RM','FR','LT','RI','VT',                          // Lazio
]);
// tutto il resto = Sud + Isole

function getMacroArea(sigla: string): 'Nord' | 'Centro' | 'Sud' {
  if (NORD_PROVINCE.has(sigla)) return 'Nord';
  if (CENTRO_PROVINCE.has(sigla)) return 'Centro';
  return 'Sud';
}

export default async function RedditiHub() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Top 10 comuni per reddito — reali, non hardcoded
  const { data: top10 } = await supabase
    .from('mef_redditi_comuni')
    .select('comune, comune_slug, reddito_medio_euro, num_contribuenti, sigla_provincia')
    .order('reddito_medio_euro', { ascending: false })
    .limit(10);

  // Campione per statistiche nazionali e gap
  const { data: statsRows } = await supabase
    .from('mef_redditi_comuni')
    .select('reddito_medio_euro, imposta_netta_ammontare, imposta_netta_freq, sigla_provincia')
    .limit(3000);

  let mediaRedditoNaz = 0;
  let mediaIrpefNaz = 0;
  let mediaNord = 0;
  let mediaSud = 0;
  let gapNordSud = 0;

  if (statsRows && statsRows.length > 0) {
    // Media nazionale
    mediaRedditoNaz =
      statsRows.reduce((s, r) => s + Number(r.reddito_medio_euro), 0) / statsRows.length;

    // IRPEF media
    const totImposta = statsRows.reduce((s, r) => s + (r.imposta_netta_ammontare || 0), 0);
    const totFreq = statsRows.reduce((s, r) => s + (r.imposta_netta_freq || 1), 0);
    mediaIrpefNaz = totImposta / totFreq;

    // Gap Nord-Sud reale
    const rowsNord = statsRows.filter((r) => getMacroArea(r.sigla_provincia) === 'Nord');
    const rowsSud  = statsRows.filter((r) => getMacroArea(r.sigla_provincia) === 'Sud');
    mediaNord = rowsNord.length > 0
      ? rowsNord.reduce((s, r) => s + Number(r.reddito_medio_euro), 0) / rowsNord.length
      : 0;
    mediaSud = rowsSud.length > 0
      ? rowsSud.reduce((s, r) => s + Number(r.reddito_medio_euro), 0) / rowsSud.length
      : 0;
    gapNordSud = mediaSud > 0 ? ((mediaNord - mediaSud) / mediaSud) * 100 : 0;
  }

  // Top comune per macro-area
  const topPerArea: Record<string, NonNullable<typeof top10>[0]> = {};
  if (statsRows) {
    // Prendiamo top 500 per trovare il miglior comune per area
    const { data: top500 } = await supabase
      .from('mef_redditi_comuni')
      .select('comune, comune_slug, reddito_medio_euro, sigla_provincia')
      .order('reddito_medio_euro', { ascending: false })
      .limit(500);

    for (const r of top500 || []) {
      const area = getMacroArea(r.sigla_provincia);
      if (!topPerArea[area]) topPerArea[area] = r as any;
    }
  }

  const fmt = (n: number) =>
    '€' + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });

  const diffVsNaz = (reddito: number) => {
    if (!mediaRedditoNaz) return null;
    const pct = ((reddito - mediaRedditoNaz) / mediaRedditoNaz) * 100;
    return pct;
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/5 via-background to-background -z-10 h-[60vh]" />

      <div className="max-w-5xl mx-auto px-4 pt-16 space-y-20">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
            <HandCoins className="w-3.5 h-3.5" />
            Dati MEF · Ministero Economia e Finanze · 2024
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Analisi <span className="text-emerald-600">Redditi</span> Italia
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Esplora la distribuzione della ricchezza, i salari medi e il carico fiscale
            di ogni comune italiano con i dati ufficiali delle dichiarazioni dei redditi.
          </p>
        </section>

        {/* ── Search ───────────────────────────────────────────── */}
        <section>
          <SearchRedditi />
        </section>

        {/* ── Statistiche Nazionali ────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Benchmark Nazionale (Media Comuni)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border rounded-2xl p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" /> Reddito Lordo
              </p>
              <p className="text-3xl font-black">{fmt(mediaRedditoNaz)}</p>
              <p className="text-xs text-muted-foreground mt-1">media annua pro-capite</p>
            </div>
            <div className="bg-card border rounded-2xl p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Pressione Fiscale
              </p>
              <p className="text-3xl font-black">{fmt(mediaIrpefNaz)}</p>
              <p className="text-xs text-muted-foreground mt-1">IRPEF netta media</p>
            </div>
            <div className="bg-slate-900 text-white border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Gap Nord-Sud
              </p>
              <p className="text-3xl font-black text-emerald-400 relative z-10">
                +{gapNordSud.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1 relative z-10">
                Nord {fmt(mediaNord)} vs Sud {fmt(mediaSud)}
              </p>
            </div>
          </div>
        </section>

        {/* ── Top per macro-area ───────────────────────────────── */}
        {Object.keys(topPerArea).length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Comune più ricco per area geografica
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['Nord', 'Centro', 'Sud'] as const).map((area) => {
                const c = topPerArea[area];
                if (!c) return null;
                const colors = {
                  Nord:   'text-blue-600   bg-blue-50   dark:bg-blue-900/20   border-blue-100   dark:border-blue-900/30',
                  Centro: 'text-amber-600  bg-amber-50  dark:bg-amber-900/20  border-amber-100  dark:border-amber-900/30',
                  Sud:    'text-rose-600   bg-rose-50   dark:bg-rose-900/20   border-rose-100   dark:border-rose-900/30',
                };
                return (
                  <Link
                    key={area}
                    href={`/redditi/${c.comune_slug}`}
                    className={`group border rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 ${colors[area]}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-70">{area}</p>
                    <p className="text-xl font-black capitalize mb-1">{c.comune}</p>
                    <p className="text-2xl font-black">{fmt(Number(c.reddito_medio_euro))}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Vedi analisi <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Link alla mappa ──────────────────────────────────── */}
        <section>
          <Link
            href="/redditi/mappa"
            className="group flex items-center justify-between bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-emerald-500/40 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-lg">Mappa dei Redditi per Provincia</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Visualizza reddito medio, pressione fiscale e distribuzione geografica
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </section>

        {/* ── Top 10 comuni per reddito (reali) ───────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Top 10 Comuni per Reddito
            </h2>
            <p className="text-sm text-muted-foreground">Dichiarazioni IRPEF 2024 ↓</p>
          </div>

          {(!top10 || top10.length === 0) && (
            <p className="text-muted-foreground text-sm text-center py-12">
              Nessun dato disponibile.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {top10?.map((city, i) => {
              const diff = diffVsNaz(Number(city.reddito_medio_euro));
              const isTop3 = i < 3;
              return (
                <Link
                  href={`/redditi/${city.comune_slug}`}
                  key={city.comune_slug}
                  className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 relative"
                >
                  {/* Numero ranking */}
                  <span className={`absolute top-4 left-4 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                    isTop3
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>

                  <div className="flex items-start justify-between mb-5 pl-8">
                    <div className="px-3 py-1 bg-secondary rounded-full text-xs font-bold text-muted-foreground uppercase">
                      {city.sigla_provincia}
                    </div>
                    {/* Badge confronto vs media nazionale */}
                    {diff !== null && (
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        diff >= 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(0)}% vs 🇮🇹
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl font-black capitalize mb-4">{city.comune}</h3>

                  <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Reddito Medio
                      </p>
                      <p className="font-bold text-lg text-emerald-600">
                        {fmt(Number(city.reddito_medio_euro))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Contribuenti
                      </p>
                      <p className="font-bold">
                        {city.num_contribuenti >= 1000
                          ? (city.num_contribuenti / 1000).toFixed(1) + 'k'
                          : city.num_contribuenti.toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-4 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Analisi stipendio netto <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────── */}
        <section className="border-t border-border pt-8">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            I dati provengono dal Dipartimento delle Finanze (MEF) e si riferiscono alle
            dichiarazioni dei redditi persone fisiche (IRPEF). Il reddito medio è calcolato
            dividendo l'ammontare complessivo per il numero di contribuenti. Le stime del
            netto sono puramente indicative. Il gap Nord-Sud è calcolato sulla media dei
            comuni nel campione per macro-area geografica.
          </p>
        </section>

      </div>
    </main>
  );
}
