'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Home, CreditCard, PiggyBank, BarChart3, Map, ShieldCheck } from 'lucide-react';

type Stats = {
  mediaReddito: number;
  mediaDebito: number;
  mediaAffitto: number;
  mediaRisparmio: number;
};

const JOB_OPTIONS = [
  'Lavoratore Dipendente',
  'Lavoratore Autonomo / P.IVA',
  'Pensionato',
  'Non occupato',
  'Studente',
];

function fmt(n: number) {
  return '€' + n.toLocaleString('it-IT', { maximumFractionDigits: 0 });
}

export default function HomeClient({ stats }: { stats: Stats }) {
  const router = useRouter();
  const [jobLabel, setJobLabel] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  // Mappa label → valore schema
  const jobCategoryMap: Record<string, string> = {
    'Lavoratore Dipendente':    'Dipendente',
    'Lavoratore Autonomo / P.IVA': 'Autonomo',
    'Pensionato':               'Pensionato',
    'Non occupato':  'Disoccupato',
    'Studente': 'Studente',
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const ageNum = parseInt(age);
    if (!jobLabel) { setError('Seleziona la tua categoria lavorativa.'); return; }
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 99) { setError('Inserisci un\'età valida (18-99).'); return; }

    const jobCategory = jobCategoryMap[jobLabel];
    const params = new URLSearchParams({ jobCategory, age });
    router.push(`/score?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <main className="flex w-full flex-col items-center justify-center px-6 py-24 text-center sm:px-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/5 via-background to-background -z-10 h-[80vh]" />

        {/* Badge */}
        <div className="mb-6 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
          Dati ufficiali MEF · ISTAT · Banca d'Italia · 100% gratuito
        </div>

        {/* Titolo */}
        <h1 className="mb-6 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          Stai guadagnando abbastanza{' '}
          <span className="text-emerald-600">rispetto ai tuoi pari?</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Confronta stipendio, risparmi e debiti con persone della tua età, professione e comune.
          Anonimo e senza registrazione.
        </p>

        {/* Form */}
        <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-4 shadow-xl">
          <form onSubmit={handleStart} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Selezione categoria lavorativa */}
              <select
                value={jobLabel}
                onChange={(e) => setJobLabel(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                <option value="">La tua categoria lavorativa...</option>
                {JOB_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>

              {/* Età */}
              <input
                type="number"
                placeholder="La tua età"
                inputMode="numeric"
                min={18}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:w-32"
              />

              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white transition-all hover:bg-emerald-500 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
              >
                Calcola il tuo Score <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-500 text-left px-1">{error}</p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Nessuna registrazione richiesta · Risultati in 30 secondi
            </p>
          </form>
        </div>
      </main>

      {/* ── Statistiche nazionali ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20 space-y-6">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            La situazione degli italiani · Dati ufficiali 2024
          </p>
          <h2 className="text-3xl font-black">I numeri che non ti dicono</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Reddito medio
              </p>
            </div>
            <p className="text-3xl font-black">{fmt(stats.mediaReddito)}</p>
            <p className="text-xs text-muted-foreground mt-1">lordo annuo · Fonte MEF</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <CreditCard className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Debito medio
              </p>
            </div>
            <p className="text-3xl font-black">{fmt(stats.mediaDebito)}</p>
            <p className="text-xs text-muted-foreground mt-1">per famiglia · Fonte Banca d'Italia</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Home className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                In affitto
              </p>
            </div>
            <p className="text-3xl font-black">{stats.mediaAffitto}%</p>
            <p className="text-xs text-muted-foreground mt-1">delle famiglie · Fonte Banca d'Italia</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <PiggyBank className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tasso risparmio
              </p>
            </div>
            <p className="text-3xl font-black">{stats.mediaRisparmio}%</p>
            <p className="text-xs text-muted-foreground mt-1">del reddito · Fonte ISTAT</p>
          </div>
        </div>

        {/* ── Link alle sezioni ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Link
            href="/redditi"
            className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-emerald-500/40 transition-all hover:-translate-y-0.5"
          >
            <BarChart3 className="w-6 h-6 text-emerald-600 mb-3" />
            <p className="font-black text-lg mb-1">Analisi Redditi</p>
            <p className="text-sm text-muted-foreground">
              Reddito medio per ogni comune italiano
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Esplora <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/immobiliare"
            className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-blue-500/40 transition-all hover:-translate-y-0.5"
          >
            <Home className="w-6 h-6 text-blue-600 mb-3" />
            <p className="font-black text-lg mb-1">Mercato Immobiliare</p>
            <p className="text-sm text-muted-foreground">
              Prezzi e rendimenti OMI per comune
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Esplora <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/score"
            className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-amber-500/40 transition-all hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-6 h-6 text-amber-600 mb-3" />
            <p className="font-black text-lg mb-1">Health Score</p>
            <p className="text-sm text-muted-foreground">
              Calcola la tua salute finanziaria in 2 minuti
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Inizia <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

    </div>
  );
}