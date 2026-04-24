// app/report/page.tsx
import { redirect } from 'next/navigation';
import { calculateHealthScore } from '@/lib/engines/health-score-engine';
import { healthScoreSchema } from '@/lib/schemas/health-score';

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const params = await searchParams;
  const payload = params.d;

  if (!payload) {
    redirect('/score'); // Rimbalza se non c'è payload
  }

  let inputData;
  try {
    const decoded = JSON.parse(decodeURIComponent(Buffer.from(payload, 'base64').toString('utf-8')));
    inputData = healthScoreSchema.parse(decoded);
  } catch (e) {
    console.error("Errore decodifica:", e);
    console.error("Payload ricevuto:", payload);
    redirect('/score');
  }

  // Motore di calcolo Server-Side
  const result = calculateHealthScore(inputData);

  // Helper per il colore del punteggio
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-600';
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Score */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <h1 className="text-xl font-medium text-slate-500 uppercase tracking-wide">Il tuo Health Score</h1>
          <div className={`text-8xl font-black mt-4 mb-2 tracking-tighter ${getScoreColor(result.score)}`}>
            {result.score}
            <span className="text-3xl text-slate-300 font-medium">/100</span>
          </div>
          <p className="text-slate-600 max-w-lg mx-auto">
            Questo score riflette la tua resilienza e il tuo flusso di cassa. Non è un giudizio, ma un punto di partenza.
          </p>
        </div>

        {/* Confronto Peers & Metriche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-4">Tasso di Risparmio</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-slate-900">{(result.metrics.savingsRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-slate-500 mt-1">Il tuo risparmio</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-slate-400">{(result.benchmark.avgSavingsRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">Media coetanei</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-4">Patrimonio Netto</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-slate-900">€{result.metrics.netWorth.toLocaleString('it-IT')}</p>
                <p className="text-sm text-slate-500 mt-1">La tua liquidità</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-slate-400">€{result.benchmark.avgNetWorth.toLocaleString('it-IT')}</p>
                <p className="text-sm text-slate-400 mt-1">Media coetanei</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">I tuoi 3 Insight</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {result.insights.map((insight, idx) => (
              <div key={idx} className="p-6 flex gap-4 items-start hover:bg-slate-50 transition-colors">
                <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                  insight.status === 'success' ? 'bg-emerald-500' : 
                  insight.status === 'warning' ? 'bg-amber-400' : 'bg-red-500'
                }`} />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{insight.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder CTA / Lead Gen */}
        <div className="bg-slate-900 text-white p-8 rounded-2xl text-center shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Vuoi il report completo e personalizzato?</h3>
          <p className="text-slate-400 mb-6">Scarica il PDF con la strategia per migliorare il tuo score e i prodotti suggeriti per te.</p>
          {/* Qui andrà il form email + Supabase che costruiremo dopo */}
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg transition-colors">
            Invia Report via Email
          </button>
        </div>

      </div>
    </main>
  );
}