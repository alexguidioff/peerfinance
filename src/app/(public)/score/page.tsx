// app/score/page.tsx
import { Suspense } from 'react'
import ScoreForm from '@/components/score/ScoreForm'

import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Calcola il tuo Financial Health Score | Peerfinance',
  description: 'Scopri il tuo stato di salute finanziaria e confrontalo con la media italiana in meno di 5 minuti.',
};

export default function ScorePage() {
  return (
    <main className="relative min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden">
      
      {/* Sfondo decorativo coerente con il resto del sito */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/10 via-background to-background -z-10 h-full" />

      <div className="w-full max-w-3xl space-y-10 relative z-10">
        
        {/* Header della pagina */}
        <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700 space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            100% Anonimo e Sicuro
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Il tuo <span className="text-emerald-600">Health Score</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium">
            Scopri come sei posizionato rispetto a chi vive nel tuo stesso comune e fa il tuo stesso lavoro. 
            I dati vengono processati <span className="text-foreground font-bold">solo sul tuo dispositivo</span> per la massima privacy.
          </p>
        </div>
        
        {/* Il Form che abbiamo aggiornato prima */}
        <Suspense fallback={<div>Caricamento form...</div>}>
      <ScoreForm />
    </Suspense>
        
      </div>
    </main>
  );
}
