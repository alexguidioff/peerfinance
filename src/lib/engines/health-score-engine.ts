import { HealthScoreInput } from '../schemas/health-score';

export interface ShiwData {
  patrimonio_netto: number;
  attivita_finanziarie: number;
  debito_medio: number;
  perc_proprieta: number;
  perc_affitto: number;
}

export interface BenchmarkStats {
  localAvgIncome: number;
  ageData: ShiwData;
  jobData: ShiwData;
  avgSavingsRate?: number;
}

interface BaseScoreResult {
  sRateScore: number;
  sRunwayScore: number;
  sNetWorthScore: number;
  targetSavingsRate: number;
  targetRunway: number;
}

export type EngineFlag =
  | 'INVESTED_RUNWAY_BUFFER'
  | 'POSSIBLE_FAMILY_INPUT'
  | 'SMALL_DEBT_EXEMPTION'
  | 'INVESTMENT_GAP';

export type LeadType = 'CFA' | 'financial_coach' | 'career_coach';

/**
 * Risultato del triage lead.
 *
 * `primary`   → consulente da notificare per primo (max 5 di quel tipo)
 * `secondary` → tipo alternativo se il pool primario è vuoto
 * `scores`    → punteggi grezzi per debug/analytics
 * `reasons`   → motivazioni human-readable per la dashboard admin
 */
export interface LeadTriageResult {
  primary: LeadType;
  secondary: LeadType | null;
  scores: Record<LeadType, number>;
  reasons: Record<LeadType, string>;
}


// ==========================================
// HELPER ESPORTATO: shiwLiquidWealthTarget
// ==========================================

export function resolveShiwWealthTarget(
  ageData: ShiwData,
  jobData: ShiwData,
  fallbackAnnualIncome: number
): number {
  const ageWealth = ageData.attivita_finanziarie;
  const jobWealth = jobData.attivita_finanziarie;
  if (ageWealth > 0 && jobWealth > 0) return (ageWealth + jobWealth) / 2;
  if (ageWealth > 0) return ageWealth;
  if (jobWealth > 0) return jobWealth;
  return fallbackAnnualIncome;
}


// ==========================================
// LEAD TRIAGE — logica di classificazione
// ==========================================

/**
 * calculateLeadTriage
 *
 * Assegna un punteggio di affinità (0–100) a ciascuno dei tre tipi
 * di consulente, poi restituisce primary e secondary.
 *
 * LOGICA PER TIPO:
 *
 * ── CFA (Consulente Finanziario Abilitato) ──────────────────────────
 * Vuole clienti con patrimonio da gestire o ottimizzare.
 * Segnali positivi:
 *   - investments > 0                          (+30)
 *   - INVESTMENT_GAP (liquidità da allocare)   (+25)
 *   - INVESTED_RUNWAY_BUFFER (patrimonio alto) (+20)
 *   - netWorth > shiwWealth                    (+15)
 *   - score >= 70                              (+10)
 * Segnali negativi:
 *   - consumerDebt alto (DTI > 20%)            (-20)
 *   - savingsRate < 0                          (-15)
 *   - jobCategory Disoccupato/Studente         (-30)
 *
 * ── Financial Coach ─────────────────────────────────────────────────
 * Vuole clienti con problemi di comportamento: debiti, spese,
 * savings rate basso. Non gestisce patrimoni.
 * Segnali positivi:
 *   - consumerDebt > 0                         (+25)
 *   - savingsRate < targetSavingsRate          (+20)
 *   - savingsRate < 0                          (+30)
 *   - POSSIBLE_FAMILY_INPUT (disorganizzazione)(+15)
 *   - score < 50                               (+10)
 * Segnali negativi:
 *   - investments > 0 E score > 70             (-20) già un CFA
 *   - netWorth > shiwWealth                    (-10)
 *
 * ── Career Coach ────────────────────────────────────────────────────
 * Vuole clienti il cui problema principale è il reddito.
 * Segnali positivi:
 *   - reddito < media locale                   (+30)
 *   - age < 35                                 (+20)
 *   - jobCategory Disoccupato/Studente         (+35)
 *   - careerGoal offensivo (cambio, crescita)  (+15)
 * Segnali negativi:
 *   - investments > 0 E score > 60             (-15)
 *   - jobCategory Pensionato                   (-40)
 *   - age > 55                                 (-20)
 */
