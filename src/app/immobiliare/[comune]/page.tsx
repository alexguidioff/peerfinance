import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { MapPin, Building2, PieChart, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SearchImmobiliare from '@/components/SearchImmobiliare';

type PageProps = {
  params: Promise<{ comune: string }>;
};

export default async function ComuneImmobiliarePage({ params }: PageProps) {
  const { comune } = await params;

  // Normalizza lo slug in arrivo (stesso algoritmo usato per generare comune_slug nel DB)
  const slugPuro = decodeURIComponent(comune).toLowerCase().replace(/[^a-z0-9]/g, '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Query diretta su comune_slug — usa l'indice, nessun filtro JS necessario
  const { data: records, error } = await supabase
    .from('omi_quotazioni')
    .select('*')
    .eq('comune_slug', slugPuro)
    .ilike('tipologia', '%abitazion%');

  if (error || !records || records.length === 0) {
    console.warn("Nessun dato trovato per slug:", slugPuro);
    notFound();
  }

  // Nome originale dal DB (es. "San Remo") per il titolo
  const comuneClean = records[0].comune;

  // --- CALCOLO MEDIE PER ZONA ---
  const zoneStats = records.reduce((acc: any, curr) => {
    const fascia = curr.fascia_zona;
    if (!acc[fascia]) {
      acc[fascia] = { nome: fascia, vendita: 0, affitto: 0, count: 0 };
    }
    acc[fascia].vendita += (curr.vendita_min + curr.vendita_max) / 2;
    acc[fascia].affitto += (curr.affitto_min + curr.affitto_max) / 2;
    acc[fascia].count++;
    return acc;
  }, {});

  const zoneFinali = Object.values(zoneStats)
    .map((z: any) => {
      const v = z.vendita / z.count;
      const a = z.affitto / z.count;
      return {
        nome: z.nome,
        prezzo: v,
        affitto: a,
        rendimento: ((a * 12) / v) * 100,
      };
    })
    .sort((a, b) => b.prezzo - a.prezzo);

  const mediaCittaPrezzo =
    zoneFinali.reduce((s, c) => s + c.prezzo, 0) / zoneFinali.length;
  const mediaCittaRendimento =
    zoneFinali.reduce((s, c) => s + c.rendimento, 0) / zoneFinali.length;

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/5 via-background to-background -z-10 h-[50vh]" />

      <div className="max-w-5xl mx-auto p-6 pt-12">

        {/* Navbar interna */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-50">
          <Link
            href="/immobiliare"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Torna alla Home
          </Link>
          <div className="w-full md:max-w-md">
            <SearchImmobiliare />
          </div>
        </div>

        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black capitalize tracking-tight mb-4">
            {comuneClean}
          </h1>
          <p className="text-xl text-muted-foreground">
            Analisi quotazioni OMI · Semestre 2025H2
          </p>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
          <div className="bg-card border p-8 rounded-[2rem] shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Prezzo Acquisto
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">
                €{mediaCittaPrezzo.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-muted-foreground font-medium">/mq</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl md:col-span-2 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" /> Rendimento Lordo Medio
              </p>
              <span className="text-5xl md:text-6xl font-black text-emerald-400">
                {mediaCittaRendimento.toFixed(2)}%
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-4 flex items-center gap-2 relative z-10">
              <Info className="w-4 h-4" /> Calcolato su locazione 12 mesi
            </p>
          </div>
        </div>

        {/* Lista Zone */}
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" /> Analisi per Zone OMI
        </h2>
        <div className="space-y-4">
          {zoneFinali.map((zona: any) => (
            <div
              key={zona.nome}
              className="bg-card border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="text-xl font-black mb-1">{zona.nome}</h3>
                <p className="text-sm text-muted-foreground">Zona Residenziale</p>
              </div>

              <div className="grid grid-cols-2 md:flex gap-8 md:gap-12">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Acquisto
                  </p>
                  <p className="text-xl font-bold">
                    €{zona.prezzo.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    <span className="text-xs text-muted-foreground">/mq</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Affitto
                  </p>
                  <p className="text-xl font-bold">
                    €{zona.affitto.toLocaleString('it-IT', { maximumFractionDigits: 1 })}
                    <span className="text-xs text-muted-foreground">/mq</span>
                  </p>
                </div>
                <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l md:pl-12 pt-4 md:pt-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Rendimento
                  </p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {zona.rendimento.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
