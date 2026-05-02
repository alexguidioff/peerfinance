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

/**
 * Flag diagnostici emessi dal motore.
 *
 * - INVESTED_RUNWAY_BUFFER : Caso 1 — liquidità bassa ma investimenti alti
 * - POSSIBLE_FAMILY_INPUT  : Caso 4 — spese familiari su reddito individuale
 * - SMALL_DEBT_EXEMPTION   : Caso 5 — debito piccolo in assoluto, DTI distorto
 * - INVESTMENT_GAP         : Caso 2 — liquidità in eccesso, zero investimenti
 */
export type EngineFlag =
  | 'INVESTED_RUNWAY_BUFFER'
  | 'POSSIBLE_FAMILY_INPUT'
  | 'SMALL_DEBT_EXEMPTION'
  | 'INVESTMENT_GAP';


// ==========================================
// HELPER ESPORTATO: calcola shiwLiquidWealthTarget
// Esportato così la UI (PeerComparison) può usare la stessa
// logica del motore invece di ricalcolare la media aritmetica grezza.
// ==========================================

export function resolveShiwWealthTarget(ageData: ShiwData, jobData: ShiwData, fallbackAnnualIncome: number): number {
  const ageWealth = ageData.attivita_finanziarie;
  const jobWealth = jobData.attivita_finanziarie;

  if (ageWealth > 0 && jobWealth > 0) return (ageWealth + jobWealth) / 2;
  if (ageWealth > 0) return ageWealth;
  if (jobWealth > 0) return jobWealth;
  return fallbackAnnualIncome; // fallback: 1x RAL annuo
}


// ==========================================
// HELPER: PENALITÀ DEBITO (curva logaritmica)
// ==========================================

/**
 * Curva logaritmica con cap a 25pt, applicata prima dei Red Flag.
 *   DTI  5% → ~0 pt
 *   DTI 15% → ~10 pt
 *   DTI 30% → ~20 pt
 *   DTI 50%+→  25 pt (cap)
 *
 * CASO 5 — Small Debt Exemption:
 * Se il debito assoluto è < 2x il reddito mensile, la penalità è dimezzata.
 */
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