export function calculateLeadTriage(
  input: HealthScoreInput,
  benchmark: BenchmarkStats,
  flags: EngineFlag[],
  score: number,
  savingsRate: number,
  netWorth: number,
  shiwWealth: number,
  targetSavingsRate: number,
  consumerDti: number
): LeadTriageResult {

  const scores: Record<LeadType, number> = {
    CFA: 0,
    financial_coach: 0,
    career_coach: 0,
  };

  const reasons: Record<LeadType, string[]> = {
    CFA: [],
    financial_coach: [],
    career_coach: [],
  };

  const totalAssets = (input.liquidCash ?? 0) + (input.investments ?? 0);
  const isWorker = !['Disoccupato', 'Studente', 'Pensionato'].includes(input.jobCategory);
  const isPensionato = input.jobCategory === 'Pensionato';
  const isInattivo = ['Disoccupato', 'Studente'].includes(input.jobCategory);

  // ── CFA ──────────────────────────────────────────────────────────
  if (input.investments > 0) {
    scores.CFA += 30;
    reasons.CFA.push(`Ha investimenti: €${input.investments.toLocaleString('it-IT')}`);
  }
  if (flags.includes('INVESTMENT_GAP')) {
    scores.CFA += 25;
    reasons.CFA.push('Liquidità in eccesso da allocare (INVESTMENT_GAP)');
  }
  if (flags.includes('INVESTED_RUNWAY_BUFFER')) {
    scores.CFA += 20;
    reasons.CFA.push('Patrimonio investito elevato rispetto alla liquidità');
  }
  if (netWorth > shiwWealth) {
    scores.CFA += 15;
    reasons.CFA.push('Patrimonio sopra la media SHIW per fascia d\'età');
  }
  if (score >= 70) {
    scores.CFA += 10;
    reasons.CFA.push(`Score alto (${score}/100)`);
  }
  if (isPensionato) {
    scores.CFA += 15;
    reasons.CFA.push('Pensionato: focus su protezione e decumulo');
  }
  // Malus CFA
  if (consumerDti > 0.20) {
    scores.CFA -= 20;
    reasons.CFA.push(`DTI elevato (${(consumerDti * 100).toFixed(0)}%): debito prioritario`);
  }
  if (savingsRate < 0) {
    scores.CFA -= 15;
    reasons.CFA.push('Flusso di cassa negativo');
  }
  if (isInattivo) {
    scores.CFA -= 30;
    reasons.CFA.push('Disoccupato/Studente: nessun patrimonio da gestire');
  }

  // ── Financial Coach ───────────────────────────────────────────────
  if (input.consumerDebt > 0) {
    scores.financial_coach += 25;
    reasons.financial_coach.push(`Debito al consumo: €${input.consumerDebt.toLocaleString('it-IT')}`);
  }
  if (savingsRate < 0) {
    scores.financial_coach += 30;
    reasons.financial_coach.push('Flusso di cassa negativo: uscite > entrate');
  } else if (savingsRate < targetSavingsRate) {
    scores.financial_coach += 20;
    reasons.financial_coach.push(`Savings rate sotto target (${(savingsRate * 100).toFixed(0)}% vs ${(targetSavingsRate * 100).toFixed(0)}%)`);
  }
  if (flags.includes('POSSIBLE_FAMILY_INPUT')) {
    scores.financial_coach += 15;
    reasons.financial_coach.push('Possibile disorganizzazione finanziaria familiare');
  }
  if (score < 50) {
    scores.financial_coach += 10;
    reasons.financial_coach.push(`Score basso (${score}/100): necessita coaching`);
  }
  // Malus Financial Coach
  if (input.investments > 0 && score > 70) {
    scores.financial_coach -= 20;
    reasons.financial_coach.push('Già ben investito e score alto: profilo CFA');
  }
  if (netWorth > shiwWealth) {
    scores.financial_coach -= 10;
    reasons.financial_coach.push('Patrimonio sopra media: coaching comportamentale meno urgente');
  }

  // ── Career Coach ──────────────────────────────────────────────────
  if (isInattivo) {
    scores.career_coach += 35;
    reasons.career_coach.push(`Categoria: ${input.jobCategory}`);
  }
  if (input.monthlyNetIncome < benchmark.localAvgIncome && benchmark.localAvgIncome > 0) {
    const gap = ((benchmark.localAvgIncome - input.monthlyNetIncome) / benchmark.localAvgIncome * 100).toFixed(0);
    scores.career_coach += 30;
    reasons.career_coach.push(`Reddito ${gap}% sotto la media locale`);
  }
  if (input.age < 35 && isWorker) {
    scores.career_coach += 20;
    reasons.career_coach.push(`Giovane professionista (${input.age} anni)`);
  }

  // Malus Career Coach
  if (isPensionato) {
    scores.career_coach -= 40;
    reasons.career_coach.push('Pensionato: carriera non rilevante');
  }
  if (input.age > 55 && !isInattivo) {
    scores.career_coach -= 20;
    reasons.career_coach.push('Età avanzata: priorità su protezione, non carriera');
  }
  if (input.investments > 0 && score > 60) {
    scores.career_coach -= 15;
    reasons.career_coach.push('Già investito e score buono: problema non è il reddito');
  }

  // Normalizza tutti i punteggi tra 0 e 100
  const types: LeadType[] = ['CFA', 'financial_coach', 'career_coach'];
  for (const t of types) {
    scores[t] = Math.max(0, Math.min(100, scores[t]));
  }

  // Ordina per score decrescente
  const sorted = types.sort((a, b) => scores[b] - scores[a]);
  const primary = sorted[0];

  // Secondary solo se ha un punteggio significativo (>= 20) e non è zero
  const secondary = scores[sorted[1]] >= 20 ? sorted[1] : null;

  return {
    primary,
    secondary,
    scores,
    reasons: Object.fromEntries(
      types.map(t => [t, reasons[t].join(' · ')])
    ) as Record<LeadType, string>,
  };
}


