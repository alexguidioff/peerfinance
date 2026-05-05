import { createClient } from '@supabase/supabase-js';
import SearchProvinceStipendi from '@/components/SearchProvinceStipendi';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Users,
  Briefcase,
  ArrowRight,
  Target,
  BarChart3,
  Award,
  UserCircle,
  MapPin
} from 'lucide-react';

export default async function StipendiHub() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Estraiamo la RAL media e l'Età a livello Italia (IT)
  // Aggiungiamo age_group alla select
  const { data: statsRows } = await supabase
    .from('salary_submissions')
    .select('inquadramento, ral, age_group')
    .eq('provincia', 'IT');

  // Calcoliamo la media per inquadramento
  const ralStats: Record<string, { total: number; count: number; avg: number }> = {};
  // Calcoliamo la media per fascia d'età
  const ageStats: Record<string, { total: number; count: number; avg: number }> = {};
  
  if (statsRows) {
    statsRows.forEach(row => {
      // Popola statistiche Inquadramento
      if (!ralStats[row.inquadramento]) {
        ralStats[row.inquadramento] = { total: 0, count: 0, avg: 0 };
      }
      ralStats[row.inquadramento].total += row.ral;
      ralStats[row.inquadramento].count += 1;

      // Popola statistiche Età (ignorando le righe che non hanno age_group)
      if (row.age_group) {
        if (!ageStats[row.age_group]) {
          ageStats[row.age_group] = { total: 0, count: 0, avg: 0 };
        }
        ageStats[row.age_group].total += row.ral;
        ageStats[row.age_group].count += 1;
      }
    });

    Object.keys(ralStats).forEach(key => {
      ralStats[key].avg = ralStats[key].total / ralStats[key].count;
    });

    Object.keys(ageStats).forEach(key => {
      ageStats[key].avg = ageStats[key].total / ageStats[key].count;
    });
  }

  // 2. Calcoliamo la Media Nazionale assoluta
  const mediaNazionale = statsRows && statsRows.length > 0 
    ? statsRows.reduce((acc, row) => acc + row.ral, 0) / statsRows.length
    : 31000;

  // Formattatore
  const fmt = (n: number) => '€' + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });

  // Ordiniamo le qualifiche per RAL media decrescente
  const qualificheClassifica = Object.keys(ralStats)
    .map(key => ({
      nome: key,
      ral: ralStats[key].avg
    }))
    .sort((a, b) => b.ral - a.ral);

  // Ordiniamo le età cronologicamente
  const ageOrder = [
    'Fino a 19', '20 - 24', '25 - 29', '30 - 34', '35 - 39', 
    '40 - 44', '45 - 49', '50 - 54', '55 - 59', '60 - 64', '65 ed oltre'
  ];
  
  const etaClassifica = Object.keys(ageStats)
    .map(key => ({
      eta: key,
      ral: ageStats[key].avg
    }))
    .sort((a, b) => ageOrder.indexOf(a.eta) - ageOrder.indexOf(b.eta));

  // Troviamo la RAL massima tra le età per calcolare la larghezza delle barre
  const maxAgeRal = Math.max(...etaClassifica.map(e => e.ral), 1);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/5 via-background to-background -z-10 h-[60vh]" />

      <div className="max-w-5xl mx-auto px-4 pt-16 space-y-20">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-800">
            <BarChart3 className="w-3.5 h-3.5" />
            Dati Ufficiali INPS · Settore Privato 2024
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Analisi <span className="text-indigo-600">Stipendi</span> Italia
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Scopri quanto paga il mercato del lavoro italiano. Esplora le retribuzioni per qualifica, età e provincia basate sui dati reali INPS.
          </p>
        </section>

        {/* ── Call to Action Principale ───────────────────────────── */}
        <section className="max-w-3xl mx-auto">
          <div className="bg-card border-2 border-indigo-500/30 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4">Scopri se sei pagato il giusto.</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Usa il nostro calcolatore gratuito per confrontare la tua RAL con la media della tua provincia e dei tuoi coetanei.
              </p>
              <Link
                href="/stipendi/confronta"
                className="inline-flex items-center justify-center gap-3 bg-indigo-600 text-white font-black text-xl py-5 px-10 rounded-2xl hover:bg-indigo-500 transition-all hover:-translate-y-1 shadow-xl shadow-indigo-500/25 w-full sm:w-auto"
              >
                <Target className="w-6 h-6" /> Avvia il Confronto
              </Link>
            </div>
          </div>
        </section>

        {/* ── Statistiche Nazionali ────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Benchmark Nazionale (Media Settore Privato)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border rounded-2xl p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-500" /> RAL Media Italia
              </p>
              <p className="text-3xl font-black">{fmt(mediaNazionale)}</p>
              <p className="text-xs text-muted-foreground mt-1">su 12 mensilità (Lordo)</p>
            </div>
            
            <div className="bg-card border rounded-2xl p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> Settori Analizzati
              </p>
              <p className="text-3xl font-black">Tutti</p>
              <p className="text-xs text-muted-foreground mt-1">Esclusi agricoli e domestici</p>
            </div>
            
            {/* Box Dinamico: Gap Dirigenti vs Impiegati */}
            {qualificheClassifica.length > 0 && (
              <div className="bg-slate-900 text-white border rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Multiplo Dirigenziale
                </p>
                <p className="text-3xl font-black text-indigo-400 relative z-10">
                  {((ralStats['Dirigente']?.avg || 0) / (ralStats['Impiegato']?.avg || 1)).toFixed(1)}x
                </p>
                <p className="text-xs text-slate-400 mt-1 relative z-10">
                  Un Dirigente guadagna {((ralStats['Dirigente']?.avg || 0) / (ralStats['Impiegato']?.avg || 1)).toFixed(1)} volte un Impiegato
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Esplora per Provincia (Ricerca) ──────────────────────── */}
        <SearchProvinceStipendi />

        {/* ── Classifica Qualifiche ───────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              Retribuzioni Medie per Qualifica
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {qualificheClassifica.map((q) => (
              <div
                key={q.nome}
                className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-indigo-500/40 transition-all relative"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="p-3 bg-secondary rounded-2xl text-muted-foreground group-hover:text-indigo-600 transition-colors">
                    <Briefcase className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-4">{q.nome}</h3>

                <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      RAL Media
                    </p>
                    <p className="font-bold text-lg text-indigo-600">
                      {fmt(q.ral)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Netto Mese (Stima)
                    </p>
                    <p className="font-bold">
                      {fmt((q.ral * 0.70) / 12)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Progressione per Età ───────────────────────────────── */}
        {etaClassifica.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-emerald-500" />
                La Curva della Carriera (Età)
              </h2>
            </div>

            <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
              <div className="space-y-6">
                {etaClassifica.map((item) => (
                  <div key={item.eta} className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                    <div className="w-32 font-bold text-muted-foreground whitespace-nowrap">
                      {item.eta} {item.eta !== 'Fino a 19' && item.eta !== '65 ed oltre' ? 'anni' : ''}
                    </div>
                    
                    <div className="flex-1">
                      <div className="h-4 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-all rounded-full"
                          style={{ width: `${(item.ral / maxAgeRal) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-32 text-right">
                      <p className="font-black text-lg">{fmt(item.ral)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">RAL Media</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Disclaimer ───────────────────────────────────────── */}
        <section className="border-t border-border pt-8">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            I dati provengono dall'Osservatorio Statistico sui Lavoratori Dipendenti del Settore Privato (INPS). 
            La RAL è stata calcolata proporzionando la retribuzione complessiva ai giorni lavorati teorici (312 l'anno). 
            Le stime del netto mensile sono puramente indicative e calcolate su 12 mensilità applicando una pressione fiscale forfettaria del 30%.
          </p>
        </section>

      </div>
    </main>
  );
}