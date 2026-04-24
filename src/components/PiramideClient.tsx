"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Users, Landmark, ArrowRight, TrendingUp, Wallet, CalendarDays } from 'lucide-react';

type PiramideClientProps = {
  initialData: Array<{
    eta: string;
    contribuenti: number;
    lordoAnnuale: number;
    nettoAnnuale: number;
  }>;
};

export default function PiramideClient({ initialData }: PiramideClientProps) {
  // --- STATI PER I CONTROLLI ---
  const [tipoReddito, setTipoReddito] = useState<'lordo' | 'netto'>('lordo');
  const [mensilita, setMensilita] = useState<number>(1); // 1 = Annuale, 12, 13, 14

  // 1. Ordinamento robusto (più vecchi in alto)
  const chartData = useMemo(() => {
    return [...initialData].sort((a, b) => {
      const getAge = (str: string) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      return getAge(b.eta) - getAge(a.eta);
    });
  }, [initialData]);

  // 2. Calcoli dinamici basati sulle scelte dell'utente
  const calcoli = useMemo(() => {
    let totaleContribuenti = 0;
    let totaleValore = 0;
    let maxReddito = 0;
    const maxContribuenti = Math.max(...chartData.map(d => d.contribuenti));

    const processedData = chartData.map(d => {
      // Sceglie se usare lordo o netto
      const valoreBase = tipoReddito === 'netto' ? d.nettoAnnuale : d.lordoAnnuale;
      // Applica il divisore mensile
      const valoreFinale = valoreBase / mensilita;

      if (valoreFinale > maxReddito) maxReddito = valoreFinale;
      
      totaleContribuenti += d.contribuenti;
      totaleValore += (valoreFinale * d.contribuenti); // Media ponderata

      return { ...d, valoreVisualizzato: valoreFinale };
    });

    const mediaNazionale = totaleContribuenti > 0 ? totaleValore / totaleContribuenti : 0;

    return { processedData, maxContribuenti, maxReddito, mediaNazionale, totaleContribuenti };
  }, [chartData, tipoReddito, mensilita]);

  return (
    <main className="font-sans min-h-screen bg-background text-foreground pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-background to-background -z-10 h-[60vh]"></div>

      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        
        {/* Header Dashboard */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>Spaccato Demografico Nazionale</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Demografia e Ricchezza
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Scopri come si distribuisce il reddito in Italia in base all'età.
          </p>

          {/* CONTROLLI INTERATTIVI (Toggles) */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 bg-card border shadow-sm p-4 rounded-[2rem] max-w-2xl mx-auto relative z-20">
            
            {/* Toggle Lordo/Netto */}
            <div className="flex bg-secondary p-1 rounded-xl w-full md:w-auto">
              <button 
                onClick={() => setTipoReddito('lordo')} 
                className={`flex-1 md:w-32 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tipoReddito === 'lordo' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Landmark className="w-4 h-4" /> Lordo
              </button>
              <button 
                onClick={() => setTipoReddito('netto')} 
                className={`flex-1 md:w-32 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tipoReddito === 'netto' ? 'bg-emerald-500 shadow text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Wallet className="w-4 h-4" /> Netto
              </button>
            </div>

            <div className="hidden md:block w-px h-8 bg-border"></div>

            {/* Toggle Mensilità */}
            <div className="flex bg-secondary p-1 rounded-xl w-full md:w-auto">
              {[
                { label: 'Annuale', val: 1 },
                { label: '12m', val: 12 },
                { label: '13m', val: 13 },
                { label: '14m', val: 14 }
              ].map(opt => (
                <button 
                  key={opt.val}
                  onClick={() => setMensilita(opt.val)} 
                  className={`flex-1 md:w-20 py-2.5 rounded-lg text-sm font-bold transition-all ${mensilita === opt.val ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dati Nazionali Riassuntivi */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="bg-card border px-6 py-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-5 h-5"/></div>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Totale Contribuenti</p>
                <p className="text-xl font-black">{calcoli.totaleContribuenti.toLocaleString('it-IT')}</p>
              </div>
            </div>
            <div className="bg-card border px-6 py-4 rounded-2xl flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tipoReddito === 'netto' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                {mensilita === 1 ? <Landmark className="w-5 h-5"/> : <CalendarDays className="w-5 h-5"/>}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Media Nazionale ({tipoReddito})</p>
                <p className="text-xl font-black">€{calcoli.mediaNazionale.toLocaleString('it-IT', {maximumFractionDigits: 0})}</p>
              </div>
            </div>
          </div>
        </header>

        {/* GRAFICO A FARFALLA */}
        <div className="bg-card border rounded-[2.5rem] shadow-sm p-4 md:p-10 relative overflow-hidden">
          
          <div className="grid grid-cols-[1fr_80px_1fr] md:grid-cols-[1fr_120px_1fr] gap-2 mb-8 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
            <div className="text-right flex items-center justify-end gap-2">
              <Users className="w-4 h-4"/> Popolazione
            </div>
            <div>Età</div>
            <div className="text-left flex items-center gap-2">
              Valore <ArrowRight className="w-4 h-4"/>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {calcoli.processedData.map((d: any) => {
              const popPct = (d.contribuenti / calcoli.maxContribuenti) * 100;
              const incPct = calcoli.maxReddito > 0 ? (d.valoreVisualizzato / calcoli.maxReddito) * 100 : 0;
              const slug = d.eta.replace(/\s*-\s*/g, '-').replace(/\s+/g, '-').toLowerCase();

              return (
                <Link href={`/analisi/fascia-eta/${slug}`} key={d.eta} className="block group">
                  <div className="grid grid-cols-[1fr_80px_1fr] md:grid-cols-[1fr_120px_1fr] gap-2 md:gap-4 items-center">
                    
                    {/* SINISTRA: Popolazione */}
                    <div className="flex justify-end h-10 md:h-12 relative">
                      <div 
                        className="bg-blue-100 dark:bg-blue-900/30 h-full rounded-l-xl absolute right-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors"
                        style={{ width: `${popPct}%` }}
                      >
                        <div className="absolute inset-y-0 right-0 bg-blue-500 w-1 rounded-full opacity-50"></div>
                      </div>
                      <div className="absolute inset-y-0 right-4 flex items-center text-[11px] md:text-sm font-bold text-blue-900 dark:text-blue-100 z-10">
                        {d.contribuenti.toLocaleString('it-IT')}
                      </div>
                    </div>

                    {/* CENTRO: Età */}
                    <div className="h-10 md:h-12 bg-secondary rounded-xl flex items-center justify-center text-xs md:text-sm font-black text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                      {d.eta}
                    </div>

                    {/* DESTRA: Reddito */}
                    <div className="flex justify-start h-10 md:h-12 relative">
                      <div 
                        className={`h-full rounded-r-xl absolute left-0 transition-colors ${tipoReddito === 'netto' ? 'bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50' : 'bg-primary/10 group-hover:bg-primary/20'}`}
                        style={{ width: `${incPct}%` }}
                      >
                        <div className={`absolute inset-y-0 left-0 w-1 rounded-full opacity-50 ${tipoReddito === 'netto' ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                      </div>
                      {/* RIGA CORRETTA: */}
<div className={`absolute inset-y-0 left-4 flex items-center text-[11px] md:text-sm font-bold z-10 flex-row gap-2 ${tipoReddito === 'netto' ? 'text-emerald-900 dark:text-emerald-100' : 'text-primary dark:text-blue-100'}`}>

                        €{d.valoreVisualizzato.toLocaleString('it-IT', {maximumFractionDigits: 0})}
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-2 transition-all transform group-hover:translate-x-1" />
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
          <div className="absolute top-20 bottom-10 left-1/2 w-px bg-border -translate-x-1/2 z-0"></div>
        </div>
      </div>
    </main>
  );
}
