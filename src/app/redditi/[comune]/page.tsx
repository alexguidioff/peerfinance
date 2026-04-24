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
  Wallet
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

  return (
    // font-sans qui forza il caricamento del font moderno
    <main className="font-sans min-h-screen bg-background text-foreground pb-20">
      
      {/* Sfondo decorativo super-sottile per togliere l'effetto "pagina vuota" */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10 h-[50vh]"></div>

      <div className="mx-auto max-w-5xl p-6 md:p-10 lg:pt-16">
        
        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Landmark className="w-4 h-4" />
            <span>Analisi Territoriale MEF</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black capitalize tracking-tight text-foreground">
            {info.comune}
          </h1>
          <p className="text-muted-foreground text-lg mt-3 font-medium">
            Provincia di {info.sigla_provincia}, {info.regione} • {info.num_contribuenti.toLocaleString('it-IT')} contribuenti
          </p>
        </header>

        {/* Grid Principale: Lordo vs Netto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Card Lordo */}
          <div className="bg-card text-card-foreground p-8 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-muted-foreground font-semibold uppercase text-xs tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Reddito Medio Lordo
              </h3>
            </div>
            <p className="text-4xl md:text-5xl font-black tracking-tight">€{lordo.toLocaleString('it-IT')}</p>
            
            <div className="mt-8 pt-6 border-t flex justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium mb-1">Mensile (12 mens.)</p>
                <p className="font-bold text-lg">€{(lordo / 12).toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs font-medium mb-1">Mensile (13 mens.)</p>
                <p className="font-bold text-lg">€{(lordo / 13).toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* Card Netto Premium */}
          <div className="bg-gradient-to-br from-primary to-blue-800 text-primary-foreground p-8 rounded-3xl shadow-xl relative overflow-hidden">
            {/* Pattern decorativo nella card */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            
            <h3 className="text-primary-foreground/80 font-semibold uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Stima Netto Mensile
            </h3>
            <p className="text-5xl md:text-6xl font-black tracking-tight">
              €{netto.mensile12.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-primary-foreground/80 text-sm mt-2 font-medium">Calcolato su 12 mensilità</p>
            
            <div className="mt-8 pt-6 border-t border-primary-foreground/20 relative z-10">
              <p className="text-xs text-primary-foreground/80 mb-1 font-medium">Netto Annuale Stimato</p>
              <p className="text-2xl font-bold">€{netto.annuale.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        {/* Nuova Sezione: Categorie Lavorative */}
        <section className="mb-12">
          <h2 className="text-foreground text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Spaccato per Categoria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Building2 className="w-5 h-5"/></div>
                <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Dipendenti</p>
              </div>
              <p className="text-3xl font-black text-foreground mb-1">€{mediaDipendenti.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground font-medium">{info.dipendenti_freq.toLocaleString('it-IT')} persone</p>
            </div>

            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><UserPlus className="w-5 h-5"/></div>
                <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Pensionati</p>
              </div>
              <p className="text-3xl font-black text-foreground mb-1">€{mediaPensionati.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground font-medium">{info.pensionati_freq.toLocaleString('it-IT')} persone</p>
            </div>

            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400"><Briefcase className="w-5 h-5"/></div>
                <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Autonomi / P.IVA</p>
              </div>
              <p className="text-3xl font-black text-foreground mb-1">€{mediaAutonomi.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground font-medium">{info.autonomi_freq.toLocaleString('it-IT')} persone</p>
            </div>
          </div>
        </section>

        {/* Tasse e Immobili */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border">
            <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Home className="w-4 h-4 text-slate-500" /> Ricchezza Immobiliare
            </h3>
            <p className="text-muted-foreground text-xs mb-4">Contribuenti con redditi da fabbricati</p>
            <p className="text-4xl font-black text-foreground">{percProprietari.toFixed(1)}%</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
              <ReceiptEuro className="w-4 h-4" /> IRPEF Media Versata
            </h3>
            <p className="text-red-600/70 dark:text-red-400/70 text-xs mb-4">Imposta netta media per contribuente</p>
            <p className="text-4xl font-black text-red-700 dark:text-red-400">
              €{mediaTasse.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Distribuzione della ricchezza */}
        <section className="mb-16">
          <h2 className="text-foreground text-2xl font-bold mb-6">Distribuzione della Ricchezza</h2>
          <div className="bg-card text-card-foreground border rounded-3xl overflow-hidden shadow-sm p-6 md:p-8">
            <div className="space-y-5">
              {fasce.map((fascia) => {
                const percentuale = (fascia.val / info.num_contribuenti) * 100;
                return (
                  <div key={fascia.label} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-foreground">{fascia.label}</span>
                      <span className="text-muted-foreground font-medium">{percentuale.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-blue-500" 
                        style={{ width: `${percentuale}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Finale */}
        <section className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-10 md:p-14 text-center relative overflow-hidden border dark:border-slate-800">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">E tu come sei messo?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto text-lg">
              Le medie raccontano solo metà della storia. Inserisci i tuoi dati in modo anonimo per scoprire il tuo Health Score rispetto ai tuoi coetanei.
            </p>
            <a href={`/score?citta=${info.comune}`} className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary/20">
              Calcola il tuo Health Score
            </a>
          </div>
          {/* Cerchi decorativi CTA */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        </section>

      </div>
    </main>
  );
}
