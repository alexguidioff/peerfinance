import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { 
    Users, 
    PiggyBank, 
    ArrowDownCircle,
    Percent,
    Scale
} from 'lucide-react';

type PageProps = {
  params: Promise<{
    eta: string;
  }>;
};

// Calcolo pressione fiscale
function calculateTaxMetrics(lordo: number, impostaNetta: number) {
  const pressioneFiscale = lordo > 0 ? (impostaNetta / lordo) * 100 : 0;
  const nettoAnnuale = lordo - impostaNetta;
  return {
    pressione: pressioneFiscale.toFixed(1),
    nettoMensile: nettoAnnuale / 12,
    nettoAnnuale
  };
}

// Aggrega le 34 fasce MEF in 6 macro-categorie ordinate
function getFasciaAggregata(classe: string) {
  const text = classe.toLowerCase();
  if (text.includes("zero") || text.includes("minore") || text.includes("-1.000 a 0")) return "0€ o Negativo";
  if (text.includes("oltre")) return "Oltre 120.000 €";

  // Estraiamo i numeri dalla stringa (es: da "15.000 a 20.000" estraiamo 20000)
  const nums = text.match(/\d+\.\d+|\d+/g);
  if (!nums) return "Altro";
  const maxVal = Math.max(...nums.map(n => parseInt(n.replace(/\./g, ''), 10)));

  if (maxVal <= 15000) return "0 - 15.000 €";
  if (maxVal <= 26000) return "15.000 - 26.000 €";
  if (maxVal <= 55000) return "26.000 - 55.000 €";
  if (maxVal <= 120000) return "55.000 - 120.000 €";
  return "Oltre 120.000 €";
}


export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  return { title: `Analisi Redditi Fascia d'Età: ${resolvedParams.eta} | Peerfinance` };
}

