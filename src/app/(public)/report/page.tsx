// app/report/page.tsx
import { redirect } from 'next/navigation';
import { calculateHealthScore, BenchmarkStats, ShiwData, EngineFlag, resolveShiwWealthTarget } from '@/lib/engines/health-score-engine';
import { healthScoreSchema, HealthScoreInput } from '@/lib/schemas/health-score';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck, TrendingUp, Wallet, ArrowRight, Home,
  CreditCard, MapPin, Users, Target, AlertTriangle, CheckCircle2
} from 'lucide-react';

// --- HELPERS E MAPPATURE ---

function getShiwAgeCategory(age: number): string {
  if (age <= 34) return '15-24';
  if (age <= 44) return '25-44';
  if (age <= 64) return '45-64';
  return 'oltre 64';
}

function getShiwJobCategory(jobCategory: string): string {
  const map: Record<string, string> = {
    'Dipendente': 'Dipendente',
    'Autonomo': 'Autonomo',
    'Pensionato': 'Pensionato',
    'Disoccupato': 'Disoccupato',
    'Studente': 'Studente',
  };
  return map[jobCategory] ?? jobCategory;
}

const fmt = (n: number) => '€' + Math.round(n).toLocaleString('it-IT');

function getScoreUI(score: number) {
  if (score >= 80) return { color: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/20', label: 'Eccellente', border: 'border-emerald-500/30' };
  if (score >= 60) return { color: 'text-blue-500', bg: 'bg-blue-500', glow: 'shadow-blue-500/20', label: 'Buono', border: 'border-blue-500/30' };
  if (score >= 40) return { color: 'text-amber-500', bg: 'bg-amber-500', glow: 'shadow-amber-500/20', label: 'Da Migliorare', border: 'border-amber-500/30' };
  return { color: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-red-500/20', label: 'Critico', border: 'border-red-500/30' };
}

/**
 * Genera una frase contestuale sotto lo score.
 * Usa flags + dati per dare all'utente un'ancora emotiva immediata
 * prima di leggere gli insight.
 */
function getScoreSubtitle(score: number, flags: EngineFlag[], input: HealthScoreInput): string {
  if (score >= 80) {
    if (flags.includes('INVESTMENT_GAP')) {
      return `Ottima gestione del flusso di cassa, ma hai liquidità in eccesso che potrebbe lavorare meglio per te.`;
    }
    return `Sei tra i profili più solidi per la tua categoria. Continua così.`;
  }
  if (score >= 60) {
    if (flags.includes('INVESTED_RUNWAY_BUFFER')) {
      return `Il tuo patrimonio investito è un punto di forza. Costruisci un cuscinetto liquido e il punteggio salirà.`;
    }
    return `Buone fondamenta. Qualche aggiustamento mirato può portarti all'eccellenza.`;
  }
  if (score >= 40) {
    return `Ci sono aree critiche da affrontare. Gli insight qui sotto indicano da dove partire.`;
  }
  return `Situazione che richiede attenzione immediata. Prioritizza i punti rossi.`;
}

/**
 * Genera il testo CTA personalizzato per il profilo.
 * Usa flags e metriche invece di solo la categoria lavorativa.
 */
function getCtaText(input: HealthScoreInput, flags: EngineFlag[], metrics: { liquidCash: number; investments: number }): string {
  if (flags.includes('INVESTMENT_GAP')) {
    const excess = fmt(metrics.liquidCash);
    return `Hai ${excess} fermi sul conto corrente che stanno perdendo potere d'acquisto. Un consulente può aiutarti a costruire un piano di allocazione su misura — senza rischi inutili.`;
  }
  if (flags.includes('INVESTED_RUNWAY_BUFFER')) {
    return `Hai un portafoglio investito solido ma poca liquidità immediata. Un consulente può aiutarti a bilanciare la struttura per dormire sonni tranquilli senza smobilizzare asset.`;
  }
  if (flags.includes('POSSIBLE_FAMILY_INPUT')) {
    return `Un'analisi personalizzata sul tuo nucleo familiare può fare la differenza. Porta i tuoi dati reali e costruiamo insieme un piano finanziario su misura.`;
  }

  // Fallback per categoria
  if (input.jobCategory === 'Dipendente') return `Pianifica il tuo futuro e ottimizza la pressione fiscale con strumenti dedicati ai lavoratori dipendenti.`;
  if (input.jobCategory === 'Autonomo') return `Proteggi la tua Partita IVA dagli imprevisti e gestisci la volatilità del reddito con una strategia solida.`;
  if (input.jobCategory === 'Pensionato') return `Metti al sicuro il tuo patrimonio e pianifica il passaggio generazionale con il supporto di un esperto.`;
  return `Crea la tua prima mappa finanziaria e inizia col piede giusto.`;
}


// --- MINI-COMPONENTI ---

function WorkerMetrics({ input, metrics }: { input: HealthScoreInput; metrics: any }) {
  const targetRunway = input.jobCategory === 'Autonomo' ? 12 : 6;
  const targetSavings = input.jobCategory === 'Autonomo' ? 0.25 : 0.20;

  return (
    <>
      <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border hover:-translate-y-1 transition-transform">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" /> Tasso di Risparmio
        </h3>
        <div className="flex justify-between items-end border-b border-border pb-6 mb-4">
          <div>
            <p className="text-4xl font-black">{(metrics.savingsRate * 100).toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-1">Il tuo dato</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-muted-foreground">{(targetSavings * 100).toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground mt-1">Target Ottimale</p>
          </div>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all"
            style={{ width: `${Math.min((metrics.savingsRate / targetSavings) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border hover:-translate-y-1 transition-transform">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" /> Fondo Emergenza
        </h3>
        <div className="flex justify-between items-end border-b border-border pb-6 mb-4">
          <div>
            <p className="text-4xl font-black">
              {metrics.runwayMonths > 99 ? '∞' : metrics.runwayMonths.toFixed(1)}
              <span className="text-lg font-medium text-muted-foreground ml-1">mesi</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">Autonomia liquida</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-muted-foreground">{targetRunway} mesi</p>
            <p className="text-sm text-muted-foreground mt-1">Target Sicurezza</p>
          </div>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all"
            style={{ width: `${Math.min((metrics.runwayMonths / targetRunway) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border hover:-translate-y-1 transition-transform md:col-span-2">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-500" /> Composizione Patrimonio Liquido
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Liquidità Immediata</p>
            <p className="text-2xl font-black">{fmt(metrics.liquidCash)}</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Investimenti</p>
            <p className="text-2xl font-black text-blue-600">{fmt(metrics.investments)}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function PensionerMetrics({ metrics, input }: { metrics: any; input: HealthScoreInput }) {
  return (
    <>
      <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border md:col-span-2">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-purple-500" /> Capitale di Protezione
        </h3>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6 mb-4">
          <div>
            <p className="text-5xl font-black">{fmt(metrics.netWorth)}</p>
            <p className="text-sm text-muted-foreground mt-1">Patrimonio netto disponibile</p>
          </div>
          <div className="text-left md:text-right p-4 bg-secondary/50 rounded-xl">
            <p className="text-sm font-bold">Liquidità: {fmt(metrics.liquidCash)}</p>
            <p className="text-sm font-bold text-blue-600 mt-1">Investimenti: {fmt(metrics.investments)}</p>
          </div>
        </div>
      </div>

      {input.consumerDebt === 0 ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2rem] border border-emerald-200 dark:border-emerald-900/30 md:col-span-2 flex items-center gap-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 flex-shrink-0" />
          <div>
            <h4 className="text-emerald-800 dark:text-emerald-400 font-black text-lg">Libertà dai Debiti</h4>
            <p className="text-emerald-700/80 dark:text-emerald-400/80 text-sm mt-1">Non hai debiti al consumo. Questa è la regola d'oro per una pensione serena.</p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2rem] border border-red-200 dark:border-red-900/30 md:col-span-2 flex items-center gap-4">
          <AlertTriangle className="w-10 h-10 text-red-500 flex-shrink-0" />
          <div>
            <h4 className="text-red-800 dark:text-red-400 font-black text-lg">Allarme Debito</h4>
            <p className="text-red-700/80 dark:text-red-400/80 text-sm mt-1">
              Hai {fmt(input.consumerDebt)} di debiti. Durante il decumulo i debiti erodono il capitale in modo accelerato. Estinguili subito.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Barra di confronto peer normalizzata.
 *
 * Fix bug originale: la formula `* 50` posizionava la barra utente al 50%
 * quando era pari alla media, ma produceva valori controintuitivi per chi
 * era molto sotto (es. 17% invece di "sei al 34% della media").
 *
 * Nuova logica: scala lineare dove:
 *   - la barra utente occupa (userValue / maxValue) * 100% della larghezza totale
 *   - la linea verticale "media" è posizionata a (avgValue / maxValue) * 100%
 *   - maxValue = max(userValue, avgValue) * 1.2 per dare sempre respiro visivo
 *
 * Risultato: utente e media sono sempre visivamente proporzionali tra loro.
 */
function ComparisonBar({
  userValue,
  avgValue,
  userLabel,
  avgLabel,
  color = 'bg-indigo-500',
  bgColor = 'bg-indigo-200',
}: {
  userValue: number;
  avgValue: number;
  userLabel: string;
  avgLabel: string;
  color?: string;
  bgColor?: string;
}) {
  const maxValue = Math.max(userValue, avgValue) * 1.2 || 1;
  const userPct = Math.min((userValue / maxValue) * 100, 100);
  const avgPct = Math.min((avgValue / maxValue) * 100, 100);

  return (
    <div>
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${bgColor} w-full`} />
        <div
          className={`absolute top-0 left-0 h-full ${color} transition-all`}
          style={{ width: `${userPct}%` }}
        />
        {/* Linea media */}
        <div
          className="absolute top-0 h-full w-0.5 bg-black dark:bg-white z-10 opacity-60"
          style={{ left: `${avgPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-2 text-muted-foreground">
        <span>{userLabel}</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0.5 h-3 bg-black dark:bg-white opacity-60" />
          {avgLabel}
        </span>
      </div>
    </div>
  );
}

function PeerComparison({
  input,
  benchmark,
  metrics,
  refArea,
  shiwWealthTarget,
}: {
  input: HealthScoreInput;
  benchmark: BenchmarkStats;
  metrics: any;
  refArea: string;
  shiwWealthTarget: number;
}) {
  const userTotalAssets = metrics.liquidCash + metrics.investments;

  return (
    <div className="bg-card rounded-[2.5rem] shadow-xl border border-border p-8 mt-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-6 h-6 text-indigo-500" />
        <h2 className="text-2xl font-black">Come ti posizioni (L'Arena)</h2>
      </div>

      <div className="space-y-8">
        {/* Confronto Reddito Locale */}
        {input.jobCategory !== 'Disoccupato' && input.jobCategory !== 'Pensionato' && input.jobCategory !== 'Studente' && (
          <div>
            <p className="text-sm font-bold mb-2 flex items-center gap-1.5 capitalize">
              <MapPin className="w-4 h-4 text-muted-foreground" /> Reddito vs {refArea}
            </p>
            <ComparisonBar
              userValue={input.monthlyNetIncome}
              avgValue={benchmark.localAvgIncome}
              userLabel={`Tu: ${fmt(input.monthlyNetIncome)}/mese`}
              avgLabel={`Media: ${fmt(benchmark.localAvgIncome)}/mese`}
              color="bg-indigo-500"
              bgColor="bg-indigo-100 dark:bg-indigo-900/30"
            />
          </div>
        )}

        {/* Confronto Asset Liquidi vs Coetanei */}
        <div>
          <p className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-muted-foreground" /> Asset Liquidi vs Coetanei (Italia)
          </p>
          <ComparisonBar
            userValue={userTotalAssets}
            avgValue={shiwWealthTarget}
            userLabel={`Tu: ${fmt(userTotalAssets)}`}
            avgLabel={`Media coetanei: ${fmt(shiwWealthTarget)}`}
            color="bg-emerald-500"
            bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          />
        </div>

        {/* Info casa */}
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Situazione Abitativa:</strong> A {input.age} anni in Italia, il{' '}
            <strong>{benchmark.ageData.perc_proprieta.toFixed(0)}%</strong> possiede una casa, mentre il{' '}
            <strong>{benchmark.ageData.perc_affitto.toFixed(0)}%</strong> vive in affitto. Tu hai selezionato:{' '}
            <span className="font-bold text-foreground">{input.housingStatus}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}


// --- MAIN SERVER COMPONENT ---

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const params = await searchParams;
  const payload = params.d;

  if (!payload) redirect('/score');

  let inputData: HealthScoreInput;
  try {
    const decoded = JSON.parse(decodeURIComponent(Buffer.from(payload, 'base64').toString('utf-8')));
    inputData = healthScoreSchema.parse(decoded);
  } catch (e) {
    redirect('/score');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const ageCategory = getShiwAgeCategory(inputData.age);
  const jobCategory = getShiwJobCategory(inputData.jobCategory);

  const [shiwAgeResponse, shiwJobResponse] = await Promise.all([
    supabase.from('shiw_benchmarks').select('*').ilike('categoria', ageCategory).ilike('tipo_categoria', 'eta').maybeSingle(),
    supabase.from('shiw_benchmarks').select('*').ilike('categoria', jobCategory).ilike('tipo_categoria', 'lavoro').maybeSingle(),
  ]);

  // Fallback Comune → Provincia
  let localLordoAnnuo = 25000;
  let refAreaName = inputData.comune;

  const { data: mefComune } = await supabase
    .from('mef_redditi_comuni')
    .select('reddito_medio_euro, numero_contribuenti, sigla_provincia')
    .ilike('comune', `%${inputData.comune}%`)
    .limit(1)
    .maybeSingle();

  if (mefComune && mefComune.numero_contribuenti >= 1000) {
    localLordoAnnuo = mefComune.reddito_medio_euro;
  } else if (mefComune?.sigla_provincia) {
    const { data: mefProv } = await supabase
      .from('mef_redditi_province')
      .select('reddito_medio')
      .eq('sigla_provincia', mefComune.sigla_provincia)
      .maybeSingle();

    if (mefProv) {
      localLordoAnnuo = mefProv.reddito_medio;
      refAreaName = `Prov. di ${mefComune.sigla_provincia}`;
    } else {
      localLordoAnnuo = mefComune.reddito_medio_euro || 25000;
    }
  }

  const localNetIncomeMonthly = (localLordoAnnuo * 0.70) / 12;
  const defaultShiw: ShiwData = {
    patrimonio_netto: 0, attivita_finanziarie: 0, debito_medio: 0,
    perc_proprieta: 0, perc_affitto: 0,
  };

  const benchmarkStats: BenchmarkStats = {
    localAvgIncome: localNetIncomeMonthly,
    ageData: shiwAgeResponse.data || defaultShiw,
    jobData: shiwJobResponse.data || defaultShiw,
    avgSavingsRate: 0.10,
  };

  const result = calculateHealthScore(inputData, benchmarkStats);
  const ui = getScoreUI(result.score);

  // shiwWealthTarget calcolato con lo stesso helper del motore (allineato, no doppio calcolo)
  const annualIncome = inputData.monthlyNetIncome * 12;
  const shiwWealthTarget = resolveShiwWealthTarget(
    benchmarkStats.ageData,
    benchmarkStats.jobData,
    annualIncome
  );

  const scoreSubtitle = getScoreSubtitle(result.score, result.flags, inputData);
  const ctaText = getCtaText(inputData, result.flags, result.metrics);

  // 🌟 NUOVO: Creiamo un nuovo pacchetto che contiene i dati vecchi + i calcoli nuovi
  // 🌟 Aggiunto encodeURIComponent per allinearsi perfettamente a chi legge i dati
  const enrichedPayload = Buffer.from(
    encodeURIComponent(
      JSON.stringify({
        ...inputData,
        score: result.score,
        triage: result.triage
      })
    )
  ).toString('base64');

  return (
    <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/5 via-background to-background -z-10 h-full" />

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* BLOCCO 1: Hero */}
        <div className={`bg-card p-10 rounded-[2.5rem] shadow-xl border ${ui.border} text-center relative overflow-hidden ${ui.glow}`}>
          <div className="inline-flex items-center gap-2 bg-secondary text-muted-foreground text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <ShieldCheck className="w-4 h-4" /> Analisi Completata
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Il tuo Health Score come <span className="text-foreground">{inputData.jobCategory}</span>
          </h1>
          <div className={`text-8xl md:text-[9rem] font-black tracking-tighter leading-none mb-4 ${ui.color}`}>
            {result.score}
            <span className="text-4xl text-muted-foreground font-medium ml-2">/100</span>
          </div>
          <div className={`inline-block px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 border ${ui.color} ${ui.border}`}>
            Stato: {ui.label}
          </div>
          {/* Sottotitolo contestuale — fix mancante nel report originale */}
          <p className="text-muted-foreground text-base max-w-xl mx-auto font-medium mb-3">
            {scoreSubtitle}
          </p>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Analisi calibrata sugli standard di un <strong className="text-foreground">{inputData.jobCategory.toLowerCase()}</strong> di{' '}
            <strong className="text-foreground">{inputData.age} anni</strong> residente a{' '}
            <strong className="text-foreground capitalize">{inputData.comune}</strong>.
          </p>
        </div>

        {/* BLOCCO 2: Metriche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inputData.jobCategory === 'Pensionato' && (
            <PensionerMetrics metrics={result.metrics} input={inputData} />
          )}
          {(inputData.jobCategory === 'Dipendente' || inputData.jobCategory === 'Autonomo') && (
            <WorkerMetrics input={inputData} metrics={result.metrics} />
          )}
          {(inputData.jobCategory === 'Disoccupato' || inputData.jobCategory === 'Studente') && (
            <div className="bg-card p-8 rounded-[2rem] border border-border md:col-span-2 text-center">
              <h3 className="text-2xl font-black mb-2">Punto di Partenza</h3>
              <p className="text-muted-foreground">
                Stai costruendo le tue fondamenta. Hai{' '}
                <strong className="text-foreground">{fmt(result.metrics.liquidCash)}</strong> di liquidità per gestire la transizione.
              </p>
            </div>
          )}
        </div>

        {/* BLOCCO 3: L'Arena — con ComparisonBar fissa e shiwWealthTarget allineato */}
        <PeerComparison
          input={inputData}
          benchmark={benchmarkStats}
          metrics={result.metrics}
          refArea={refAreaName}
          shiwWealthTarget={shiwWealthTarget}
        />

        {/* BLOCCO 4: Insights */}
        <div className="bg-card rounded-[2.5rem] shadow-xl border border-border overflow-hidden mt-8">
          <div className="p-8 border-b border-border bg-secondary/30">
            <h2 className="text-2xl font-black">Il verdetto dell'Algoritmo</h2>
          </div>
          <div className="divide-y divide-border">
            {result.insights.map((insight, idx) => (
              <div key={idx} className="p-8 flex gap-6 items-start hover:bg-secondary/20 transition-colors">
                <div
                  className={`mt-1.5 h-4 w-4 rounded-full flex-shrink-0 shadow-lg ${
                    insight.status === 'success' ? 'bg-emerald-500 shadow-emerald-500/40' :
                    insight.status === 'warning' ? 'bg-amber-400 shadow-amber-400/40' :
                    insight.status === 'info'    ? 'bg-blue-500 shadow-blue-500/40' :
                                                   'bg-red-500 shadow-red-500/40'
                  }`}
                />
                <div>
                  <h4 className="text-lg font-bold mb-2">{insight.title}</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCCO 5: CTA personalizzata */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-10 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden mt-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-3xl font-black mb-4 relative z-10">Vuoi fare il salto di qualità?</h3>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto font-medium text-lg relative z-10">
            {ctaText}{' '}
            Richiedi una <strong>Sessione Strategica Gratuita (valore €150)</strong> con un consulente verificato della nostra rete.
          </p>
          <a
            href={`/strategy?d=${enrichedPayload}`}
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold py-4 px-10 rounded-2xl transition-all transform hover:-translate-y-1 shadow-lg relative z-10 mx-auto"
          >
            Prenota la Sessione Gratuita <ArrowRight className="w-5 h-5" />
          </a>
        </div>

      </div>
    </main>
  );
}