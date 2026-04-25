import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  PieChart,
  BarChart3,
  ArrowRight,
  User,
  Activity,
  PiggyBank
} from 'lucide-react';

// Le 4 macro-fasce richieste
const FASCE_ETA = [
  { label: '15 - 24 anni', slug: '15-24' },
  { label: '25 - 44 anni', slug: '25-44' },
  { label: '45 - 64 anni', slug: '45-64' },
  { label: 'Oltre 64 anni', slug: 'oltre-64' },
];

type FasciaData = {
  slug: string;
  label: string;
  contribuenti: number;
  redditoLordoMedio: number;
  pressioneFiscale: number;
};

export default async function DemografiaHub() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: rows } = await supabase
    .from('mef_distribuzione_eta')
    .select('classe_eta, num_contribuenti, reddito_complessivo_ammontare, imposta_netta_ammontare')
    .limit(2000);

  // Inizializza l'aggregatore
  const aggregated: Record<string, { contribuenti: number; lordo: number; netta: number }> = {};
  FASCE_ETA.forEach(f => {
    aggregated[f.slug] = { contribuenti: 0, lordo: 0, netta: 0 };
  });

  if (rows) {
    for (const r of rows) {
      const text = (r.classe_eta || '').toLowerCase();
      let matchedSlug = '';
      
      // L'ORDINE QUI È FONDAMENTALE!
      if (text.includes('oltre') || text.includes('65') || text.includes('74') || text.includes('75')) {
        matchedSlug = 'oltre-64';
      } else if (text.includes('45') || text.includes('54') || text.includes('64') || text.includes('55')) {
        matchedSlug = '45-64';
      } else if (text.includes('25') || text.includes('34') || text.includes('44') || text.includes('35')) {
        matchedSlug = '25-44';
      } else if (text.includes('15') || text.includes('24') || text.includes('minore')) {
        matchedSlug = '15-24';
      }

      if (matchedSlug && aggregated[matchedSlug]) {
        aggregated[matchedSlug].contribuenti += Number(r.num_contribuenti) || 0;
        aggregated[matchedSlug].lordo += Number(r.reddito_complessivo_ammontare) || 0;
        aggregated[matchedSlug].netta += Number(r.imposta_netta_ammontare) || 0;
      }
    }
  }

  // Costruisce l'array finale
  const displayFasce: FasciaData[] = FASCE_ETA.map(f => {
    const data = aggregated[f.slug];
    const redditoLordoMedio = data.contribuenti > 0 ? data.lordo / data.contribuenti : 0;
    const pressioneFiscale = data.lordo > 0 ? (data.netta / data.lordo) * 100 : 0;
    
    return {
      slug: f.slug,
      label: f.label,
      contribuenti: data.contribuenti,
      redditoLordoMedio,
      pressioneFiscale
    };
  });

  // Totali Nazionali
  let totContribuenti = 0;
  let totLordo = 0;
  let totNetta = 0;

  displayFasce.forEach(f => {
    totContribuenti += f.contribuenti;
    totLordo += aggregated[f.slug].lordo;
    totNetta += aggregated[f.slug].netta;
  });

  const mediaLordoNaz = totContribuenti > 0 ? totLordo / totContribuenti : 0;
  const topFascia = [...displayFasce].sort((a, b) => b.redditoLordoMedio - a.redditoLordoMedio)[0];

  const fmt = (n: number) =>
    '€' + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/5 via-background to-background -z-10 h-[60vh]" />

      <div className="max-w-5xl mx-auto px-4 pt-16 space-y-20">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
            <BarChart3 className="w-3.5 h-3.5" />
            Dati MEF · Ministero Economia e Finanze · 2024
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Demografia del <span className="text-blue-600">Reddito</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Scopri come cambia la ricchezza, la pressione fiscale e il numero di contribuenti
            in base alle diverse fasce d'età in Italia.
          </p>
        </section>

        {/* ── Statistiche nazionali ────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Benchmark Generazionale (Italia)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border rounded-3xl p-6 hover:shadow-md transition-shadow">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Totale Contribuenti
              </p>
              <p className="text-3xl font-black">
                {totContribuenti >= 1000000 
                  ? (totContribuenti / 1000000).toFixed(1) + ' Mln'
                  : totContribuenti.toLocaleString('it-IT')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Dichiaranti IRPEF analizzati</p>
            </div>
            <div className="bg-card border rounded-3xl p-6 hover:shadow-md transition-shadow">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-indigo-500" /> Reddito Medio
              </p>
              <p className="text-3xl font-black">{fmt(mediaLordoNaz)}</p>
              <p className="text-xs text-muted-foreground mt-1">Lordo pro-capite</p>
            </div>
            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-lg hover:-translate-y-0.5 transition-transform">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Fascia più Ricca
              </p>
              <p className="text-3xl font-black text-blue-400 relative z-10">
                {topFascia?.label || 'N/D'}
              </p>
              <p className="text-xs text-slate-400 mt-1 relative z-10">
                {fmt(topFascia?.redditoLordoMedio || 0)} medi annui
              </p>
            </div>
          </div>
        </section>

        {/* ── Link alla Mappa/Confronto ────────────────────────── */}
        <section>
          <Link
            href="/demografia/piramide"
            className="group flex items-center justify-between bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-blue-500/40 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-lg">Piramide dell'Età</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Confronta visivamente la distribuzione della ricchezza tra le diverse generazioni
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </section>

        {/* ── Fasce d'età ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Analisi per Fascia d'Età
            </h2>
            <p className="text-sm text-muted-foreground">
              Dal più giovane al più anziano ↓
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayFasce.map((fascia) => {
              const isTop = fascia.slug === topFascia?.slug;
              
              return (
                <Link
                  href={`/demografia/${encodeURIComponent(fascia.slug)}`}
                  key={fascia.slug}
                  className={`group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-blue-500/40 transition-all hover:-translate-y-0.5 relative ${
                    isTop ? 'ring-2 ring-blue-500/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={`p-2.5 rounded-xl ${
                      isTop ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black capitalize mb-4">{fascia.label}</h3>

                  <div className="grid grid-cols-1 gap-3 text-sm border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Lordo Medio
                      </p>
                      <p className="font-bold text-2xl text-foreground">
                        {fmt(fascia.redditoLordoMedio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Contribuenti
                      </p>
                      <p className="font-bold text-base text-muted-foreground">
                        {fascia.contribuenti >= 1000000
                          ? (fascia.contribuenti / 1000000).toFixed(1) + ' Milioni'
                          : fascia.contribuenti.toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex justify-between">
                       <span>Pressione Fiscale</span>
                       <span>{fascia.pressioneFiscale.toFixed(1)}%</span>
                     </p>
                     <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full opacity-70"
                          style={{ width: `${Math.min(fascia.pressioneFiscale, 100)}%` }}
                        />
                     </div>
                  </div>

                  <div className="flex items-center gap-1 mt-5 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Vedi dettaglio <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────── */}
        <section className="border-t border-border pt-8">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            I dati provengono dalle dichiarazioni dei redditi IRPEF del Dipartimento delle Finanze (MEF). 
            L'analisi aggrega le fasce d'età a livello nazionale per mostrare l'evoluzione del reddito 
            e della pressione fiscale nel corso della vita lavorativa e pensionistica. I dati della fascia "0-14" sono stati esclusi o incorporati per via della scarsa rilevanza ai fini IRPEF.
          </p>
        </section>

      </div>
    </main>
  );
}