/**
 * Rampa lineare 0.2 → 1.0 tra 18 e 30 anni.
 * Evita target impossibili per i giovani con la formula Stanley/Danko.
 */
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

  // Fix SHIW con helper condiviso
  const shiwLiquidWealthTarget = resolveShiwWealthTarget(
    benchmark.ageData,
    benchmark.jobData,
    annualIncome
  );

  const idealWealthTarget = calculateIdealWealth(input.age, annualIncome, shiwLiquidWealthTarget);


  // --- 2. RILEVAMENTO FLAG DIAGNOSTICI ---

  // Caso 4: possibile input familiare
  const possibleFamilyInput =
    savingsRate < -0.50 &&
    input.monthlyNetIncome > 0 &&
    input.monthlyNetIncome < 1800;
  if (possibleFamilyInput) flags.push('POSSIBLE_FAMILY_INPUT');

  // Caso 1: invested runway buffer
  const targetRunwayForFlag = input.jobCategory === 'Autonomo' ? 12 : 6;
  const investedRunwayBuffer =
    input.investments > 0 &&
    expenses > 0 &&
    input.investments > targetRunwayForFlag * expenses * 3;
  if (investedRunwayBuffer) flags.push('INVESTED_RUNWAY_BUFFER');

  // Caso 2: investment gap
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

  // Red Flag 1: emorragia di cassa (sospeso per POSSIBLE_FAMILY_INPUT)
  if (expenses > input.monthlyNetIncome && input.monthlyNetIncome > 0 && !possibleFamilyInput) {
    rawScore = Math.min(rawScore, 40);
  }

  // Red Flag 2: trappola del debito (soglia alzata con SMALL_DEBT_EXEMPTION)
  const dtiRedFlagThreshold = smallDebtExemption ? 0.50 : 0.30;
  if (consumerDti >= dtiRedFlagThreshold) {
    rawScore = Math.min(rawScore, 35);
  }

  // Red Flag 3: vulnerabilità estrema
  if (
    runwayMonths < 1 &&
    expenses > 0 &&
    input.jobCategory !== 'Disoccupato' &&
    input.jobCategory !== 'Studente'
  ) {
    rawScore = Math.min(rawScore, 50);
  }

  const finalScore = Math.max(Math.min(Math.round(rawScore), 100), 0);


  // --- 5. INSIGHTS ---
  const insights = generateInsights(
    input, benchmark, base,
    savingsRate, runwayMonths, liquidNetWorth,
    idealWealthTarget, shiwLiquidWealthTarget,
    consumerDti, flags
  );

  return {
    score: finalScore,
    flags,
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

  // Runway Score (Max 35) con floor per INVESTED_RUNWAY_BUFFER
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
    sRunwayScore = Math.max(sRunwayScore, 35 * 0.50); // floor 17.5pt
  }

  // Savings Rate Score con cap al 40%
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

  // Net Worth Score (Max 30)
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
  if (savingsRate >= 0)       sRateScore = 10;
  else if (savingsRate >= -0.10) sRateScore = 5;  // decumulo lieve
  else                           sRateScore = 0;  // erosione grave

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
      // Caso 5: debito piccolo — tono informativo, non allarmistico.
      // STATUS DELIBERATAMENTE 'info': con exemption attiva il debito non
      // è una priorità reale e non deve aprire il report (sort lo mette dopo warning).
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

  // --- Possibile Input Familiare (Caso 4) ---
  if (flags.includes('POSSIBLE_FAMILY_INPUT')) {
    insights.push({
      title: '⚠️ Verifica i Dati Inseriti',
      text: `Abbiamo rilevato una forte discrepanza tra il reddito dichiarato (€${input.monthlyNetIncome.toLocaleString('it-IT')}/mese) e le spese mensili (€${input.monthlyFixedExpenses.toLocaleString('it-IT')}/mese). Se stai compilando come parte di un nucleo familiare, inserisci il reddito familiare totale oppure solo la tua quota delle spese. Un'analisi su dati incongruenti non rifletterà la tua reale salute finanziaria.`,
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
      cashflowText += 'Le tue uscite superano le entrate. Questa emorragia mensile sta erodendo il tuo patrimonio. Traccia le spese e taglia il superfluo.';
      status = 'danger';
    } else if (savingsRate > 0.40 && input.jobCategory !== 'Pensionato') {
      cashflowText += `Stai mettendo da parte il ${(savingsRate * 100).toFixed(0)}% del reddito, un livello straordinariamente alto. Assicurati che rifletta una scelta consapevole. Valuta di indirizzare il surplus verso investimenti strutturati.`;
      status = 'info';
    } else if (savingsRate >= base.targetSavingsRate) {
      cashflowText += `Mettendo da parte il ${(savingsRate * 100).toFixed(0)}% del reddito, sei a un livello d'eccellenza. Stai costruendo capitale alla giusta velocità.`;
      status = 'success';
    } else if (savingsRate >= 0) {
      cashflowText += `Risparmi il ${(savingsRate * 100).toFixed(0)}%. Stai facendo meglio di chi non risparmia nulla, ma per la tua categoria l'ideale sarebbe il ${(base.targetSavingsRate * 100).toFixed(0)}%. Prova la regola del 50/30/20.`;
      status = 'warning';
    }

    if (diffIncome > 0 && input.jobCategory !== 'Pensionato' && !flags.includes('POSSIBLE_FAMILY_INPUT')) {
      cashflowText += ` Il tuo reddito mensile è il ${diffIncome.toFixed(0)}% sopra la media della tua zona.`;
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
      runwayText += `Hai solo ${runway.toFixed(1)} mesi di liquidità immediata, sotto il target di ${base.targetRunway} mesi. Il tuo portafoglio investito (€${input.investments.toLocaleString('it-IT')}) è una rete alternativa, ma costruisci gradualmente un cuscinetto liquido separato per evitare vendite forzate in momenti sfavorevoli.`;
      status = 'warning';
    } else if (runway < base.targetRunway / 2) {
      runwayText += `Con soli ${runway.toFixed(1)} mesi di autonomia sei fortemente vulnerabile. In caso di perdita del lavoro o spesa imprevista saresti costretto a indebitarti. Ricostruisci subito questa scorta.`;
      status = 'danger';
    } else if (runway >= base.targetRunway && runway <= base.targetRunway * 2.5) {
      runwayText += `Cuscinetto perfetto: ${runway.toFixed(1)} mesi di spese coperte in contanti. Hai la serenità per investire a lungo termine.`;
      status = 'success';
    } else if (runway > base.targetRunway * 2.5) {
      runwayText += `Hai ${runway.toFixed(1)} mesi di spese parcheggiati sul conto. La liquidità in eccesso subisce l'inflazione (Inflation Drag). Valuta di trasferire parte di questo capitale in investimenti.`;
      status = 'warning';
    } else {
      runwayText += `Hai ${runway.toFixed(1)} mesi di copertura. L'obiettivo è arrivare ad almeno ${base.targetRunway} mesi.`;
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
      wealthText = `Il tuo Patrimonio Netto Liquido supera la curva di accumulo ideale per età e reddito. Gestisci i tuoi soldi in maniera esemplare. `;
      status = 'success';
    } else if (netWorth >= shiwWealth) {
      wealthText = `La tua ricchezza è sopra la media nazionale per la tua fascia d'età, ma ancora sotto il potenziale matematico ideale. `;
      status = 'info';
    } else {
      wealthText = `Il tuo patrimonio è inferiore alla media statistica italiana (Banca d'Italia) per la tua fascia d'età e professione. `;
      status = 'warning';
    }

    if (flags.includes('INVESTMENT_GAP')) {
      wealthText += `Attenzione: hai ${runway.toFixed(0)} mesi di spese in liquidità ma zero investimenti. L'inflazione erode silenziosamente quel capitale ogni mese. Anche un Piano di Accumulo (PAC) da poche centinaia di euro su un ETF diversificato farebbe lavorare quei risparmi per te.`;
      if (status === 'success' || status === 'info') status = 'warning';
    } else if (input.investments > 0 && ratioInvested > 20) {
      wealthText += `È positivo che il ${ratioInvested.toFixed(0)}% del portafoglio sia investito a mercato. I soldi stanno lavorando per te.`;
    } else if (input.investments === 0 && input.liquidCash > 10000) {
      wealthText += `Il grande errore attuale è l'assenza totale di investimenti. Il risparmio da solo non basta per battere l'inflazione.`;
      status = 'warning';
    }

    insights.push({ title: 'Solidità Patrimoniale e Allocazione', text: wealthText, status });
  }

  // --- Situazione Abitativa ---
  if (input.housingStatus === 'Proprietà (con Mutuo in corso)') {
    insights.push({
      title: 'Gestione del Mutuo',
      text: "La rata mensile non dovrebbe mai superare il 30% del reddito netto. Oltre questa soglia rischi di comprimere troppo la tua capacità di risparmio e investimento.",
      status: 'info',
    });
  } else if (input.housingStatus === 'Affitto') {
    insights.push({
      title: 'Ottimizzazione Affitto',
      text: `Vivi in affitto, come il ${benchmark.jobData.perc_affitto.toFixed(0)}% delle persone nella tua categoria. L'affitto dà flessibilità, ma assicurati che il canone non superi 1/3 delle entrate mensili nette.`,
      status: 'info',
    });
  } else if (input.housingStatus === 'Vivo con i genitori / in famiglia' && input.age >= 25) {
    insights.push({
      title: 'Vantaggio Abitativo',
      text: 'Vivendo in famiglia hai spese strutturali quasi nulle. Sfrutta questa fase irripetibile per massimizzare il risparmio e accumulare liquidità iniziale.',
      status: 'success',
    });
  }

  // Ordinamento: danger(1) → warning(2) → info(3) → success(4)
  // Con SMALL_DEBT_EXEMPTION il debito ha status 'info' → finisce dopo i warning
  const statusPriority: Record<string, number> = { danger: 1, warning: 2, info: 3, success: 4 };
  insights.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  return insights;
}