// ==========================================
// HELPER: PENALITÀ DEBITO (curva logaritmica)
// ==========================================

function calculateDebtPenalty(
  consumerDti: number,
  consumerDebt: number,
  monthlyNetIncome: number
): { penalty: number; smallDebtExemption: boolean } {
  if (consumerDti <= 0.05) return { penalty: 0, smallDebtExemption: false };

  const normalized = Math.min((consumerDti - 0.05) / 0.45, 1);
  let penalty = 25 * Math.log10(1 + normalized * 9) / Math.log10(10);
  penalty = Math.min(penalty, 25);

  const smallDebtExemption =
    monthlyNetIncome > 0 &&
    consumerDebt > 0 &&
    consumerDebt < monthlyNetIncome * 2;

  if (smallDebtExemption) penalty *= 0.5;

  return { penalty, smallDebtExemption };
}


// ==========================================
// HELPER: IDEAL WEALTH TARGET (modificatore età)
// ==========================================

function calculateIdealWealth(age: number, annualIncome: number, shiwTarget: number): number {
  let ageMultiplier = 1.0;
  if (age < 30) {
    ageMultiplier = 0.2 + 0.8 * ((age - 18) / (30 - 18));
    ageMultiplier = Math.max(0.2, Math.min(ageMultiplier, 1.0));
  }
  const stanleyDanko = ((age * annualIncome) / 10) * ageMultiplier;
  return Math.max(stanleyDanko, shiwTarget);
}


// ==========================================
// FUNZIONE PRINCIPALE
// ==========================================

