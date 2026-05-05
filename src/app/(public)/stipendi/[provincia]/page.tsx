import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Wallet,
  Briefcase,
  MapPin,
  Target,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

// Mappa delle province principali per i nomi estesi (aggiungile man mano se vuoi)
const PROVINCE_MAP: Record<string, string> = {
  MI: 'Milano', RM: 'Roma', TO: 'Torino', NA: 'Napoli',
  BO: 'Bologna', FI: 'Firenze', VE: 'Venezia', GE: 'Genova',
  BA: 'Bari', PA: 'Palermo', BZ: 'Bolzano', TN: 'Trento',
  BS: 'Brescia', BG: 'Bergamo', VR: 'Verona', PD: 'Padova'
};

export default async function ProvinciaStipendiPage({
  params
}: {
  params: Promise<{ provincia: string }>
}) {
  const resolvedParams = await params;
  const sigla = resolvedParams.provincia.toUpperCase();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Estraiamo i dati specifici per questa provincia
  const { data: provinceData } = await supabase
    .from('salary_submissions')
    .select('inquadramento, ral, net_monthly_estimated')
    .eq('provincia', sigla)
    .is('age_group', null); // Escludiamo i dati nazionali sull'età che hanno provincia 'IT'

  if (!provinceData || provinceData.length === 0) {
    notFound(); // Se la provincia non esiste nel DB, diamo 404
  }

  // Estraiamo i dati nazionali per fare il confronto
  const { data: nationalData } = await supabase
    .from('salary_submissions')
    .select('inquadramento, ral')
    .eq('provincia', 'IT')
    .is('age_group', null); // Medie nazionali base

  // Calcoliamo la media generale della provincia
  const mediaProvincia = provinceData.reduce((acc, row) => acc + row.ral, 0) / provinceData.length;

  // Prepariamo i dati per la UI
  const qualifiche = provinceData.sort((a, b) => b.ral - a.ral);
  const nomeProvincia = PROVINCE_MAP[sigla] || `Provincia di ${sigla}`;
  const fmt = (n: number) => '€' + Math.round(n).toLocaleString('it-IT');

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/5 via-background to-background -z-10 h-[60vh]" />

      <div className="max-w-5xl mx-auto px-4 pt-16 space-y-16">

        {/* ── Hero Provincia ──────────────────────────────────────── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-800">
            <MapPin className="w-3.5 h-3.5" />
            Report Territoriale INPS 2024
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Stipendi a <span className="text-indigo-600">{nomeProvincia}</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Analisi dettagliata delle retribuzioni nel settore privato per la provincia di {nomeProvincia}. Scopri quanto guadagnano i tuoi colleghi.
          </p>
        </section>

        {/* ── Recap Macro ────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-card border rounded-[2rem] p-8 text-center shadow-lg">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">RAL Media Provinciale</p>
            <p className="text-5xl font-black text-foreground">{fmt(mediaProvincia)}</p>
          </div>
          
          <div className="bg-indigo-600 text-white border border-indigo-500 rounded-[2rem] p-8 text-center shadow-lg shadow-indigo-500/20 flex flex-col justify-center items-center">
            <Target className="w-8 h-8 mb-3 text-indigo-200" />
            <p className="font-bold text-lg mb-1">Sei pagato il giusto?</p>
            <Link href="/stipendi/confronta" className="text-sm font-black text-indigo-200 hover:text-white flex items-center gap-1 transition-colors">
              Avvia il confronto <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── Dettaglio Qualifiche ───────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-500" />
              Retribuzioni per Inquadramento ({sigla})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {qualifiche.map((q) => {
              // Cerchiamo la media nazionale per questa qualifica
              const nazRow = nationalData?.find(n => n.inquadramento === q.inquadramento);
              const diffVsNaz = nazRow ? ((q.ral - nazRow.ral) / nazRow.ral) * 100 : 0;

              return (
                <div key={q.inquadramento} className="bg-card border rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all relative">
                  <h3 className="text-2xl font-black mb-6">{q.inquadramento}</h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">RAL Media Lorda</p>
                      <div className="flex items-end justify-between">
                        <p className="font-black text-3xl text-indigo-600">{fmt(q.ral)}</p>
                        {nazRow && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${diffVsNaz >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {diffVsNaz >= 0 ? '+' : ''}{diffVsNaz.toFixed(1)}% vs ITA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Netto Mensile (Stima)</p>
                      <p className="font-bold text-xl">{fmt(q.net_monthly_estimated)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}