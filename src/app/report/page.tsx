// app/report/page.tsx
import { redirect } from 'next/navigation';
import { calculateHealthScore, BenchmarkStats, ShiwData } from '@/lib/engines/health-score-engine';
import { healthScoreSchema } from '@/lib/schemas/health-score';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, TrendingUp, Wallet, ArrowRight, Home, CreditCard } from 'lucide-react';

function getShiwAgeCategory(age: number): string {
  if (age <= 34) return '15-24';   // ← fix: SHIW usa "34 and under", non 24
  if (age <= 44) return '25-44';
  if (age <= 64) return '45-64';
  return 'oltre 64';
}

// Mapping jobCategory → categoria SHIW nel DB
function getShiwJobCategory(jobCategory: string): string {
  const map: Record<string, string> = {
    'Dipendente':  'Dipendente',
    'Autonomo':    'Autonomo',
    'Pensionato':  'Pensionato',
    'Disoccupato': 'Disoccupato',
  };
  return map[jobCategory] ?? jobCategory;
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const params = await searchParams;
  const payload = params.d;

  if (!payload) redirect('/score');

  let inputData;
  try {
    const decoded = JSON.parse(decodeURIComponent(Buffer.from(payload, 'base64').toString('utf-8')));
    inputData = healthScoreSchema.parse(decoded);
  } catch (e) {
    console.error("Errore decodifica:", e);
    redirect('/score');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const ageCategory = getShiwAgeCategory(inputData.age);
  const jobCategory = getShiwJobCategory(inputData.jobCategory);

  // Query MEF + SHIW in parallelo
  const [mefResponse, shiwAgeResponse, shiwJobResponse] = await Promise.all([
    supabase
      .from('mef_redditi_comuni')
      .select('reddito_medio_euro')
      .ilike('comune', inputData.comune)
      .limit(1)
      .single(),
    supabase
      .from('shiw_benchmarks')
      .select('*')
      .eq('categoria', ageCategory)
      .eq('tipo_categoria', 'eta')   // ← filtro aggiunto per evitare ambiguità
      .single(),
    supabase
      .from('shiw_benchmarks')
      .select('*')
      .eq('categoria', jobCategory)
      .eq('tipo_categoria', 'lavoro') // ← filtro aggiunto
      .single(),
  ]);

  // Log in dev per debug
  if (process.env.NODE_ENV === 'development') {
    console.log('ageCategory:', ageCategory, shiwAgeResponse.error);
    console.log('jobCategory:', jobCategory, shiwJobResponse.error);
  }

  const localLordoAnnuo = mefResponse.data?.reddito_medio_euro || 25000;
  const localNetIncomeMonthly = (localLordoAnnuo * 0.70) / 12;

  const defaultShiw: ShiwData = {
    patrimonio_netto: 0,
    attivita_finanziarie: 0,
    debito_medio: 0,
    perc_proprieta: 0,
    perc_affitto: 0,
  };

  const benchmarkStats: BenchmarkStats = {
    localAvgIncome: localNetIncomeMonthly,
    ageData: shiwAgeResponse.data || defaultShiw,
    jobData: shiwJobResponse.data || defaultShiw,
    avgSavingsRate: 0.10,
  };

  const result = calculateHealthScore(inputData, benchmarkStats);

  const getScoreUI = (score: number) => {
    if (score >= 80) return { color: 'text-emerald-500', glow: 'shadow-emerald-500/20', label: 'Eccellente' };
    if (score >= 60) return { color: 'text-blue-500',   glow: 'shadow-blue-500/20',    label: 'Buono' };
    if (score >= 40) return { color: 'text-amber-500',  glow: 'shadow-amber-500/20',   label: 'Da Migliorare' };
    return             { color: 'text-red-500',    glow: 'shadow-red-500/20',     label: 'Critico' };
  };

  const ui = getScoreUI(result.score);

  // Dati di supporto per le card
  const avgLiquidita = (
    (benchmarkStats.ageData.attivita_finanziarie + benchmarkStats.jobData.attivita_finanziarie) / 2
  );
  const avgDebito = (
    (benchmarkStats.ageData.debito_medio + benchmarkStats.jobData.debito_medio) / 2
  );
  // perc_affitto per età è più significativa di quella per lavoro
  const percAffittoEta = benchmarkStats.ageData.perc_affitto;
  const percProprietaEta = benchmarkStats.ageData.perc_proprieta;

  const fmt = (n: number) => '€' + Math.round(n).toLocaleString('it-IT');

  return (
    <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/5 via-background to-background -z-10 h-full" />

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── Score Hero ───────────────────────────────────────────── */}
        <div className={`bg-card p-10 rounded-[2.5rem] shadow-xl border border-border text-center relative overflow-hidden ${ui.glow}`}>
          <div className="inline-flex items-center gap-2 bg-secondary text-muted-foreground text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <ShieldCheck className="w-4 h-4" /> Risultato Analisi
          </div>
          <h1 className="text-xl font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Il tuo Health Score
          </h1>
          <div className={`text-8xl md:text-[9rem] font-black tracking-tighter leading-none mb-4 ${ui.color}`}>
            {result.score}
            <span className="text-4xl text-muted-foreground font-medium ml-2">/100</span>
          </div>
          <div className={`inline-block px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 border ${ui.color}`}>
            Stato: {ui.label}
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
            Analisi basata su età, categoria lavorativa e media dei contribuenti di{' '}
            <span className="font-bold capitalize">{inputData.comune}</span>.
          </p>
        </div>

        {/* ── Metriche principali ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Tasso di risparmio */}
          <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border hover:-translate-y-1 transition-transform">
            <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Tasso di Risparmio
            </h3>
            <div className="flex justify-between items-end border-b border-border pb-6 mb-4">
              <div>
                <p className="text-4xl font-black">{(result.metrics.savingsRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Il tuo dato</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-muted-foreground">~10%</p>
                <p className="text-sm text-muted-foreground mt-1">Media ISTAT</p>
              </div>
            </div>
            {/* Barra visiva */}
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(result.metrics.savingsRate * 100 * 4, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target {inputData.jobCategory === 'Autonomo' ? '25%' : '20%'} per un {inputData.jobCategory.toLowerCase()}
            </p>
          </div>

          {/* Liquidità */}
          <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border hover:-translate-y-1 transition-transform">
            <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-500" /> Liquidità Netta
            </h3>
            <div className="flex justify-between items-end border-b border-border pb-6 mb-4">
              <div>
                <p className="text-4xl font-black">{fmt(result.metrics.netWorth)}</p>
                <p className="text-sm text-muted-foreground mt-1">La tua liquidità</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-muted-foreground">{fmt(avgLiquidita)}</p>
                <p className="text-sm text-muted-foreground mt-1">Media tuoi pari*</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * Media attività finanziarie per età e categoria · Fonte Banca d'Italia SHIW 2022
            </p>
          </div>

          {/* Fondo Emergenza */}
          <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border hover:-translate-y-1 transition-transform">
            <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Fondo Emergenza
            </h3>
            <div className="flex justify-between items-end border-b border-border pb-6 mb-4">
              <div>
                <p className="text-4xl font-black">
                  {result.metrics.runwayMonths > 99 ? '∞' : result.metrics.runwayMonths.toFixed(1)}
                  <span className="text-lg font-medium text-muted-foreground ml-1">mesi</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">La tua autonomia</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-muted-foreground">
                  {inputData.jobCategory === 'Autonomo' ? '12' : '6'} mesi
                </p>
                <p className="text-sm text-muted-foreground mt-1">Target consigliato</p>
              </div>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min((result.metrics.runwayMonths / (inputData.jobCategory === 'Autonomo' ? 12 : 6)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Situazione Abitativa — fix del 0.0% */}
          <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border hover:-translate-y-1 transition-transform">
            <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Home className="w-4 h-4 text-purple-500" /> Situazione Abitativa
            </h3>
            <p className="text-2xl font-black mb-4 capitalize">{inputData.housingStatus}</p>
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proprietari (tua fascia età)</span>
                <span className="font-bold">
                  {percProprietaEta > 0 ? `${percProprietaEta.toFixed(1)}%` : 'N/D'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In affitto (tua fascia età)</span>
                <span className="font-bold">
                  {percAffittoEta > 0 ? `${percAffittoEta.toFixed(1)}%` : 'N/D'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Altro (famiglia/usufrutto)</span>
                <span className="font-bold">
                  {percProprietaEta > 0 && percAffittoEta > 0
                    ? `${(100 - percProprietaEta - percAffittoEta).toFixed(1)}%`
                    : 'N/D'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Fonte Banca d'Italia SHIW 2022</p>
          </div>
        </div>

        {/* ── Debito ───────────────────────────────────────────────── */}
        {inputData.consumerDebt > 0 && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-8 rounded-[2rem]">
            <h3 className="text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Debito al Consumo
            </h3>
            <div className="flex justify-between items-end border-b border-red-200 dark:border-red-900/30 pb-6 mb-4">
              <div>
                <p className="text-4xl font-black text-red-700 dark:text-red-400">
                  {fmt(inputData.consumerDebt)}
                </p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">Il tuo debito</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600/70 dark:text-red-400/70">
                  {fmt(avgDebito)}
                </p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
                  Media tuoi pari*
                </p>
              </div>
            </div>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              * Il dato SHIW include mutui e prestiti. Il debito al consumo puro (carte revolving,
              prestiti personali) è in media circa il 15-20% del totale. Estingui prima i debiti
              con tasso più alto.
            </p>
          </div>
        )}

        {/* ── Insights dinamici ────────────────────────────────────── */}
        <div className="bg-card rounded-[2.5rem] shadow-xl border border-border overflow-hidden">
          <div className="p-8 border-b border-border bg-secondary/30">
            <h2 className="text-2xl font-black">I tuoi Insight Personalizzati</h2>
          </div>
          <div className="divide-y divide-border">
            {result.insights.map((insight, idx) => (
              <div key={idx} className="p-8 flex gap-6 items-start hover:bg-secondary/20 transition-colors">
                <div className={`mt-1.5 h-4 w-4 rounded-full flex-shrink-0 shadow-lg ${
                  insight.status === 'success' ? 'bg-emerald-500 shadow-emerald-500/40' :
                  insight.status === 'warning' ? 'bg-amber-400 shadow-amber-400/40' :
                  insight.status === 'info'    ? 'bg-blue-500 shadow-blue-500/40' :
                  'bg-red-500 shadow-red-500/40'
                }`} />
                <div>
                  <h4 className="text-lg font-bold mb-2">{insight.title}</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-3xl font-black mb-4 relative z-10">Migliora il tuo Score</h3>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto font-medium text-lg relative z-10">
            Vuoi ricevere il report completo in PDF con le strategie per ottimizzare le tue
            finanze e i prodotti raccomandati?
          </p>
          <button className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-2xl transition-all transform hover:-translate-y-1 shadow-lg relative z-10 flex items-center justify-center gap-2 mx-auto">
            Richiedi Report <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </main>
  );
}