export function calculateHealthScore(input: HealthScoreInput, benchmark: BenchmarkStats) {
  if (!benchmark || !benchmark.ageData || !benchmark.jobData) {
    throw new Error('Dati di benchmark mancanti per il calcolo dello score.');
  }

  const flags: EngineFlag[] = [];

  // --- 1. VARIABILI FINANZIARIE CHIAVE ---
  const annualIncome = input.monthlyNetIncome * 12;
  const expenses = input.monthlyFixedExpenses;

  const savingsRate = input.monthlyNetIncome > 0
    ? (input.monthlyNetIncome - expenses) / input.monthlyNetIncome
    : 0;

  const runwayMonths = expenses > 0 ? input.liquidCash / expenses : 999;
  const liquidNetWorth = (input.liquidCash + input.investments) - input.consumerDebt;

  const consumerDti = annualIncome > 0
    ? input.consumerDebt / annualIncome
    : (input.consumerDebt > 0 ? 1 : 0);

  const shiwLiquidWealthTarget = resolveShiwWealthTarget(
    benchmark.ageData,
    benchmark.jobData,
    annualIncome
  );

  const idealWealthTarget = calculateIdealWealth(input.age, annualIncome, shiwLiquidWealthTarget);


  // --- 2. RILEVAMENTO FLAG DIAGNOSTICI ---
  const possibleFamilyInput =
    savingsRate < -0.50 &&
    input.monthlyNetIncome > 0 &&
    input.monthlyNetIncome < 1800;
  if (possibleFamilyInput) flags.push('POSSIBLE_FAMILY_INPUT');

  const targetRunwayForFlag = input.jobCategory === 'Autonomo' ? 12 : 6;

  const investedRunwayBuffer =
    input.investments > 0 &&
    expenses > 0 &&
    input.investments > targetRunwayForFlag * expenses * 3;
  if (investedRunwayBuffer) flags.push('INVESTED_RUNWAY_BUFFER');

  const investmentGap =
    input.investments === 0 &&
    expenses > 0 &&
    input.liquidCash > targetRunwayForFlag * expenses * 2;
  if (investmentGap) flags.push('INVESTMENT_GAP');


  // --- 3. ROUTER DEL CONTESTO ---
  let base: BaseScoreResult;

  if (input.jobCategory === 'Pensionato') {
    base = calculatePensionerScore(savingsRate, runwayMonths, liquidNetWorth, idealWealthTarget);
  } else if (input.jobCategory === 'Disoccupato' || input.jobCategory === 'Studente') {
    base = calculateUnemployedScore(input.liquidCash, input.consumerDebt);
  } else {
    base = calculateWorkerScore(
      input.jobCategory,
      savingsRate,
      runwayMonths,
      liquidNetWorth,
      idealWealthTarget,
      shiwLiquidWealthTarget,
      investedRunwayBuffer
    );
  }

  let rawScore = base.sRateScore + base.sRunwayScore + base.sNetWorthScore;


  // --- 4. PENALITÀ E RED FLAGS ---
  const { penalty: debtPenalty, smallDebtExemption } = calculateDebtPenalty(
    consumerDti,
    input.consumerDebt,
    input.monthlyNetIncome
  );
  if (smallDebtExemption) flags.push('SMALL_DEBT_EXEMPTION');

  rawScore -= debtPenalty;

  if (expenses > input.monthlyNetIncome && input.monthlyNetIncome > 0 && !possibleFamilyInput) {
    rawScore = Math.min(rawScore, 40);
  }
  const dtiRedFlagThreshold = smallDebtExemption ? 0.50 : 0.30;
  if (consumerDti >= dtiRedFlagThreshold) {
    rawScore = Math.min(rawScore, 35);
  }
  if (
    runwayMonths < 1 &&
    expenses > 0 &&
    input.jobCategory !== 'Disoccupato' &&
    input.jobCategory !== 'Studente'
  ) {
    rawScore = Math.min(rawScore, 50);
  }

  const finalScore = Math.max(Math.min(Math.round(rawScore), 100), 0);


  // --- 5. LEAD TRIAGE -----------------------------------------------
  // Calcolato dopo il finalScore perché usa score + flags già computati.
  // Il risultato viene salvato in leads.lead_type (primary) e
  // leads.triage_data (JSON completo) dalla server action.
  const triage = calculateLeadTriage(
    input,
    benchmark,
    flags,
    finalScore,
    savingsRate,
    liquidNetWorth,
    shiwLiquidWealthTarget,
    base.targetSavingsRate,
    consumerDti
  );


  // --- 6. INSIGHTS ---
  const insights = generateInsights(
    input, benchmark, base,
    savingsRate, runwayMonths, liquidNetWorth,
    idealWealthTarget, shiwLiquidWealthTarget,
    consumerDti, flags
  );

  return {
    score: finalScore,
    flags,
    triage,          // ← nuovo: { primary, secondary, scores, reasons }
    metrics: {
      savingsRate,
      runwayMonths,
      netWorth: liquidNetWorth,
      liquidCash: input.liquidCash,
      investments: input.investments,
    },
    benchmark,
    insights,
  };
}


