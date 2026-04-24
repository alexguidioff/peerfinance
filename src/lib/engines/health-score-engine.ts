// lib/engines/health-score-engine.ts
import { HealthScoreInput } from '../schemas/health-score';
import benchmarkData from '../../data/benchmarks.json';

// 1. Tipizziamo le chiavi dinamicamente dal JSON
export type AgeGroup = keyof typeof benchmarkData.benchmarks;
export type Region = "Nord" | "Centro" | "Sud" | "Isole";

// Helper per mappare l'età dell'utente alla fascia del JSON
function getAgeGroup(age: number): AgeGroup {
  if (age <= 25) return "18-25";
  if (age <= 30) return "26-30";
  if (age <= 35) return "31-35";
  if (age <= 40) return "36-40";
  if (age <= 50) return "41-50";
  return "51-60";
}

export function calculateHealthScore(input: HealthScoreInput) {
  // 2. Estraiamo il benchmark specifico dal JSON
  const ageGroup = getAgeGroup(input.age);
  const benchmark = benchmarkData.benchmarks[ageGroup][input.region as Region];

  if (!benchmark) {
    throw new Error("Benchmark non trovato per questa combinazione di età e regione.");
  }

  // 3. Variabili base
  const savingsRate = input.monthlyNetIncome > 0 
    ? (input.monthlyNetIncome - input.monthlyFixedExpenses) / input.monthlyNetIncome 
    : 0;
  
  const runwayMonths = input.monthlyFixedExpenses > 0 
    ? input.totalSavings / input.monthlyFixedExpenses 
    : 999; 
    
  const netWorth = input.totalSavings - input.consumerDebt;

  // --- MATEMATICA DELLO SCORE (40-40-20) ---
  
  let sRateScore = 0;
  if (savingsRate >= 0.20) sRateScore = 40;
  else if (savingsRate > 0) sRateScore = 40 * (savingsRate / 0.20);

  let sRunwayScore = 0;
  if (runwayMonths >= 6) sRunwayScore = 40;
  else if (runwayMonths > 0) sRunwayScore = 40 * (runwayMonths / 6);

  let sNetWorthScore = 0;
  if (netWorth >= benchmark.avgNetWorth) sNetWorthScore = 20;
  else if (netWorth > 0) sNetWorthScore = 20 * (netWorth / benchmark.avgNetWorth);

  const totalScore = Math.min(Math.max(Math.round(sRateScore + sRunwayScore + sNetWorthScore), 0), 100);

  // --- GENERAZIONE INSIGHTS STRUTTURATI ---
  const insights = [
    {
      title: "Flusso di cassa",
      text: savingsRate >= 0.20 
        ? "Ottimo lavoro! Risparmi il 20% o più del tuo reddito, rispettando la regola d'oro." 
        : savingsRate >= benchmark.avgSavingsRate 
        ? "Risparmi più della media italiana per la tua fascia, ma cerca di avvicinarti al target del 20%." 
        : "Il tuo tasso di risparmio è sotto la media. Analizza le tue uscite fisse.",
      status: savingsRate >= 0.20 ? "success" : savingsRate >= benchmark.avgSavingsRate ? "warning" : "danger"
    },
    {
      title: "Fondo di emergenza (Runway)",
      text: runwayMonths >= 6 
        ? `Hai ${runwayMonths.toFixed(1)} mesi di autonomia. Sei ben protetto da imprevisti.` 
        : runwayMonths >= 3 
        ? `Hai un cuscinetto di ${runwayMonths.toFixed(1)} mesi. Cerca di portarlo a 6 mesi.` 
        : "Il tuo cuscinetto di liquidità è basso. Priorità: accumulare un fondo per le emergenze.",
      status: runwayMonths >= 6 ? "success" : runwayMonths >= 3 ? "warning" : "danger"
    },
    {
      title: "Patrimonio Netto Finanziario",
      text: netWorth >= benchmark.avgNetWorth 
        ? "Il tuo patrimonio liquido è superiore a quello dei tuoi coetanei." 
        : netWorth > 0 
        ? "Stai costruendo il tuo patrimonio, ma sei ancora sotto la media ISTAT." 
        : "I tuoi debiti superano i risparmi. La priorità assoluta è abbattere il debito al consumo.",
      status: netWorth >= benchmark.avgNetWorth ? "success" : netWorth > 0 ? "warning" : "danger"
    }
  ];

  return {
    score: totalScore,
    metrics: { savingsRate, runwayMonths, netWorth },
    benchmark,
    insights
  };
}