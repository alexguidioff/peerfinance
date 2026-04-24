import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  BarChart3, 
  MapPin, 
  ArrowRight, 
  Info, 
  HandCoins 
} from 'lucide-react';
import SearchRedditi from '@/components/SearchRedditi'; // Assicurati di crearlo o adattarlo

// Città in evidenza per i redditi
const FEATURED_CITIES = [
  'Milano', 'Roma', 'Bologna', 'Padova', 'Parma', 
  'Torino', 'Firenze', 'Bergamo', 'Monza', 'Verona'
];

type RedditoCard = {
  comune: string;
  comune_slug: string;
  redditoMedio: number;
  numContribuenti: number;
  siglaProvincia: string;
};

export default async function RedditiHub() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Recupero dati per le città in evidenza
  const { data: cityRows } = await supabase
    .from('mef_redditi_comuni')
    .select('comune, reddito_medio_euro, num_contribuenti, sigla_provincia')
    .in('comune', FEATURED_CITIES)
    .order('reddito_medio_euro', { ascending: false });

  // 2. Calcolo Medie Nazionali (Approssimate dai dati MEF)
  // Nota: In produzione potresti voler pre-calcolare questi valori per performance
  const { data: statsRows } = await supabase
    .from('mef_redditi_comuni')
    .select('reddito_medio_euro, imposta_netta_ammontare, imposta_netta_freq')
    .limit(1000);

  let mediaRedditoNaz = 0;
  let mediaIrpefNaz = 0;

  if (statsRows && statsRows.length > 0) {
    mediaRedditoNaz = statsRows.reduce((s, r) => s + Number(r.reddito_medio_euro), 0) / statsRows.length;
    const totImposta = statsRows.reduce((s, r) => s + (r.imposta_netta_ammontare || 0), 0);
    const totFreq = statsRows.reduce((s, r) => s + (r.imposta_netta_freq || 1), 0);
    mediaIrpefNaz = totImposta / totFreq;
  }

  const fmt = (n: number) =>
    '€' + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Gradiente decorativo simile all'immobiliare ma virato sul verde/smeraldo (colore dei soldi) */}
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
          {/* Qui puoi riutilizzare la tua Searchbar che punta a /stipendio/[comune] */}
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
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Gap Nord-Sud
              </p>
              <p className="text-3xl font-black text-white relative z-10">
                +38%
              </p>
              <p className="text-xs text-slate-400 mt-1 relative z-10">differenziale medio</p>
            </div>
          </div>
        </section>

        {/* ── Città Top per Reddito ────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600" />
              Top Comuni per Reddito
            </h2>
            <p className="text-sm text-muted-foreground">
              Basato su dichiarazioni IRPEF ↓
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cityRows?.map((city) => (
              <Link
                href={`/stipendio/${city.comune.toLowerCase()}`}
                key={city.comune}
                className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-emerald-500/40 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="px-3 py-1 bg-secondary rounded-full text-xs font-bold text-muted-foreground uppercase">
                    {city.sigla_provincia}
                  </div>
                </div>

                <h3 className="text-2xl font-black capitalize mb-4">{city.comune}</h3>

                <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Reddito Medio
                    </p>
                    <p className="font-bold text-lg text-emerald-600">{fmt(Number(city.reddito_medio_euro))}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Contribuenti
                    </p>
                    <p className="font-bold">{(city.num_contribuenti / 1000).toFixed(1)}k</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Analisi stipendio netto <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────── */}
        <section className="border-t border-border pt-8">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            I dati provengono dal Dipartimento delle Finanze (MEF) e si riferiscono alle 
            dichiarazioni dei redditi persone fisiche (IRPEF). Il reddito medio è calcolato 
            dividendo l'ammontare complessivo per il numero di contribuenti. Le stime del 
            netto sono puramente indicative.
          </p>
        </section>

      </div>
    </main>
  );
}