// ==========================================
// FUNZIONI DI CALCOLO PER CONTESTO
// ==========================================

function calculateWorkerScore(
  job: string,
  savingsRate: number,
  runway: number,
  netWorth: number,
  idealWealth: number,
  shiwWealth: number,
  investedRunwayBuffer: boolean
): BaseScoreResult {
  const isAuto = job === 'Autonomo';
  const targetSavingsRate = isAuto ? 0.25 : 0.20;
  const targetRunway = isAuto ? 12 : 6;

  let sRunwayScore = 0;
  if (runway >= targetRunway && runway <= targetRunway * 2.5) {
    sRunwayScore = 35;
  } else if (runway > targetRunway * 2.5) {
    const drag = Math.min((runway - targetRunway * 2.5) * 0.5, 10);
    sRunwayScore = 35 - drag;
  } else if (runway > 0) {
    sRunwayScore = 35 * (runway / targetRunway);
  }
  if (investedRunwayBuffer) {
    sRunwayScore = Math.max(sRunwayScore, 35 * 0.50);
  }

  const SAVINGS_CAP = 0.40;
  let sRateScore = 0;
  if (savingsRate <= 0) {
    sRateScore = 0;
  } else if (savingsRate <= 0.10) {
    sRateScore = 15 * (savingsRate / 0.10);
  } else if (savingsRate <= targetSavingsRate) {
    sRateScore = 15 + 15 * ((savingsRate - 0.10) / (targetSavingsRate - 0.10));
  } else if (savingsRate <= SAVINGS_CAP) {
    sRateScore = 30 + 5 * ((savingsRate - targetSavingsRate) / (SAVINGS_CAP - targetSavingsRate));
  } else {
    sRateScore = 35;
  }

  let sNetWorthScore = 0;
  if (netWorth >= idealWealth) {
    sNetWorthScore = 30;
  } else if (netWorth >= shiwWealth) {
    sNetWorthScore = 15 + 15 * ((netWorth - shiwWealth) / (idealWealth - shiwWealth));
  } else if (netWorth > 0) {
    sNetWorthScore = 15 * (netWorth / shiwWealth);
  }

  return { sRateScore, sRunwayScore, sNetWorthScore, targetSavingsRate, targetRunway };
}


function calculatePensionerScore(
  savingsRate: number,
  runway: number,
  netWorth: number,
  idealWealth: number
): BaseScoreResult {
  const targetRunway = 6;
  const targetSavingsRate = 0.05;

  const sRunwayScore = runway >= targetRunway
    ? 30
    : 30 * (Math.max(runway, 0) / targetRunway);

  let sRateScore: number;
  if (savingsRate >= 0)          sRateScore = 10;
  else if (savingsRate >= -0.10) sRateScore = 5;
  else                           sRateScore = 0;

  let sNetWorthScore = 0;
  if (netWorth >= idealWealth * 0.8) {
    sNetWorthScore = 60;
  } else if (netWorth > 0) {
    sNetWorthScore = 60 * (netWorth / (idealWealth * 0.8));
  }

  return { sRateScore, sRunwayScore, sNetWorthScore, targetSavingsRate, targetRunway };
}


function calculateUnemployedScore(liquidCash: number, consumerDebt: number): BaseScoreResult {
  if (consumerDebt > 0) {
    return { sRateScore: 0, sRunwayScore: 0, sNetWorthScore: 0, targetSavingsRate: 0, targetRunway: 0 };
  }
  const bonus = liquidCash > 0 ? Math.min((liquidCash / 5000) * 15, 15) : 0;
  return { sRateScore: 0, sRunwayScore: 65 + bonus, sNetWorthScore: 0, targetSavingsRate: 0, targetRunway: 0 };
}


// ==========================================
// GENERATORE DI INSIGHTS
// ==========================================

