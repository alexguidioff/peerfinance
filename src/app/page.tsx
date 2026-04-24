"use client";

import { useState } from "react";

export default function Home() {
  const [profession, setProfession] = useState("");
  const [age, setAge] = useState("");

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    // Qui andrà il routing verso /risultati o lo step 2 del form
    console.log("Inizio funnel con:", { profession, age });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center px-6 py-24 text-center sm:px-12">
        
        {/* Badge / Sottotitolo */}
        <div className="mb-6 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Unisciti a 10.000+ italiani che hanno preso il controllo delle proprie finanze
        </div>

        {/* Titolo Principale */}
        <h1 className="mb-6 max-w-3xl text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
          Scopri se stai guadagnando (e risparmiando) abbastanza.
        </h1>

        {/* Paragrafo Descrittivo */}
        <p className="mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
          Confronta il tuo stipendio, il tuo affitto e i tuoi risparmi con persone della tua età e regione. 100% gratuito e anonimo.
        </p>

        {/* Form "Versione Corta" - Il Gancio */}
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
          <form onSubmit={handleStart} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="La tua professione (es. Docente)"
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="La tua età"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:w-32"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
            <button
              type="submit"
              className="flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
            >
              Inizia Ora
            </button>
          </form>
        </div>

        {/* Trust Signals / Features */}
        <div className="mt-16 grid grid-cols-1 gap-8 text-sm text-zinc-500 dark:text-zinc-400 sm:grid-cols-3">
          <div>Dati ufficiali basati su ISTAT e MEF</div>
          <div>Nessuna registrazione richiesta per iniziare</div>
          <div>Report personalizzati in 30 secondi</div>
        </div>

      </main>
    </div>
  );
}
