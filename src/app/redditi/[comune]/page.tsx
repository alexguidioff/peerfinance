import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { 
  Briefcase, 
  UserPlus, 
  Building2, 
  Landmark, 
  Home, 
  ReceiptEuro,
  TrendingUp,
  Wallet,
  ArrowRight
} from 'lucide-react';

type PageProps = {
  params: Promise<{
    comune: string;
  }>;
};

function calculateNetto(lordo: number) {
  const contributi = lordo * 0.0919;
  const imponibile = lordo - contributi;
  let irpef = 0;
  if (imponibile <= 28000) {
    irpef = imponibile * 0.23;
  } else if (imponibile <= 50000) {
    irpef = 28000 * 0.23 + (imponibile - 28000) * 0.35;
  } else {
    irpef = 28000 * 0.23 + 22000 * 0.35 + (imponibile - 50000) * 0.43;
  }
  const nettoAnnuale = imponibile - irpef;
  return { annuale: nettoAnnuale, mensile12: nettoAnnuale / 12, mensile13: nettoAnnuale / 13 };
}

export async function generateMetadata({ params }: PageProps) {
  const { comune } = await params;
  const name = decodeURIComponent(comune).replace(/-/g, ' ');
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  return { title: `Stipendio Netto e Analisi Redditi a ${title} | Peerfinance` };
}