function generateInsights(
  input: HealthScoreInput,
  benchmark: BenchmarkStats,
  base: BaseScoreResult,
  savingsRate: number,
  runway: number,
  netWorth: number,
  idealWealth: number,
  shiwWealth: number,
  dti: number,
  flags: EngineFlag[]
) {
  const insights: { title: string; text: string; status: string }[] = [];

  // --- Debito ---
  if (input.consumerDebt > 0) {
    let debtText = `Attualmente hai €${input.consumerDebt.toLocaleString('it-IT')} di debito al consumo, pari al ${(dti * 100).toFixed(1)}% del tuo reddito annuo. `;
    let status = 'warning';

    if (flags.includes('SMALL_DEBT_EXEMPTION')) {
      debtText += `In termini assoluti è un importo contenuto rispetto al tuo reddito mensile. I finanziamenti al consumo hanno comunque tassi elevati (TAEG): vale la pena estinguerlo presto per liberare flusso di cassa.`;
      status = 'info';
    } else if (dti >= 0.20) {
      debtText += `Questo livello di indebitamento è tossico. Prima di pensare a qualsiasi investimento, la tua priorità assoluta deve essere l'estinzione anticipata di queste passività.`;
      status = 'danger';
    } else {
      debtText += `Concentra il tuo extra-risparmio per azzerare questo debito il prima possibile.`;
    }

    insights.push({
      title: status === 'danger' ? 'Allarme Rosso: Debito Tossico' : 'Il Debito al Consumo',
      text: debtText,
      status,
    });
  }

  // --- Possibile Input Familiare ---
  if (flags.includes('POSSIBLE_FAMILY_INPUT')) {
    insights.push({
      title: '⚠️ Verifica i Dati Inseriti',
      text: `Abbiamo rilevato una forte discrepanza tra il reddito dichiarato (€${input.monthlyNetIncome.toLocaleString('it-IT')}/mese) e le spese mensili (€${input.monthlyFixedExpenses.toLocaleString('it-IT')}/mese). Se stai compilando come parte di un nucleo familiare, inserisci il reddito familiare totale oppure solo la tua quota delle spese.`,
      status: 'warning',
    });
  }

  // --- Flusso di Cassa ---
  if (input.jobCategory !== 'Disoccupato' && input.jobCategory !== 'Studente') {
    const diffIncome = benchmark.localAvgIncome > 0
      ? ((input.monthlyNetIncome - benchmark.localAvgIncome) / benchmark.localAvgIncome) * 100
      : 0;

    let cashflowText = `Il Tasso di Risparmio è il vero 'motore' della creazione di ricchezza. `;
    let status = 'info';

    if (savingsRate < 0 && !flags.includes('POSSIBLE_FAMILY_INPUT')) {
      cashflowText += 'Le tue uscite superano le entrate. Traccia le spese e taglia il superfluo.';
      status = 'danger';
    } else if (savingsRate > 0.40 && input.jobCategory !== 'Pensionato') {
      cashflowText += `Stai mettendo da parte il ${(savingsRate * 100).toFixed(0)}% del reddito. Valuta di indirizzare il surplus verso investimenti strutturati.`;
      status = 'info';
    } else if (savingsRate >= base.targetSavingsRate) {
      cashflowText += `Mettendo da parte il ${(savingsRate * 100).toFixed(0)}% del reddito, sei a un livello d'eccellenza.`;
      status = 'success';
    } else if (savingsRate >= 0) {
      cashflowText += `Risparmi il ${(savingsRate * 100).toFixed(0)}%. L'ideale per la tua categoria sarebbe il ${(base.targetSavingsRate * 100).toFixed(0)}%. Prova la regola del 50/30/20.`;
      status = 'warning';
    }

    if (diffIncome > 0 && input.jobCategory !== 'Pensionato' && !flags.includes('POSSIBLE_FAMILY_INPUT')) {
      cashflowText += ` Il tuo reddito è il ${diffIncome.toFixed(0)}% sopra la media della tua zona.`;
    }

    if (!flags.includes('POSSIBLE_FAMILY_INPUT') || savingsRate >= 0) {
      insights.push({ title: 'Motore di Cassa e Risparmio', text: cashflowText, status });
    }
  }

  // --- Fondo Emergenza ---
  if (input.jobCategory !== 'Disoccupato' && input.jobCategory !== 'Studente') {
    let runwayText = `Il Fondo d'Emergenza protegge i tuoi investimenti, evitando di liquidarli in perdita in caso di imprevisti. `;
    let status = 'info';

    if (flags.includes('INVESTED_RUNWAY_BUFFER') && runway < base.targetRunway) {
      runwayText += `Hai ${runway.toFixed(1)} mesi di liquidità immediata. Il portafoglio investito è una rete alternativa, ma costruisci un cuscinetto liquido separato per evitare vendite forzate.`;
      status = 'warning';
    } else if (runway < base.targetRunway / 2) {
      runwayText += `Con ${runway.toFixed(1)} mesi sei vulnerabile. Ricostruisci subito questa scorta.`;
      status = 'danger';
    } else if (runway >= base.targetRunway && runway <= base.targetRunway * 2.5) {
      runwayText += `Cuscinetto perfetto: ${runway.toFixed(1)} mesi coperti. Hai la serenità per investire a lungo termine.`;
      status = 'success';
    } else if (runway > base.targetRunway * 2.5) {
      runwayText += `Hai ${runway.toFixed(1)} mesi parcheggiati sul conto. La liquidità in eccesso subisce l'inflazione. Valuta di trasferire parte in investimenti.`;
      status = 'warning';
    } else {
      runwayText += `Hai ${runway.toFixed(1)} mesi. L'obiettivo è almeno ${base.targetRunway} mesi.`;
      status = 'warning';
    }
    insights.push({ title: 'Protezione: Il Fondo di Emergenza', text: runwayText, status });
  }

  // --- Patrimonio e Investimenti ---
  if (input.jobCategory !== 'Disoccupato' && input.jobCategory !== 'Studente') {
    const totalAssets = input.investments + input.liquidCash;
    const ratioInvested = totalAssets > 0 ? (input.investments / totalAssets) * 100 : 0;

    let wealthText = '';
    let status = 'info';

    if (netWorth >= idealWealth) {
      wealthText = `Il tuo Patrimonio Netto supera la curva di accumulo ideale per età e reddito. Gestisci i tuoi soldi in maniera esemplare. `;
      status = 'success';
    } else if (netWorth >= shiwWealth) {
      wealthText = `La tua ricchezza è sopra la media nazionale per la tua fascia d'età, ma sotto il potenziale ideale. `;
      status = 'info';
    } else {
      wealthText = `Il patrimonio è inferiore alla media statistica italiana (Banca d'Italia) per la tua fascia d'età. `;
      status = 'warning';
    }

    if (flags.includes('INVESTMENT_GAP')) {
      wealthText += `Hai ${runway.toFixed(0)} mesi di spese in liquidità ma zero investimenti. L'inflazione erode quel capitale ogni mese. Anche un PAC da poche centinaia di euro su un ETF farebbe lavorare quei risparmi.`;
      if (status === 'success' || status === 'info') status = 'warning';
    } else if (input.investments > 0 && ratioInvested > 20) {
      wealthText += `Il ${ratioInvested.toFixed(0)}% del portafoglio è investito a mercato. I soldi stanno lavorando per te.`;
    } else if (input.investments === 0 && input.liquidCash > 10000) {
      wealthText += `L'assenza totale di investimenti è il principale limite. Il risparmio da solo non batte l'inflazione.`;
      status = 'warning';
    }

    insights.push({ title: 'Solidità Patrimoniale e Allocazione', text: wealthText, status });
  }

  // --- Situazione Abitativa ---
  if (input.housingStatus === 'Proprietà (con Mutuo in corso)') {
    insights.push({
      title: 'Gestione del Mutuo',
      text: "La rata mensile non dovrebbe mai superare il 30% del reddito netto.",
      status: 'info',
    });
  } else if (input.housingStatus === 'Affitto') {
    insights.push({
      title: 'Ottimizzazione Affitto',
      text: `Vivi in affitto come il ${benchmark.jobData.perc_affitto.toFixed(0)}% della tua categoria. Assicurati che il canone non superi 1/3 delle entrate nette.`,
      status: 'info',
    });
  } else if (input.housingStatus === 'Vivo con i genitori / in famiglia' && input.age >= 25) {
    insights.push({
      title: 'Vantaggio Abitativo',
      text: 'Spese strutturali quasi nulle. Sfrutta questa fase per massimizzare il risparmio.',
      status: 'success',
    });
  }

  const statusPriority: Record<string, number> = { danger: 1, warning: 2, info: 3, success: 4 };
  insights.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  return insights;
}