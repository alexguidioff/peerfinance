// lib/engines/health-score-engine.ts
import { HealthScoreInput } from '../schemas/health-score';

// Struttura dei dati presi dalla tabella SHIW di Supabase
export interface ShiwData {
  patrimonio_netto: number;
  attivita_finanziarie: number;
  debito_medio: number;
  perc_proprieta: number;
  perc_affitto: number;
}

// Struttura che la pagina /report passerà a questa funzione
export interface BenchmarkStats {
  localAvgIncome: number; // Dal MEF (convertito in netto mensile)
  ageData: ShiwData;      // Da SHIW (es. fascia 25-44)
  jobData: ShiwData;      // Da SHIW (es. Dipendente)
  avgSavingsRate?: number; // Da ISTAT (Opzionale, usiamo un fallback se manca)
}

export function calculateHealthScore(input: HealthScoreInput, benchmark: BenchmarkStats) {
  
  if (!benchmark || !benchmark.ageData || !benchmark.jobData) {
    throw new Error("Dati di benchmark mancanti per il calcolo dello score.");
  }

  // --- 1. VARIABILI BASE DELL'UTENTE ---
  const savingsRate = input.monthlyNetIncome > 0 
    ? (input.monthlyNetIncome - input.monthlyFixedExpenses) / input.monthlyNetIncome 
    : 0;
  
  const runwayMonths = input.monthlyFixedExpenses > 0 
    ? input.totalSavings / input.monthlyFixedExpenses 
    : 999; 
    
  // Patrimonio netto "liquido" (Risparmi - Debiti al consumo)
  const liquidNetWorth = input.totalSavings - input.consumerDebt;


  // --- 2. BENCHMARK PERSONALIZZATI (Mix Età + Lavoro) ---
  // Tasso di risparmio medio ISTAT (Fallback realistico al 10% se il sito ISTAT è down)
  const nationalSavingsRate = benchmark.avgSavingsRate || 0.10; 

  // Creiamo un benchmark "Su misura" mediando i dati anagrafici e professionali
  const customLiquidWealthTarget = (benchmark.ageData.attivita_finanziarie + benchmark.jobData.attivita_finanziarie) / 2;


  // --- 3. MATEMATICA DELLO SCORE (40-40-20) ---
  
  // A. SCORE TASSO DI RISPARMIO (Max 40)
  let sRateScore = 0;
  const targetSavingsRate = input.jobCategory === 'Autonomo' ? 0.25 : 0.20; 
  if (savingsRate >= targetSavingsRate) sRateScore = 40;
  else if (savingsRate > 0) sRateScore = 40 * (savingsRate / targetSavingsRate);

  // B. SCORE RUNWAY / FONDO EMERGENZA (Max 40)
  let sRunwayScore = 0;
  const targetRunway = input.jobCategory === 'Autonomo' ? 12 : 6;
  if (runwayMonths >= targetRunway) sRunwayScore = 40;
  else if (runwayMonths > 0) sRunwayScore = 40 * (runwayMonths / targetRunway);

  // C. SCORE PATRIMONIO LIQUIDO (Max 20)
  let sNetWorthScore = 0;
  if (liquidNetWorth >= customLiquidWealthTarget) sNetWorthScore = 20;
  else if (liquidNetWorth > 0) sNetWorthScore = 20 * (liquidNetWorth / customLiquidWealthTarget);

  // D. PENALITÀ DEBITO
  let penalty = 0;
  if (input.consumerDebt > 0) penalty += 5; // -5 punti se ci sono debiti cattivi

  const totalScore = Math.min(Math.max(Math.round(sRateScore + sRunwayScore + sNetWorthScore - penalty), 0), 100);


  // --- 4. GENERAZIONE INSIGHTS DINAMICI ---
  const insights = [];

  // Insight 1: Flusso di cassa e Confronto col Comune (MEF)
  const diffIncome = benchmark.localAvgIncome > 0 
    ? ((input.monthlyNetIncome - benchmark.localAvgIncome) / benchmark.localAvgIncome) * 100 
    : 0;
  
  let cashflowText = savingsRate >= targetSavingsRate 
    ? `Eccellente! Risparmi il ${(savingsRate * 100).toFixed(0)}% del tuo reddito, il target ideale per un ${input.jobCategory.toLowerCase()}. ` 
    : savingsRate >= nationalSavingsRate 
    ? `Risparmi il ${(savingsRate * 100).toFixed(0)}%, superiore alla media nazionale dell'ISTAT (~${(nationalSavingsRate * 100).toFixed(0)}%), ma cerca di ridurre le uscite fisse. ` 
    : `Il tuo tasso di risparmio (${(savingsRate * 100).toFixed(0)}%) è sotto la media nazionale. Analizza bene le tue uscite. `;

  if (diffIncome > 0) {
    cashflowText += `Inoltre, il tuo reddito mensile è del ${diffIncome.toFixed(0)}% superiore alla media dei contribuenti di ${input.comune}.`;
  } else if (diffIncome < 0) {
    cashflowText += `Attualmente il tuo reddito è del ${Math.abs(diffIncome).toFixed(0)}% inferiore alla media dichiarata a ${input.comune}.`;
  }

  insights.push({
    title: "Flusso di cassa e Reddito Locale",
    text: cashflowText,
    status: savingsRate >= targetSavingsRate ? "success" : savingsRate >= nationalSavingsRate ? "warning" : "danger"
  });

  // Insight 2: Fondo di emergenza
  insights.push({
    title: "Fondo di emergenza (Runway)",
    text: runwayMonths >= targetRunway 
      ? `Hai ${runwayMonths.toFixed(1)} mesi di autonomia. Sei blindato contro gli imprevisti.` 
      : runwayMonths >= (targetRunway / 2) 
      ? `Hai un cuscinetto di ${runwayMonths.toFixed(1)} mesi. Come ${input.jobCategory.toLowerCase()}, punta ad arrivare ad almeno ${targetRunway} mesi.` 
      : "Il tuo cuscinetto di liquidità è pericolosamente basso. Priorità: accumulare liquidità sul conto.",
    status: runwayMonths >= targetRunway ? "success" : runwayMonths >= (targetRunway / 2) ? "warning" : "danger"
  });

  // Insight 3: Confronto Ricchezza Liquida (SHIW)
  insights.push({
    title: "Liquidità vs Coetanei",
    text: liquidNetWorth >= customLiquidWealthTarget 
      ? `Hai una liquidità netta di €${liquidNetWorth.toLocaleString('it-IT')}. Sei ben al di sopra della media dei tuoi coetanei/colleghi (stimata a €${customLiquidWealthTarget.toLocaleString('it-IT')}).` 
      : liquidNetWorth > 0 
      ? `La tua liquidità netta è €${liquidNetWorth.toLocaleString('it-IT')}. C'è margine di miglioramento rispetto ai €${customLiquidWealthTarget.toLocaleString('it-IT')} medi della tua categoria (dati Banca d'Italia).` 
      : "I tuoi debiti superano i risparmi liquidi. Costruire ricchezza in questo stato è impossibile.",
    status: liquidNetWorth >= customLiquidWealthTarget ? "success" : liquidNetWorth > 0 ? "warning" : "danger"
  });

  // Insight Extra: Debito
  if (input.consumerDebt > 0) {
    const avgDebt = benchmark.ageData.debito_medio; // Debito medio della sua età
    insights.push({
      title: "Allarme Debito Cattivo",
      text: `Hai €${input.consumerDebt.toLocaleString('it-IT')} di debito al consumo. La media per la tua età è €${avgDebt.toLocaleString('it-IT')} (ma questo include i mutui!). Estingui prestiti e carte revolving il prima possibile.`,
      status: "danger"
    });
  }

  // Insight Extra: Situazione Abitativa
  if (input.housingStatus === 'Vivo con i genitori' && input.age > 30) {
    insights.push({
      title: "Indipendenza Abitativa",
      text: `Vivi in famiglia, una scelta comune: ben il ${(100 - benchmark.ageData.perc_proprieta - benchmark.ageData.perc_affitto).toFixed(1)}% della tua fascia d'età è in una situazione simile (usufrutto/famiglia). Sfrutta l'assenza di spese per massimizzare gli investimenti.`,
      status: "warning"
    });
  } else if (input.housingStatus === 'Affitto') {
    insights.push({
      title: "Situazione Abitativa",
      text: `Sei in affitto, come il ${benchmark.jobData.perc_affitto.toFixed(1)}% dei lavoratori della tua categoria. Se l'affitto supera il 30% del tuo reddito netto, valuta opzioni per ridurlo.`,
      status: "info"
    });
  }

  return {
    score: totalScore,
    metrics: { savingsRate, runwayMonths, netWorth: liquidNetWorth },
    benchmark,
    insights
  };
}