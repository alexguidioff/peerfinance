import { redirect } from 'next/navigation';
import { healthScoreSchema } from '@/lib/schemas/health-score';
import StrategyForm from '@/components/strategy/StrategyForm';
import { Target } from 'lucide-react';

export default async function StrategyPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const params = await searchParams;
  const payload = params.d;

  // Se atterra qui senza dati, lo rimandiamo allo score iniziale
  if (!payload) {
    redirect('/score');
  }

  let prefilledData;
  try {
    const decoded = JSON.parse(decodeURIComponent(Buffer.from(payload, 'base64').toString('utf-8')));
    // Zod ora fa passare tutto, inclusi score e triage!
    prefilledData = healthScoreSchema.parse(decoded);
  } catch (e) {
    console.error("Errore decodifica payload strategy:", e);
    redirect('/score');
  }
  

  


  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Intestazione */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-2 text-emerald-600 dark:text-emerald-400">
            <Target className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Analisi Strategica Avanzata
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium">
            Completa il tuo profilo per sbloccare il report PDF dettagliato e ricevere un'analisi personalizzata dai nostri partner (Consulenti Finanziari o Career Coach).
          </p>
        </div>

        {/* Qui montiamo il Client Component del Form Multi-Step.
          Passiamo i "prefilledData", lo "score" e il "triage" recuperati dal payload.
        */}
        <StrategyForm 
    prefilledData={prefilledData} 
    healthScore={prefilledData.score} 
    triage={prefilledData.triage} 
  />

      </div>
    </main>
  );
}