export default async function FasciaEtaPage({ params }: PageProps) {
  const resolvedParams = await params;
  const eta = resolvedParams.eta; // "15-24"
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Metodo "Antiproiettile": trasformiamo "15-24" in "%15%24%"
  // Così aggancia "15 - 24", "15-24", "da 15 a 24", ecc.
  const searchPattern = `%${eta.split('-').join('%')}%`;

  const { data: records, error } = await supabase
    .from('mef_distribuzione_eta')
    .select('*')
    .ilike('classe_eta', searchPattern);

  // Se nonostante tutto non trova nulla, manda in 404
  if (error || !records || records.length === 0) {
    notFound();
  }

  // Usiamo il nome esatto trovato nel DB (es. "15 - 24")
  const fasciaVisualizzata = records[0].classe_eta;

  // Aggregazione dati
  const totali = records.reduce((acc, curr) => ({
    contribuenti: acc.contribuenti + (Number(curr.num_contribuenti) || 0),
    lordo: acc.lordo + (Number(curr.reddito_complessivo_ammontare) || 0),
    netta: acc.netta + (Number(curr.imposta_netta_ammontare) || 0),
    imponibile: acc.imponibile + (Number(curr.reddito_imponibile_ammontare) || 0),
    detrazioni: acc.detrazioni + (Number(curr.detrazioni_imposta_ammontare) || 0),
    deduzioni: acc.deduzioni + (Number(curr.oneri_deducibili_ammontare) || 0)
  }), { contribuenti: 0, lordo: 0, netta: 0, imponibile: 0, detrazioni: 0, deduzioni: 0 });

  const mediaLordo = totali.contribuenti > 0 ? totali.lordo / totali.contribuenti : 0;
  const mediaNetta = totali.contribuenti > 0 ? totali.netta / totali.contribuenti : 0;
  const tax = calculateTaxMetrics(mediaLordo, mediaNetta);

  return (
    <main className="font-sans min-h-screen bg-background text-foreground pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-background to-background -z-10 h-[50vh]"></div>

      <div className="mx-auto max-w-5xl p-6 md:p-10 lg:pt-16">
        
        <header className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-sm font-semibold mb-4">
            <Users className="w-4 h-4" />
            <span>Analisi Demografica Nazionale</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Fascia {fasciaVisualizzata} Anni
          </h1>
          <p className="text-muted-foreground text-lg mt-3 font-medium">
            Analisi su {totali.contribuenti.toLocaleString('it-IT')} contribuenti in Italia
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card p-8 rounded-3xl border shadow-sm md:col-span-2">
            <h3 className="text-muted-foreground font-semibold uppercase text-xs tracking-widest flex items-center gap-2 mb-6">
              <PiggyBank className="w-4 h-4 text-emerald-500" /> Reddito Medio Lordo vs Netto
            </h3>
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div>
                <p className="text-5xl font-black tracking-tight">€{mediaLordo.toLocaleString('it-IT', {maximumFractionDigits: 0})}</p>
                <p className="text-muted-foreground text-sm font-medium mt-1">Lordo Annuale Medio</p>
              </div>
              <div className="hidden md:block h-12 w-[1px] bg-border mb-2"></div>
              <div>
                <p className="text-4xl font-black text-emerald-600 tracking-tight">€{tax.nettoMensile.toLocaleString('it-IT', {maximumFractionDigits: 0})}</p>
                <p className="text-muted-foreground text-sm font-medium mt-1">Netto Mensile Stimato</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-center">
            <h3 className="text-slate-400 font-semibold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-400" /> Pressione Fiscale
            </h3>
            <p className="text-5xl font-black tracking-tight text-blue-400">{tax.pressione}%</p>
            <p className="text-slate-400 text-xs mt-2 font-medium">Incidenza media dell'imposta netta</p>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-foreground text-2xl font-bold mb-6 flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> Anatomia della Tassazione
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card p-6 rounded-2xl border flex items-center gap-5">
              <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
                <ArrowDownCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase">Deduzioni Medie</p>
                <p className="text-2xl font-black">€{(totali.contribuenti > 0 ? totali.deduzioni / totali.contribuenti : 0).toLocaleString('it-IT', {maximumFractionDigits: 0})}</p>
                <p className="text-xs text-muted-foreground">Riduzione dell'imponibile</p>
              </div>
            </div>
            <div className="bg-card p-6 rounded-2xl border flex items-center gap-5">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase">Detrazioni Medie</p>
                <p className="text-2xl font-black">€{(totali.contribuenti > 0 ? totali.detrazioni / totali.contribuenti : 0).toLocaleString('it-IT', {maximumFractionDigits: 0})}</p>
                <p className="text-xs text-muted-foreground">Sconto diretto sulle tasse</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-foreground text-2xl font-bold mb-6">Distribuzione Interna del Reddito ({fasciaVisualizzata})</h2>
          <div className="bg-card text-card-foreground border rounded-3xl p-6 md:p-8">
            <div className="space-y-6">
              {(() => {
                // 1. Definiamo l'ordine perfetto e pulito
                const fasceAggregate = [
                  { label: "0€ o Negativo", count: 0 },
                  { label: "0 - 15.000 €", count: 0 },
                  { label: "15.000 - 26.000 €", count: 0 },
                  { label: "26.000 - 55.000 €", count: 0 },
                  { label: "55.000 - 120.000 €", count: 0 },
                  { label: "Oltre 120.000 €", count: 0 },
                ];

                // 2. Riempiamo le scatole sommando i dati del DB
                records.forEach(r => {
                  const labelAggregata = getFasciaAggregata(r.classe_reddito);
                  const bucket = fasceAggregate.find(b => b.label === labelAggregata);
                  if (bucket) {
                    bucket.count += (Number(r.num_contribuenti) || 0);
                  }
                });

                // 3. Renderizziamo solo le 6 fasce macro
                return fasceAggregate.map((fascia) => {
                  const percentuale = totali.contribuenti > 0 ? (fascia.count / totali.contribuenti) * 100 : 0;
                  
                  return (
                    <div key={fascia.label} className="group">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-foreground">{fascia.label}</span>
                        <div className="text-right">
                          <span className="text-muted-foreground font-medium mr-2">{fascia.count.toLocaleString('it-IT')} persone</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{percentuale.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-indigo-500" 
                          style={{ width: `${percentuale}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </section>


        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Confronta con le altre età</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Vuoi vedere come cambia il potere d'acquisto man mano che si invecchia in Italia? Guarda la piramide completa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/analisi/piramide" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-bold transition-all shadow-lg">
              Vedi Piramide Età
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