export default async function ComunePage({ params }: PageProps) {
  const { comune } = await params;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const comuneDecoded = decodeURIComponent(comune).toLowerCase().replace(/-/g, ' ');

  const { data: info } = await supabase
    .from('mef_redditi_comuni')
    .select('*')
    .eq('comune', comuneDecoded)
    .single();

  if (!info) notFound();

  // Calcoli Base
  const lordo = parseFloat(info.reddito_medio_euro);
  const netto = calculateNetto(lordo);

  // Nuovi Calcoli Avanzati (Ammontari / Frequenze)
  const mediaDipendenti = info.dipendenti_freq > 0 ? (info.dipendenti_ammontare || 0) / info.dipendenti_freq : 0;
  const mediaPensionati = info.pensionati_freq > 0 ? (info.pensionati_ammontare || 0) / info.pensionati_freq : 0;
  const mediaAutonomi = info.autonomi_freq > 0 ? (info.autonomi_ammontare || 0) / info.autonomi_freq : 0;
  const mediaTasse = (info.imposta_netta_freq || 0) > 0 ? (info.imposta_netta_ammontare || 0) / info.imposta_netta_freq : 0;
  const percProprietari = ((info.fabbricati_freq || 0) / info.num_contribuenti) * 100;

  const fasce = [
    { label: '0 - 10k', val: info.fascia_0_10k },
    { label: '10k - 15k', val: info.fascia_10k_15k },
    { label: '15k - 26k', val: info.fascia_15k_26k },
    { label: '26k - 55k', val: info.fascia_26k_55k },
    { label: '55k - 75k', val: info.fascia_55k_75k },
    { label: '75k - 120k', val: info.fascia_75k_120k },
    { label: 'Oltre 120k', val: info.fascia_oltre_120k },
  ];

  const fmt = (n: number) =>
    '€' + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });

  return (
    <main className="font-sans min-h-screen bg-background text-foreground pb-24">
      
      {/* Sfondo decorativo uguale all'Hub dei Redditi (Emerald) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/5 via-background to-background -z-10 h-[60vh]"></div>

      <div className="mx-auto max-w-5xl px-4 pt-16 space-y-20">
        
        {/* ── Hero Centrata ─────────────────────────────────────────────── */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Landmark className="w-3.5 h-3.5" />
            Analisi Territoriale MEF
          </div>
          <h1 className="text-5xl md:text-7xl font-black capitalize tracking-tight text-foreground">
            {info.comune}
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Provincia di <span className="font-bold text-foreground uppercase">{info.sigla_provincia}</span>, {info.regione} <br/> 
            Basato su {info.num_contribuenti.toLocaleString('it-IT')} contribuenti IRPEF
          </p>
        </header>

        {/* ── Grid Principale: Lordo vs Netto ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card Lordo (Stile Hub) */}
          <div className="bg-card border rounded-3xl p-8 hover:shadow-xl hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-500" /> Reddito Medio Lordo
              </p>
            </div>
            <p className="text-5xl md:text-6xl font-black tracking-tight">{fmt(lordo)}</p>
            
            <div className="mt-8 pt-6 border-t border-border flex justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Mensile (12 mens.)</p>
                <p className="font-bold text-lg">{fmt(lordo / 12)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Mensile (13 mens.)</p>
                <p className="font-bold text-lg">{fmt(lordo / 13)}</p>
              </div>
            </div>
          </div>

          {/* Card Netto Premium (Stile Dark Hub) */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-xl hover:-translate-y-0.5 transition-transform">
            <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
            
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5 relative z-10">
              <Wallet className="w-4 h-4 text-emerald-400" /> Stima Netto Mensile
            </p>
            
            <p className="text-5xl md:text-6xl font-black tracking-tight text-white relative z-10">
              {fmt(netto.mensile12)}
            </p>
            <p className="text-xs text-slate-400 mt-2 relative z-10">calcolato su 12 mensilità</p>
            
            <div className="mt-8 pt-6 border-t border-slate-700/50 relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Netto Annuale Stimato</p>
              <p className="text-2xl font-bold text-emerald-400">{fmt(netto.annuale)}</p>
            </div>
          </div>
        </div>

        {/* ── Sezione: Categorie Lavorative ───────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Spaccato per Categoria
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-blue-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                  <Building2 className="w-5 h-5"/>
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Dipendenti</p>
              <p className="text-3xl font-black text-foreground mb-1">{fmt(mediaDipendenti)}</p>
              <p className="text-xs text-muted-foreground">{info.dipendenti_freq.toLocaleString('it-IT')} persone</p>
            </div>

            <div className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-emerald-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                  <UserPlus className="w-5 h-5"/>
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Pensionati</p>
              <p className="text-3xl font-black text-foreground mb-1">{fmt(mediaPensionati)}</p>
              <p className="text-xs text-muted-foreground">{info.pensionati_freq.toLocaleString('it-IT')} persone</p>
            </div>

            <div className="group bg-card border rounded-3xl p-6 hover:shadow-xl hover:border-amber-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-5">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600">
                  <Briefcase className="w-5 h-5"/>
                </div>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Autonomi / P.IVA</p>
              <p className="text-3xl font-black text-foreground mb-1">{fmt(mediaAutonomi)}</p>
              <p className="text-xs text-muted-foreground">{info.autonomi_freq.toLocaleString('it-IT')} persone</p>
            </div>

          </div>
        </section>

        {/* ── Tasse e Immobili ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-3xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-500" /> Ricchezza Immobiliare
              </p>
              <p className="text-xs text-muted-foreground">Contribuenti con redditi da fabbricati</p>
            </div>
            <p className="text-3xl font-black text-foreground">{percProprietari.toFixed(1)}%</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ReceiptEuro className="w-4 h-4" /> IRPEF Media
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">Imposta netta per contribuente</p>
            </div>
            <p className="text-3xl font-black text-red-700 dark:text-red-400">
              {fmt(mediaTasse)}
            </p>
          </div>
        </div>

        {/* ── Distribuzione della ricchezza ───────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Distribuzione della Ricchezza</h2>
          </div>
          <div className="bg-card border rounded-3xl p-8 shadow-sm">
            <div className="space-y-5">
              {fasce.map((fascia) => {
                const percentuale = (fascia.val / info.num_contribuenti) * 100;
                return (
                  <div key={fascia.label} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-foreground">{fascia.label}</span>
                      <span className="text-muted-foreground font-bold">{percentuale.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-emerald-400" 
                        style={{ width: `${percentuale}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Finale ──────────────────────────────────────────────── */}
        <section className="bg-slate-900 text-white border border-slate-800 rounded-[2.5rem] p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-4">E tu come sei messo?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto text-lg">
              Le medie raccontano solo metà della storia. Inserisci i tuoi dati in modo anonimo per scoprire il tuo Health Score rispetto ai tuoi coetanei.
            </p>
            <a 
              href={`/score?citta=${info.comune}`} 
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/25"
            >
              Calcola il tuo Health Score <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}
